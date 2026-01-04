/**
 * 筋トレガイドアプリ - プリセット定義
 */

// エクササイズの種類
export interface Exercise {
    id: string;
    name: string;
    type: "reps" | "time";       // 回数制 or 時間制
    defaultReps?: number;         // デフォルト回数
    defaultDuration?: number;     // デフォルト時間（秒）
    description: string;          // 簡潔な説明
    imageUrl: string;             // マネキン画像パス
}

// エクササイズセット（トレーニング内の1種目）
export interface ExerciseSet {
    exercise: Exercise;
    reps?: number;                // 回数（type="reps"の場合）
    duration?: number;            // 時間（type="time"の場合）
    sets: number;                 // セット数
}

// トレーニングプリセット
export interface WorkoutPreset {
    id: string;
    name: string;
    description: string;
    estimatedTime: number;        // 目安時間（秒）
    exercises: ExerciseSet[];
}

// セッション設定
export interface WorkoutSettings {
    restBetweenSets: number;      // セット間休憩（秒）
    restBetweenExercises: number; // 種目間休憩（秒）
    soundEnabled: boolean;        // 音声ガイド
    effectSoundEnabled: boolean;  // 効果音
}

// セッション状態
export type SessionPhase =
    | "idle"          // 待機中
    | "exercise"      // エクササイズ中
    | "rest"          // 休憩中
    | "completed";    // 完了

// エクササイズ定義
export const exercises: Exercise[] = [
    // 下半身
    {
        id: "squat",
        name: "スクワット",
        type: "reps",
        defaultReps: 10,
        description: "足を肩幅に開き、膝を曲げて腰を落とす",
        imageUrl: "/workout/squat.webp",
    },
    {
        id: "lunge",
        name: "ランジ",
        type: "reps",
        defaultReps: 10,
        description: "片足を前に踏み出し、両膝を曲げる",
        imageUrl: "/workout/lunge.webp",
    },
    {
        id: "calf-raise",
        name: "カーフレイズ",
        type: "reps",
        defaultReps: 15,
        description: "つま先立ちでふくらはぎを鍛える",
        imageUrl: "/workout/calf_raise.webp",
    },
    // 上半身
    {
        id: "pushup",
        name: "プッシュアップ",
        type: "reps",
        defaultReps: 10,
        description: "腕立て伏せ。胸を床に近づけて押し上げる",
        imageUrl: "/workout/pushup.webp",
    },
    {
        id: "diamond-pushup",
        name: "ダイヤモンドプッシュアップ",
        type: "reps",
        defaultReps: 8,
        description: "両手を近づけて行う腕立て伏せ",
        imageUrl: "/workout/diamond_pushup.webp",
    },
    {
        id: "tricep-dip",
        name: "トライセップディップ",
        type: "reps",
        defaultReps: 10,
        description: "椅子を使って上腕三頭筋を鍛える",
        imageUrl: "/workout/tricep_dip.webp",
    },
    // 体幹
    {
        id: "plank",
        name: "プランク",
        type: "time",
        defaultDuration: 30,
        description: "うつ伏せで体を一直線に保つ",
        imageUrl: "/workout/plank.webp",
    },
    {
        id: "crunch",
        name: "クランチ",
        type: "reps",
        defaultReps: 15,
        description: "仰向けで上体を起こす腹筋運動",
        imageUrl: "/workout/crunch.webp",
    },
    {
        id: "mountain-climber",
        name: "マウンテンクライマー",
        type: "time",
        defaultDuration: 30,
        description: "プランク姿勢で足を交互に引きつける",
        imageUrl: "/workout/mountain_climber.webp",
    },
    {
        id: "side-plank",
        name: "サイドプランク",
        type: "time",
        defaultDuration: 20,
        description: "横向きで体を一直線に保つ",
        imageUrl: "/workout/side_plank.webp",
    },
    // 全身
    {
        id: "burpee",
        name: "バーピー",
        type: "reps",
        defaultReps: 5,
        description: "スクワット→プランク→ジャンプの全身運動",
        imageUrl: "/workout/burpee.webp",
    },
    {
        id: "jumping-jack",
        name: "ジャンピングジャック",
        type: "reps",
        defaultReps: 20,
        description: "ジャンプしながら手足を開閉する",
        imageUrl: "/workout/jumping_jack.webp",
    },
];

