"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Settings, X, ChevronLeft } from "lucide-react";
import {
    BreathingPreset,
    BreathingTheme,
    BreathPhase,
    phaseGuideText,
    breathingPresets,
    breathingThemes,
    sessionDurations,
    defaultBreathingSettings,
} from "@/lib/breathing-presets";
import Link from "next/link";

interface BreathingSessionProps {
    preset: BreathingPreset;
    theme: BreathingTheme;
    duration: number;
    onOpenSettings?: () => void;
    onPresetChange: (preset: BreathingPreset) => void;
    onThemeChange: (theme: BreathingTheme) => void;
    onDurationChange: (duration: number) => void;
}

export function BreathingSession({
    preset,
    theme,
    duration: totalDuration,
    onOpenSettings,
    onPresetChange,
    onThemeChange,
    onDurationChange,
}: BreathingSessionProps) {
    // セッション状態
    const [isActive, setIsActive] = useState(false);
    const [timeLeft, setTimeLeft] = useState(totalDuration);
    const [phase, setPhase] = useState<BreathPhase>("idle");
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(0);

    // refs
    const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 1サイクルの合計秒数
    const cycleLength = preset.inhale + preset.hold + preset.exhale;

    // フェーズの切り替え
    const getNextPhase = useCallback(
        (currentPhase: BreathPhase): BreathPhase => {
            if (currentPhase === "inhale") {
                return preset.hold > 0 ? "hold" : "exhale";
            }
            if (currentPhase === "hold") return "exhale";
            return "inhale";
        },
        [preset.hold]
    );

    const getPhaseDuration = useCallback(
        (p: BreathPhase): number => {
            switch (p) {
                case "inhale":
                    return preset.inhale;
                case "hold":
                    return preset.hold;
                case "exhale":
                    return preset.exhale;
                default:
                    return 0;
            }
        },
        [preset]
    );

    // セッション開始
    const startSession = useCallback(() => {
        setIsActive(true);
        setPhase("inhale");
        setPhaseTimeLeft(preset.inhale);
    }, [preset.inhale]);

    // セッション停止
    const stopSession = useCallback(() => {
        setIsActive(false);
        setPhase("idle");
        setPhaseTimeLeft(0);
        if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    }, []);

    // リセット
    const resetSession = useCallback(() => {
        stopSession();
        setTimeLeft(totalDuration);
    }, [stopSession, totalDuration]);

    // トグル
    const toggleSession = useCallback(() => {
        if (isActive) {
            stopSession();
        } else {
            startSession();
        }
    }, [isActive, startSession, stopSession]);

    // フェーズタイマー
    useEffect(() => {
        if (!isActive) return;

        phaseTimerRef.current = setInterval(() => {
            setPhaseTimeLeft((prev) => {
                if (prev <= 1) {
                    const nextPhase = getNextPhase(phase);
                    setPhase(nextPhase);
                    return getPhaseDuration(nextPhase);
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
        };
    }, [isActive, phase, getNextPhase, getPhaseDuration]);

    // セッションタイマー
    useEffect(() => {
        if (!isActive) return;

        sessionTimerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    stopSession();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        };
    }, [isActive, stopSession]);

    // 時間フォーマット
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    // 円のスケール計算
    const getCircleScale = (): number => {
        if (!isActive || phase === "idle") return 1;
        if (phase === "inhale") return 1.5;
        if (phase === "hold") return 1.5;
        return 1;
    };

    // 設定変更時にリセット
    useEffect(() => {
        setTimeLeft(totalDuration);
    }, [totalDuration]);

    return (
        <div
            className={`min-h-screen flex flex-col ${theme.backgroundColor} transition-colors duration-500`}
        >
            {/* ヘッダー */}
            <header className="flex items-center justify-between p-4 sm:p-6">
                <Link href="/">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`${theme.textColor} hover:bg-white/10`}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className={`text-lg font-semibold ${theme.textColor}`}>
                    呼吸ガイド
                </h1>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenSettings}
                    className={`${theme.textColor} hover:bg-white/10`}
                >
                    <Settings className="h-5 w-5" />
                </Button>
            </header>

            {/* メインコンテンツ */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
                {/* プリセット表示 */}
                <div className={`text-center mb-6 sm:mb-8 ${theme.textColor}`}>
                    <p className="text-sm opacity-70">{preset.name}</p>
                    <p className="text-xs opacity-50 mt-1">
                        {preset.inhale}秒 - {preset.hold > 0 ? `${preset.hold}秒 - ` : ""}
                        {preset.exhale}秒
                    </p>
                </div>

                {/* 呼吸ガイド円 */}
                <div className="relative flex items-center justify-center w-64 h-64 sm:w-80 sm:h-80">
                    {/* 外側のリング */}
                    <div className="absolute inset-0 rounded-full border-2 border-white/10" />

                    {/* アニメーション付きの円 */}
                    <motion.div
                        className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br ${theme.circleColor} shadow-2xl`}
                        animate={{
                            scale: getCircleScale(),
                            opacity: isActive ? (phase === "exhale" ? 0.6 : 0.9) : 0.7,
                        }}
                        transition={{
                            duration: getPhaseDuration(phase),
                            ease: "easeInOut",
                        }}
                    />

                    {/* 中央のテキスト */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={phase}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className={`text-xl sm:text-2xl font-bold ${theme.textColor}`}
                            >
                                {phaseGuideText[phase]}
                            </motion.span>
                        </AnimatePresence>
                    </div>
                </div>

                {/* 残り時間 */}
                <div className={`mt-8 sm:mt-12 text-center ${theme.textColor}`}>
                    <p className="text-4xl sm:text-5xl font-black tabular-nums">
                        {formatTime(timeLeft)}
                    </p>
                    <p className="text-sm opacity-60 mt-2">残り時間</p>
                </div>
            </main>

            {/* コントロールボタン */}
            <footer className="p-6 sm:p-8 flex justify-center gap-4">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={resetSession}
                    className={`h-14 w-14 rounded-full border-white/20 ${theme.textColor} hover:bg-white/10`}
                >
                    <RotateCcw className="h-6 w-6" />
                </Button>
                <Button
                    onClick={toggleSession}
                    size="lg"
                    className={`h-14 w-40 rounded-full shadow-lg font-bold text-base bg-white/20 backdrop-blur-sm hover:bg-white/30 ${theme.textColor}`}
                >
                    {isActive ? (
                        <>
                            <Pause className="h-6 w-6 mr-2" />
                            一時停止
                        </>
                    ) : (
                        <>
                            <Play className="h-6 w-6 mr-2" />
                            スタート
                        </>
                    )}
                </Button>
            </footer>

            {/* クイック設定 - 停止中のみ表示 */}
            {!isActive && (
                <div className="px-4 pb-8">
                    {/* 時間選択 */}
                    <div className="flex justify-center gap-2 mb-4">
                        {sessionDurations.slice(0, 4).map((d) => (
                            <button
                                key={d.value}
                                onClick={() => onDurationChange(d.value)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${totalDuration === d.value
                                    ? `bg-white/20 ${theme.textColor}`
                                    : `${theme.textColor} opacity-50 hover:opacity-80`
                                    }`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>

                    {/* プリセット選択 */}
                    <div className="flex justify-center gap-2 flex-wrap">
                        {breathingPresets.slice(0, 4).map((p) => (
                            <button
                                key={p.id}
                                onClick={() => onPresetChange(p)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${preset.id === p.id
                                    ? `bg-white/20 ${theme.textColor}`
                                    : `${theme.textColor} opacity-50 hover:opacity-80`
                                    }`}
                            >
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
