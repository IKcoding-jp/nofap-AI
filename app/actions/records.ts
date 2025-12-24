"use server";

import { db } from "@/lib/db";
import { dailyRecords, streaks, userProfiles } from "@/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { calculateLevel } from "@/lib/gamification";
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
    // プロファイルがなければ作成
    const [newProfile] = await db.insert(userProfiles).values({
      userId,
      totalXp: 0,
      level: 1,
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
        currentStreak: status === "success" ? 1 : 0,
        maxStreak: status === "success" ? 1 : 0,
        startedAt: status === "success" ? new Date() : null,
        updatedAt: new Date(),
      });
    } else {
      let newCurrent = userStreak.currentStreak;
      let newMax = userStreak.maxStreak;
      let newStartedAt = userStreak.startedAt;

      if (status === "success") {
        newCurrent += 1;
        if (newCurrent > newMax) newMax = newCurrent;
        if (!newStartedAt) newStartedAt = new Date();
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

  // XPの反映とレベルアップ判定
  if (xpToAdd > 0 && userProfile) {
    const newTotalXp = userProfile.totalXp + xpToAdd;
    const { level: newLevel } = calculateLevel(newTotalXp);
    
    await db.update(userProfiles)
      .set({
        totalXp: newTotalXp,
        level: newLevel,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, userProfile.id));
  } else if (status === "failure" && userProfile) {
    // 失敗時はモテレベルを半分にする（ロジック定義に基づく）
    await db.update(userProfiles)
      .set({
        moteLevel: Math.floor(userProfile.moteLevel * 0.5),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, userProfile.id));
  }

  revalidatePath("/");
}
