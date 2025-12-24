"use server";

import { db } from "@/lib/db";
import { dailyRecords, streaks } from "@/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

  if (existingRecord) {
    // すでに記録がある場合は更新
    // 前回のステータスと異なる場合のみストリークを再計算
    if (existingRecord.status !== status) {
      if (userStreak) {
        let newCurrent = userStreak.currentStreak;
        let newMax = userStreak.maxStreak;
        let newStartedAt = userStreak.startedAt;

        if (status === "success") {
          // 失敗から成功へ変更：ストリークを+1（本当はもっと複雑だが、簡易的に+1）
          // 本来は前日の状態を見るべきだが、一旦シンプルに
          newCurrent += 1;
          if (newCurrent > newMax) newMax = newCurrent;
          if (!newStartedAt) newStartedAt = new Date();
        } else {
          // 成功から失敗へ変更：ストリークをリセット
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
    
    await db.update(dailyRecords)
      .set({ status, journal: journal ?? existingRecord.journal })
      .where(eq(dailyRecords.id, existingRecord.id));
  } else {
    // 新規作成
    await db.insert(dailyRecords).values({
      userId,
      date: today,
      status,
      journal,
      createdAt: new Date(),
    });

    if (!userStreak) {
      // 初回
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

  revalidatePath("/");
}
