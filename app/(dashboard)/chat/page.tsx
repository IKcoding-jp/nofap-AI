import { getChatHistory } from "@/app/actions/chat";
import ChatClient from "./chat-client";
import { Suspense } from "react";

export default async function ChatPage() {
  const initialMessages = await getChatHistory();

  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">読み込み中...</div>}>
      <ChatClient initialMessages={initialMessages as any} />
    </Suspense>
  );
}
