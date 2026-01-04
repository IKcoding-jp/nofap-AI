"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Check, ChevronRight } from "lucide-react";
import {
    WorkoutPreset,
    WorkoutSettings,
    workoutPresets,
    restDurations,
} from "@/lib/workout-presets";

interface WorkoutSettingsProps {
    isOpen: boolean;
    onClose: () => void;
    currentPreset: WorkoutPreset;
    currentSettings: WorkoutSettings;
    onPresetChange: (preset: WorkoutPreset) => void;
    onSettingsChange: (settings: WorkoutSettings) => void;
}

export function WorkoutSettingsPanel({
    isOpen,
    onClose,
    currentPreset,
    currentSettings,
    onPresetChange,
    onSettingsChange,
}: WorkoutSettingsProps) {
    const [localPreset, setLocalPreset] = useState(currentPreset);
    const [localSettings, setLocalSettings] = useState(currentSettings);

    const handleSave = () => {
        onPresetChange(localPreset);
        onSettingsChange(localSettings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-emerald-800/30"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between p-4 border-b border-emerald-800/30">
                        <h2 className="text-emerald-100 text-lg font-semibold">設定</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-emerald-400 hover:bg-emerald-900/50"
                            onClick={onClose}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* コンテンツ */}
                    <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
                        {/* プリセット選択 */}
                        <section>
                            <h3 className="text-emerald-300 text-sm font-medium mb-3">
                                トレーニングメニュー
                            </h3>
                            <div className="space-y-2">
                                {workoutPresets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        onClick={() => setLocalPreset(preset)}
                                        className={`w-full p-4 rounded-xl border text-left transition-all ${localPreset.id === preset.id
                                                ? "border-emerald-500 bg-emerald-900/30"
                                                : "border-emerald-800/30 bg-emerald-950/30 hover:bg-emerald-900/20"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-emerald-100 font-medium">
                                                    {preset.name}
                                                </div>
                                                <div className="text-emerald-400/70 text-xs mt-1">
                                                    {preset.description}
                                                </div>
                                                <div className="text-emerald-500/60 text-xs mt-1">
                                                    {preset.exercises.length}種目 • 約{Math.round(preset.estimatedTime / 60)}分
                                                </div>
                                            </div>
                                            {localPreset.id === preset.id && (
                                                <Check className="h-5 w-5 text-emerald-400 shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* セット間休憩 */}
                        <section>
                            <h3 className="text-emerald-300 text-sm font-medium mb-3">
                                セット間休憩
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {restDurations.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() =>
                                            setLocalSettings({
                                                ...localSettings,
                                                restBetweenSets: option.value,
                                            })
                                        }
                                        className={`p-3 rounded-xl border text-center transition-all ${localSettings.restBetweenSets === option.value
                                                ? "border-emerald-500 bg-emerald-900/30 text-emerald-100"
                                                : "border-emerald-800/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/20"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 種目間休憩 */}
                        <section>
                            <h3 className="text-emerald-300 text-sm font-medium mb-3">
                                種目間休憩
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                                {restDurations.map((option) => (
                                    <button
                                        key={option.value}
                                        onClick={() =>
                                            setLocalSettings({
                                                ...localSettings,
                                                restBetweenExercises: option.value,
                                            })
                                        }
                                        className={`p-3 rounded-xl border text-center transition-all ${localSettings.restBetweenExercises === option.value
                                                ? "border-emerald-500 bg-emerald-900/30 text-emerald-100"
                                                : "border-emerald-800/30 bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/20"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* サウンド設定 */}
                        <section>
                            <h3 className="text-emerald-300 text-sm font-medium mb-3">
                                サウンド
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-800/30 bg-emerald-950/30">
                                    <span className="text-emerald-100">音声ガイド</span>
                                    <button
                                        onClick={() =>
                                            setLocalSettings({
                                                ...localSettings,
                                                soundEnabled: !localSettings.soundEnabled,
                                            })
                                        }
                                        className={`w-12 h-7 rounded-full transition-all ${localSettings.soundEnabled
                                                ? "bg-emerald-500"
                                                : "bg-emerald-800/50"
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 bg-white rounded-full m-1 transition-transform ${localSettings.soundEnabled
                                                    ? "translate-x-5"
                                                    : "translate-x-0"
                                                }`}
                                        />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-800/30 bg-emerald-950/30">
                                    <span className="text-emerald-100">効果音</span>
                                    <button
                                        onClick={() =>
                                            setLocalSettings({
                                                ...localSettings,
                                                effectSoundEnabled: !localSettings.effectSoundEnabled,
                                            })
                                        }
                                        className={`w-12 h-7 rounded-full transition-all ${localSettings.effectSoundEnabled
                                                ? "bg-emerald-500"
                                                : "bg-emerald-800/50"
                                            }`}
                                    >
                                        <div
                                            className={`w-5 h-5 bg-white rounded-full m-1 transition-transform ${localSettings.effectSoundEnabled
                                                    ? "translate-x-5"
                                                    : "translate-x-0"
                                                }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* フッター */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-emerald-800/30 bg-slate-900">
                        <Button
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 rounded-xl"
                            onClick={handleSave}
                        >
                            保存
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
