"use server";

import { db } from "@/lib/db";
import { 
  dailyRecords, 
  aiConversations, 
  userHabits, 
  streaks, 
  userProfiles 
} from "@/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function resetAccountData() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  try {
    // トランザクション的に処理（SQLiteでは個別に実行）
    // 1. dailyRecords を全削除
    await db.delete(dailyRecords)
      .where(eq(dailyRecords.userId, userId));

    // 2. aiConversations を全削除
    await db.delete(aiConversations)
      .where(eq(aiConversations.userId, userId));

    // 3. userHabits を全削除
    await db.delete(userHabits)
      .where(eq(userHabits.userId, userId));

    // 4. streaks をリセット
    const existingStreak = await db.query.streaks.findFirst({
      where: eq(streaks.userId, userId),
    });

    if (existingStreak) {
      await db.update(streaks)
        .set({
          currentStreak: 0,
          maxStreak: 0,
          startedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(streaks.id, existingStreak.id));
    } else {
      // ストリークレコードが存在しない場合は作成
      await db.insert(streaks).values({
        userId,
        currentStreak: 0,
        maxStreak: 0,
        startedAt: null,
        updatedAt: new Date(),
      });
    }

    // 5. userProfiles をリセット
    const existingProfile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });

    if (existingProfile) {
      await db.update(userProfiles)
        .set({
          totalXp: 0,
          level: 1,
          moteLevel: 0,
          goal: null,
          reason: null,
          failTriggers: null,
          selectedPersona: "sayuri",
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, existingProfile.id));
    } else {
      // プロファイルが存在しない場合は作成
      await db.insert(userProfiles).values({
        userId,
        totalXp: 0,
        level: 1,
        moteLevel: 0,
        goal: null,
        reason: null,
        failTriggers: null,
        selectedPersona: "sayuri",
        updatedAt: new Date(),
      });
    }

    // キャッシュをクリア
    revalidatePath("/");
    revalidatePath("/settings");
    revalidatePath("/calendar");
    revalidatePath("/chat");
    revalidatePath("/journal");
    revalidatePath("/tools");

    return { success: true };
  } catch (error) {
    console.error("Failed to reset account data:", error);
    throw new Error("データの初期化に失敗しました");
  }
}





