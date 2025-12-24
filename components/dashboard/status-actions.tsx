"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface StatusActionsProps {
  onSuccess: () => void;
  onFailure: () => void;
  disabled?: boolean;
}

export function StatusActions({ onSuccess, onFailure, disabled }: StatusActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={() => {
            onSuccess();
            toast.success("今日も一日お疲れ様でした！成功を記録しました。");
          }}
          variant="outline"
          className="w-full h-24 flex-col gap-2 border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
          disabled={disabled}
        >
          <CheckCircle2 className="h-8 w-8 text-blue-500" />
          <span className="font-bold">今日も成功！</span>
        </Button>
      </motion.div>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={() => {
            onFailure();
            toast.error("どんまい！ここからまた始めましょう。");
          }}
          variant="outline"
          className="w-full h-24 flex-col gap-2 border-red-500/50 bg-red-500/5 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all"
          disabled={disabled}
        >
          <XCircle className="h-8 w-8 text-red-500" />
          <span className="font-bold">負けてしまった...</span>
        </Button>
      </motion.div>
    </div>
  );
}