// ヘルパー関数：IDからエクササイズを取得
export const getExerciseById = (id: string): Exercise | undefined =>
    exercises.find(e => e.id === id);

// トレーニングプリセット
export const workoutPresets: WorkoutPreset[] = [
    {
        id: "full-body-beginner",
        name: "全身（初心者）",
        description: "初心者向けの基本的な全身トレーニング",
        estimatedTime: 600, // 10分
        exercises: [
            { exercise: getExerciseById("squat")!, reps: 10, sets: 2 },
            { exercise: getExerciseById("pushup")!, reps: 8, sets: 2 },
            { exercise: getExerciseById("plank")!, duration: 20, sets: 2 },
            { exercise: getExerciseById("crunch")!, reps: 10, sets: 2 },
            { exercise: getExerciseById("jumping-jack")!, reps: 15, sets: 1 },
        ],
    },
    {
        id: "lower-body",
        name: "下半身",
        description: "脚とお尻を重点的に鍛える",
        estimatedTime: 480, // 8分
        exercises: [
            { exercise: getExerciseById("squat")!, reps: 15, sets: 3 },
            { exercise: getExerciseById("lunge")!, reps: 10, sets: 2 },
            { exercise: getExerciseById("calf-raise")!, reps: 20, sets: 2 },
        ],
    },
    {
        id: "upper-body",
        name: "上半身",
        description: "胸・腕・肩を鍛える",
        estimatedTime: 480, // 8分
        exercises: [
            { exercise: getExerciseById("pushup")!, reps: 12, sets: 3 },
            { exercise: getExerciseById("diamond-pushup")!, reps: 8, sets: 2 },
            { exercise: getExerciseById("tricep-dip")!, reps: 10, sets: 2 },
        ],
    },
    {
        id: "core",
        name: "体幹",
        description: "腹筋とコアを強化する",
        estimatedTime: 480, // 8分
        exercises: [
            { exercise: getExerciseById("plank")!, duration: 30, sets: 3 },
            { exercise: getExerciseById("crunch")!, reps: 15, sets: 2 },
            { exercise: getExerciseById("mountain-climber")!, duration: 20, sets: 2 },
            { exercise: getExerciseById("side-plank")!, duration: 15, sets: 2 },
        ],
    },
    {
        id: "quick-3min",
        name: "3分クイック",
        description: "短時間でリフレッシュ",
        estimatedTime: 180, // 3分
        exercises: [
            { exercise: getExerciseById("jumping-jack")!, reps: 20, sets: 1 },
            { exercise: getExerciseById("squat")!, reps: 10, sets: 1 },
            { exercise: getExerciseById("plank")!, duration: 20, sets: 1 },
        ],
    },
];

// 休憩時間オプション（秒）
export const restDurations = [
    { label: "15秒", value: 15 },
    { label: "30秒", value: 30 },
    { label: "45秒", value: 45 },
    { label: "60秒", value: 60 },
];

// デフォルト設定
export const defaultWorkoutSettings: WorkoutSettings = {
    restBetweenSets: 15,
    restBetweenExercises: 30,
    soundEnabled: true,
    effectSoundEnabled: true,
};

// フェーズごとのガイドテキスト
export const phaseGuideText: Record<SessionPhase, string> = {
    idle: "準備はいいですか？",
    exercise: "頑張って！",
    rest: "休憩中…",
    completed: "お疲れさまでした！",
};

// 動作中の指示テキスト
export const exerciseGuideTexts = {
    start: "動作開始！",
    remaining: (count: number) => `あと${count}回`,
    remainingTime: (seconds: number) => `残り${seconds}秒`,
    nextExercise: "次の種目へ",
    nextSet: "次のセットへ",
    takeRest: "休憩",
    complete: "完了！",
};
