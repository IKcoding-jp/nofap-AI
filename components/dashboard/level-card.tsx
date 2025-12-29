"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, BookOpen, Briefcase, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function LevelCard({ level, xp, nextLevelXp, progress, titles }: { 
  level: number; 
  xp: number; 
  nextLevelXp: number; 
  progress: number;
  titles: { study: string, work: string, love: string }
}) {
  const remainingXp = nextLevelXp - xp;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-border bg-card shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden relative h-full group">
        {/* 装飾的な背景要素 */}
        <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <Trophy className="h-24 w-24 text-primary rotate-12" />
        </div>
        <div className="absolute top-2 right-2 opacity-10">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>
        
        <CardContent className="p-5 h-full flex flex-col relative z-10">
          {/* ヘッダーセクション */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border-2 border-primary/30 shrink-0 shadow-sm"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Star className="h-6 w-6 text-primary fill-primary" />
              </motion.div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] leading-tight mb-0.5">RANK</p>
                <h3 className="text-3xl font-black text-foreground italic leading-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Lv. {level}
                </h3>
              </div>
            </div>
            <div className="text-right bg-accent/40 rounded-lg px-3 py-2 border border-border/50">
              <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1 leading-tight tracking-wide">XP Progress</p>
              <p className="text-sm font-black tabular-nums leading-tight text-foreground">{xp} / {nextLevelXp}</p>
              {remainingXp > 0 && (
                <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
                  あと {remainingXp} XP
                </p>
              )}
            </div>
          </div>
          
          {/* プログレスバーセクション */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">進捗</span>
              <span className="text-xs font-bold tabular-nums text-foreground">{progress}%</span>
            </div>
            <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden border border-border/30 shadow-inner">
              <motion.div 
                className="h-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full relative overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 2, 
                    ease: "linear" 
                  }}
                />
              </motion.div>
            </div>
          </div>

          {/* 称号セクション */}
          <div className="grid grid-cols-3 gap-2 mt-auto">
            <motion.div 
              className="flex flex-col items-center p-2.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-200 group/title"
              whileHover={{ scale: 1.03, y: -2 }}
            >
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-1.5 group-hover/title:bg-blue-500/20 transition-colors">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-foreground truncate w-full text-center leading-tight">
                {titles.study}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center p-2.5 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-200 group/title"
              whileHover={{ scale: 1.03, y: -2 }}
            >
              <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center mb-1.5 group-hover/title:bg-orange-500/20 transition-colors">
                <Briefcase className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-[10px] font-bold text-foreground truncate w-full text-center leading-tight">
                {titles.work}
              </span>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center p-2.5 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-all duration-200 group/title"
              whileHover={{ scale: 1.03, y: -2 }}
            >
              <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center mb-1.5 group-hover/title:bg-red-500/20 transition-colors">
                <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-[10px] font-bold text-foreground truncate w-full text-center leading-tight">
                {titles.love}
              </span>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

