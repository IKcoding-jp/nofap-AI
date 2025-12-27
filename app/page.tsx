import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { streaks, userProfiles } from "@/schema";
import { eq } from "drizzle-orm";
import { StreakCounter } from "@/components/dashboard/streak-counter";
import { StartStreakButton } from "@/components/dashboard/start-streak-button";
import { MoteMeter } from "@/components/dashboard/mote-meter";
import { MoteMission } from "@/components/dashboard/mote-mission";
import { RecordSection } from "@/components/dashboard/record-section";
import { LevelCard } from "@/components/dashboard/level-card";
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
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              おかえりなさい、{session.user.name}さん
            </h1>
            <p className="text-muted-foreground text-sm">今日の調子はいかがですか？</p>
          </div>
          <UserNav />
        </div>

        {/* メイングリッド */}
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userStreak.startedAt ? (
              <StreakCounter
                currentStreak={userStreak.currentStreak}
                maxStreak={userStreak.maxStreak}
                startedAt={userStreak.startedAt}
              />
            ) : (
              <StartStreakButton />
            )}
            <LevelCard 
              level={level}
              xp={userProfile.totalXp}
              nextLevelXp={nextLevelXp}
              progress={progress}
              titles={titles}
            />
          </div>
          
          <MoteMeter 
            level={userProfile.moteLevel} 
            attributes={userProfile.moteAttributes} 
          />

          <MoteMission />

          <RecordSection />
        </div>

        {/* クイックリンク */}
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both">
          <Link href="/calendar" className="w-full">
            <Button variant="outline" className="w-full h-16 flex-col gap-1 border-border bg-card hover:bg-accent transition-colors">
              <span className="text-xs text-muted-foreground font-normal">過去の記録</span>
              <span>カレンダー</span>
            </Button>
          </Link>
          <Link href="/journal" className="w-full">
            <Button variant="outline" className="w-full h-16 flex-col gap-1 border-border bg-card hover:bg-accent transition-colors">
              <span className="text-xs text-muted-foreground font-normal">振り返り</span>
              <span>日記一覧</span>
            </Button>
          </Link>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400 fill-mode-both">
          <Link href="/tools" className="block w-full">
            <Button variant="secondary" className="w-full h-12 gap-2 shadow-sm border border-border">
              <Hammer className="h-4 w-4" />
              サポートツール (瞑想・筋トレ)
            </Button>
          </Link>
        </div>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500 fill-mode-both">
          <Link href="/chat" className="block w-full">
            <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground gap-2 shadow-md">
              AIに相談する
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
