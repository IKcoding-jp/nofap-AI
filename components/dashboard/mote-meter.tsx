"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Eye, MessageCircle, Flame, Ghost } from "lucide-react";
import { motion } from "framer-motion";

interface MoteMeterProps {
  level: number; // 0 to 30
}

export function MoteMeter({ level }: MoteMeterProps) {
  // レベルに応じたステージとメッセージ
  const getStageInfo = (lvl: number) => {
    if (lvl <= 5) return {
      name: "透明人間からの脱却",
      desc: lvl === 0 ? "誰の視界にも入らない状態" : "存在が認識され始めています",
      icon: <Ghost className="h-5 w-5 text-slate-400" />,
      color: "from-slate-400 to-slate-500"
    };
    if (lvl <= 15) return {
      name: "周囲の反応の変化",
      desc: "すれ違いざまに視線を感じる...",
      icon: <Eye className="h-5 w-5 text-blue-400" />,
      color: "from-blue-400 to-cyan-500"
    };
    if (lvl <= 25) return {
      name: "惹きつける力",
      desc: "周囲を惹きつける力が覚醒中",
      icon: <MessageCircle className="h-5 w-5 text-pink-400" />,
      color: "from-pink-400 to-rose-500"
    };
    return {
      name: "圧倒的オーラ",
      desc: "存在するだけで空気が変わる",
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      color: "from-orange-500 to-yellow-500"
    };
  };

  const stage = getStageInfo(level);
  const percentage = (level / 30) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="bg-card text-card-foreground border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-lg font-bold">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              モテレベル
            </div>
            <span className="text-2xl font-black italic text-primary">Lv. {level}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-4">
          <div className="relative h-6 w-full overflow-hidden rounded-full bg-secondary border border-border">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={cn("h-full bg-gradient-to-r", stage.color)}
            />
          </div>
          
          <div className="mt-6 flex items-start gap-4 bg-accent/30 p-4 rounded-xl border border-border/50">
            <div className="bg-background p-3 rounded-lg shadow-sm border border-border">
              {stage.icon}
            </div>
            <div>
              <h4 className="font-bold text-foreground leading-tight">{stage.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{stage.desc}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Helper to use cn in this file if not already available
import { cn } from "@/lib/utils";

