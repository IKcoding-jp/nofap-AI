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
      className="h-full"
    >
      <Card className="h-full relative overflow-hidden border border-slate-200 bg-white/80 backdrop-blur-xl text-slate-900 shadow-2xl flex flex-col">
        {/* 装飾的な背景グラデーションを少し強調 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-indigo-50/50 pointer-events-none" />

        <CardHeader className="pb-3 relative z-10 p-4 sm:p-5 border-b border-slate-100 bg-white/50">
          <CardTitle className="text-[10px] sm:text-xs font-black flex items-center gap-2 text-blue-600 tracking-widest uppercase">
            <div className="p-1.5 rounded-lg bg-blue-100/50 shadow-sm border border-blue-200 shrink-0 text-blue-600">
              <PenLine className="h-3.5 w-3.5" />
            </div>
            今日の振り返り
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4 relative z-10 p-4 sm:p-5 overflow-hidden">
          {/* テキストエリアの背景を少し濃くしてコントラストをつける */}
          <div className="flex-1 min-h-[120px] bg-slate-50/80 backdrop-blur-sm rounded-xl p-1 border border-slate-200/60 shadow-inner focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all overflow-hidden flex flex-col">
            <Textarea
              placeholder="今日の一言（日記・反省・気づき）"
              value={journal}
              onChange={(e) => setJournal(e.target.value)}
              className="flex-1 text-sm sm:text-base bg-transparent border-none transition-colors focus-visible:ring-0 resize-none font-medium placeholder:text-slate-400 p-3 leading-relaxed"
            />
          </div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="shrink-0"
          >
            <Button
              onClick={handleSave}
              disabled={isPending || !journal.trim()}
              className="w-full h-11 sm:h-12 font-bold bg-slate-900 hover:bg-black text-white rounded-xl shadow-lg shadow-slate-200 transition-all text-sm sm:text-base flex items-center justify-center gap-2"
              size="default"
            >
              {isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isPending ? "保存中..." : "記録を保存"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

