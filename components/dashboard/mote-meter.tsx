"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Eye, MessageCircle, Flame, Ghost, Skull, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { getMoteStage } from "@/lib/mote-stages";
import { cn } from "@/lib/utils";

interface MoteMeterProps {
  level: number; // -100 to 100
  attributes?: {
    confidence: number;
    vitality: number;
    calmness: number;
    cleanliness: number;
  };
}

export function MoteMeter({ level, attributes }: MoteMeterProps) {
  // レベルに応じたステージとメッセージ（-100から100の200段階）
  const getStageInfo = (lvl: number) => {
    const stageData = getMoteStage(lvl);
    
    // レベル範囲に応じたアイコンと色、オーラを決定
    let icon, color, aura;
    
    if (lvl <= -80) {
      icon = <Skull className="h-5 w-5 text-gray-800 dark:text-gray-300" />;
      color = "from-gray-900 to-gray-800";
      aura = "shadow-[0_0_20px_rgba(0,0,0,0.5)] border-gray-800";
    } else if (lvl <= -50) {
      icon = <AlertTriangle className="h-5 w-5 text-red-700 dark:text-red-500" />;
      color = "from-red-900 to-red-800";
      aura = "shadow-[0_0_15px_rgba(185,28,28,0.4)] border-red-800/50";
    } else if (lvl <= -20) {
      icon = <AlertTriangle className="h-5 w-5 text-orange-700 dark:text-orange-500" />;
      color = "from-orange-800 to-orange-700";
      aura = "";
    } else if (lvl < 0) {
      icon = <Ghost className="h-5 w-5 text-slate-500" />;
      color = "from-slate-600 to-slate-500";
      aura = "";
    } else if (lvl === 0) {
      icon = <Ghost className="h-5 w-5 text-slate-400" />;
      color = "from-slate-400 to-slate-500";
      aura = "";
    } else if (lvl <= 20) {
      icon = <Ghost className="h-5 w-5 text-slate-300" />;
      color = "from-slate-300 to-blue-400";
      aura = "";
    } else if (lvl <= 50) {
      icon = <Eye className="h-5 w-5 text-blue-400" />;
      color = "from-blue-400 to-cyan-500";
      aura = "";
    } else if (lvl <= 75) {
      icon = <MessageCircle className="h-5 w-5 text-pink-400" />;
      color = "from-pink-400 to-rose-500";
      aura = "shadow-[0_0_20px_rgba(244,63,94,0.3)] border-rose-500/50";
    } else {
      icon = <Flame className="h-5 w-5 text-orange-500" />;
      color = "from-orange-500 to-yellow-500";
      aura = "shadow-[0_0_30px_rgba(245,158,11,0.5)] border-amber-500 animate-pulse";
    }
    
    return {
      name: stageData.name,
      desc: stageData.desc,
      icon,
      color,
      aura
    };
  };

  const stage = getStageInfo(level);
  // -100から100の範囲を0-100%に変換
  const percentage = ((level + 100) / 200) * 100;

  // レーダーチャート用の計算
  const getPoint = (val: number, angle: number, center: number, radius: number) => {
    // 属性値を-100から100の範囲で0-100%に正規化
    const normalizedVal = Math.max(-100, Math.min(100, val));
    const normalizedPercent = (normalizedVal + 100) / 200; // 0-1の範囲に変換
    const r = normalizedPercent * radius;
    const x = center + r * Math.sin((angle * Math.PI) / 180);
    const y = center - r * Math.cos((angle * Math.PI) / 180);
    return `${x},${y}`;
  };

  const attrPoints = attributes ? [
    getPoint(attributes.confidence, 0),
    getPoint(attributes.vitality, 90),
    getPoint(attributes.calmness, 180),
    getPoint(attributes.cleanliness, 270),
  ].join(" ") : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className={cn(
        "bg-card text-card-foreground border-border shadow-sm overflow-hidden transition-all duration-1000",
        stage.aura
      )}>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="flex items-center justify-between text-sm font-bold">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              モテレベル
            </div>
            <span className={`text-xl font-black italic ${level < 0 ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>
              {level >= 0 ? '+' : ''}{level}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="space-y-4">
              <div className="relative h-5 w-full overflow-hidden rounded-full bg-secondary border border-border">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn("h-full bg-gradient-to-r", stage.color)}
                />
              </div>
              
              <div className="flex items-center gap-4 bg-accent/30 p-3 rounded-lg border border-border/50">
                <div className="bg-background p-2 rounded shadow-sm border border-border shrink-0">
                  {/* アイコンサイズを調整 */}
                  {React.cloneElement(stage.icon as React.ReactElement, { className: "h-5 w-5" })}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-foreground leading-tight text-sm truncate">{stage.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{stage.desc}</p>
                </div>
              </div>
            </div>

            {/* Radar Chart */}
            {attributes && (
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative">
                  <svg width={100} height={100} className="drop-shadow-sm">
                    {/* Background circles (0, 50, 100のレベルに対応) */}
                    {[0, 50, 100].map((r) => (
                      <circle
                        key={r}
                        cx={50}
                        cy={50}
                        r={(r / 100) * 40}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-border"
                      />
                    ))}
                    {/* Axes */}
                    <line x1={50} y1={10} x2={50} y2={90} stroke="currentColor" strokeWidth="1" className="text-border" />
                    <line x1={10} y1={50} x2={90} y2={50} stroke="currentColor" strokeWidth="1" className="text-border" />
                    
                    {/* Attribute Polygon */}
                    <motion.polygon
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.6, scale: 1 }}
                      points={[
                        getPoint(attributes.confidence, 0, 50, 40),
                        getPoint(attributes.vitality, 90, 50, 40),
                        getPoint(attributes.calmness, 180, 50, 40),
                        getPoint(attributes.cleanliness, 270, 50, 40),
                      ].join(" ")}
                      fill="var(--primary)"
                      className="text-primary fill-primary"
                    />
                  </svg>
                  
                  {/* Labels */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-bold text-muted-foreground whitespace-nowrap">自信</div>
                  <div className="absolute top-1/2 -right-5 -translate-y-1/2 text-[8px] font-bold text-muted-foreground whitespace-nowrap">活力</div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-bold text-muted-foreground whitespace-nowrap">余裕</div>
                  <div className="absolute top-1/2 -left-5 -translate-y-1/2 text-[8px] font-bold text-muted-foreground whitespace-nowrap">清潔</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

