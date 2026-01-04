/**
 * 呼吸ガイドアプリ - プリセット定義
 */

export interface BreathingPreset {
    id: string;
    name: string;
    description: string;
    inhale: number;  // 吸う秒数
    hold: number;    // 止める秒数
    exhale: number;  // 吐く秒数
}

export interface BreathingTheme {
    id: string;
    name: string;
    circleColor: string;
    backgroundColor: string;
    textColor: string;
}

// 呼吸パターンプリセット
export const breathingPresets: BreathingPreset[] = [
    {
        id: "relax",
        name: "リラックス（4-7-8法）",
        description: "深いリラックスと睡眠の質向上に効果的",
        inhale: 4,
        hold: 7,
        exhale: 8,
    },
    {
        id: "focus",
        name: "集中",
        description: "均等なリズムで集中力を高める",
        inhale: 4,
        hold: 4,
        exhale: 4,
    },
    {
        id: "calm",
        name: "落ち着き",
        description: "シンプルなリズムで心を落ち着かせる",
        inhale: 5,
        hold: 2,
        exhale: 5,
    },
    {
        id: "energize",
        name: "活力",
        description: "短いサイクルで活力を高める",
        inhale: 3,
        hold: 0,
        exhale: 3,
    },
    {
        id: "box",
        name: "ボックス呼吸",
        description: "均等な4拍子でストレスを解消",
        inhale: 4,
        hold: 4,
        exhale: 4,
    },
];

// セッション時間オプション（秒）
export const sessionDurations = [
    { label: "1分", value: 60 },
    { label: "3分", value: 180 },
    { label: "5分", value: 300 },
    { label: "10分", value: 600 },
];

// テーマカラー
export const breathingThemes: BreathingTheme[] = [
    {
        id: "calm-blue",
        name: "静穏",
        circleColor: "from-blue-400 to-cyan-400",
        backgroundColor: "bg-gradient-to-b from-slate-900 to-blue-950",
        textColor: "text-blue-100",
    },
    {
        id: "warm-sunset",
        name: "夕焼け",
        circleColor: "from-orange-400 to-rose-400",
        backgroundColor: "bg-gradient-to-b from-slate-900 to-orange-950",
        textColor: "text-orange-100",
    },
    {
        id: "nature-green",
        name: "自然",
        circleColor: "from-emerald-400 to-teal-400",
        backgroundColor: "bg-gradient-to-b from-slate-900 to-emerald-950",
        textColor: "text-emerald-100",
    },
    {
        id: "soft-purple",
        name: "やすらぎ",
        circleColor: "from-violet-400 to-purple-400",
        backgroundColor: "bg-gradient-to-b from-slate-900 to-violet-950",
        textColor: "text-violet-100",
    },
    {
        id: "minimal-dark",
        name: "シンプル",
        circleColor: "from-gray-300 to-gray-400",
        backgroundColor: "bg-background",
        textColor: "text-foreground",
    },
];

// デフォルト設定
export const defaultBreathingSettings = {
    presetId: "relax",
    duration: 180,
    themeId: "calm-blue",
    soundEnabled: false,
    ambientSound: null as string | null,
};

// 呼吸フェーズの種類
export type BreathPhase = "inhale" | "hold" | "exhale" | "idle";

// フェーズごとのガイドテキスト
export const phaseGuideText: Record<BreathPhase, string> = {
    inhale: "吸って…",
    hold: "止めて…",
    exhale: "吐いて…",
    idle: "準備はいいですか？",
};
