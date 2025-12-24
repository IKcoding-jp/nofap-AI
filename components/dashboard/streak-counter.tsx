"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { motion } from "framer-motion";

interface StreakCounterProps {
  currentStreak: number;
  maxStreak: number;
}

export function StreakCounter({ currentStreak, maxStreak }: StreakCounterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium opacity-90">
            <Flame className="h-5 w-5 fill-current" />
            現在のストリーク
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
            className="text-7xl font-bold tracking-tighter"
          >
            {currentStreak}
            <span className="ml-2 text-2xl font-normal opacity-80">日目</span>
          </motion.div>
          <div className="mt-4 flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-sm font-medium backdrop-blur-sm">
            <span>最高記録: {maxStreak}日</span>
          </div>
        </CardContent>
        {/* 装飾用アイコン */}
        <Flame className="absolute -bottom-6 -right-6 h-32 w-32 opacity-10" />
      </Card>
    </motion.div>
  );
}

