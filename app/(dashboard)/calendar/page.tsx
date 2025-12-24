import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { dailyRecords } from "@/schema";
import { eq, desc } from "drizzle-orm";
import { ActivityCalendar } from "@/components/calendar/activity-calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default async function CalendarPage() {
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
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4 duration-500">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">活動カレンダー</h1>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
          <ActivityCalendar records={records} />
        </div>
      </div>
    </main>
  );
}

