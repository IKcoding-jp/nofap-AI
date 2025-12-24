"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface MoteMeterProps {
  level: number; // 0 to 100
}

export function MoteMeter({ level }: MoteMeterProps) {
  // レベルに応じたメッセージ
  const getMessage = (lvl: number) => {
    if (lvl < 10) return "まずは一歩から。";
    if (lvl < 30) return "少しずつオーラが出てきました。";
    if (lvl < 50) return "自信が顔つきに現れています。";
    if (lvl < 80) return "周りの目が変わり始めています！";
    return "覇王のオーラを纏っています。";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="bg-card text-card-foreground border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg font-medium text-purple-500 dark:text-purple-400">
            <Sparkles className="h-5 w-5" />
            モテ度メーター
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${level}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">{getMessage(level)}</p>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-300"
            >
              {level}%
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

