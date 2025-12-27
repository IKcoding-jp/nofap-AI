"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startStreak } from "@/app/actions/streak";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { motion } from "framer-motion";

export function StartStreakButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStart = () => {
    startTransition(async () => {
      try {
        const result = await startStreak();
        if (result.success) {
          if (result.alreadyStarted) {
            toast.info("既に開始済みです");
            router.refresh(); // ページをリフレッシュしてタイマー表示へ
          } else {
            toast.success("オナ禁を開始しました！頑張りましょう！");
            router.refresh(); // ページをリフレッシュしてタイマー表示へ
          }
        }
      } catch (error) {
        console.error("Failed to start streak:", error);
        toast.error("開始に失敗しました");
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium opacity-90">
            <Play className="h-5 w-5 fill-current" />
            オナ禁を始めましょう
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
          <p className="text-sm opacity-90 text-center">
            スタートボタンを押すと、継続時間が自動でカウントされます
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleStart}
              disabled={isPending}
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg px-8 py-6 h-auto"
              size="lg"
            >
              {isPending ? (
                <span>開始中...</span>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-2 fill-current" />
                  オナ禁スタート
                </>
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

