"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Plus, Check, Flame, Trophy, Clock, Sparkles } from "lucide-react";
import {
    createHabit,
    checkHabit,
    uncheckHabit,
    getActiveHabits,
    getHabitProgress,
} from "@/app/actions/continuity-challenge";
import { toast } from "sonner";

// 型定義
interface Habit {
    id: number;
    name: string;
    status: "challenge" | "maintenance" | "archived";
    currentStreak: number;
    longestStreak: number;
    totalChecks: number;
    todayChecked: boolean;
    yesterdayChecked: boolean;
    canBackfillYesterday: boolean;
    isLatest: boolean;
}

interface Progress {
    unlockedSlots: number;
    activeHabitsCount: number;
    latestHabit: any;
    canAddNewHabit: boolean;
}

interface Props {
    initialHabits: Habit[];
    initialProgress: Progress;
}

export function ContinuityChallengeSection({
    initialHabits,
    initialProgress,
}: Props) {
    const [habits, setHabits] = useState<Habit[]>(initialHabits);
    const [progress, setProgress] = useState<Progress>(initialProgress);
    const [newHabitName, setNewHabitName] = useState("");
    const [isPending, startTransition] = useTransition();
    const [showAchievement, setShowAchievement] = useState(false);

    // データを再取得
    const refreshData = async () => {
        const [newHabits, newProgress] = await Promise.all([
            getActiveHabits(),
            getHabitProgress(),
        ]);
        setHabits(newHabits);
        setProgress(newProgress);
    };

    // 習慣を追加
    const handleAddHabit = async () => {
        if (!newHabitName.trim()) return;

        startTransition(async () => {
            try {
                await createHabit(newHabitName.trim());
                setNewHabitName("");
                await refreshData();
                toast.success("新しい習慣を追加しました！");
            } catch (error) {
                toast.error("習慣の追加に失敗しました");
            }
        });
    };

    // チェックを記録
    const handleCheck = async (habitId: number, isYesterday: boolean = false) => {
        startTransition(async () => {
            try {
                const result = await checkHabit(habitId, isYesterday);
                await refreshData();

                if (result.achievement?.achieved) {
                    setShowAchievement(true);
                    setTimeout(() => setShowAchievement(false), 5000);
                } else {
                    toast.success(isYesterday ? "昨日分をチェック！" : "チェック完了！");
                }
            } catch (error) {
                toast.error("チェックに失敗しました");
            }
        });
    };

    // チェックを解除
    const handleUncheck = async (
        habitId: number,
        isYesterday: boolean = false
    ) => {
        startTransition(async () => {
            try {
                await uncheckHabit(habitId, isYesterday);
                await refreshData();
                toast.success("チェックを解除しました");
            } catch (error) {
                toast.error("チェック解除に失敗しました");
            }
        });
    };

    return (
        <Card className="p-4 sm:p-5 space-y-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <h2 className="font-semibold text-base sm:text-lg">継続チャレンジ</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                    <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                    <span>{progress.unlockedSlots}枠解放</span>
                </div>
            </div>

            {/* 達成演出 */}
            {showAchievement && (
                <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Trophy className="h-8 w-8 text-yellow-500" />
                            <Sparkles className="h-4 w-4 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                        <div>
                            <p className="font-bold text-yellow-600 dark:text-yellow-400">
                                30日達成おめでとう！🎉
                            </p>
                            <p className="text-xs text-muted-foreground">
                                新しい習慣枠が解放されました
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 習慣がない場合 */}
            {habits.length === 0 && (
                <div className="text-center py-6">
                    <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                        <Flame className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                        30日連続で習慣枠が解放されます
                    </p>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-1.5">
                                <Plus className="h-4 w-4" />
                                最初の習慣を追加
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>新しい習慣を追加</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    placeholder="習慣名を入力（例：毎日5分の瞑想）"
                                    value={newHabitName}
                                    onChange={(e) => setNewHabitName(e.target.value)}
                                    maxLength={50}
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">キャンセル</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button
                                        onClick={handleAddHabit}
                                        disabled={!newHabitName.trim() || isPending}
                                    >
                                        追加
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

            {/* 習慣一覧 */}
            {habits.length > 0 && (
                <div className="space-y-2">
                    {habits.map((habit) => (
                        <div
                            key={habit.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${habit.todayChecked
                                    ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                                    : "bg-muted/50 border border-transparent"
                                }`}
                        >
                            {/* チェックボタン */}
                            <Button
                                variant={habit.todayChecked ? "default" : "outline"}
                                size="icon"
                                className={`h-10 w-10 rounded-full shrink-0 transition-all ${habit.todayChecked
                                        ? "bg-green-500 hover:bg-green-600 text-white"
                                        : "border-2 border-dashed hover:border-primary hover:bg-primary/5"
                                    }`}
                                onClick={() =>
                                    habit.todayChecked
                                        ? handleUncheck(habit.id, false)
                                        : handleCheck(habit.id, false)
                                }
                                disabled={isPending}
                            >
                                <Check
                                    className={`h-5 w-5 ${habit.todayChecked ? "" : "text-muted-foreground"
                                        }`}
                                />
                            </Button>

                            {/* 習慣情報 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">
                                        {habit.name}
                                    </span>
                                    {habit.isLatest && habit.status === "challenge" && (
                                        <span className="text-xs bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded shrink-0">
                                            {habit.currentStreak}/30
                                        </span>
                                    )}
                                    {habit.status === "maintenance" && (
                                        <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded shrink-0">
                                            達成✓
                                        </span>
                                    )}
                                </div>

                                {/* プログレスバー（チャレンジ中の習慣） */}
                                {habit.isLatest && habit.status === "challenge" && (
                                    <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                                            style={{
                                                width: `${Math.min(
                                                    (habit.currentStreak / 30) * 100,
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* 連続日数 */}
                            <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                <Flame
                                    className={`h-3.5 w-3.5 ${habit.currentStreak > 0
                                            ? "text-orange-500"
                                            : "text-muted-foreground"
                                        }`}
                                />
                                <span>{habit.currentStreak}日</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 昨日分の後付け（コンパクト版） */}
            {habits.some((h) => h.canBackfillYesterday) && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-300 flex-1">
                        昨日の分も記録できます
                    </span>
                    <div className="flex gap-1">
                        {habits
                            .filter((h) => h.canBackfillYesterday)
                            .map((habit) => (
                                <Button
                                    key={`backfill-${habit.id}`}
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-800"
                                    onClick={() => handleCheck(habit.id, true)}
                                    disabled={isPending}
                                >
                                    <Check className="h-3 w-3 mr-1" />
                                    昨日
                                </Button>
                            ))}
                    </div>
                </div>
            )}

            {/* 新規習慣追加ボタン */}
            {habits.length > 0 && progress.canAddNewHabit && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full gap-1.5 text-muted-foreground hover:text-foreground"
                        >
                            <Plus className="h-4 w-4" />
                            次の習慣を追加
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>新しい習慣を追加</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <Input
                                placeholder="習慣名を入力（例：毎日5分の読書）"
                                value={newHabitName}
                                onChange={(e) => setNewHabitName(e.target.value)}
                                maxLength={50}
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">キャンセル</Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button
                                    onClick={handleAddHabit}
                                    disabled={!newHabitName.trim() || isPending}
                                >
                                    追加
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </Card>
    );
}
