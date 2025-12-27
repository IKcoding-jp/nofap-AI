"use server";

import { db } from "@/lib/db";
import { dailyRecords, streaks, userProfiles } from "@/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { calculateLevel, calculateConfidence, calculateMoteLevel, calculateResetAttributes } from "@/lib/gamification";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

async function analyzeJournal(userId: string, journal: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: `あなたは「オナ禁サポートAI」の分析担当です。
      ユーザーの日記を読み、以下の2点をJSON形式で出力してください。
      1. summary: 日記の短い要約（15文字以内）
      2. category: 内容に基づいたカテゴリ（ストレス, 暇, 自信, 孤独, 喜び, 成長, その他）のいずれか一つ
      
      出力例: {"summary": "誘惑を乗り越えた", "category": "自信"}`,
      prompt: journal,
    });
    
    return JSON.parse(text);
  } catch (e) {
    console.error("Journal analysis failed:", e);
    return null;
  }
}

/**
 * 日記を保存する（新しい仕様：自動カウントベース）
 * リセットされていない限り、常に成功として扱う
 */
export async function saveJournal(journal: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const today = new Date().toISOString().split("T")[0];

  // 今日の記録が既にあるか確認
  const existingRecord = await db.query.dailyRecords.findFirst({
    where: and(eq(dailyRecords.userId, userId), eq(dailyRecords.date, today)),
  });

  // プロファイルの取得
  let userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (!userProfile) {
    const [newProfile] = await db.insert(userProfiles).values({
      userId,
      totalXp: 0,
      level: 1,
      moteLevel: 0,
      moteConfidence: 0,
      moteVitality: 0,
      moteCalmness: 0,
      moteCleanliness: 0,
      maxMoteLevel: 0,
      updatedAt: new Date(),
    }).returning();
    userProfile = newProfile;
  }

  let xpToAdd = 0;
  let analysis = null;

  // 日記が新しく書かれた場合のみ分析とXP追加
  if (journal && (!existingRecord || !existingRecord.journal)) {
    xpToAdd += 50; // 日記XP
    analysis = await analyzeJournal(userId, journal);
  }

  // ストリークの取得（属性計算用）
  const userStreak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  if (existingRecord) {
    // 既存レコードを更新（statusは変更しない、リセットされていない限りsuccess）
    await db.update(dailyRecords)
      .set({
        journal: journal || existingRecord.journal,
        analysisSummary: analysis?.summary || existingRecord.analysisSummary,
        analysisCategory: analysis?.category || existingRecord.analysisCategory,
      })
      .where(eq(dailyRecords.id, existingRecord.id));
  } else {
    // 新規レコード作成（リセットされていない限りsuccess）
    // ただし、今日がリセット日かどうかは dailyRecords に failure があるかで判定
    const todayFailure = await db.query.dailyRecords.findFirst({
      where: and(
        eq(dailyRecords.userId, userId),
        eq(dailyRecords.date, today),
        eq(dailyRecords.status, "failure")
      ),
    });

    await db.insert(dailyRecords).values({
      userId,
      date: today,
      status: todayFailure ? "failure" : "success", // リセット日でなければsuccess
      journal,
      analysisSummary: analysis?.summary,
      analysisCategory: analysis?.category,
      createdAt: new Date(),
    });
  }

  // XPの反映、属性の更新
  if (userProfile && xpToAdd > 0) {
    const ensureNumber = (val: any) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    let newConfidence = ensureNumber(userProfile.moteConfidence);
    let newCalmness = ensureNumber(userProfile.moteCalmness);
    let newVitality = ensureNumber(userProfile.moteVitality);
    let newCleanliness = ensureNumber(userProfile.moteCleanliness);
    let newTotalXp = ensureNumber(userProfile.totalXp) + xpToAdd;
    let { level: newLevel } = calculateLevel(newTotalXp);

    // 最新のストリーク情報を取得して自信(Confidence)を計算
    if (userStreak) {
      const elapsedTime = userStreak.startedAt
        ? Math.floor((new Date().getTime() - new Date(userStreak.startedAt).getTime()) / 86400000)
        : 0;
      newConfidence = calculateConfidence(elapsedTime);
    }

    // 日記が書かれた場合は余裕(Calmness)を増加
    if (journal) {
      let increment = 1;
      if (userProfile.lastResetAt) {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        if (userProfile.lastResetAt > threeDaysAgo) {
          increment = 2;
        }
      }
      newCalmness = Math.max(-100, Math.min(100, newCalmness + increment));
    }

    const newMoteLevel = calculateMoteLevel({
      confidence: newConfidence,
      vitality: newVitality,
      calmness: newCalmness,
      cleanliness: newCleanliness,
    });

    // 値の検証
    if (isNaN(newMoteLevel) || isNaN(newConfidence) || isNaN(newVitality) || isNaN(newCalmness) || isNaN(newCleanliness)) {
      console.error("Invalid mote attribute values:", {
        newConfidence,
        newVitality,
        newCalmness,
        newCleanliness,
        newMoteLevel,
      });
      throw new Error("Invalid mote attribute values detected");
    }

    await db.update(userProfiles)
      .set({
        totalXp: newTotalXp,
        level: newLevel,
        moteConfidence: newConfidence,
        moteVitality: newVitality,
        moteCalmness: newCalmness,
        moteCleanliness: newCleanliness,
        moteLevel: newMoteLevel,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, userProfile.id));
  }

  revalidatePath("/");
}

