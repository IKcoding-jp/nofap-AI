"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { recordCleanliness } from "@/app/actions/habit";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function MoteMission() {
  const [completed, setCompleted] = useState(false);

  const handleComplete = async () => {
    try {
      await recordCleanliness();
      setCompleted(true);
      toast.success("ミッション達成！清潔感属性がアップしました。");
    } catch (e) {
      toast.error("エラーが発生しました。");
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Zap className="h-4 w-4" />
          今日のモテ・ミッション
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AnimatePresence mode="wait">
          {!completed ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-foreground">鏡を見て笑顔を3回作る</p>
                <p className="text-xs text-muted-foreground mt-1">清潔感と自信がアップします</p>
              </div>
              <Button 
                onClick={handleComplete}
                size="sm" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
              >
                達成！
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold"
            >
              <CheckCircle2 className="h-5 w-5" />
              本日のミッション完了！
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

