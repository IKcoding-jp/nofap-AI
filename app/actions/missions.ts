"use server";

import { db } from "@/lib/db";
import { dailyMissions, userProfiles } from "@/schema";
import { and, eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { calculateLevel, calculateMoteLevel } from "@/lib/gamification";
import { revalidatePath } from "next/cache";
import { MOTE_MISSIONS, selectRandomMissions, getMissionById, type MoteAttribute } from "@/lib/mote-missions";

function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * 今日のミッションを取得（未割当なら3件をランダム生成）
 */
export async function getTodayMissions() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const today = toIsoDate(new Date());

  try {
    // 今日のミッションを取得
    const existingMissions = await db.query.dailyMissions.findMany({
      where: and(
        eq(dailyMissions.userId, userId),
        eq(dailyMissions.date, today)
      ),
      orderBy: [asc(dailyMissions.createdAt)],
    });

  // 既に3件以上ある場合はそのまま返す
  if (existingMissions.length >= 3) {
    return existingMissions
      .filter((m) => m.status === "pending")
      .map((m) => {
        const mission = getMissionById(m.missionId);
        return {
          id: m.id,
          missionId: m.missionId,
          title: mission?.title ?? "不明なミッション",
          description: mission?.description ?? "",
          xpReward: mission?.xpReward ?? 0,
          attributeReward: mission?.attributeReward,
          status: m.status as "pending" | "completed",
          completedAt: m.completedAt,
        };
      });
  }

  // 不足分を生成
  const existingMissionIds = existingMissions.map((m) => m.missionId);
  const neededCount = 3 - existingMissions.length;
  const newMissions = selectRandomMissions(neededCount, existingMissionIds);

  // 新規ミッションをDBに保存
  const now = new Date();
  const inserted = await db
    .insert(dailyMissions)
    .values(
      newMissions.map((mission) => ({
        userId,
        missionId: mission.id,
        date: today,
        status: "pending" as const,
        createdAt: now,
      }))
    )
    .returning();

  // 既存 + 新規を結合して返す
  const allMissions = [...existingMissions, ...inserted]
    .filter((m) => m.status === "pending")
    .map((m) => {
      const mission = getMissionById(m.missionId);
      return {
        id: m.id,
        missionId: m.missionId,
        title: mission?.title ?? "不明なミッション",
        description: mission?.description ?? "",
        xpReward: mission?.xpReward ?? 0,
        attributeReward: mission?.attributeReward,
        status: m.status as "pending" | "completed",
        completedAt: m.completedAt,
      };
    });

    return allMissions;
  } catch (error) {
    console.error("Error fetching missions:", error);
    throw new Error(`Failed to fetch missions: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * ミッションを完了する
 */
export async function completeMission(missionRecordId: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const today = toIsoDate(new Date());

  // ミッションレコードを取得
  const missionRecord = await db.query.dailyMissions.findFirst({
    where: and(
      eq(dailyMissions.id, missionRecordId),
      eq(dailyMissions.userId, userId),
      eq(dailyMissions.date, today)
    ),
  });

  if (!missionRecord) {
    throw new Error("Mission not found");
  }

  if (missionRecord.status === "completed") {
    return {
      success: false,
      message: "このミッションは既に完了しています",
    };
  }

  // ミッション定義を取得
  const mission = getMissionById(missionRecord.missionId);
  if (!mission) {
    throw new Error("Mission definition not found");
  }

  // ユーザープロフィールを取得
  const userProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (!userProfile) {
    throw new Error("User profile not found");
  }

  const ensureNumber = (val: any) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  // XPを追加
  const xpToAdd = mission.xpReward;
  const newTotalXp = ensureNumber(userProfile.totalXp) + xpToAdd;
  const { level: newLevel } = calculateLevel(newTotalXp);

  // 再起ボーナス判定
  let attributeIncrement = 1;
  if (userProfile.lastResetAt) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    if (userProfile.lastResetAt > threeDaysAgo) {
      attributeIncrement = 2;
    }
  }

  // 属性値を更新
  let newConfidence = ensureNumber(userProfile.moteConfidence);
  let newVitality = ensureNumber(userProfile.moteVitality);
  let newCalmness = ensureNumber(userProfile.moteCalmness);
  let newCleanliness = ensureNumber(userProfile.moteCleanliness);

  if (mission.attributeReward) {
    const { attribute, amount } = mission.attributeReward;
    const increment = attributeIncrement * amount;
    
    switch (attribute) {
      case "confidence":
        newConfidence = Math.max(-100, Math.min(100, newConfidence + increment));
        break;
      case "vitality":
        newVitality = Math.max(-100, Math.min(100, newVitality + increment));
        break;
      case "calmness":
        newCalmness = Math.max(-100, Math.min(100, newCalmness + increment));
        break;
      case "cleanliness":
        newCleanliness = Math.max(-100, Math.min(100, newCleanliness + increment));
        break;
    }
  }

  // モテレベルを再計算
  const newMoteLevel = calculateMoteLevel({
    confidence: newConfidence,
    vitality: newVitality,
    calmness: newCalmness,
    cleanliness: newCleanliness,
  });

  const currentMax = ensureNumber(userProfile.maxMoteLevel);
  const nextMax = Math.max(currentMax, newMoteLevel);

  const updates: Partial<typeof userProfiles.$inferInsert> = {
    totalXp: newTotalXp,
    level: newLevel,
    moteConfidence: newConfidence,
    moteVitality: newVitality,
    moteCalmness: newCalmness,
    moteCleanliness: newCleanliness,
    moteLevel: newMoteLevel,
    maxMoteLevel: nextMax,
    updatedAt: new Date(),
  };

  // トランザクション: ミッション完了 + プロフィール更新
  await db.update(dailyMissions)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(dailyMissions.id, missionRecordId));

  await db.update(userProfiles)
    .set(updates)
    .where(eq(userProfiles.id, userProfile.id));

  revalidatePath("/");

  return {
    success: true,
    xpAdded: xpToAdd,
    attributeReward: mission.attributeReward,
    attributeIncrement,
  };
}
