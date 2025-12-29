"use client";

import { saveJournal } from "@/app/actions/records";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save, PenLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RecordSection() {
  const [isPending, startTransition] = useTransition();
  const [journal, setJournal] = useState("");
  const router = useRouter();

  const handleSave = () => {
    if (!journal.trim()) {
      toast.info("日記を入力してください");
      return;
    }

    startTransition(async () => {
      try {
        await saveJournal(journal);
        toast.success("日記を保存しました");
        setJournal(""); // 保存したらクリア
        router.refresh();
      } catch (e) {
        console.error("Failed to save journal:", e);
        toast.error("日記の保存に失敗しました");
      }
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="relative overflow-hidden border border-white/50 bg-white/70 backdrop-blur-xl text-slate-900 shadow-xl transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-emerald-500/5 opacity-50" />
        
        <CardHeader className="pb-2 sm:pb-3 relative z-10 p-4 sm:p-6">
          <CardTitle className="text-[10px] sm:text-xs font-black flex items-center gap-1.5 sm:gap-2 text-blue-500 tracking-widest uppercase">
            <div className="p-1 sm:p-1.5 rounded-lg bg-blue-50 shadow-sm border border-blue-100 shrink-0">
              <PenLine className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </div>
            今日の振り返り
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3 sm:space-y-4 relative z-10 p-4 sm:p-6 pt-0">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl sm:rounded-2xl p-1 border border-white/80 shadow-inner">
            <Textarea
              placeholder="今日の一言（日記・反省・気づき）"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              className="min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm bg-transparent border-none transition-colors focus-visible:ring-0 resize-none font-medium placeholder:text-slate-400"
            />
          </div>
          
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Button
              onClick={handleSave}
              disabled={isPending || !journal.trim()}
              className="w-full h-10 sm:h-11 font-black bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all text-sm"
              size="default"
            >
              <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              {isPending ? "保存中..." : "記録を保存"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

