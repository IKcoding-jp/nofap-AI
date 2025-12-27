import { getChatHistory, listChatSessions, createChatSession, migrateExistingConversations } from "@/app/actions/chat";
import ChatClient from "./chat-client";
import { Suspense } from "react";
import { redirect } from "next/navigation";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const resolvedParams = await searchParams;
  // 既存データの移行（エラーが発生しても続行）
  try {
    await migrateExistingConversations();
  } catch (error) {
    console.warn("Migration failed, continuing:", error);
  }

  let sessionId: number | undefined;
  let initialMessages: any[] = [];

  if (resolvedParams.session) {
    // URLクエリからsessionIdを取得
    sessionId = parseInt(resolvedParams.session);
    if (!isNaN(sessionId)) {
      try {
        initialMessages = await getChatHistory(sessionId);
      } catch (error) {
        console.error("Failed to load session:", error);
        // セッションが見つからない場合は新規作成
        sessionId = await createChatSession();
        redirect(`/chat?session=${sessionId}`);
      }
    }
  } else {
    // セッションが指定されていない場合は、最新のセッションを取得
    const sessions = await listChatSessions();
    if (sessions.length > 0) {
      sessionId = sessions[0].id;
      initialMessages = await getChatHistory(sessionId);
    } else {
      // セッションがない場合は新規作成
      sessionId = await createChatSession();
      redirect(`/chat?session=${sessionId}`);
    }
  }

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">読み込み中...</div>}>
      <ChatClient initialSessionId={sessionId} initialMessages={initialMessages as any} />
    </Suspense>
  );
}
