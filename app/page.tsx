import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { streaks } from "@/schema";
import { eq } from "drizzle-orm";
import { StreakCounter } from "@/components/dashboard/streak-counter";
import { MoteMeter } from "@/components/dashboard/mote-meter";
import { RecordSection } from "@/components/dashboard/record-section";
import { UserNav } from "@/components/layout/user-nav";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  // データの取得 (エラーハンドリング付き)
  let userStreak = { currentStreak: 0, maxStreak: 0 };
  try {
    const data = await db.query.streaks.findFirst({
      where: eq(streaks.userId, session.user.id),
    });
    if (data) {
      userStreak = {
        currentStreak: data.currentStreak,
        maxStreak: data.maxStreak
      };
    }
  } catch (e) {
    console.error("Database connection failed:", e);
    // エラー時は初期値を使用
  }

  // モテ度の計算 (単純に日数 * 5, 最大100)
  const moteLevel = Math.min(userStreak.currentStreak * 5, 100);

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              おかえりなさい、{session.user.name}さん
            </h1>
            <p className="text-slate-500 text-sm">今日の調子はいかがですか？</p>
          </div>
          <UserNav />
        </div>

        {/* メイングリッド */}
        <div className="grid gap-6">
          <StreakCounter
            currentStreak={userStreak.currentStreak}
            maxStreak={userStreak.maxStreak}
          />
          
          <MoteMeter level={moteLevel} />

          <RecordSection />
        </div>

        {/* クイックリンク */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/calendar" className="w-full">
            <Button variant="outline" className="w-full h-16 flex-col gap-1 border-slate-200 bg-white hover:bg-slate-50">
              <span className="text-xs text-slate-500 font-normal">過去の記録</span>
              <span>カレンダー</span>
            </Button>
          </Link>
          <Link href="/journal" className="w-full">
            <Button variant="outline" className="w-full h-16 flex-col gap-1 border-slate-200 bg-white hover:bg-slate-50">
              <span className="text-xs text-slate-500 font-normal">振り返り</span>
              <span>日記一覧</span>
            </Button>
          </Link>
        </div>
        
        <Link href="/chat" className="block w-full">
          <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white gap-2">
            AIに相談する
          </Button>
        </Link>

        {/* 緊急 SOS ボタン */}
        <Link href="/chat?sos=true" className="block w-full">
          <Button variant="outline" className="w-full h-12 border-red-500 text-red-600 hover:bg-red-50 gap-2 font-bold animate-pulse">
            <AlertTriangle className="h-5 w-5" />
            ⚠️ 今すぐ助けが必要（負けそう）
          </Button>
        </Link>
      </div>
    </main>
  );
}
