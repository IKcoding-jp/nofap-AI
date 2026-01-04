"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Settings, ArrowLeft, SkipForward } from "lucide-react";
import Link from "next/link";
import {
    WorkoutPreset,
    WorkoutSettings,
    ExerciseSet,
    SessionPhase,
    phaseGuideText,
    exerciseGuideTexts,
} from "@/lib/workout-presets";

interface WorkoutSessionProps {
    preset: WorkoutPreset;
    settings: WorkoutSettings;
    onOpenSettings?: () => void;
    onPresetChange: (preset: WorkoutPreset) => void;
}

interface SessionState {
    phase: SessionPhase;
    exerciseIndex: number;
    setIndex: number;
    count: number;              // 回数 or 残り秒数
    isRunning: boolean;
}

export function WorkoutSession({
    preset,
    settings,
    onOpenSettings,
    onPresetChange,
}: WorkoutSessionProps) {
    const [state, setState] = useState<SessionState>({
        phase: "idle",
        exerciseIndex: 0,
        setIndex: 0,
        count: 0,
        isRunning: false,
    });

    const [restCountdown, setRestCountdown] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 現在のエクササイズ
    const currentExerciseSet: ExerciseSet | undefined = preset.exercises[state.exerciseIndex];
    const currentExercise = currentExerciseSet?.exercise;

    // 音声再生
    const playSound = useCallback((type: "start" | "complete" | "rest") => {
        if (!settings.effectSoundEnabled) return;
        // シンプルなビープ音を生成
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = type === "start" ? 880 : type === "complete" ? 1320 : 440;
            oscillator.type = "sine";
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            // 音声再生に失敗しても続行
        }
    }, [settings.effectSoundEnabled]);

    // セッション開始
    const startSession = useCallback(() => {
        if (!currentExerciseSet) return;

        playSound("start");

        const initialCount = currentExerciseSet.exercise.type === "reps"
            ? (currentExerciseSet.reps || currentExerciseSet.exercise.defaultReps || 10)
            : (currentExerciseSet.duration || currentExerciseSet.exercise.defaultDuration || 30);

        setState({
            phase: "exercise",
            exerciseIndex: 0,
            setIndex: 0,
            count: initialCount,
            isRunning: true,
        });
    }, [currentExerciseSet, playSound]);

    // 一時停止/再開
    const togglePause = useCallback(() => {
        setState(prev => ({ ...prev, isRunning: !prev.isRunning }));
    }, []);

    // セッション終了
    const endSession = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        setState({
            phase: "idle",
            exerciseIndex: 0,
            setIndex: 0,
            count: 0,
            isRunning: false,
        });
        setRestCountdown(0);
    }, []);

    // 次のエクササイズ/セットへ
    const nextStep = useCallback(() => {
        const currentSet = preset.exercises[state.exerciseIndex];
        if (!currentSet) return;

        // 次のセットがあるか
        if (state.setIndex + 1 < currentSet.sets) {
            // 次のセットへ（セット間休憩）
            playSound("rest");
            setState(prev => ({ ...prev, phase: "rest", isRunning: true }));
            setRestCountdown(settings.restBetweenSets);
        } else if (state.exerciseIndex + 1 < preset.exercises.length) {
            // 次の種目へ（種目間休憩）
            playSound("rest");
            setState(prev => ({ ...prev, phase: "rest", isRunning: true }));
            setRestCountdown(settings.restBetweenExercises);
        } else {
            // 全て完了
            playSound("complete");
            setState(prev => ({ ...prev, phase: "completed", isRunning: false }));
        }
    }, [preset.exercises, state.exerciseIndex, state.setIndex, settings, playSound]);

    // 休憩後の次のエクササイズ開始
    const startNextExercise = useCallback(() => {
        const currentSet = preset.exercises[state.exerciseIndex];
        if (!currentSet) return;

        let nextExerciseIndex = state.exerciseIndex;
        let nextSetIndex = state.setIndex + 1;

        if (nextSetIndex >= currentSet.sets) {
            nextExerciseIndex = state.exerciseIndex + 1;
            nextSetIndex = 0;
        }

        const nextSet = preset.exercises[nextExerciseIndex];
        if (!nextSet) {
            setState(prev => ({ ...prev, phase: "completed", isRunning: false }));
            return;
        }

        playSound("start");

        const initialCount = nextSet.exercise.type === "reps"
            ? (nextSet.reps || nextSet.exercise.defaultReps || 10)
            : (nextSet.duration || nextSet.exercise.defaultDuration || 30);

        setState({
            phase: "exercise",
            exerciseIndex: nextExerciseIndex,
            setIndex: nextSetIndex,
            count: initialCount,
            isRunning: true,
        });
        setRestCountdown(0);
    }, [preset.exercises, state.exerciseIndex, state.setIndex, playSound]);

    // スキップ
    const skip = useCallback(() => {
        if (state.phase === "rest") {
            startNextExercise();
        } else if (state.phase === "exercise") {
            nextStep();
        }
    }, [state.phase, startNextExercise, nextStep]);

    // タイマー処理
    useEffect(() => {
        if (!state.isRunning) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        if (state.phase === "rest") {
            intervalRef.current = setInterval(() => {
                setRestCountdown(prev => {
                    if (prev <= 1) {
                        startNextExercise();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (state.phase === "exercise" && currentExercise?.type === "time") {
            intervalRef.current = setInterval(() => {
                setState(prev => {
                    if (prev.count <= 1) {
                        nextStep();
                        return { ...prev, count: 0 };
                    }
                    return { ...prev, count: prev.count - 1 };
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [state.isRunning, state.phase, currentExercise?.type, startNextExercise, nextStep]);

    // 回数カウントダウン（手動）
    const decrementCount = useCallback(() => {
        if (state.phase !== "exercise" || currentExercise?.type !== "reps") return;

        setState(prev => {
            if (prev.count <= 1) {
                nextStep();
                return { ...prev, count: 0 };
            }
            return { ...prev, count: prev.count - 1 };
        });
    }, [state.phase, currentExercise?.type, nextStep]);

    // 進捗計算
    const totalExercises = preset.exercises.length;
    const currentExerciseNum = state.exerciseIndex + 1;
    const totalSets = currentExerciseSet?.sets || 1;
    const currentSetNum = state.setIndex + 1;

    // 円のスケール計算（休憩中のアニメーション）
    const getCircleScale = () => {
        if (state.phase === "rest") {
            return 0.8 + (restCountdown % 2) * 0.1;
        }
        if (state.phase === "exercise" && currentExercise?.type === "time") {
            const maxDuration = currentExerciseSet?.duration || currentExercise.defaultDuration || 30;
            return 0.6 + (state.count / maxDuration) * 0.4;
        }
        return 1;
    };

    // ガイドテキスト
    const getGuideText = () => {
        if (state.phase === "rest") {
            return `休憩 ${restCountdown}秒`;
        }
        if (state.phase === "exercise") {
            if (currentExercise?.type === "reps") {
                return exerciseGuideTexts.remaining(state.count);
            }
            return exerciseGuideTexts.remainingTime(state.count);
        }
        return phaseGuideText[state.phase];
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-emerald-950 flex flex-col">
            {/* ヘッダー */}
            <header className="flex items-center justify-between p-4 shrink-0">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="text-emerald-100 hover:bg-emerald-900/50">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-emerald-100 font-semibold">{preset.name}</h1>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-emerald-100 hover:bg-emerald-900/50"
                    onClick={onOpenSettings}
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </header>

            {/* メインコンテンツ */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
                {/* 進捗表示 */}
                {state.phase !== "idle" && state.phase !== "completed" && (
                    <div className="text-emerald-300 text-sm font-medium">
                        {currentExerciseNum} / {totalExercises} 種目 • セット {currentSetNum} / {totalSets}
                    </div>
                )}

                {/* エクササイズ名・画像 */}
                <AnimatePresence mode="wait">
                    {state.phase === "idle" && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="text-center"
                        >
                            <p className="text-emerald-200 text-lg mb-2">{phaseGuideText.idle}</p>
                            <p className="text-emerald-400/70 text-sm">
                                {preset.exercises.length}種目 • 約{Math.round(preset.estimatedTime / 60)}分
                            </p>
                        </motion.div>
                    )}

                    {state.phase === "completed" && (
                        <motion.div
                            key="completed"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <div className="text-6xl mb-4">🎉</div>
                            <p className="text-emerald-100 text-2xl font-bold mb-2">{phaseGuideText.completed}</p>
                            <p className="text-emerald-400/70">素晴らしいトレーニングでした！</p>
                        </motion.div>
                    )}

                    {(state.phase === "exercise" || state.phase === "rest") && currentExercise && (
                        <motion.div
                            key={`exercise-${state.exerciseIndex}-${state.setIndex}`}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="text-center"
                        >
                            <h2 className="text-emerald-100 text-3xl font-bold mb-4">
                                {currentExercise.name}
                            </h2>

                            {/* マネキン画像プレースホルダー */}
                            <div className="w-48 h-48 mx-auto mb-4 rounded-2xl bg-emerald-900/30 border border-emerald-700/30 flex items-center justify-center overflow-hidden">
                                <img
                                    src={currentExercise.imageUrl}
                                    alt={currentExercise.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>

                            <p className="text-emerald-400/80 text-sm max-w-xs">
                                {currentExercise.description}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* カウント表示円 */}
                {(state.phase === "exercise" || state.phase === "rest") && (
                    <motion.div
                        className="relative w-48 h-48 flex items-center justify-center"
                        animate={{ scale: getCircleScale() }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                        <div className={`absolute inset-0 rounded-full ${state.phase === "rest"
                                ? "bg-gradient-to-r from-amber-400 to-orange-400"
                                : "bg-gradient-to-r from-emerald-400 to-teal-400"
                            } opacity-20`} />
                        <div className={`absolute inset-2 rounded-full ${state.phase === "rest"
                                ? "bg-gradient-to-r from-amber-500 to-orange-500"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500"
                            } opacity-40`} />
                        <div className="relative z-10 text-center">
                            <div className="text-white text-5xl font-bold">
                                {state.phase === "rest" ? restCountdown : state.count}
                            </div>
                            <div className="text-white/80 text-sm mt-1">
                                {getGuideText()}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* タップで回数カウント（回数制エクササイズ時） */}
                {state.phase === "exercise" && currentExercise?.type === "reps" && state.isRunning && (
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-emerald-500 text-emerald-300 hover:bg-emerald-900/50 px-8"
                        onClick={decrementCount}
                    >
                        タップでカウント
                    </Button>
                )}
            </main>

            {/* コントロールボタン */}
            <footer className="p-6 shrink-0">
                <div className="flex items-center justify-center gap-4">
                    {state.phase === "idle" && (
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-12 py-6 text-lg rounded-2xl"
                            onClick={startSession}
                        >
                            <Play className="h-6 w-6 mr-2" />
                            開始
                        </Button>
                    )}

                    {state.phase === "completed" && (
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-12 py-6 text-lg rounded-2xl"
                            onClick={endSession}
                        >
                            ホームに戻る
                        </Button>
                    )}

                    {(state.phase === "exercise" || state.phase === "rest") && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                className="border-red-500/50 text-red-400 hover:bg-red-900/30 h-14 w-14 rounded-2xl"
                                onClick={endSession}
                            >
                                <X className="h-6 w-6" />
                            </Button>

                            <Button
                                size="lg"
                                className={`${state.isRunning
                                        ? "bg-amber-500 hover:bg-amber-600"
                                        : "bg-emerald-500 hover:bg-emerald-600"
                                    } text-white px-8 py-6 text-lg rounded-2xl h-14`}
                                onClick={togglePause}
                            >
                                {state.isRunning ? (
                                    <>
                                        <Pause className="h-6 w-6 mr-2" />
                                        一時停止
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-6 w-6 mr-2" />
                                        再開
                                    </>
                                )}
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/30 h-14 w-14 rounded-2xl"
                                onClick={skip}
                            >
                                <SkipForward className="h-6 w-6" />
                            </Button>
                        </>
                    )}
                </div>
            </footer>
        </div>
    );
}
