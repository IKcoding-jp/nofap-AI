"use client";

import { useState, useEffect, useRef } from "react";
import { useChat, Message } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Send, Sparkles, User, Bot, AlertTriangle, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ChatClient({ initialMessages }: { initialMessages: Message[] }) {
  const searchParams = useSearchParams();
  const [input, setInput] = useState("");
  const chat = useChat({
    initialMessages,
  });
  const { messages, status, error } = chat;
  const sendMessage = (chat as any).sendMessage;

  const scrollRef = useRef<HTMLDivElement>(null);
  const sosTriggered = useRef(false);

  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (searchParams.get("sos") === "true" && !sosTriggered.current && !isLoading) {
      sosTriggered.current = true;
      handleAppend("助けてください！今、強烈な誘惑に襲われていて、リセットしてしまいそうです。どうすればいいですか？");
    }
  }, [searchParams, isLoading, messages.length, status, error]);

  const handleAppend = async (content: string) => {
    if (isLoading) return;
    try {
      if (typeof sendMessage === 'function') {
        await sendMessage({ text: content });
      }
    } catch (err: any) {
      console.error("Failed to append message:", err);
    }
  };

  const onFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const currentInput = input;
    setInput("");
    
    try {
      if (typeof sendMessage === 'function') {
        await sendMessage({ text: currentInput });
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setInput(currentInput);
    }
  };

  useEffect(() => {
    // ScrollAreaの内部のビューポートを取得してスクロール
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="flex h-screen flex-col bg-slate-50">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 bg-white p-4 border-b">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Bot className="h-6 w-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900">AI サポートチャット</h1>
        </div>
      </div>

      {/* チャットエリア */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="mx-auto max-w-2xl space-y-4 pb-4">
          {messages.length === 0 && (
            <div className="space-y-6 py-10">
              <div className="text-center space-y-2">
                <Sparkles className="mx-auto h-12 w-12 text-indigo-400 opacity-50" />
                <h2 className="text-xl font-semibold text-slate-700">何かお手伝いできることはありますか？</h2>
                <p className="text-slate-500">誘惑への対策や、モチベーションの相談など、何でも話してください。</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <QuickAction 
                  icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
                  label="誘惑に負けそう..."
                  onClick={() => handleAppend("誘惑に負けそうです。どうすればいいですか？")}
                />
                <QuickAction 
                  icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}
                  label="メリットを教えて"
                  onClick={() => handleAppend("オナ禁を続けるメリットを改めて教えてください。")}
                />
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex w-full items-start gap-3",
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
                m.role === "user" ? "bg-white" : "bg-indigo-600 border-indigo-600 text-white"
              )}>
                {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                m.role === "user" 
                  ? "bg-indigo-600 text-white rounded-tr-none" 
                  : "bg-white text-slate-700 border rounded-tl-none"
              )}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {typeof m.content === 'string' ? m.content : (m as any).parts?.map((part: any, i: number) => 
                    part.type === 'text' ? part.text : null
                  ).join('')}
                </div>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
                <Bot className="h-5 w-5" />
              </div>
              <div className="bg-white border text-slate-700 rounded-2xl rounded-tl-none px-4 py-2 text-sm shadow-sm">
                入力中...
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 入力エリア */}
      <div className="border-t bg-white p-4">
        <form 
          onSubmit={onFormSubmit}
          className="mx-auto flex max-w-2xl items-center gap-2"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="メッセージを入力..."
            className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !(input || "").trim()} 
            size="icon" 
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </main>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <Button 
      type="button"
      variant="outline" 
      className="h-auto py-3 px-4 flex items-center justify-start gap-3 border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
      onClick={onClick}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </Button>
  );
}
