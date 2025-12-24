"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dumbbell, CheckCircle2, Trophy } from "lucide-react";
import { recordMuscleTraining } from "@/app/actions/habit";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function MuscleTrainingCounter() {
  const [selectedCount, setSelectedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const counts = [10, 20, 30, 50];

  const handleComplete = async () => {
    if (!selectedCount) return;
    setLoading(true);
    try {
      await recordMuscleTraining(selectedCount);
      setCompleted(true);
      toast.success(`${selectedCount}回の筋トレを記録しました！ (+30 XP)`);
      setTimeout(() => setCompleted(false), 3000);
    } catch (error) {
      toast.error("記録に失敗しました");
    } finally {
      setLoading(false);
      setSelectedCount(null);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle>筋トレカウンター</CardTitle>
        <CardDescription>
          エネルギーを運動に変換しましょう。完了すると経験値を獲得できます。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8 py-6">
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
            <Dumbbell className="h-10 w-10 text-primary" />
          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            {counts.map((c) => (
              <Button
                key={c}
                variant={selectedCount === c ? "default" : "outline"}
                className={cn(
                  "h-16 text-lg font-bold border-border transition-all",
                  selectedCount === c ? "shadow-md scale-105" : "bg-background"
                )}
                onClick={() => setSelectedCount(c)}
              >
                {c} 回
              </Button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex flex-col items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
            >
              <Trophy className="h-8 w-8 text-green-500" />
              <span className="font-bold text-green-600">ナイスバルク！ XPを獲得しました。</span>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <CardFooter className="border-t border-border pt-6">
        <Button 
          className="w-full h-12 text-lg font-bold shadow-lg" 
          disabled={!selectedCount || loading}
          onClick={handleComplete}
        >
          {loading ? "記録中..." : (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              トレーニング完了
            </div>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

