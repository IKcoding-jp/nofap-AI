"use client";

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { listChatSessions, createChatSession, deleteChatSession, ChatSession } from "@/app/actions/chat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChatSidebarProps {
  selectedSessionId?: number;
  onSelectSession: (sessionId: number) => void;
  onNewSession: (sessionId: number) => void;
}

export default function ChatSidebar({
  selectedSessionId,
  onSelectSession,
  onNewSession,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await listChatSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleNewChat = async () => {
    try {
      const newSessionId = await createChatSession();
      await loadSessions();
      onNewSession(newSessionId);
    } catch (error) {
      console.error("Failed to create new session:", error);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await deleteChatSession(sessionToDelete);
      await loadSessions();
      setShowDeleteDialog(false);
      setSessionToDelete(null);
      // 削除されたセッションが選択されていた場合、最初のセッションを選択
      if (selectedSessionId === sessionToDelete) {
        const remainingSessions = sessions.filter(s => s.id !== sessionToDelete);
        if (remainingSessions.length > 0) {
          onSelectSession(remainingSessions[0].id);
        } else {
          // セッションがない場合は新規作成
          await handleNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const formatSessionDate = (date: Date | null) => {
    if (!date) return "";
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "今日";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "昨日";
    } else {
      return format(date, "M月d日(E)", { locale: ja });
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card">
      {/* 新規チャットボタン */}
      <div className="p-4 border-b border-border">
        <Button
          onClick={handleNewChat}
          className="w-full"
          variant="default"
        >
          <Plus className="h-4 w-4 mr-2" />
          新しいチャット
        </Button>
      </div>

      <ScrollArea className="flex-1 w-full">
        <div className="p-2 space-y-1 w-full">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              読み込み中...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              会話履歴がありません
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative rounded-md w-full",
                  selectedSessionId === session.id && "bg-accent"
                )}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-auto py-3 px-3",
                    selectedSessionId === session.id && "bg-accent"
                  )}
                  onClick={() => onSelectSession(session.id)}
                >
                  <span className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="flex items-center justify-between">
                      <span className="font-medium text-sm truncate">
                        {session.title}
                      </span>
                    </span>
                    {session.lastMessageAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatSessionDate(session.lastMessageAt)}
                      </span>
                    )}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSessionToDelete(session.id);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>セッションを削除</DialogTitle>
            <DialogDescription>
              この会話セッションを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSessionToDelete(null);
              }}
            >
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteSession}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

