"use client";

import { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Send, Sparkles, User, Bot, AlertTriangle, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatClient({ initialMessages }: { initialMessages: any[] }) {
  const searchParams = useSearchParams();
  const chat = useChat({
    initialMessages: initialMessages as any,
  } as any) as any;

  const { 
    messages, 
    status, 
    isLoading: isChatLoading,
    sendMessage
  } = chat;

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sosTriggered = useRef(false);

  const isLoading = status === "submitted" || status === "streaming" || isChatLoading;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (searchParams.get("sos") === "true" && !sosTriggered.current && !isLoading && messages && messages.length === initialMessages.length) {
      sosTriggered.current = true;
      if (sendMessage) {
        sendMessage({ text: "助けてください！今、強烈な誘惑に襲われていて、リセットしてしまいそうです。どうすればいいですか？" });
      }
    }
  }, [searchParams, isLoading, messages, initialMessages.length, sendMessage]);

  const handleAppend = async (content: string) => {
    if (isLoading) return;
    try {
      if (sendMessage) {
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
      if (sendMessage) {
        await sendMessage({ text: currentInput });
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      setInput(currentInput);
    }
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="flex h-screen flex-col bg-background">
      {/* ヘッダー */}
      <div className="flex items-center gap-4 bg-card p-4 border-b border-border shadow-sm">
        <Link href="/">
          <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">AI サポートチャット</h1>
        </div>
      </div>

      {/* チャットエリア */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="mx-auto max-w-2xl space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {(!messages || messages.length === 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 py-10"
              >
                <div className="text-center space-y-2">
                  <div className="mx-auto h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-primary opacity-50" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">何かお手伝いできることはありますか？</h2>
                  <p className="text-muted-foreground">誘惑への対策や、モチベーションの相談など、何でも話してください。</p>
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
              </motion.div>
            )}

            {messages && messages.map((m: any) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "flex w-full items-start gap-3",
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
                  m.role === "user" ? "bg-card border-border" : "bg-primary border-primary text-primary-foreground"
                )}>
                  {m.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                  m.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-card text-foreground border border-border rounded-tl-none"
                )}>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {typeof m.content === 'string' ? m.content : (m as any).parts?.map((part: any) => 
                      part.type === 'text' ? part.text : null
                    ).join('')}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {isLoading && messages && messages[messages.length - 1]?.role === "user" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="bg-card border border-border text-foreground rounded-2xl rounded-tl-none px-4 py-2 text-sm shadow-sm">
                  <div className="flex gap-1 items-center h-5">
                    <span className="animate-bounce h-1 w-1 bg-foreground/50 rounded-full" />
                    <span className="animate-bounce h-1 w-1 bg-foreground/50 rounded-full [animation-delay:0.2s]" />
                    <span className="animate-bounce h-1 w-1 bg-foreground/50 rounded-full [animation-delay:0.4s]" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* 入力エリア */}
      <div className="border-t border-border bg-card p-4">
        <form 
          onSubmit={onFormSubmit}
          className="mx-auto flex max-w-2xl items-center gap-2"
        >
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="メッセージを入力..."
            className="flex-1 bg-background border-border focus-visible:ring-primary"
          />
          <Button 
            type="submit" 
            disabled={isLoading || !(input || "").trim()} 
            size="icon" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95"
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
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button 
        type="button"
        variant="outline" 
        className="w-full h-auto py-3 px-4 flex items-center justify-start gap-3 border-border bg-card hover:bg-accent hover:border-border transition-all shadow-sm"
        onClick={onClick}
      >
        {icon}
        <span className="font-medium">{label}</span>
      </Button>
    </motion.div>
  );
}
