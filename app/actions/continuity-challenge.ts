"use server";

import { db } from "@/lib/db";
import { userHabitProgress, habits, habitChecks } from "@/schema";
import { and, eq, desc, ne, sql, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// ============================================
// JST日付ユーティリティ
// ============================================

/**
 * JST（日本標準時）での現在日付を取得
 * サーバーのタイムゾーンに依存せず、常にJSTで計算
 */
function getJstToday(): string {
    const now = new Date();
    // UTCに9時間を加算してJSTを取得
    const jstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return jstTime.toISOString().split("T")[0];
}

/**
 * 日付文字列の前日を取得
 */
function getPreviousDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().split("T")[0];
}

/**
 * JST 23:59を過ぎているかどうかを判定
 * 前日の後付けチェックが可能かどうかの判定に使用
 */
function isWithinBackfillWindow(targetDate: string): boolean {
    const today = getJstToday();
    const yesterday = getPreviousDate(today);
    return targetDate === yesterday;
}

// ============================================
// 認証ヘルパー
// ============================================

async function getCurrentUserId(): Promise<string | null> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session?.user?.id ?? null;
}

// ============================================
// メイン関数
// ============================================

/**
 * ユーザーの習慣進捗・枠解放状態を取得
 */
export async function getHabitProgress() {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // user_habit_progressが存在しない場合は作成
    let progress = await db.query.userHabitProgress.findFirst({
        where: eq(userHabitProgress.userId, userId),
    });

    if (!progress) {
        await db.insert(userHabitProgress).values({
            userId,
            unlockedSlots: 1,
            currentChallengeHabitId: null,
            updatedAt: new Date(),
        });

        progress = {
            userId,
            unlockedSlots: 1,
            currentChallengeHabitId: null,
            updatedAt: new Date(),
        };
    }

    // アクティブな習慣数を取得
    const activeHabitsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(habits)
        .where(and(eq(habits.userId, userId), ne(habits.status, "archived")));

    const activeHabitsCount = activeHabitsResult[0]?.count ?? 0;

    // 最新習慣（チャレンジ中）を取得
    const latestHabit = await db.query.habits.findFirst({
        where: and(eq(habits.userId, userId), eq(habits.status, "challenge")),
        orderBy: [desc(habits.createdAt)],
    });

    // 新規習慣追加可能かどうか
    const canAddNewHabit =
        activeHabitsCount < progress.unlockedSlots &&
        (!latestHabit || latestHabit.currentStreak >= 30);

    return {
        unlockedSlots: progress.unlockedSlots,
        activeHabitsCount,
        latestHabit,
        canAddNewHabit,
    };
}

/**
 * 継続中の習慣一覧を取得（アーカイブ以外すべて）
 */
export async function getActiveHabits() {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const today = getJstToday();
    const yesterday = getPreviousDate(today);

    // 習慣一覧を取得
    const habitsList = await db.query.habits.findMany({
        where: and(eq(habits.userId, userId), ne(habits.status, "archived")),
        orderBy: [asc(habits.sortOrder), asc(habits.createdAt)],
    });

    // 各習慣の今日と昨日のチェック状態を取得
    const habitsWithChecks = await Promise.all(
        habitsList.map(async (habit) => {
            // 今日のチェック
            const todayCheck = await db.query.habitChecks.findFirst({
                where: and(
                    eq(habitChecks.habitId, habit.id),
                    eq(habitChecks.checkDate, today)
                ),
            });

            // 昨日のチェック
            const yesterdayCheck = await db.query.habitChecks.findFirst({
                where: and(
                    eq(habitChecks.habitId, habit.id),
                    eq(habitChecks.checkDate, yesterday)
                ),
            });

            // 最新習慣かどうか（チャレンジ中の習慣が1つだけの場合）
            const isLatest = habit.status === "challenge";

            return {
                ...habit,
                todayChecked: !!todayCheck,
                yesterdayChecked: !!yesterdayCheck,
                canBackfillYesterday: isWithinBackfillWindow(yesterday) && !yesterdayCheck,
                isLatest,
            };
        })
    );

    return habitsWithChecks;
}

