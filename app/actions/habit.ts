"use server";

import { db } from "@/lib/db";
import { userProfiles } from "@/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { calculateLevel } from "@/lib/gamification";
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
  const newTotalXp = userProfile.totalXp + xpToAdd;
  const { level: newLevel } = calculateLevel(newTotalXp);

  await db.update(userProfiles)
    .set({
      totalXp: newTotalXp,
      level: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.id, userProfile.id));

  revalidatePath("/");
  revalidatePath("/tools");
}






