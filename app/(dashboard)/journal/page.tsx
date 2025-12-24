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
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">日記・反省一覧</h1>
        </div>

        <div className="space-y-4">
          {records.length > 0 ? (
            records.map((record) => (
              <Card key={record.id} className="overflow-hidden">
                <div className={cn(
                  "h-1 w-full",
                  record.status === "success" ? "bg-blue-500" : "bg-red-500"
                )} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-slate-500">
                      {format(parseISO(record.date), "yyyy年M月d日 (E)", { locale: ja })}
                    </CardTitle>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-bold",
                      record.status === "success" 
                        ? "bg-blue-50 text-blue-600" 
                        : "bg-red-50 text-red-600"
                    )}>
                      {record.status === "success" ? "SUCCESS" : "FAILURE"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {record.journal ? (
                    <p className="text-slate-700 whitespace-pre-wrap">{record.journal}</p>
                  ) : (
                    <p className="text-slate-400 italic text-sm">日記の記載はありません。</p>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
              <MessageSquareQuote className="h-12 w-12 opacity-20" />
              <p>まだ記録がありません。まずは今日を記録しましょう！</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

