"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Check } from "lucide-react";
import {
    BreathingPreset,
    BreathingTheme,
    breathingPresets,
    breathingThemes,
    sessionDurations,
} from "@/lib/breathing-presets";

interface BreathingSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentPreset: BreathingPreset;
    currentTheme: BreathingTheme;
    currentDuration: number;
    onPresetChange: (preset: BreathingPreset) => void;
    onThemeChange: (theme: BreathingTheme) => void;
    onDurationChange: (duration: number) => void;
}

export function BreathingSettings({
    isOpen,
    onClose,
    currentPreset,
    currentTheme,
    currentDuration,
    onPresetChange,
    onThemeChange,
    onDurationChange,
}: BreathingSettingsProps) {
    const [customInhale, setCustomInhale] = useState(4);
    const [customHold, setCustomHold] = useState(4);
    const [customExhale, setCustomExhale] = useState(4);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto"
        >
            <div className="min-h-screen p-4 sm:p-6">
                {/* ヘッダー */}
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-foreground">設定</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="max-w-md mx-auto space-y-8">
                    {/* セッション時間 */}
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                            セッション時間
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                            {sessionDurations.map((d) => (
                                <button
                                    key={d.value}
                                    onClick={() => onDurationChange(d.value)}
                                    className={`py-3 rounded-xl text-sm font-medium transition-all ${currentDuration === d.value
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* 呼吸パターン */}
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                            呼吸パターン
                        </h3>
                        <div className="space-y-2">
                            {breathingPresets.map((preset) => (
                                <button
                                    key={preset.id}
                                    onClick={() => onPresetChange(preset)}
                                    className={`w-full p-4 rounded-xl text-left transition-all ${currentPreset.id === preset.id
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "bg-muted text-foreground hover:bg-muted/80"
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{preset.name}</p>
                                            <p
                                                className={`text-xs mt-0.5 ${currentPreset.id === preset.id
                                                        ? "opacity-80"
                                                        : "text-muted-foreground"
                                                    }`}
                                            >
                                                {preset.description}
                                            </p>
                                        </div>
                                        <div
                                            className={`text-xs font-mono ${currentPreset.id === preset.id
                                                    ? "opacity-80"
                                                    : "text-muted-foreground"
                                                }`}
                                        >
                                            {preset.inhale}-{preset.hold}-{preset.exhale}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* テーマ */}
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                            テーマカラー
                        </h3>
                        <div className="grid grid-cols-5 gap-3">
                            {breathingThemes.map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => onThemeChange(theme)}
                                    className="relative flex flex-col items-center gap-2"
                                >
                                    <div
                                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${theme.circleColor} shadow-lg transition-transform ${currentTheme.id === theme.id ? "scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                                            }`}
                                    />
                                    <span className="text-xs text-muted-foreground">
                                        {theme.name}
                                    </span>
                                    {currentTheme.id === theme.id && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                            <Check className="h-3 w-3 text-primary-foreground" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* カスタム設定（将来拡張用） */}
                    <section className="pb-8">
                        <h3 className="text-sm font-semibold text-foreground mb-3">
                            カスタム呼吸リズム
                        </h3>
                        <div className="bg-muted rounded-xl p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground">吸う</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCustomInhale(Math.max(1, customInhale - 1))}
                                        className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-mono">{customInhale}秒</span>
                                    <button
                                        onClick={() => setCustomInhale(Math.min(10, customInhale + 1))}
                                        className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground">止める</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCustomHold(Math.max(0, customHold - 1))}
                                        className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-mono">{customHold}秒</span>
                                    <button
                                        onClick={() => setCustomHold(Math.min(10, customHold + 1))}
                                        className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-foreground">吐く</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCustomExhale(Math.max(1, customExhale - 1))}
                                        className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground"
                                    >
                                        -
                                    </button>
                                    <span className="w-8 text-center font-mono">{customExhale}秒</span>
                                    <button
                                        onClick={() => setCustomExhale(Math.min(15, customExhale + 1))}
                                        className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-foreground"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <Button
                                onClick={() => {
                                    const customPreset: BreathingPreset = {
                                        id: "custom",
                                        name: "カスタム",
                                        description: "自分で設定したリズム",
                                        inhale: customInhale,
                                        hold: customHold,
                                        exhale: customExhale,
                                    };
                                    onPresetChange(customPreset);
                                }}
                                className="w-full mt-2"
                                variant="secondary"
                            >
                                このリズムを適用
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </motion.div>
    );
}
