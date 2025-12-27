"use server";

import { db } from "@/lib/db";
import { streaks, dailyRecords, userProfiles } from "@/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { calculateLevel, calculateMoteLevel, calculateResetAttributes } from "@/lib/gamification";

export async function startStreak() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  // 既存のストリークを確認
  const existingStreak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  // 既に開始日時が設定されている場合は何もしない（ガード）
  if (existingStreak?.startedAt) {
    return { success: true, alreadyStarted: true };
  }

  const now = new Date();

  if (existingStreak) {
    // ストリークレコードが存在する場合は更新
    await db.update(streaks)
      .set({
        startedAt: now,
        currentStreak: 0, // 互換性のため
        updatedAt: now,
      })
      .where(eq(streaks.id, existingStreak.id));
  } else {
    // ストリークレコードが存在しない場合は作成
    await db.insert(streaks).values({
      userId,
      startedAt: now,
      currentStreak: 0,
      maxStreak: 0,
      updatedAt: now,
    });
  }

  revalidatePath("/");
  return { success: true, alreadyStarted: false };
}

export async function resetStreak() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  // ストリークの取得
  const userStreak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  if (!userStreak) {
    throw new Error("Streak not found");
  }

  // 今日の記録が既にあるか確認
  const existingRecord = await db.query.dailyRecords.findFirst({
    where: and(eq(dailyRecords.userId, userId), eq(dailyRecords.date, today)),
  });

  // 今日の日付で failure レコードを作成または更新
  if (existingRecord) {
    await db.update(dailyRecords)
      .set({
        status: "failure",
        journal: existingRecord.journal, // 既存の日記は保持
        updatedAt: new Date(),
      })
      .where(eq(dailyRecords.id, existingRecord.id));
  } else {
    await db.insert(dailyRecords).values({
      userId,
      date: today,
      status: "failure",
      createdAt: now,
    });
  }

  // ストリークを再スタート（開始日時を現在時刻に更新）
  await db.update(streaks)
    .set({
      startedAt: now,
      currentStreak: 0, // リセット時は0から
      updatedAt: now,
    })
    .where(eq(streaks.id, userStreak.id));

  // プロファイルの取得
  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (userProfile) {
    // 属性値を減少
    const ensureNumber = (val: any) => {
      const n = Number(val);
      return isNaN(n) ? 0 : n;
    };

    let newConfidence = ensureNumber(userProfile.moteConfidence);
    let newVitality = ensureNumber(userProfile.moteVitality);
    let newCalmness = ensureNumber(userProfile.moteCalmness);
    let newCleanliness = ensureNumber(userProfile.moteCleanliness);

    // リセット時の属性減少
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
        moteConfidence: newConfidence,
        moteVitality: newVitality,
        moteCalmness: newCalmness,
        moteCleanliness: newCleanliness,
        moteLevel: newMoteLevel,
        lastResetAt: now,
        updatedAt: now,
      })
      .where(eq(userProfiles.id, userProfile.id));
  }

  revalidatePath("/");
  return { success: true };
}

