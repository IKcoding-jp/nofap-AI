"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Send,
    MessageCircle,
    AlertTriangle,
    Lightbulb,
    User,
    Bot,
    Sparkles,
    ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { createChatSession, renameChatSession } from "@/app/actions/chat";

interface InlineChatProps {
    initialSessionId?: number;
    initialMessages?: any[];
}

export function InlineChat({ initialSessionId, initialMessages = [] }: InlineChatProps) {
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(initialSessionId || null);
    const [isFirstMessage, setIsFirstMessage] = useState(initialMessages.length === 0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // セッションIDをCookieに保存
    useEffect(() => {
        if (!currentSessionId) return;
        try {
            document.cookie = `aiChatSessionId=${currentSessionId}; Path=/; SameSite=Lax`;
        } catch (e) {
            // ignore
        }
    }, [currentSessionId]);

    const chatBody = useMemo(() => {
        return { sessionId: currentSessionId ?? undefined };
    }, [currentSessionId]);

    const chat = useChat({
        key: currentSessionId ? `inline-session-${currentSessionId}` : undefined,
        initialMessages: initialMessages as any,
        api: "/api/chat",
        body: chatBody,
    } as any) as any;

    const {
        messages,
        status,
        isLoading: isChatLoading,
        sendMessage,
    } = chat;

    const [input, setInput] = useState("");
    const isLoading = status === "submitted" || status === "streaming" || isChatLoading;

    // 新しいメッセージが追加されたら自動スクロール
    useEffect(() => {
        const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
    };

    const handleAppend = async (content: string) => {
        if (isLoading) return;
        try {
            let sessionId = currentSessionId;
            if (!sessionId) {
                sessionId = await createChatSession();
                setCurrentSessionId(sessionId);
            }

            if (isFirstMessage) {
                const title = content.trim().slice(0, 20);
                await renameChatSession(sessionId, title);
                setIsFirstMessage(false);
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
            let sessionId = currentSessionId;
            if (!sessionId) {
                sessionId = await createChatSession();
                setCurrentSessionId(sessionId);
            }

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
            <Card className="relative overflow-hidden border border-primary/10 bg-card shadow-xl group transition-all duration-300 hover:shadow-2xl hover:border-primary/20 flex flex-col h-[700px]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

                <CardHeader className="pb-2 sm:pb-3 relative z-10 p-4 sm:p-5">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] sm:text-[11px] font-black flex items-center gap-2 text-primary/80 tracking-widest uppercase">
                            <MessageCircle className="h-3.5 w-3.5" />
                            AIアシスタントに相談
                        </CardTitle>
                        <Link href="/chat" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                            履歴
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10 p-3 sm:p-4 pt-0 flex flex-col gap-2 flex-1 min-h-0">
                    {messages && messages.length > 0 ? (
                        <ScrollArea className="flex-1 min-h-0 rounded-lg border border-border/50 bg-background/50" ref={scrollRef}>
                            <div className="p-3 space-y-3">
                                <AnimatePresence initial={false}>
                                    {messages.map((m: any) => (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className={cn(
                                                "flex w-full items-start gap-2",
                                                m.role === "user" ? "flex-row-reverse" : "flex-row"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex h-6 w-6 shrink-0 select-none items-center justify-center rounded-full border shadow-sm",
                                                m.role === "user" ? "bg-card border-border" : "bg-primary border-primary text-primary-foreground"
                                            )}>
                                                {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                                            </div>
                                            <div className={cn(
                                                "max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm",
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

                                    {/* ローディング表示 */}
                                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex items-start gap-2"
                                        >
                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                                <Bot className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="bg-card border border-border text-foreground rounded-2xl rounded-tl-none px-3 py-2 text-xs shadow-sm">
                                                <div className="flex gap-1 items-center h-4">
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
                    ) : (
                        /* 空状態 - クイックアクション表示 */
                        <div className="space-y-3">
                            <div className="text-center py-4">
                                <div className="mx-auto h-10 w-10 bg-primary/5 rounded-full flex items-center justify-center mb-2">
                                    <Sparkles className="h-5 w-5 text-primary opacity-50" />
                                </div>
                                <p className="text-xs text-muted-foreground">何でも相談してください</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <QuickAction
                                    icon={<AlertTriangle className="h-3.5 w-3.5 text-orange-500" />}
                                    label="誘惑に負けそう..."
                                    onClick={() => handleAppend("誘惑に負けそうです。どうすればいいですか？")}
                                    disabled={isLoading}
                                />
                                <QuickAction
                                    icon={<Lightbulb className="h-3.5 w-3.5 text-yellow-500" />}
                                    label="メリットを教えて"
                                    onClick={() => handleAppend("オナ禁を続けるメリットを改めて教えてください。")}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    )}

                    {/* 入力フォーム */}
                    <form onSubmit={onFormSubmit} className="flex items-center gap-2 shrink-0">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="メッセージを入力..."
                            className="flex-1 bg-background/80 backdrop-blur-sm border-primary/20 focus-visible:ring-primary h-10 sm:h-11 text-sm shadow-inner"
                            disabled={isLoading}
                        />
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                className="h-10 w-10 sm:h-11 sm:w-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shrink-0 flex items-center justify-center"
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </motion.div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
}

function QuickAction({
    icon,
    label,
    onClick,
    disabled
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <motion.div
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
        >
            <Button
                type="button"
                variant="outline"
                className="w-full h-auto py-2.5 px-3 flex items-center justify-start gap-2 border-border bg-card hover:bg-accent hover:border-border transition-all shadow-sm text-xs"
                onClick={onClick}
                disabled={disabled}
            >
                {icon}
                <span className="font-medium truncate">{label}</span>
            </Button>
        </motion.div>
    );
}
