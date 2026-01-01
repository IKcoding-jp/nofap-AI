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
import { InlineChat } from "@/components/dashboard/inline-chat";
import { UserNav } from "@/components/layout/user-nav";
import { Button } from "@/components/ui/button";
import { Hammer, Calendar } from "lucide-react";
import Link from "next/link";
import { calculateLevel, calculateConfidence, calculateMoteLevel } from "@/lib/gamification";
import { getActiveHabits, getHabitProgress } from "@/app/actions/continuity-challenge";
import { listChatSessions, getChatHistory, createChatSession } from "@/app/actions/chat";

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

  // チャットセッション情報を取得
  let chatSessionId: number | undefined;
  let chatMessages: any[] = [];
  try {
    const sessions = await listChatSessions();
    if (sessions.length > 0) {
      chatSessionId = sessions[0].id;
      chatMessages = await getChatHistory(chatSessionId);
    } else {
      chatSessionId = await createChatSession();
    }
  } catch (e) {
    console.error("Failed to load chat session:", e);
  }

  return (
    <main className="h-screen overflow-hidden bg-background p-3 sm:p-4 md:p-5 flex flex-col">
      <div className="mx-auto max-w-2xl lg:max-w-7xl w-full flex flex-col h-full gap-3 sm:gap-4">
        {/* ヘッダー */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border pb-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground break-words tracking-tight">
              おかえりなさい、{session.user.name}さん
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">今日の調子はいかがですか？</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border">
              <Link href="/records">
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-lg text-xs font-semibold hover:bg-background hover:shadow-sm transition-all duration-200">
                  <Calendar className="h-3 w-3 text-blue-500" />
                  <span className="hidden sm:inline">履歴・カレンダー</span>
                  <span className="sm:hidden">履歴</span>
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 rounded-lg text-xs font-semibold hover:bg-background hover:shadow-sm transition-all duration-200">
                  <Hammer className="h-3 w-3 text-orange-500" />
                  <span className="hidden sm:inline">サポートツール</span>
                  <span className="sm:hidden">ツール</span>
                </Button>
              </Link>
            </div>
            <div className="h-6 w-[1px] bg-border mx-0.5" />
            <UserNav />
          </div>
        </div>

        {/* メインコンテンツエリア - 3カラム */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* 左カラム: 継続チャレンジ */}
          <div className="h-full min-h-0 overflow-hidden">
            <ContinuityChallengeSection
              initialHabits={habitsData}
              initialProgress={progressData}
            />
          </div>

          {/* 中央カラム: 上にストリーク、下に振り返り */}
          <div className="flex flex-col gap-3 sm:gap-4 h-full min-h-0">
            {/* 上: ストリーク */}
            <div className="shrink-0">
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

            {/* 下: 今日の振り返り */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <RecordSection />
            </div>
          </div>

          {/* 右カラム: AIアシスタント */}
          <div className="h-full min-h-0">
            <InlineChat
              initialSessionId={chatSessionId}
              initialMessages={chatMessages}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

