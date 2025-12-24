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
        <CardContent className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <Star className="h-6 w-6 text-primary fill-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">RANK</p>
                <h3 className="text-3xl font-black text-foreground italic leading-none">Lv. {level}</h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">XP Progress</p>
              <p className="text-sm font-black tabular-nums">{xp} / {nextLevelXp}</p>
            </div>
          </div>
          
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-6">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 mt-auto">
            <div className="flex flex-col items-center p-2 rounded-lg bg-accent/30 border border-border/50">
              <BookOpen className="h-3 w-3 text-blue-500 mb-1" />
              <span className="text-[9px] font-bold text-muted-foreground truncate w-full text-center">{titles.study}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-accent/30 border border-border/50">
              <Briefcase className="h-3 w-3 text-orange-500 mb-1" />
              <span className="text-[9px] font-bold text-muted-foreground truncate w-full text-center">{titles.work}</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-accent/30 border border-border/50">
              <Heart className="h-3 w-3 text-red-500 mb-1" />
              <span className="text-[9px] font-bold text-muted-foreground truncate w-full text-center">{titles.love}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

