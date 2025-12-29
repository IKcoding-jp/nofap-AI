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
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg sm:text-xl">誘惑をやり過ごす</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              深呼吸や瞑想で、脳の興奮を落ち着かせます。
            </CardDescription>
          </div>
          <div className="flex gap-2 bg-secondary p-1 rounded-lg w-full sm:w-auto">
            <Button 
              variant={mode === "meditation" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => { setMode("meditation"); setTimeLeft(180); setIsActive(false); }}
              className="text-xs sm:text-sm h-9 sm:h-9 flex-1 sm:flex-none px-4"
            >
              瞑想
            </Button>
            <Button 
              variant={mode === "breathing" ? "default" : "ghost"} 
              size="sm" 
              onClick={() => { setMode("breathing"); setTimeLeft(60); setIsActive(false); }}
              className="text-xs sm:text-sm h-9 sm:h-9 flex-1 sm:flex-none px-4"
            >
              深呼吸
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-4 sm:py-6 md:py-10 px-4 sm:px-6">
        {mode === "meditation" ? (
          <div className="relative flex items-center justify-center w-full max-w-sm mx-auto">
            <svg className="h-56 w-56 sm:h-64 sm:w-64 md:h-72 md:w-72 -rotate-90 max-w-full" viewBox="0 0 256 256">
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
              <span className="text-4xl sm:text-5xl md:text-6xl font-black tabular-nums">{formatTime(timeLeft)}</span>
              <span className="text-xs sm:text-sm text-muted-foreground mt-2 font-medium text-center px-4">
                {isActive ? "集中してください" : "準備はいいですか？"}
              </span>
            </div>
          </div>
        ) : (
          <div className="h-56 sm:h-64 md:h-72 flex flex-col items-center justify-center w-full max-w-sm mx-auto">
             <motion.div
              animate={{ 
                scale: breathPhase === "in" ? 1.5 : breathPhase === "hold" ? 1.5 : 1,
                opacity: breathPhase === "in" ? 0.8 : 0.4
              }}
              transition={{ duration: breathPhase === "out" ? 8 : 4, ease: "easeInOut" }}
              className="h-28 w-28 sm:h-32 sm:w-32 md:h-40 md:w-40 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/20"
            >
              <Wind className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-primary-foreground" />
            </motion.div>
            <div className="mt-4 sm:mt-6 md:mt-8 text-center px-4">
              <span className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-wider sm:tracking-widest text-primary block">
                {isActive ? (
                  breathPhase === "in" ? "吸って..." : 
                  breathPhase === "hold" ? "止めて..." : "吐いて..."
                ) : "開始ボタンを押してください"}
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">残り {formatTime(timeLeft)}</p>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8 md:mt-10 flex gap-3 sm:gap-4 justify-center w-full max-w-sm mx-auto">
          <Button variant="outline" size="icon" onClick={resetTimer} className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border-border shrink-0">
            <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
          <Button onClick={toggleTimer} size="lg" className="h-11 sm:h-12 flex-1 sm:flex-none sm:w-36 md:w-40 rounded-full shadow-md font-bold text-sm sm:text-base">
            {isActive ? <Pause className="h-5 w-5 sm:h-6 sm:w-6 mr-2" /> : <Play className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />}
            {isActive ? "一時停止" : "スタート"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}






