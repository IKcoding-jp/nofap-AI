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
            <Card className="relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-xl text-slate-900 shadow-2xl flex flex-col h-[700px]">
                {/* 装飾的な背景グラデーションを少し強調 */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-purple-50/50 pointer-events-none" />

                <CardHeader className="pb-3 relative z-10 p-4 sm:p-5 border-b border-slate-100 bg-white/50">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-[10px] sm:text-xs font-black flex items-center gap-2 text-indigo-600 tracking-widest uppercase">
                            <div className="p-1.5 rounded-lg bg-indigo-100/50 shadow-sm border border-indigo-200 shrink-0 text-indigo-600">
                                <MessageCircle className="h-4 w-4" />
                            </div>
                            AIアシスタントに相談
                        </CardTitle>
                        <Link href="/chat" className="text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 uppercase tracking-wider">
                            履歴
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                </CardHeader>

                <CardContent className="relative z-10 p-4 sm:p-5 flex flex-col gap-4 flex-1 min-h-0">
                    {messages && messages.length > 0 ? (
                        <ScrollArea className="flex-1 min-h-0 rounded-2xl border border-slate-200/60 bg-slate-50/50 backdrop-blur-sm shadow-inner" ref={scrollRef}>
                            <div className="p-4 space-y-4">
                                <AnimatePresence initial={false}>
                                    {messages.map((m: any) => (
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
                                                "flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl border shadow-sm transition-all",
                                                m.role === "user"
                                                    ? "bg-white border-slate-200 text-slate-600"
                                                    : "bg-indigo-600 border-indigo-500 text-white"
                                            )}>
                                                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                            </div>
                                            <div className={cn(
                                                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed transition-all",
                                                m.role === "user"
                                                    ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-100"
                                                    : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                                            )}>
                                                <div className="whitespace-pre-wrap">
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
                                            className="flex items-start gap-3"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
                                                <Bot className="h-4 w-4" />
                                            </div>
                                            <div className="bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-sm">
                                                <div className="flex gap-1.5 items-center h-4">
                                                    <span className="animate-bounce h-1.5 w-1.5 bg-indigo-400 rounded-full" />
                                                    <span className="animate-bounce h-1.5 w-1.5 bg-indigo-400 rounded-full [animation-delay:0.2s]" />
                                                    <span className="animate-bounce h-1.5 w-1.5 bg-indigo-400 rounded-full [animation-delay:0.4s]" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>
                    ) : (
                        /* 空状態 - クイックアクション表示 */
                        <div className="space-y-4">
                            <div className="text-center py-6">
                                <div className="mx-auto h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3 border border-indigo-100 shadow-sm">
                                    <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-800">AIアシスタント</h3>
                                <p className="text-xs text-slate-400 mt-1">何でも相談してください</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <QuickAction
                                    icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
                                    label="誘惑に負けそう..."
                                    onClick={() => handleAppend("誘惑に負けそうです。どうすればいいですか？")}
                                    disabled={isLoading}
                                />
                                <QuickAction
                                    icon={<Lightbulb className="h-4 w-4 text-yellow-500" />}
                                    label="メリットを教えて"
                                    onClick={() => handleAppend("オナ禁を続けるメリットを改めて教えてください。")}
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    )}

                    {/* 入力フォーム */}
                    <form onSubmit={onFormSubmit} className="flex items-center gap-2 shrink-0 relative">
                        <Input
                            value={input}
                            onChange={handleInputChange}
                            placeholder="メッセージを入力..."
                            className="flex-1 bg-slate-50/80 backdrop-blur-sm border-slate-200 focus-visible:ring-indigo-100 focus-visible:border-indigo-300 h-10 sm:h-12 text-sm sm:text-base shadow-inner rounded-xl px-4"
                            disabled={isLoading}
                        />
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || isLoading}
                                className="h-10 w-10 sm:h-12 sm:w-12 bg-slate-900 hover:bg-black text-white shadow-xl shadow-slate-200 shrink-0 flex items-center justify-center rounded-xl"
                            >
                                <Send className="h-5 w-5" />
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