/**
 * 後方互換性のための関数（非推奨）
 * 新しいコードでは saveJournal を使用してください
 */
export async function recordDay(status: "success" | "failure", journal?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const today = new Date().toISOString().split("T")[0];

  // 今日の記録が既にあるか確認
  const existingRecord = await db.query.dailyRecords.findFirst({
    where: and(eq(dailyRecords.userId, userId), eq(dailyRecords.date, today)),
  });

  // ストリークの取得
  const userStreak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  // プロファイルの取得 (XP追加用)
  let userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (!userProfile) {
    // プロファイルがなければ作成（全属性を明示的に初期化）
    const [newProfile] = await db.insert(userProfiles).values({
      userId,
      totalXp: 0,
      level: 1,
      moteLevel: 0,
      moteConfidence: 0,
      moteVitality: 0,
      moteCalmness: 0,
      moteCleanliness: 0,
      maxMoteLevel: 0,
      updatedAt: new Date(),
    }).returning();
    userProfile = newProfile;
  }

  let xpToAdd = 0;

  if (existingRecord) {
    // すでに記録がある場合は更新
    if (existingRecord.status !== status) {
      if (userStreak) {
        let newCurrent = userStreak.currentStreak;
        let newMax = userStreak.maxStreak;
        let newStartedAt = userStreak.startedAt;

        if (status === "success") {
          newCurrent += 1;
          if (newCurrent > newMax) newMax = newCurrent;
          if (!newStartedAt) newStartedAt = new Date();
          xpToAdd += 100; // 成功への変更でXP追加
        } else {
          newCurrent = 0;
          newStartedAt = null;
        }

        await db.update(streaks)
          .set({
            currentStreak: newCurrent,
            maxStreak: newMax,
            startedAt: newStartedAt,
            updatedAt: new Date(),
          })
          .where(eq(streaks.id, userStreak.id));
      }
    } else if (status === "failure" && userStreak) {
      // 失敗記録の場合、statusが変更されなくても開始日時をリセット
      await db.update(streaks)
        .set({
          startedAt: null,
          currentStreak: 0,
          updatedAt: new Date(),
        })
        .where(eq(streaks.id, userStreak.id));
    }
    
    // 日記が新しく書かれた場合
    let analysis = null;
    if (journal && !existingRecord.journal) {
      xpToAdd += 50;
      analysis = await analyzeJournal(userId, journal);
    }

    await db.update(dailyRecords)
      .set({ 
        status, 
        journal: journal ?? existingRecord.journal,
        analysisSummary: analysis?.summary || existingRecord.analysisSummary,
        analysisCategory: analysis?.category || existingRecord.analysisCategory
      })
      .where(eq(dailyRecords.id, existingRecord.id));
  } else {
    // 新規作成
    let analysis = null;
    if (journal) {
      analysis = await analyzeJournal(userId, journal);
    }

    await db.insert(dailyRecords).values({
      userId,
      date: today,
      status,
      journal,
      analysisSummary: analysis?.summary,
      analysisCategory: analysis?.category,
      createdAt: new Date(),
    });

    if (status === "success") {
      xpToAdd += 100; // 継続XP
      if (journal) xpToAdd += 50; // 日記XP
    }

    if (!userStreak) {
      await db.insert(streaks).values({
        userId,
        currentStreak: 0,
        maxStreak: 0,
        startedAt: status === "success" ? new Date() : null,
        updatedAt: new Date(),
      });
    } else {
      let newCurrent = userStreak.currentStreak;
      let newMax = userStreak.maxStreak;
      let newStartedAt = userStreak.startedAt;

      if (status === "success") {
        if (!newStartedAt) {
          newStartedAt = new Date();
          newCurrent = 0;
        } else {
          // 既存の開始日時がある場合は、経過日数を計算
          newCurrent = Math.floor((new Date().getTime() - new Date(newStartedAt).getTime()) / 86400000);
        }
        if (newCurrent > newMax) newMax = newCurrent;
      } else {
        newCurrent = 0;
        newStartedAt = null;
      }

      await db.update(streaks)
        .set({
          currentStreak: newCurrent,
          maxStreak: newMax,
          startedAt: newStartedAt,
          updatedAt: new Date(),
        })
        .where(eq(streaks.id, userStreak.id));
    }
  }

  // XPの反映、属性の更新、レベルアップ判定
  if (userProfile) {
    // 属性値が未定義の場合は0で初期化、数値型を保証
    const ensureNumber = (val: any) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    let newConfidence = ensureNumber(userProfile.moteConfidence);
    let newCalmness = ensureNumber(userProfile.moteCalmness);
    let newVitality = ensureNumber(userProfile.moteVitality);
    let newCleanliness = ensureNumber(userProfile.moteCleanliness);
    let newTotalXp = ensureNumber(userProfile.totalXp) + xpToAdd;
    let { level: newLevel } = calculateLevel(newTotalXp);

    if (status === "success") {
      // 最新のストリーク情報を取得して自信(Confidence)を計算
      const updatedStreak = await db.query.streaks.findFirst({
        where: eq(streaks.userId, userId),
      });
      if (updatedStreak) {
        newConfidence = calculateConfidence(updatedStreak.currentStreak);
      }
      
      // 日記が書かれた場合は余裕(Calmness)を増加
      if (journal) {
        let increment = 1;
        if (userProfile.lastResetAt) {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          if (userProfile.lastResetAt > threeDaysAgo) {
            increment = 2;
          }
        }
        newCalmness = Math.max(-100, Math.min(100, newCalmness + increment));
      }
    } else {
      // 失敗時は属性をリセットロジックに従って減少
      const resetAttrs = calculateResetAttributes({
        confidence: newConfidence,
        vitality: newVitality,
        calmness: newCalmness,
        cleanliness: newCleanliness,
      });
      newConfidence = resetAttrs.confidence;
      newVitality = resetAttrs.vitality;
      newCalmness = resetAttrs.calmness;
      newCleanliness = resetAttrs.cleanliness;
    }

    const newMoteLevel = calculateMoteLevel({
      confidence: newConfidence,
      vitality: newVitality,
      calmness: newCalmness,
      cleanliness: newCleanliness,
    });

    // 値の検証: NaNや不正な値がないか確認
    if (isNaN(newMoteLevel) || isNaN(newConfidence) || isNaN(newVitality) || isNaN(newCalmness) || isNaN(newCleanliness)) {
      console.error("Invalid mote attribute values:", {
        newConfidence,
        newVitality,
        newCalmness,
        newCleanliness,
        newMoteLevel,
      });
      throw new Error("Invalid mote attribute values detected");
    }

    const updateData: any = {
      totalXp: newTotalXp,
      level: newLevel,
      moteConfidence: newConfidence,
      moteVitality: newVitality,
      moteCalmness: newCalmness,
      moteCleanliness: newCleanliness,
      moteLevel: newMoteLevel,
      updatedAt: new Date(),
    };

    if (status === "failure") {
      updateData.lastResetAt = new Date();
    }

    if (newMoteLevel > (userProfile.maxMoteLevel || 0)) {
      updateData.maxMoteLevel = newMoteLevel;
    }

    await db.update(userProfiles)
      .set(updateData)
      .where(eq(userProfiles.id, userProfile.id));
  }

  revalidatePath("/");
}
