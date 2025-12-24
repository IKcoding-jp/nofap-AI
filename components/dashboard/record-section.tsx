"use client";

import { recordDay } from "@/app/actions/records";
import { StatusActions } from "./status-actions";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/textarea";

export function RecordSection() {
  const [isPending, startTransition] = useTransition();
  const [journal, setJournal] = useState("");

  const handleRecord = (status: "success" | "failure") => {
    startTransition(async () => {
      try {
        await recordDay(status, journal);
        setJournal(""); // 成功したらクリア
      } catch (e) {
        console.error("Failed to record day:", e);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-800 px-1">今日の記録</h2>
        <Textarea
          placeholder="今日の一言（日記・反省）"
          value={journal}
          onChange={(e) => setJournal(e.target.value)}
          className="min-h-[100px] bg-white"
        />
      </div>
      <StatusActions
        onSuccess={() => handleRecord("success")}
        onFailure={() => handleRecord("failure")}
        disabled={isPending}
      />
    </div>
  );
}

