"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface StatusActionsProps {
  onSuccess: () => void;
  onFailure: () => void;
  disabled?: boolean;
}

export function StatusActions({ onSuccess, onFailure, disabled }: StatusActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Button
        onClick={() => {
          onSuccess();
          toast.success("今日も一日お疲れ様でした！成功を記録しました。");
        }}
        variant="outline"
        className="h-24 flex-col gap-2 border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-500"
        disabled={disabled}
      >
        <CheckCircle2 className="h-8 w-8 text-blue-500" />
        <span className="font-bold">今日も成功！</span>
      </Button>
      <Button
        onClick={() => {
          onFailure();
          toast.error("どんまい！ここからまた始めましょう。");
        }}
        variant="outline"
        className="h-24 flex-col gap-2 border-red-500/50 hover:bg-red-500/10 hover:text-red-500"
        disabled={disabled}
      >
        <XCircle className="h-8 w-8 text-red-500" />
        <span className="font-bold">負けてしまった...</span>
      </Button>
    </div>
  );
}

