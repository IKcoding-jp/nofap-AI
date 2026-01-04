"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { WorkoutSession } from "@/components/workout/workout-session";
import { WorkoutSettingsPanel } from "@/components/workout/workout-settings";
import {
    WorkoutPreset,
    WorkoutSettings,
    workoutPresets,
    defaultWorkoutSettings,
} from "@/lib/workout-presets";

export default function WorkoutPage() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // プリセット状態
    const [preset, setPreset] = useState<WorkoutPreset>(workoutPresets[0]);

    // 設定状態
    const [settings, setSettings] = useState<WorkoutSettings>(defaultWorkoutSettings);

    return (
        <>
            <WorkoutSession
                preset={preset}
                settings={settings}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onPresetChange={setPreset}
            />

            <AnimatePresence>
                {isSettingsOpen && (
                    <WorkoutSettingsPanel
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        currentPreset={preset}
                        currentSettings={settings}
                        onPresetChange={setPreset}
                        onSettingsChange={setSettings}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
