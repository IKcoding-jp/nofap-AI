"use server";

import { db } from "@/lib/db";
import { userHabits, userProfiles } from "@/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { calculateLevel, calculateMoteLevel } from "@/lib/gamification";
import { revalidatePath } from "next/cache";

function toIsoDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function isSameIsoDate(a: Date, b: Date) {
  return toIsoDate(a) === toIsoDate(b);
}

async function getOrCreateDailyHabitCounter(userId: string, habitName: string) {
  const existing = await db.query.userHabits.findFirst({
    where: and(eq(userHabits.userId, userId), eq(userHabits.habitName, habitName)),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(userHabits)
    .values({
      userId,
      habitName,
      // NOTE: 現状は「今日の実行回数」を入れる用途で利用（テーブル未使用のため安全）
      streak: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

async function bumpDailyCount(userId: string, habitName: string, cap: number) {
  const row = await getOrCreateDailyHabitCounter(userId, habitName);
  const now = new Date();

  const todayCount = row.updatedAt && isSameIsoDate(row.updatedAt, now) ? row.streak : 0;
  if (todayCount >= cap) {
    return { capped: true as const, todayCount, cap };
  }

  const nextCount = todayCount + 1;
  await db
    .update(userHabits)
    .set({
      streak: nextCount,
      updatedAt: now,
    })
    .where(eq(userHabits.id, row.id));

  return { capped: false as const, todayCount: nextCount, cap };
}

export async function recordMuscleTraining(count: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (!userProfile) return;

  // 1日最大3回（それ以上は逓減＝0として扱う）
  const daily = await bumpDailyCount(userId, "muscle_training", 3);
  if (daily.capped) {
    return { xpAdded: 0, vitalityAdded: 0, capped: true as const, cap: daily.cap };
  }

  const xpToAdd = 30; // 筋トレ1回につき30XP（モチベ重視で固定）
  const ensureNumber = (val: any) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const newTotalXp = ensureNumber(userProfile.totalXp) + xpToAdd;
  const { level: newLevel } = calculateLevel(newTotalXp);

  // 再起ボーナス判定 (リセットから3日以内なら上昇量1.5倍)
  let increment = 1;
  if (userProfile.lastResetAt) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    if (userProfile.lastResetAt > threeDaysAgo) {
      increment = 2; // 1.5倍は整数に切り上げで2とする
    }
  }

  // 活力(Vitality)属性を増加させる（最大100）
  const currentVitality = ensureNumber(userProfile.moteVitality);
  const newVitality = Math.max(-100, Math.min(100, currentVitality + increment));
  const newMoteLevel = calculateMoteLevel({
    confidence: ensureNumber(userProfile.moteConfidence),
    vitality: newVitality,
    calmness: ensureNumber(userProfile.moteCalmness),
    cleanliness: ensureNumber(userProfile.moteCleanliness),
  });

  const currentMax = ensureNumber(userProfile.maxMoteLevel);
  const nextMax = Math.max(currentMax, newMoteLevel);

  await db.update(userProfiles)
    .set({
      totalXp: newTotalXp,
      level: newLevel,
      moteVitality: newVitality,
      moteLevel: newMoteLevel,
      maxMoteLevel: nextMax,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userProfile.id));

  revalidatePath("/");
  revalidatePath("/tools");

  return { xpAdded: xpToAdd, vitalityAdded: increment, capped: false as const, cap: daily.cap };
}

export async function recordCleanliness() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (!userProfile) return;

  // 1日1回（それ以上は逓減＝0として扱う）
  const daily = await bumpDailyCount(userId, "cleanliness", 1);
  if (daily.capped) {
    return { xpAdded: 0, cleanlinessAdded: 0, capped: true as const, cap: daily.cap };
  }

  const xpToAdd = 20; // 清潔感チェックで20XP
  const ensureNumber = (val: any) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const newTotalXp = ensureNumber(userProfile.totalXp) + xpToAdd;
  const { level: newLevel } = calculateLevel(newTotalXp);

  // 再起ボーナス判定
  let increment = 1;
  if (userProfile.lastResetAt) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    if (userProfile.lastResetAt > threeDaysAgo) {
      increment = 2;
    }
  }

  // 清潔感(Cleanliness)属性を増加させる（最大100）
  const currentCleanliness = ensureNumber(userProfile.moteCleanliness);
  const newCleanliness = Math.max(-100, Math.min(100, currentCleanliness + increment));
  const newMoteLevel = calculateMoteLevel({
    confidence: ensureNumber(userProfile.moteConfidence),
    vitality: ensureNumber(userProfile.moteVitality),
    calmness: ensureNumber(userProfile.moteCalmness),
    cleanliness: newCleanliness,
  });

  const currentMax = ensureNumber(userProfile.maxMoteLevel);
  const nextMax = Math.max(currentMax, newMoteLevel);

  await db.update(userProfiles)
    .set({
      totalXp: newTotalXp,
      level: newLevel,
      moteCleanliness: newCleanliness,
      moteLevel: newMoteLevel,
      maxMoteLevel: nextMax,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userProfile.id));

  revalidatePath("/");
  revalidatePath("/tools");

  return { xpAdded: xpToAdd, cleanlinessAdded: increment, capped: false as const, cap: daily.cap };
}






