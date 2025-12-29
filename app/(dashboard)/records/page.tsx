import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { dailyRecords, streaks } from "@/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { ActivityCalendar } from "@/components/calendar/activity-calendar";

export default async function RecordsPage() {
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

  const userStreak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, session.user.id),
  });

  const startedAt = userStreak?.startedAt || null;

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-4xl space-y-4 sm:space-y-6">
        <div className="flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-accent shrink-0">
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">記録と振り返り</h1>
        </div>

        {/* カレンダーセクション */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
          <ActivityCalendar records={records} startedAt={startedAt} />
        </div>
      </div>
    </main>
  );
}
