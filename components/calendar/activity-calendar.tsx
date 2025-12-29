"use client";

import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";

interface ActivityCalendarProps {
  records: Array<{
    date: string;
    status: "success" | "failure";
    journal?: string | null;
  }>;
  startedAt: Date | null;
}

export function ActivityCalendar({ records, startedAt }: ActivityCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // 日付文字列をキーにしたマップを作成（failure のみ）
  const failureRecordMap = useMemo(() => {
    const map = new Map<string, { date: string; status: "failure"; journal?: string | null }>();
    records.forEach(r => {
      if (r.status === "failure") {
        map.set(r.date, {
          date: r.date,
          status: r.status,
          journal: r.journal,
        });
      }
    });
    return map;
  }, [records]);

  // 日記があるレコードのマップ（表示用）
  const journalRecordMap = useMemo(() => {
    const map = new Map(records.map(r => [r.date, r]));
    return map;
  }, [records]);

  // 開始日から今日までの期間を計算
  const today = startOfDay(new Date());
  const startDate = startedAt ? startOfDay(new Date(startedAt)) : null;

  // 日付が成功期間内かどうかを判定
  const isSuccessDate = (date: Date): boolean => {
    if (!startDate) return false;
    const dateStart = startOfDay(date);
    // 開始日から今日までの期間内で、かつ failure 記録がない
    return (
      !isBefore(dateStart, startDate) &&
      !isAfter(dateStart, today) &&
      !failureRecordMap.has(format(dateStart, "yyyy-MM-dd"))
    );
  };

  // 選択された日付のレコードを取得（日記表示用）
  const selectedRecord = selectedDate 
    ? journalRecordMap.get(format(selectedDate, "yyyy-MM-dd"))
    : undefined;

  // 選択された日付のステータスを判定
  const selectedDateStatus = selectedDate
    ? (failureRecordMap.has(format(selectedDate, "yyyy-MM-dd"))
        ? "failure"
        : isSuccessDate(selectedDate)
        ? "success"
        : null)
    : null;

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-[auto_1fr]">
      <Card className="overflow-hidden w-full md:w-fit mx-auto md:mx-0">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border shadow-sm w-full"
            locale={ja}
            modifiers={{
              success: (date) => isSuccessDate(date),
              failure: (date) => failureRecordMap.has(format(date, "yyyy-MM-dd")),
            }}
            modifiersClassNames={{
              success: "bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-500/30",
              failure: "bg-red-500/20 text-red-600 dark:text-red-400 font-bold hover:bg-red-500/30",
            }}
          />
        </CardContent>
      </Card>

      <Card className="flex flex-col bg-card border-border overflow-hidden h-fit">
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
          <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">
            {selectedDate ? format(selectedDate, "M月d日", { locale: ja }) : "日付を選択"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 space-y-2 sm:space-y-3 p-3 sm:p-4 md:p-6 pt-0">
          {selectedDateStatus ? (
            <>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-block w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0",
                  selectedDateStatus === "success" ? "bg-blue-500" : "bg-red-500"
                )} />
                <span className="font-medium text-foreground text-sm sm:text-base">
                  {selectedDateStatus === "success" ? "オナ禁成功！" : "失敗..."}
                </span>
              </div>
              {selectedRecord?.journal && (
                <div className="text-xs sm:text-sm text-foreground bg-muted/50 p-2 sm:p-3 rounded-md border border-border">
                  <p className="whitespace-pre-wrap leading-relaxed break-words">{selectedRecord.journal}</p>
                </div>
              )}
              {!selectedRecord?.journal && (
                <div className="text-xs sm:text-sm text-muted-foreground italic">
                  日記の記録はありません。
                </div>
              )}
            </>
          ) : (
            <div className="text-xs sm:text-sm text-muted-foreground italic">
              記録がありません。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

