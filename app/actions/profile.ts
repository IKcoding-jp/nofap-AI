"use server";

import { db } from "@/lib/db";
import { userProfiles } from "@/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getProfile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, session.user.id),
  });
}

export async function updateProfile(data: {
  goal?: string;
  reason?: string;
  failTriggers?: string;
  selectedPersona?: "mina" | "sayuri" | "alice";
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const existingProfile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  if (existingProfile) {
    await db.update(userProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, existingProfile.id));
  } else {
    await db.insert(userProfiles).values({
      userId,
      ...data,
      updatedAt: new Date(),
    });
  }

  revalidatePath("/settings");
  revalidatePath("/chat");
}


