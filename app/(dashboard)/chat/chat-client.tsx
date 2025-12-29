"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Send, Sparkles, User, Bot, AlertTriangle, Lightbulb, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ChatSidebar from "@/components/chat/chat-sidebar";
import { getChatHistory, deleteChatMessage, createChatSession, renameChatSession, migrateExistingConversations } from "@/app/actions/chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function ChatClient({ initialSessionId, initialMessages }: { initialSessionId?: number; initialMessages: any[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(initialSessionId || null);
  const [displayMessages, setDisplayMessages] = useState<any[]>(initialMessages);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isFirstMessage, setIsFirstMessage] = useState(initialMessages.length === 0);

  // Persist sessionId for /api/chat requests via Cookie.
  // (Runtime logs show useChat requests only send {id,messages,trigger} and ignore custom body/headers.)
  useEffect(() => {
    if (!currentSessionId) return;
    try {
      document.cookie = `aiChatSessionId=${currentSessionId}; Path=/; SameSite=Lax`;
    } catch (e) {
      // ignore
    }
  }, [currentSessionId]);

  // Recreate body object whenever sessionId changes
  const chatBody = useMemo(() => {
    const body = { sessionId: currentSessionId ?? undefined };
    return body;
  }, [currentSessionId]);

  const chat = useChat({
    key: currentSessionId ? `session-${currentSessionId}` : undefined,
    initialMessages: initialMessages as any,
    api: "/api/chat",
    body: chatBody,
  } as any) as any;

  const { 
    messages, 
    status, 
    isLoading: isChatLoading,
    sendMessage,
    setMessages
  } = chat;

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sosTriggered = useRef(false);

  const isLoading = status === "submitted" || status === "streaming" || isChatLoading;

  // 初期化時に既存データを移行
  useEffect(() => {
    migrateExistingConversations();
  }, []);

  // セッション選択時の処理
  useEffect(() => {
    const loadSessionMessages = async () => {
      if (currentSessionId) {
        try {
          const sessionMessages = await getChatHistory(currentSessionId);
          setDisplayMessages(sessionMessages);
          setMessages(sessionMessages);
          setIsFirstMessage(sessionMessages.length === 0);
          // URLを更新
          router.replace(`/chat?session=${currentSessionId}`);
        } catch (error) {
          console.error("Failed to load session messages:", error);
        }
      }
    };
    loadSessionMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  // 新しいメッセージが追加されたら表示を更新
  useEffect(() => {
    if (messages && messages.length > 0) {
      setDisplayMessages(messages);
    }
  }, [messages, status]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (searchParams.get("sos") === "true" && !sosTriggered.current && !isLoading && messages && messages.length === initialMessages.length && currentSessionId) {
      sosTriggered.current = true;
      if (sendMessage) {
        sendMessage({ text: "助けてください！今、強烈な誘惑に襲われていて、リセットしてしまいそうです。どうすればいいですか？" });
      }
    }
  }, [searchParams, isLoading, messages, initialMessages.length, sendMessage, currentSessionId]);

  const handleSelectSession = (sessionId: number) => {
    setCurrentSessionId(sessionId);
  };

  const handleNewSession = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
    setDisplayMessages([]);
    setMessages([]);
    setIsFirstMessage(true);
  };

  const handleDeleteMessage = async () => {
    if (!deleteMessageId || !currentSessionId) return;
    try {
      await deleteChatMessage(deleteMessageId);
      // メッセージを再読み込み
      const sessionMessages = await getChatHistory(currentSessionId);
      setDisplayMessages(sessionMessages);
      setMessages(sessionMessages);
      setShowDeleteDialog(false);
      setDeleteMessageId(null);
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleAppend = async (content: string) => {
    if (isLoading) return;
    try {
      // セッションがない場合は新規作成
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createChatSession();
        setCurrentSessionId(sessionId);
        router.replace(`/chat?session=${sessionId}`);
        // セッション作成後、ページをリロード
        window.location.href = `/chat?session=${sessionId}`;
        return;
      }

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
      // セッションがない場合は新規作成
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = await createChatSession();
        setCurrentSessionId(sessionId);
        router.replace(`/chat?session=${sessionId}`);
        // セッション作成後、ページをリロードしてチャットを再初期化
        window.location.href = `/chat?session=${sessionId}`;
        return;
      }

      // 最初のメッセージの場合はタイトルを自動生成
      if (isFirstMessage && currentInput.trim()) {
        const title = currentInput.trim().slice(0, 20);
        await renameChatSession(sessionId, title);
        setIsFirstMessage(false);
      }

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
  }, [displayMessages]);

  return (
    <main className="flex h-screen flex-col bg-background">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 sm:gap-4 bg-card p-3 sm:p-4 border-b border-border shadow-sm">
        <Link href="/">
          <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors shrink-0">
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="bg-primary/10 p-1.5 sm:p-2 rounded-lg shrink-0">
            <Bot className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
          </div>
          <h1 className="text-base sm:text-xl font-bold text-foreground truncate">AI サポートチャット</h1>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className="hidden md:flex flex-col w-80 shrink-0 border-r border-border">
          <ChatSidebar
            selectedSessionId={currentSessionId || undefined}
            onSelectSession={handleSelectSession}
            onNewSession={handleNewSession}
          />
        </div>

        {/* チャットエリア */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 w-full md:w-auto">

          <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
            <div className="p-3 sm:p-4 h-full">
              <div className="mx-auto max-w-2xl space-y-3 sm:space-y-4 pb-4">
              <AnimatePresence initial={false}>
                {(!displayMessages || displayMessages.length === 0) && (
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
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

                {displayMessages && displayMessages.map((m: any) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex w-full items-start gap-3 group",
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
                      "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 text-xs sm:text-sm shadow-sm relative",
                      m.role === "user" 
                        ? "bg-primary text-primary-foreground rounded-tr-none" 
                        : "bg-card text-foreground border border-border rounded-tl-none"
                    )}>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {typeof m.content === 'string' ? m.content : (m as any).parts?.map((part: any) => 
                          part.type === 'text' ? part.text : null
                        ).join('')}
                      </div>
                      {m.role === "user" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute -left-10 top-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => {
                            setDeleteMessageId(m.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && displayMessages && displayMessages[displayMessages.length - 1]?.role === "user" && (
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
            </div>
          </ScrollArea>

          {/* 入力エリア */}
          <div className="border-t border-border bg-card p-3 sm:p-4">
            <form 
              onSubmit={onFormSubmit}
              className="mx-auto flex max-w-2xl items-center gap-2"
            >
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="メッセージを入力..."
                className="flex-1 bg-background border-border focus-visible:ring-primary h-9 sm:h-10 text-sm"
              />
              <Button 
                type="submit" 
                disabled={isLoading || !(input || "").trim()} 
                size="icon" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95 h-9 w-9 sm:h-10 sm:w-10 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>メッセージを削除</DialogTitle>
            <DialogDescription>
              このメッセージを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteMessageId(null);
              }}
            >
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteMessage}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
