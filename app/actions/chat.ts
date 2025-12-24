"use server";

import { db } from "@/lib/db";
import { aiConversations } from "@/schema";
import { eq, asc, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getChatHistory() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const history = await db.query.aiConversations.findMany({
    where: eq(aiConversations.userId, session.user.id),
    orderBy: [asc(aiConversations.createdAt)],
    limit: 50,
  });

  return history.map(h => ({
    id: h.id.toString(),
    role: h.role,
    content: h.content,
  }));
}

