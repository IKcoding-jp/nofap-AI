"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Wind } from "lucide-react";
import { motion } from "framer-motion";

export function MeditationTimer() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes default
  const [mode, setMode] = useState<"meditation" | "breathing">("meditation");
  
  // 深呼吸モードのアニメーション用
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");

  // タイマーのカウントダウン
  useEffect(() => {
    if (!isActive || timeLeft <= 0) {
      if (timeLeft === 0 && isActive) {
        // タイマーが0になったら停止（次のレンダリングサイクルで処理）
        setTimeout(() => setIsActive(false), 0);
        // ここで完了後のXP付与などを検討（今回は省略）
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((time) => {
        if (time <= 1) {
          setIsActive(false);
          // ここで完了後のXP付与などを検討（今回は省略）
          return 0;
        }
        return time - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // 深呼吸のリズム制御 (4秒吸う、4秒止める、8秒吐く)
  useEffect(() => {
    if (mode === "breathing" && isActive) {
      const breathInterval = setInterval(() => {
        setBreathPhase((current) => {
          if (current === "in") return "hold";
          if (current === "hold") return "out";
          return "in";
        });
      }, breathPhase === "out" ? 8000 : 4000);
      return () => clearInterval(breathInterval);
    }
  }, [mode, isActive, breathPhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "meditation" ? 180 : 60);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>誘惑をやり過ごす</CardTitle>
            <CardDescription>
              深呼吸や瞑想で、脳の興奮を落ち着かせます。
            </CardDescription>
          </div>
          <div className="flex gap-2 bg-secondary p-1 rounded-lg">
            <Button 
              variant={mode === "meditation" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => { setMode("meditation"); setTimeLeft(180); setIsActive(false); }}
              className="text-xs"
            >
              瞑想
            </Button>
            <Button 
              variant={mode === "breathing" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => { setMode("breathing"); setTimeLeft(60); setIsActive(false); }}
              className="text-xs"
            >
              深呼吸
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-10">
        {mode === "meditation" ? (
          <div className="relative flex items-center justify-center">
            <svg className="h-64 w-64 -rotate-90">
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-secondary"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="754"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: 754 - (754 * timeLeft) / (mode === "meditation" ? 180 : 60) }}
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black tabular-nums">{formatTime(timeLeft)}</span>
              <span className="text-sm text-muted-foreground mt-2 font-medium">
                {isActive ? "集中してください" : "準備はいいですか？"}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center">
             <motion.div
              animate={{ 
                scale: breathPhase === "in" ? 1.5 : breathPhase === "hold" ? 1.5 : 1,
                opacity: breathPhase === "in" ? 0.8 : 0.4
              }}
              transition={{ duration: breathPhase === "out" ? 8 : 4, ease: "easeInOut" }}
              className="h-32 w-32 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Wind className="h-12 w-12 text-primary-foreground" />
            </motion.div>
            <div className="mt-8 text-center">
              <span className="text-2xl font-bold uppercase tracking-widest text-primary">
                {isActive ? (
                  breathPhase === "in" ? "吸って..." : 
                  breathPhase === "hold" ? "止めて..." : "吐いて..."
                ) : "開始ボタンを押してください"}
              </span>
              <p className="text-sm text-muted-foreground mt-2">残り {formatTime(timeLeft)}</p>
            </div>
          </div>
        )}

        <div className="mt-10 flex gap-4">
          <Button variant="outline" size="icon" onClick={resetTimer} className="h-12 w-12 rounded-full border-border">
            <RotateCcw className="h-5 w-5" />
          </Button>
          <Button onClick={toggleTimer} size="lg" className="h-12 w-32 rounded-full shadow-md font-bold text-lg">
            {isActive ? <Pause className="h-6 w-6 mr-2" /> : <Play className="h-6 w-6 mr-2" />}
            {isActive ? "一時停止" : "スタート"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}






