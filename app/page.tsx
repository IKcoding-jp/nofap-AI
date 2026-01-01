import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { streaks, userProfiles } from "@/schema";
import { eq } from "drizzle-orm";
import { StreakCounter } from "@/components/dashboard/streak-counter";
import { StartStreakButton } from "@/components/dashboard/start-streak-button";

import { RecordSection } from "@/components/dashboard/record-section";
import { UnifiedLevelCard } from "@/components/dashboard/unified-level-card";
import { UserNav } from "@/components/layout/user-nav";
import { Button } from "@/components/ui/button";
import { Hammer } from "lucide-react";
import Link from "next/link";
import { calculateLevel, calculateConfidence, calculateMoteLevel, getTitles } from "@/lib/gamification";

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

  const { level, nextLevelXp, progress } = calculateLevel(userProfile.totalXp);
  const titles = getTitles(level);

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
        {/* ヘッダー */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">
              おかえりなさい、{session.user.name}さん
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">今日の調子はいかがですか？</p>
          </div>
          <UserNav />
        </div>

        {/* メイングリッド */}
        <div className="grid gap-3 sm:gap-4">
          {/* ストリークカード（上部） */}
          {userStreak.startedAt ? (
            <StreakCounter
              currentStreak={userStreak.currentStreak}
              maxStreak={userStreak.maxStreak}
              startedAt={userStreak.startedAt}
            />
          ) : (
            <StartStreakButton />
          )}

          {/* 統合レベルカード（下部） */}
          <UnifiedLevelCard 
            level={level}
            xp={userProfile.totalXp}
            nextLevelXp={nextLevelXp}
            progress={progress}
            titles={titles}
            moteLevel={userProfile.moteLevel}
            moteAttributes={userProfile.moteAttributes}
          />



          <RecordSection />
        </div>

        {/* クイックリンク */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
          <Link href="/records" className="block w-full">
            <Button variant="outline" className="w-full h-14 sm:h-16 flex-col gap-1 border-border bg-card hover:bg-accent transition-colors text-sm sm:text-base">
              <span className="text-xs text-muted-foreground font-normal">記録と振り返り</span>
              <span className="text-xs sm:text-sm">カレンダー・日記一覧</span>
            </Button>
          </Link>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400 fill-mode-both">
          <Link href="/tools" className="block w-full">
            <Button variant="secondary" className="w-full h-11 sm:h-12 gap-2 shadow-sm border border-border text-sm sm:text-base">
              <Hammer className="h-4 w-4 shrink-0" />
              <span className="truncate">サポートツール (瞑想・筋トレ)</span>
            </Button>
          </Link>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
          <Link href="/chat" className="block w-full">
            <Button className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-md text-sm sm:text-base">
              AIに相談する
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
