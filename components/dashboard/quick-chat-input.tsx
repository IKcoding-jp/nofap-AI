"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { createChatSession, renameChatSession } from "@/app/actions/chat";

export function QuickChatInput() {
    const [message, setMessage] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || isPending) return;

        startTransition(async () => {
            try {
                // 新しいセッションを作成
                const sessionId = await createChatSession();
                // セッションタイトルを最初のメッセージから生成
                const title = message.trim().slice(0, 20);
                await renameChatSession(sessionId, title);

                // メッセージをLocalStorageに保存してチャットページへ
                localStorage.setItem("pendingChatMessage", message.trim());
                router.push(`/chat?session=${sessionId}&pending=true`);
            } catch (error) {
                console.error("Failed to create chat session:", error);
            }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
        >
            <Card className="relative overflow-hidden border border-primary/10 bg-card shadow-xl group transition-all duration-300 hover:shadow-2xl hover:border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

                <CardHeader className="pb-2 sm:pb-3 relative z-10 p-4 sm:p-5">
                    <CardTitle className="text-[10px] sm:text-[11px] font-black flex items-center gap-2 text-primary/80 tracking-widest uppercase">
                        <MessageCircle className="h-3.5 w-3.5" />
                        AIアシスタントに相談
                    </CardTitle>
                </CardHeader>

                <CardContent className="relative z-10 p-4 sm:p-5 pt-0">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2">
                        <Input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="メッセージを入力..."
                            className="flex-1 bg-background/80 backdrop-blur-sm border-primary/20 focus-visible:ring-primary h-10 sm:h-11 text-sm shadow-inner"
                            disabled={isPending}
                        />
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!message.trim() || isPending}
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
