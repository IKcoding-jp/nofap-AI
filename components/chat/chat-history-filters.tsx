"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ChatHistoryFiltersProps {
  onSearch: (keyword: string, dateFrom?: string, dateTo?: string) => void;
  onClear: () => void;
}

export default function ChatHistoryFilters({ onSearch, onClear }: ChatHistoryFiltersProps) {
  const [keyword, setKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleSearch = () => {
    onSearch(
      keyword,
      dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
      dateTo ? format(dateTo, "yyyy-MM-dd") : undefined
    );
  };

  const handleClear = () => {
    setKeyword("");
    setDateFrom(undefined);
    setDateTo(undefined);
    onClear();
  };

  const hasFilters = keyword || dateFrom || dateTo;

  return (
    <div className="space-y-3 p-4 border-b border-border">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="会話を検索..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          className="pl-9 pr-9"
        />
        {keyword && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            onClick={() => setKeyword("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal",
                !dateFrom && !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom && dateTo
                ? `${format(dateFrom, "yyyy/MM/dd", { locale: ja })} - ${format(dateTo, "yyyy/MM/dd", { locale: ja })}`
                : dateFrom
                ? format(dateFrom, "yyyy/MM/dd", { locale: ja })
                : "日付範囲"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: dateFrom,
                to: dateTo,
              }}
              onSelect={(range) => {
                setDateFrom(range?.from);
                setDateTo(range?.to);
              }}
              locale={ja}
            />
          </PopoverContent>
        </Popover>

        <Button
          onClick={handleSearch}
          size="icon"
          className="shrink-0"
        >
          <Search className="h-4 w-4" />
        </Button>

        {hasFilters && (
          <Button
            onClick={handleClear}
            variant="ghost"
            size="icon"
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}




