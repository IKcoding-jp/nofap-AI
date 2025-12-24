import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { dailyRecords } from "@/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageSquareQuote } from "lucide-react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default async function JournalPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const records = await db.query.dailyRecords.findMany({
    where: eq(dailyRecords.userId, session.user.id),
    orderBy: [desc(dailyRecords.date)],
  });

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">日記・反省一覧</h1>
        </div>

        <div className="space-y-4">
          {records.length > 0 ? (
            records.map((record, index) => (
              <div 
                key={record.id} 
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${index * 50 + 150}ms` }}
              >
                <Card className="overflow-hidden bg-card border-border shadow-sm">
                  <div className={cn(
                    "h-1 w-full",
                    record.status === "success" ? "bg-blue-500" : "bg-red-500"
                  )} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {format(parseISO(record.date), "yyyy年M月d日 (E)", { locale: ja })}
                      </CardTitle>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full font-bold",
                        record.status === "success" 
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      )}>
                        {record.status === "success" ? "SUCCESS" : "FAILURE"}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {record.journal ? (
                      <p className="text-foreground whitespace-pre-wrap leading-relaxed">{record.journal}</p>
                    ) : (
                      <p className="text-muted-foreground italic text-sm">日記の記載はありません。</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4 animate-in fade-in duration-1000">
              <MessageSquareQuote className="h-12 w-12 opacity-20" />
              <p>まだ記録がありません。まずは今日を記録しましょう！</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

