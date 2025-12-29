"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { getTodayMissions, completeMission } from "@/app/actions/missions";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Mission {
  id: number;
  missionId: string;
  title: string;
  description: string;
  xpReward: number;
  attributeReward?: {
    attribute: string;
    amount: number;
  };
  status: "pending" | "completed";
  completedAt: Date | null;
}

export function MoteMission() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    try {
      setLoading(true);
      const data = await getTodayMissions();
      setMissions(data);
    } catch (e) {
      toast.error("ミッションの読み込みに失敗しました");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (missionRecordId: number) => {
    try {
      const res = await completeMission(missionRecordId);
      if (!res.success) {
        toast.message(res.message || "エラーが発生しました");
        return;
      }

      const attributeText = res.attributeReward
        ? ` (+${res.attributeReward.amount} ${getAttributeName(res.attributeReward.attribute)})`
        : "";
      toast.success(`ミッション達成！ (+${res.xpAdded} XP${attributeText})`);

      // ミッションリストを更新（完了したものを除外）
      setMissions((prev) => prev.filter((m) => m.id !== missionRecordId));
    } catch (e) {
      toast.error("エラーが発生しました");
      console.error(e);
    }
  };

  const getAttributeName = (attr: string): string => {
    const names: Record<string, string> = {
      confidence: "自信",
      vitality: "活力",
      calmness: "落ち着き",
      cleanliness: "清潔感",
    };
    return names[attr] || attr;
  };

  const pendingMissions = missions.filter((m) => m.status === "pending");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="relative overflow-hidden border border-white/50 bg-white/70 backdrop-blur-xl text-slate-900 shadow-xl transition-all duration-500 group">
        {/* 背景の装飾的なオーラ */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-50" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
        
        <CardHeader className="pb-2 sm:pb-3 relative z-10 p-4 sm:p-6">
          <CardTitle className="text-[10px] sm:text-xs font-black flex items-center gap-1.5 sm:gap-2 text-indigo-500 tracking-widest uppercase">
            <div className="p-1 sm:p-1.5 rounded-lg bg-indigo-50 shadow-sm border border-indigo-100 shrink-0">
              <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-indigo-500" />
            </div>
            今日のモテ・ミッション
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10 p-4 sm:p-6 pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              読み込み中...
            </div>
          ) : pendingMissions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center gap-3 py-6 text-indigo-600 font-black italic bg-indigo-50/50 rounded-2xl border border-indigo-100/50"
            >
              <div className="relative">
                <CheckCircle2 className="h-6 w-6" />
                <motion.div 
                  className="absolute inset-0 bg-indigo-400 rounded-full"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              </div>
              本日のミッション完了！
            </motion.div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              <AnimatePresence>
                {pendingMissions.map((mission, index) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 bg-white/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-white/80 shadow-inner"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-black text-slate-800 tracking-tight text-base sm:text-lg">
                        {mission.title}
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 text-emerald-500 shrink-0" />
                        {mission.description}
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto"
                    >
                      <Button 
                        onClick={() => handleComplete(mission.id)}
                        size="sm" 
                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 sm:px-5 rounded-xl shadow-lg shadow-indigo-200 text-xs sm:text-sm"
                      >
                        達成！
                      </Button>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

