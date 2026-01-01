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
    DialogClose
} from "@/components/ui/dialog";
import {
    Plus,
    Check,
    Flame,
    Trophy,
    ChevronRight,
    Clock,
    Sparkles,
    ArrowLeft
} from "lucide-react";
import Link from "next/link";
import {
    createHabit,
    checkHabit,
    uncheckHabit,
    getActiveHabits,
    getHabitProgress
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

export function ContinuityChallengeClient({ initialHabits, initialProgress }: Props) {
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
                    toast.success(isYesterday ? "昨日分をチェックしました" : "チェック完了！");
                }
            } catch (error) {
                toast.error("チェックに失敗しました");
            }
        });
    };

    // チェックを解除
    const handleUncheck = async (habitId: number, isYesterday: boolean = false) => {
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
        <div className="space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center gap-3">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                        継続チャレンジ
                    </h1>
                    <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                        毎日の習慣を積み重ねよう
                    </p>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span>{progress.unlockedSlots}枠</span>
                </div>
            </div>

            {/* 達成演出 */}
            {showAchievement && (
                <Card className="p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30 animate-in zoom-in-95 duration-300">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="relative">
                            <Trophy className="h-12 w-12 text-yellow-500" />
                            <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                30日達成おめでとう！🎉
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                新しい習慣枠が解放されました
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* 習慣がない場合 */}
            {habits.length === 0 && (
                <Card className="p-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Flame className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">最初の習慣を始めよう</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                30日連続達成で次の習慣枠が解放されます
                            </p>
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    習慣を追加
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
                                        <Button onClick={handleAddHabit} disabled={!newHabitName.trim() || isPending}>
                                            追加
                                        </Button>
                                    </DialogClose>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </Card>
            )}

            {/* 習慣一覧 */}
            {habits.length > 0 && (
                <div className="space-y-3">
                    {habits.map((habit) => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            onCheck={handleCheck}
                            onUncheck={handleUncheck}
                            isPending={isPending}
                        />
                    ))}
                </div>
            )}

            {/* 昨日分の後付けセクション */}
            {habits.some((h) => h.canBackfillYesterday) && (
                <Card className="p-4 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-medium text-amber-900 dark:text-amber-100">
                                昨日の分も記録できます
                            </h3>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                今日の23:59まで昨日のチェックを後付けできます
                            </p>
                            <div className="mt-3 space-y-2">
                                {habits
                                    .filter((h) => h.canBackfillYesterday)
                                    .map((habit) => (
                                        <div
                                            key={`backfill-${habit.id}`}
                                            className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-amber-900/30 rounded-lg"
                                        >
                                            <span className="text-sm font-medium truncate">{habit.name}</span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="shrink-0 gap-1 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-800"
                                                onClick={() => handleCheck(habit.id, true)}
                                                disabled={isPending}
                                            >
                                                <Check className="h-3 w-3" />
                                                昨日分
                                            </Button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* 新規習慣追加ボタン */}
            {habits.length > 0 && progress.canAddNewHabit && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full gap-2 h-12">
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
                                <Button onClick={handleAddHabit} disabled={!newHabitName.trim() || isPending}>
                                    追加
                                </Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* ナビゲーション */}
            <div className="flex gap-3 pt-4">
                <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full">
                        ホームに戻る
                    </Button>
                </Link>
                <Link href="/journal" className="flex-1">
                    <Button className="w-full gap-2">
                        今日の振り返りへ
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}

// 習慣カードコンポーネント
interface HabitCardProps {
    habit: Habit;
    onCheck: (habitId: number, isYesterday: boolean) => void;
    onUncheck: (habitId: number, isYesterday: boolean) => void;
    isPending: boolean;
}

function HabitCard({ habit, onCheck, onUncheck, isPending }: HabitCardProps) {
    const progressPercent = habit.isLatest ? Math.min((habit.currentStreak / 30) * 100, 100) : 100;

    return (
        <Card className={`p-4 transition-all ${habit.todayChecked ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : ''}`}>
            <div className="flex items-center gap-4">
                {/* チェックボタン */}
                <Button
                    variant={habit.todayChecked ? "default" : "outline"}
                    size="icon"
                    className={`h-12 w-12 rounded-full shrink-0 transition-all ${habit.todayChecked
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'border-2 border-dashed hover:border-primary hover:bg-primary/5'
                        }`}
                    onClick={() => habit.todayChecked ? onUncheck(habit.id, false) : onCheck(habit.id, false)}
                    disabled={isPending}
                >
                    <Check className={`h-6 w-6 ${habit.todayChecked ? '' : 'text-muted-foreground'}`} />
                </Button>

                {/* 習慣情報 */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{habit.name}</h3>
                        {habit.isLatest && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
                                チャレンジ中
                            </span>
                        )}
                        {habit.status === "maintenance" && (
                            <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full shrink-0">
                                達成済み
                            </span>
                        )}
                    </div>

                    {/* 連続日数 */}
                    <div className="flex items-center gap-2 mt-1">
                        <Flame className={`h-4 w-4 ${habit.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        <span className="text-sm text-muted-foreground">
                            連続 <span className="font-semibold text-foreground">{habit.currentStreak}</span> 日
                        </span>
                    </div>

                    {/* プログレスバー（チャレンジ中の最新習慣のみ） */}
                    {habit.isLatest && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>30日チャレンジ</span>
                                <span>{habit.currentStreak}/30</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
