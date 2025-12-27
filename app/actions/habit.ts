"use server";

import { db } from "@/lib/db";
import { userProfiles } from "@/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { calculateLevel, calculateMoteLevel } from "@/lib/gamification";
import { revalidatePath } from "next/cache";

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

  const xpToAdd = 30; // 筋トレ1回につき30XP
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

  await db.update(userProfiles)
    .set({
      totalXp: newTotalXp,
      level: newLevel,
      moteVitality: newVitality,
      moteLevel: newMoteLevel,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userProfile.id));

  revalidatePath("/");
  revalidatePath("/tools");
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

  await db.update(userProfiles)
    .set({
      totalXp: newTotalXp,
      level: newLevel,
      moteCleanliness: newCleanliness,
      moteLevel: newMoteLevel,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userProfile.id));

  revalidatePath("/");
  revalidatePath("/tools");
}






