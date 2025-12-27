"use server";

import { db } from "@/lib/db";
import { aiConversations, aiChatSessions } from "@/schema";
import { eq, asc, desc, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface ChatSession {
  id: number;
  title: string;
  lastMessageAt: Date | null;
  messageCount: number;
}

export async function createChatSession(title?: string): Promise<number> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const now = new Date();
  const [newSession] = await db.insert(aiChatSessions).values({
    userId: session.user.id,
    title: title || "新しいチャット",
    createdAt: now,
    updatedAt: now,
  }).returning({ id: aiChatSessions.id });

  return newSession.id;
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const sessions = await db.query.aiChatSessions.findMany({
    where: eq(aiChatSessions.userId, session.user.id),
    orderBy: [desc(aiChatSessions.lastMessageAt), desc(aiChatSessions.createdAt)],
  });

  // 各セッションのメッセージ数を取得
  const sessionsWithCount = await Promise.all(
    sessions.map(async (s) => {
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(aiConversations)
        .where(eq(aiConversations.sessionId, s.id));

      return {
        id: s.id,
        title: s.title,
        lastMessageAt: s.lastMessageAt,
        messageCount: count[0]?.count || 0,
      };
    })
  );

  return sessionsWithCount;
}

export async function getChatHistory(sessionId: number): Promise<any[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  // セッションがユーザーのものか確認
  const chatSession = await db.query.aiChatSessions.findFirst({
    where: and(
      eq(aiChatSessions.id, sessionId),
      eq(aiChatSessions.userId, session.user.id)
    ),
  });

  if (!chatSession) {
    throw new Error("Session not found or unauthorized");
  }

  const history = await db.query.aiConversations.findMany({
    where: eq(aiConversations.sessionId, sessionId),
    orderBy: [asc(aiConversations.createdAt)],
  });

  return history.map(h => ({
    id: h.id.toString(),
    role: h.role,
    content: h.content,
    createdAt: h.createdAt.toISOString(),
  }));
}

export async function renameChatSession(sessionId: number, title: string): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // セッションがユーザーのものか確認
  const chatSession = await db.query.aiChatSessions.findFirst({
    where: and(
      eq(aiChatSessions.id, sessionId),
      eq(aiChatSessions.userId, session.user.id)
    ),
  });

  if (!chatSession) {
    throw new Error("Session not found or unauthorized");
  }

  await db.update(aiChatSessions)
    .set({
      title: title,
      updatedAt: new Date(),
    })
    .where(eq(aiChatSessions.id, sessionId));
}

export async function deleteChatMessage(messageId: string): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const message = await db.query.aiConversations.findFirst({
    where: eq(aiConversations.id, parseInt(messageId)),
  });

  if (!message || message.userId !== session.user.id) {
    throw new Error("Message not found or unauthorized");
  }

  await db.delete(aiConversations).where(eq(aiConversations.id, parseInt(messageId)));
}

export async function deleteChatSession(sessionId: number): Promise<void> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // セッションがユーザーのものか確認
  const chatSession = await db.query.aiChatSessions.findFirst({
    where: and(
      eq(aiChatSessions.id, sessionId),
      eq(aiChatSessions.userId, session.user.id)
    ),
  });

  if (!chatSession) {
    throw new Error("Session not found or unauthorized");
  }

  // セッションを削除（cascadeでメッセージも削除される）
  await db.delete(aiChatSessions).where(eq(aiChatSessions.id, sessionId));
}

// 既存の会話履歴を移行するための関数（マイグレーション用）
export async function migrateExistingConversations(): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) return;

    // 既存のセッションがない場合のみ実行
    const existingSessions = await db.query.aiChatSessions.findMany({
      where: eq(aiChatSessions.userId, session.user.id),
    });

    if (existingSessions.length > 0) return;

    // デフォルトセッションを作成
    const now = new Date();
    const [defaultSession] = await db.insert(aiChatSessions).values({
      userId: session.user.id,
      title: "過去の会話",
      createdAt: now,
      updatedAt: now,
    }).returning({ id: aiChatSessions.id });

    // 既存の会話をデフォルトセッションに紐づけ
    await db.update(aiConversations)
      .set({ sessionId: defaultSession.id })
      .where(eq(aiConversations.userId, session.user.id));
  } catch (error) {
    // テーブルが存在しない場合など、エラーを無視
    // マイグレーションは別途実行する必要がある
    console.warn("Migration skipped:", error);
  }
}

