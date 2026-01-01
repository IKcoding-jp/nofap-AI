"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flame, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  calculateElapsedTime,
  calculateStreakDays,
  formatElapsedTime,
  formatStartDate,
  type ElapsedTime,
} from "@/lib/streak-timer";
import { resetStreak } from "@/app/actions/streak";

interface StreakCounterProps {
  currentStreak: number;
  maxStreak: number;
  startedAt: Date | null;
}

export function StreakCounter({ currentStreak, maxStreak, startedAt }: StreakCounterProps) {
  // 初期値はnull（サーバー/クライアント間のハイドレーション不一致を防ぐ）
  const [elapsed, setElapsed] = useState<ElapsedTime | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // startedAtが変更された場合の処理（次のレンダリングサイクルで処理）
  useEffect(() => {
    if (!startedAt) {
      setTimeout(() => setElapsed(null), 0);
    } else {
      setTimeout(() => setElapsed(calculateElapsedTime(startedAt)), 0);
    }
  }, [startedAt]);

  // 経過時間を1秒間隔で更新
  useEffect(() => {
    if (!startedAt) {
      return;
    }

    const updateElapsed = () => {
      const elapsedTime = calculateElapsedTime(startedAt);
      setElapsed(elapsedTime);
    };

    updateElapsed(); // 初回実行
    const interval = setInterval(updateElapsed, 1000);

    // ブラウザがバックグラウンドから復帰した時に再計算
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        updateElapsed();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startedAt]);

  // ストリーク日数を計算（開始日時から算出した値を優先）
  const streakDays = useMemo(() => {
    if (!elapsed) return currentStreak; // フォールバック
    return calculateStreakDays(elapsed.totalSeconds);
  }, [elapsed, currentStreak]);

  // 経過時間のフォーマット
  const elapsedStr = useMemo(() => formatElapsedTime(elapsed), [elapsed]);

  // 開始日時のフォーマット
  const startDateStr = useMemo(() => {
    if (!startedAt) return "";
    return formatStartDate(startedAt);
  }, [startedAt]);

  const handleReset = () => {
    startTransition(async () => {
      try {
        await resetStreak();
        toast.error("リセットしました。ここからまた始めましょう。");
        setShowResetDialog(false);
        router.refresh();
      } catch (error) {
        console.error("Failed to reset streak:", error);
        toast.error("リセットに失敗しました");
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
        <CardHeader className="p-3 sm:p-4 pb-0">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium opacity-90">
            <Flame className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
            現在のストリーク
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-4 sm:p-6 pt-2 space-y-3 sm:space-y-4">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.2,
              }}
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter"
            >
              {streakDays}
            </motion.div>
            <span className="text-lg sm:text-xl md:text-2xl font-bold opacity-90">日目</span>
          </div>

          {/* 経過時間の表示 */}
          {elapsed && (
            <div className="text-lg sm:text-xl md:text-2xl font-black tracking-tight tabular-nums bg-white/10 px-3 sm:px-4 py-1 rounded-full backdrop-blur-sm border border-white/10">
              {elapsedStr}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-[10px] sm:text-xs font-bold opacity-90">
            {/* 開始日時の表示 */}
            {startDateStr && (
              <span className="flex items-center gap-1.5">
                <span className="opacity-60">開始:</span> {startDateStr}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <span className="opacity-60">最高記録:</span> {maxStreak}日
            </span>
          </div>

          {/* リセットボタン */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="pt-1"
          >
            <Button
              onClick={() => setShowResetDialog(true)}
              variant="destructive"
              className="h-7 px-3 bg-red-600/80 hover:bg-red-600 text-white text-[10px]"
              disabled={isPending}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              リセット
            </Button>
          </motion.div>
        </CardContent>
        {/* 装飾用アイコン */}
        <Flame className="absolute -bottom-4 -right-4 h-20 w-20 opacity-10" />
      </Card>

      {/* リセット確認ダイアログ */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>リセットの確認</DialogTitle>
            <DialogDescription>
              本当にリセットしますか？タイマーが0秒から再スタートし、今日の記録が失敗として記録されます。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              disabled={isPending}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={isPending}
            >
              {isPending ? "リセット中..." : "リセットする"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

