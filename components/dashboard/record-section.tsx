"use client";

import { saveJournal } from "@/app/actions/records";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

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
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-3"
    >
      <div className="space-y-1.5">
        <h2 className="text-sm font-bold text-foreground px-1 flex items-center gap-2">
          今日の記録
        </h2>
        <Textarea
          placeholder="今日の一言（日記・反省）"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          className="min-h-[80px] text-sm bg-card border-border transition-colors focus:border-primary resize-none"
        />
      </div>
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <Button
          onClick={handleSave}
          disabled={isPending || !journal.trim()}
          className="w-full h-10 font-bold"
          size="default"
        >
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "保存中..." : "記録を保存"}
        </Button>
      </motion.div>
    </motion.div>
  );
}

