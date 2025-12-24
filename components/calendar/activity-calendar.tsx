"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ActivityCalendarProps {
  records: Array<{
    date: string;
    status: "success" | "failure";
    journal?: string | null;
  }>;
}

export function ActivityCalendar({ records }: ActivityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // 日付文字列をキーにしたマップを作成
  const recordMap = new Map(records.map(r => [r.date, r]));

  const selectedRecord = selectedDate 
    ? recordMap.get(format(selectedDate, "yyyy-MM-dd"))
    : undefined;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_300px]">
      <Card>
        <CardContent className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border shadow-sm"
            locale={ja}
            modifiers={{
              success: (date) => recordMap.get(format(date, "yyyy-MM-dd"))?.status === "success",
              failure: (date) => recordMap.get(format(date, "yyyy-MM-dd"))?.status === "failure",
            }}
            modifiersClassNames={{
              success: "bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-500/30",
              failure: "bg-red-500/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-500/30",
            }}
          />
        </CardContent>
      </Card>

      <Card className="flex flex-col bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">
            {selectedDate ? format(selectedDate, "M月d日", { locale: ja }) : "日付を選択"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          {selectedRecord ? (
            <>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-block w-3 h-3 rounded-full",
                  selectedRecord.status === "success" ? "bg-blue-500" : "bg-red-500"
                )} />
                <span className="font-medium text-foreground">
                  {selectedRecord.status === "success" ? "オナ禁成功！" : "失敗..."}
                </span>
              </div>
              <div className="text-sm text-foreground bg-muted p-3 rounded-md min-h-[100px] border border-border">
                {selectedRecord.journal || "日記の記録はありません。"}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground italic">
              記録がありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

