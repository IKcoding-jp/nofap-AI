"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BreathingSession } from "@/components/breathing/breathing-session";
import { BreathingSettings } from "@/components/breathing/breathing-settings";
import {
    BreathingPreset,
    BreathingTheme,
    breathingPresets,
    breathingThemes,
    defaultBreathingSettings,
} from "@/lib/breathing-presets";

export default function BreathingPage() {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // 設定状態をここで管理
    const [preset, setPreset] = useState<BreathingPreset>(
        breathingPresets.find((p) => p.id === defaultBreathingSettings.presetId) ||
        breathingPresets[0]
    );
    const [theme, setTheme] = useState<BreathingTheme>(
        breathingThemes.find((t) => t.id === defaultBreathingSettings.themeId) ||
        breathingThemes[0]
    );
    const [duration, setDuration] = useState(defaultBreathingSettings.duration);

    return (
        <>
            <BreathingSession
                preset={preset}
                theme={theme}
                duration={duration}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onPresetChange={setPreset}
                onThemeChange={setTheme}
                onDurationChange={setDuration}
            />

            <AnimatePresence>
                {isSettingsOpen && (
                    <BreathingSettings
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        currentPreset={preset}
                        currentTheme={theme}
                        currentDuration={duration}
                        onPresetChange={setPreset}
                        onThemeChange={setTheme}
                        onDurationChange={setDuration}
                    />
                )}
            </AnimatePresence>
        </>
    );
}