/**
 * 新規習慣を作成（枠チェック付き）
 */
export async function createHabit(name: string) {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // 名前のバリデーション
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 50) {
        throw new Error("Invalid habit name");
    }

    // 習慣追加可能かチェック
    const progress = await getHabitProgress();
    if (!progress.canAddNewHabit) {
        throw new Error("Cannot add new habit. Complete your current challenge first.");
    }

    const today = getJstToday();

    // 新規習慣を作成
    const [newHabit] = await db
        .insert(habits)
        .values({
            userId,
            name: trimmedName,
            status: "challenge",
            sortOrder: progress.activeHabitsCount,
            challengeStartedOn: today,
            currentStreak: 0,
            longestStreak: 0,
            totalChecks: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();

    // user_habit_progressのcurrentChallengeHabitIdを更新
    await db
        .update(userHabitProgress)
        .set({
            currentChallengeHabitId: newHabit.id,
            updatedAt: new Date(),
        })
        .where(eq(userHabitProgress.userId, userId));

    revalidatePath("/continuity-challenge");
    return newHabit;
}

/**
 * 連続日数を計算
 */
async function calculateStreak(habitId: number): Promise<number> {
    const checks = await db.query.habitChecks.findMany({
        where: eq(habitChecks.habitId, habitId),
        orderBy: [desc(habitChecks.checkDate)],
    });

    if (checks.length === 0) return 0;

    const today = getJstToday();
    const yesterday = getPreviousDate(today);

    // 最新チェックが今日か昨日でなければストリークは0
    const latestCheckDate = checks[0].checkDate;
    if (latestCheckDate !== today && latestCheckDate !== yesterday) {
        return 0;
    }

    let streak = 0;
    let expectedDate = latestCheckDate;

    for (const check of checks) {
        if (check.checkDate === expectedDate) {
            streak++;
            expectedDate = getPreviousDate(expectedDate);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * 30日達成時の枠解放処理
 */
async function handleAchievement(
    habitId: number,
    userId: string
): Promise<{ achieved: boolean; newSlots?: number }> {
    const habit = await db.query.habits.findFirst({
        where: eq(habits.id, habitId),
    });

    if (!habit || habit.currentStreak < 30) {
        return { achieved: false };
    }

    // 既に達成済みの場合はスキップ
    if (habit.status === "maintenance") {
        return { achieved: false };
    }

    // user_habit_progressの枠を +1
    await db
        .update(userHabitProgress)
        .set({
            unlockedSlots: sql`unlocked_slots + 1`,
            currentChallengeHabitId: null,
            updatedAt: new Date(),
        })
        .where(eq(userHabitProgress.userId, userId));

    // 習慣ステータスを maintenance に変更
    const today = getJstToday();
    await db
        .update(habits)
        .set({
            status: "maintenance",
            challengeCompletedOn: today,
            updatedAt: new Date(),
        })
        .where(eq(habits.id, habitId));

    // 更新後の枠数を取得
    const updatedProgress = await db.query.userHabitProgress.findFirst({
        where: eq(userHabitProgress.userId, userId),
    });

    return {
        achieved: true,
        newSlots: updatedProgress?.unlockedSlots ?? 2,
    };
}

/**
 * 当日/前日のチェックを記録
 */
export async function checkHabit(habitId: number, isYesterday: boolean = false) {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // 習慣の所有者確認
    const habit = await db.query.habits.findFirst({
        where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    });

    if (!habit) {
        throw new Error("Habit not found");
    }

    const today = getJstToday();
    const targetDate = isYesterday ? getPreviousDate(today) : today;

    // 後付けチェックの期限確認
    if (isYesterday && !isWithinBackfillWindow(targetDate)) {
        throw new Error("Backfill window has expired");
    }

    // 既存のチェックがあるか確認
    const existingCheck = await db.query.habitChecks.findFirst({
        where: and(
            eq(habitChecks.habitId, habitId),
            eq(habitChecks.checkDate, targetDate)
        ),
    });

    if (existingCheck) {
        // 既にチェック済み
        return { success: true, alreadyChecked: true };
    }

    // チェックを記録
    await db.insert(habitChecks).values({
        habitId,
        checkDate: targetDate,
        checkedAt: new Date(),
        source: isYesterday ? "backfill_yesterday" : "same_day",
        createdAt: new Date(),
    });

    // ストリークを再計算
    const newStreak = await calculateStreak(habitId);
    const newLongestStreak = Math.max(habit.longestStreak, newStreak);

    // 習慣を更新
    await db
        .update(habits)
        .set({
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            totalChecks: habit.totalChecks + 1,
            updatedAt: new Date(),
        })
        .where(eq(habits.id, habitId));

    // 30日達成チェック（最新習慣のみ）
    let achievement = undefined;
    if (habit.status === "challenge" && newStreak >= 30) {
        achievement = await handleAchievement(habitId, userId);
    }

    revalidatePath("/continuity-challenge");
    return {
        success: true,
        alreadyChecked: false,
        newStreak,
        achievement,
    };
}

/**
 * チェックを解除
 */
export async function uncheckHabit(habitId: number, isYesterday: boolean = false) {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // 習慣の所有者確認
    const habit = await db.query.habits.findFirst({
        where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    });

    if (!habit) {
        throw new Error("Habit not found");
    }

    const today = getJstToday();
    const targetDate = isYesterday ? getPreviousDate(today) : today;

    // 後付けチェックの期限確認（解除も同じルール）
    if (isYesterday && !isWithinBackfillWindow(targetDate)) {
        throw new Error("Backfill window has expired");
    }

    // チェックを削除
    await db
        .delete(habitChecks)
        .where(
            and(eq(habitChecks.habitId, habitId), eq(habitChecks.checkDate, targetDate))
        );

    // ストリークを再計算
    const newStreak = await calculateStreak(habitId);

    // 習慣を更新
    await db
        .update(habits)
        .set({
            currentStreak: newStreak,
            totalChecks: Math.max(0, habit.totalChecks - 1),
            updatedAt: new Date(),
        })
        .where(eq(habits.id, habitId));

    revalidatePath("/continuity-challenge");
    return { success: true, newStreak };
}

/**
 * 習慣をアーカイブ（非表示化）
 */
export async function archiveHabit(habitId: number) {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // 習慣の所有者確認
    const habit = await db.query.habits.findFirst({
        where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    });

    if (!habit) {
        throw new Error("Habit not found");
    }

    // アーカイブ処理
    await db
        .update(habits)
        .set({
            status: "archived",
            archivedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(habits.id, habitId));

    // currentChallengeHabitIdをクリア（アーカイブした習慣がチャレンジ中だった場合）
    const progress = await db.query.userHabitProgress.findFirst({
        where: eq(userHabitProgress.userId, userId),
    });

    if (progress?.currentChallengeHabitId === habitId) {
        await db
            .update(userHabitProgress)
            .set({
                currentChallengeHabitId: null,
                updatedAt: new Date(),
            })
            .where(eq(userHabitProgress.userId, userId));
    }

    revalidatePath("/continuity-challenge");
    return { success: true };
}

/**
 * 習慣名を更新
 */
export async function updateHabit(habitId: number, name: string) {
    const userId = await getCurrentUserId();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    // 名前のバリデーション
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 50) {
        throw new Error("Invalid habit name");
    }

    // 習慣の所有者確認
    const habit = await db.query.habits.findFirst({
        where: and(eq(habits.id, habitId), eq(habits.userId, userId)),
    });

    if (!habit) {
        throw new Error("Habit not found");
    }

    // 更新処理
    await db
        .update(habits)
        .set({
            name: trimmedName,
            updatedAt: new Date(),
        })
        .where(eq(habits.id, habitId));

    revalidatePath("/continuity-challenge");
    return { success: true };
}
