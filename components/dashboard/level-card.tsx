"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, BookOpen, Briefcase, Heart } from "lucide-react";
import { motion } from "framer-motion";

export function LevelCard({ level, xp, nextLevelXp, progress, titles }: { 
  level: number; 
  xp: number; 
  nextLevelXp: number; 
  progress: number;
  titles: { study: string, work: string, love: string }
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="border-border bg-card shadow-sm overflow-hidden relative h-full">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Trophy className="h-20 w-20 text-primary rotate-12" />
        </div>
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <Star className="h-5 w-5 text-primary fill-primary" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">RANK</p>
                <h3 className="text-2xl font-black text-foreground italic leading-tight text-primary">Lv. {level}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground font-bold uppercase mb-0.5 leading-tight">XP Progress</p>
              <p className="text-xs font-black tabular-nums leading-tight">{xp} / {nextLevelXp}</p>
            </div>
          </div>
          
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden mb-4">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          <div className="grid grid-cols-3 gap-1.5 mt-auto">
            <div className="flex flex-col items-center p-1.5 rounded-lg bg-accent/30 border border-border/50">
              <BookOpen className="h-3 w-3 text-blue-500 mb-0.5" />
              <span className="text-[10px] font-bold text-muted-foreground truncate w-full text-center leading-tight">{titles.study}</span>
            </div>
            <div className="flex flex-col items-center p-1.5 rounded-lg bg-accent/30 border border-border/50">
              <Briefcase className="h-3 w-3 text-orange-500 mb-0.5" />
              <span className="text-[10px] font-bold text-muted-foreground truncate w-full text-center leading-tight">{titles.work}</span>
            </div>
            <div className="flex flex-col items-center p-1.5 rounded-lg bg-accent/30 border border-border/50">
              <Heart className="h-3 w-3 text-red-500 mb-0.5" />
              <span className="text-[10px] font-bold text-muted-foreground truncate w-full text-center leading-tight">{titles.love}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

