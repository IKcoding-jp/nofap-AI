"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, BookOpen, Briefcase, Heart, Sparkles, Eye, MessageCircle, Flame, Ghost, Skull, AlertTriangle, Zap, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getMoteStage } from "@/lib/mote-stages";
import { calculateMoteScore, getMoteRank } from "@/lib/gamification";

interface UnifiedLevelCardProps {
  // 内部的なランクレベル関連（サブ情報として使用）
  level: number;
  xp: number;
  nextLevelXp: number;
  progress: number;
  titles: { study: string, work: string, love: string };
  
  // モテレベル関連（メイン）
  moteLevel: number;
  moteAttributes: {
    confidence: number;
    vitality: number;
    calmness: number;
    cleanliness: number;
  };
}

export function UnifiedLevelCard({ 
  level, 
  xp, 
  nextLevelXp, 
  progress, 
  titles,
  moteLevel,
  moteAttributes
}: UnifiedLevelCardProps) {
  const remainingXp = nextLevelXp - xp;
  const moteScore = calculateMoteScore(moteLevel);
  const moteRank = getMoteRank(moteScore);

  // モテレベルのステージ情報を取得
  const getStageInfo = (lvl: number) => {
    const stageData = getMoteStage(lvl);
    
    let icon, color, aura, bgGradient;
    
    if (lvl <= -80) {
      icon = <Skull className="h-6 w-6 text-slate-500" />;
      color = "from-slate-200 to-slate-300";
      aura = "shadow-md border-slate-200";
      bgGradient = "from-slate-50 via-white to-slate-50";
    } else if (lvl <= -50) {
      icon = <AlertTriangle className="h-6 w-6 text-red-500" />;
      color = "from-red-200 to-red-300";
      aura = "shadow-md border-red-100";
      bgGradient = "from-red-50 via-white to-slate-50";
    } else if (lvl <= -20) {
      icon = <AlertTriangle className="h-6 w-6 text-orange-500" />;
      color = "from-orange-200 to-orange-300";
      aura = "border-orange-100";
      bgGradient = "from-orange-50/50 via-white to-slate-50";
    } else if (lvl < 0) {
      icon = <Ghost className="h-6 w-6 text-slate-400" />;
      color = "from-slate-200 to-slate-100";
      aura = "border-slate-100";
      bgGradient = "from-slate-50 via-white to-slate-50";
    } else if (lvl <= 20) {
      icon = <Sparkles className="h-6 w-6 text-blue-500" />;
      color = "from-blue-400 to-cyan-300";
      aura = "shadow-lg shadow-blue-500/10 border-blue-100";
      bgGradient = "from-blue-50/50 via-white to-slate-50";
    } else if (lvl <= 50) {
      icon = <Eye className="h-6 w-6 text-cyan-500" />;
      color = "from-cyan-400 to-teal-300";
      aura = "shadow-lg shadow-cyan-500/10 border-cyan-100";
      bgGradient = "from-cyan-50/50 via-white to-slate-50";
    } else if (lvl <= 75) {
      icon = <MessageCircle className="h-6 w-6 text-pink-500" />;
      color = "from-pink-400 to-rose-300";
      aura = "shadow-lg shadow-rose-500/10 border-rose-100";
      bgGradient = "from-rose-50/50 via-white to-slate-50";
    } else {
      icon = <Flame className="h-6 w-6 text-orange-500" />;
      color = "from-orange-400 via-amber-300 to-yellow-200";
      aura = "shadow-xl shadow-amber-500/20 border-amber-100";
      bgGradient = "from-amber-50/50 via-white to-slate-50";
    }
    
    return { name: stageData.name, desc: stageData.desc, icon, color, aura, bgGradient };
  };

  const stage = getStageInfo(moteLevel);
  const motePercentage = moteScore; // 0-100

  const getPoint = (score: number, angle: number, center: number, radius: number) => {
    const normalizedScore = Math.max(0, Math.min(100, score));
    const normalizedPercent = normalizedScore / 100;
    const r = normalizedPercent * radius;
    const x = center + r * Math.sin((angle * Math.PI) / 180);
    const y = center - r * Math.cos((angle * Math.PI) / 180);
    return `${x},${y}`;
  };

  const attrScore = {
    confidence: calculateMoteScore(moteAttributes.confidence),
    vitality: calculateMoteScore(moteAttributes.vitality),
    calmness: calculateMoteScore(moteAttributes.calmness),
    cleanliness: calculateMoteScore(moteAttributes.cleanliness),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={cn(
        "relative overflow-hidden border border-white bg-white/70 backdrop-blur-xl text-slate-900 shadow-xl transition-all duration-500 group",
        stage.aura
      )}>
        {/* 背景装飾 */}
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-30 transition-opacity duration-1000", stage.bgGradient)} />
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-400/10 blur-[80px] rounded-full pointer-events-none" />
        
        <CardContent className="p-4 sm:p-6 md:p-8 relative z-10">
          <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
            
            {/* 上部：メインステータス */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("p-1 sm:p-1.5 rounded-xl bg-white shadow-sm border border-slate-100 shrink-0", stage.aura)}>
                    {stage.icon}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-slate-400">現在の状態</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-slate-800">
                    {moteRank.name}
                  </h2>
                  <span className={cn("text-[10px] sm:text-[11px] font-black px-2 py-1 rounded-full", moteRank.badgeClass)}>
                    スコア {moteScore}/100
                  </span>
                </div>
                <p className="text-slate-500 text-xs sm:text-sm font-semibold max-w-[320px] leading-relaxed">
                  {moteRank.desc}
                </p>
              </div>

              <div className="relative flex items-center justify-center p-3 sm:p-4 shrink-0">
                <div className="relative text-center">
                  <span className="block text-[9px] sm:text-[10px] font-black text-slate-400 tracking-widest mb-1">モテスコア</span>
                  <div className="flex items-baseline justify-center">
                    <span className={cn(
                      "text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter leading-none",
                      moteRank.accentClass
                    )}>
                      {moteScore}
                    </span>
                    <span className="ml-1 sm:ml-2 text-xs sm:text-sm font-black text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 中部：グリッド（レーダーチャートと属性） */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 items-center bg-white/50 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 border border-white/80 shadow-inner">
              
              {/* Radar Chart */}
              <div className="flex items-center justify-center py-2 sm:py-4 relative">
                <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px]">
                  <svg width="100%" height="100%" viewBox="0 0 180 180" className="-rotate-90">
                    {/* 背景グリッド */}
                    {[0.25, 0.5, 0.75, 1].map((scale) => (
                      <circle
                        key={scale}
                        cx={90}
                        cy={90}
                        r={80 * scale}
                        fill="none"
                        stroke="rgba(0,0,0,0.03)"
                        strokeWidth="1"
                      />
                    ))}
                    {/* 軸 */}
                    {[0, 90, 180, 270].map((angle) => {
                      const x2 = 90 + 80 * Math.sin((angle * Math.PI) / 180);
                      const y2 = 90 - 80 * Math.cos((angle * Math.PI) / 180);
                      return (
                        <line
                          key={angle}
                          x1={90}
                          y1={90}
                          x2={x2}
                          y2={y2}
                          stroke="rgba(0,0,0,0.03)"
                          strokeWidth="1"
                        />
                      );
                    })}
                    
                    {/* 属性ポリゴン */}
                    <motion.polygon
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 0.5, scale: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                      points={[
                        getPoint(attrScore.confidence, 0, 90, 80),
                        getPoint(attrScore.vitality, 90, 90, 80),
                        getPoint(attrScore.calmness, 180, 90, 80),
                        getPoint(attrScore.cleanliness, 270, 90, 80),
                      ].join(" ")}
                      className={cn("fill-blue-500")}
                    />

                    {/* 各頂点のドット */}
                    {[
                      { val: attrScore.confidence, angle: 0 },
                      { val: attrScore.vitality, angle: 90 },
                      { val: attrScore.calmness, angle: 180 },
                      { val: attrScore.cleanliness, angle: 270 },
                    ].map((attr, i) => {
                      const pos = getPoint(attr.val, attr.angle, 90, 80).split(',');
                      return (
                        <circle
                          key={i}
                          cx={pos[0]}
                          cy={pos[1]}
                          r="4"
                          className="fill-white stroke-blue-500 stroke-2 shadow-sm"
                        />
                      );
                    })}
                  </svg>
                  
                  {/* ラベル */}
                  <div className="absolute -top-2 sm:-top-4 left-1/2 -translate-x-1/2 text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 tracking-tighter">自信</div>
                  <div className="absolute top-1/2 -right-6 sm:-right-8 -translate-y-1/2 text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 tracking-tighter">活力</div>
                  <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 -translate-x-1/2 text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 tracking-tighter">余裕</div>
                  <div className="absolute top-1/2 -left-6 sm:-left-8 -translate-y-1/2 text-[8px] sm:text-[9px] md:text-[10px] font-black text-slate-400 tracking-tighter">清潔</div>
                </div>
              </div>

              {/* 属性リスト */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                {[
                  { label: "自信", val: attrScore.confidence, icon: <Zap className="h-3 w-3" />, color: "bg-amber-100 text-amber-700" },
                  { label: "活力", val: attrScore.vitality, icon: <TrendingUp className="h-3 w-3" />, color: "bg-emerald-100 text-emerald-700" },
                  { label: "余裕", val: attrScore.calmness, icon: <div className="w-1.5 h-1.5 rounded-full bg-current" />, color: "bg-blue-100 text-blue-700" },
                  { label: "清潔", val: attrScore.cleanliness, icon: <Sparkles className="h-3 w-3" />, color: "bg-pink-100 text-pink-700" },
                ].map((attr, i) => (
                  <div key={i} className="bg-white/80 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-slate-50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-1 sm:gap-1.5 mb-1">
                      <span className={cn("p-0.5 sm:p-1 rounded-lg", attr.color)}>{attr.icon}</span>
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400">{attr.label}</span>
                    </div>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-lg sm:text-xl font-black tabular-nums text-slate-700">{attr.val}</span>
                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-black ml-0.5">/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 下部：成長進捗 */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-end justify-between px-1 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 tracking-widest uppercase">成長進捗</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-600 truncate">Lv.{level} <span className="text-slate-300 mx-1">→</span> Lv.{level + 1}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl sm:text-2xl font-black italic text-slate-800 leading-none">{progress}%</span>
                  <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">
                    {xp} / {nextLevelXp} XP
                  </p>
                </div>
              </div>

              {/* プログレスバー */}
              <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-white p-[2px] shadow-inner">
                <motion.div 
                  className={cn("h-full rounded-full bg-gradient-to-r shadow-sm", moteRank.gradientClass)}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "circOut" }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  />
                </motion.div>
              </div>

              {/* 称号 */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 pt-2 sm:pt-3 border-t border-slate-100">
                {[
                  { icon: <BookOpen className="h-3 w-3" />, text: titles.study },
                  { icon: <Briefcase className="h-3 w-3" />, text: titles.work },
                  { icon: <Heart className="h-3 w-3" />, text: titles.love },
                ].map((t, i) => (
                  <div key={i} className="flex items-center gap-1 sm:gap-1.5 group/title">
                    <span className="p-0.5 sm:p-1 rounded-lg bg-slate-50 text-slate-400 group-hover/title:bg-white group-hover/title:text-blue-500 transition-colors shadow-sm shrink-0">{t.icon}</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-500 tracking-tighter">{t.text}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
