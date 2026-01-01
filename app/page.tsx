import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { streaks, userProfiles } from "@/schema";
import { eq } from "drizzle-orm";
import { StreakCounter } from "@/components/dashboard/streak-counter";
import { StartStreakButton } from "@/components/dashboard/start-streak-button";

import { RecordSection } from "@/components/dashboard/record-section";
import { ContinuityChallengeSection } from "@/components/dashboard/continuity-challenge-section";
import { QuickChatInput } from "@/components/dashboard/quick-chat-input";
import { UserNav } from "@/components/layout/user-nav";
import { Button } from "@/components/ui/button";
import { Hammer, Calendar } from "lucide-react";
import Link from "next/link";
import { calculateLevel, calculateConfidence, calculateMoteLevel } from "@/lib/gamification";
import { getActiveHabits, getHabitProgress } from "@/app/actions/continuity-challenge";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // データの取得
  let userStreak = { currentStreak: 0, maxStreak: 0, startedAt: null as Date | null };
  let userProfile: {
    level: number;
    totalXp: number;
    moteLevel: number;
    moteAttributes: {
      confidence: number;
      vitality: number;
      calmness: number;
      cleanliness: number;
    };
  } = {
    level: 1,
    totalXp: 0,
    moteLevel: 0,
    moteAttributes: {
      confidence: 0,
      vitality: 0,
      calmness: 0,
      cleanliness: 0,
    }
  };

  try {
    const streakData = await db.query.streaks.findFirst({
      where: eq(streaks.userId, userId),
    });
    if (streakData) {
      userStreak = {
        currentStreak: streakData.currentStreak,
        maxStreak: streakData.maxStreak,
        startedAt: streakData.startedAt || null,
      };
    }

    const profileData = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, userId),
    });
    if (profileData) {
      userProfile = {
        level: profileData.level,
        totalXp: profileData.totalXp,
        moteLevel: profileData.moteLevel,
        moteAttributes: {
          confidence: profileData.moteConfidence,
          vitality: profileData.moteVitality,
          calmness: profileData.moteCalmness,
          cleanliness: profileData.moteCleanliness,
        }
      };
    } else {
      // プロファイルがない場合は作成（初期化）
      const initialConfidence = calculateConfidence(userStreak.currentStreak);
      const initialMoteLevel = calculateMoteLevel({
        confidence: initialConfidence,
        vitality: 0,
        calmness: 0,
        cleanliness: 0,
      });

      await db.insert(userProfiles).values({
        userId,
        totalXp: 0,
        level: 1,
        moteConfidence: initialConfidence,
        moteLevel: initialMoteLevel,
        updatedAt: new Date(),
      });

      userProfile = {
        level: 1,
        totalXp: 0,
        moteLevel: initialMoteLevel,
        moteAttributes: {
          confidence: initialConfidence,
          vitality: 0,
          calmness: 0,
          cleanliness: 0,
        }
      };
    }
  } catch (e) {
    console.error("Database error:", e);
  }

  const { level } = calculateLevel(userProfile.totalXp);

  // 継続チャレンジのデータ取得
  const [habitsData, progressData] = await Promise.all([
    getActiveHabits(),
    getHabitProgress(),
  ]);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl lg:max-w-7xl space-y-4 sm:space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words tracking-tight">
              おかえりなさい、{session.user.name}さん
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">今日の調子はいかがですか？</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border">
              <Link href="/records">
                <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs font-semibold hover:bg-background hover:shadow-sm transition-all duration-200">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  <span className="hidden sm:inline">履歴・カレンダー</span>
                  <span className="sm:hidden">履歴</span>
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs font-semibold hover:bg-background hover:shadow-sm transition-all duration-200">
                  <Hammer className="h-3.5 w-3.5 text-orange-500" />
                  <span className="hidden sm:inline">サポートツール</span>
                  <span className="sm:hidden">ツール</span>
                </Button>
              </Link>
            </div>
            <div className="h-8 w-[1px] bg-border mx-1" />
            <UserNav />
          </div>
        </div>

        {/* メインレイアウトグリッド（3カラム） */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* 左カラム: 継続チャレンジ */}
          <div className="h-full">
            <ContinuityChallengeSection
              initialHabits={habitsData}
              initialProgress={progressData}
            />
          </div>

          {/* 中央カラム: ストリーク */}
          <div className="flex flex-col">
            {/* ストリークカード */}
            {userStreak.startedAt ? (
              <StreakCounter
                currentStreak={userStreak.currentStreak}
                maxStreak={userStreak.maxStreak}
                startedAt={userStreak.startedAt}
              />
            ) : (
              <StartStreakButton />
            )}
          </div>

          {/* 右カラム: 今日の振り返り */}
          <div className="h-full">
            <RecordSection />
          </div>
        </div>

        {/* インラインチャット入力 - 幅を制限して中央寄せ */}
        <div className="max-w-3xl mx-auto w-full pt-4">
          <QuickChatInput />
        </div>
      </div>
    </main>
  );
}

