/**
 * 経験値(XP)からレベルを計算するロジック
 * docs/gamification_logic.md に基づく
 */

export function calculateLevel(totalXp: number): { level: number; nextLevelXp: number; progress: number } {
  let level = 1;
  let remainingXp = totalXp;
  
  while (true) {
    // Lv n -> Lv n+1 に必要なXP: 100 * (n^1.5)
    const xpRequiredForNext = Math.floor(100 * Math.pow(level, 1.5));
    
    if (remainingXp >= xpRequiredForNext) {
      remainingXp -= xpRequiredForNext;
      level++;
    } else {
      const progress = Math.floor((remainingXp / xpRequiredForNext) * 100);
      return { level, nextLevelXp: xpRequiredForNext, progress };
    }
  }
}

/**
 * 各属性値からモテレベル(-100 to 100)を計算する
 * モテレベル = (Confidence + Vitality + Calmness + Cleanliness) / 4
 */
export function calculateMoteLevel(attributes: {
  confidence: number;
  vitality: number;
  calmness: number;
  cleanliness: number;
}): number {
  const { confidence, vitality, calmness, cleanliness } = attributes;
  const average = (confidence + vitality + calmness + cleanliness) / 4;
  // -100から100の範囲にクランプ
  return Math.max(-100, Math.min(100, Math.round(average)));
}

function clampInt(n: number, min: number, max: number) {
  const v = Math.round(n);
  return Math.max(min, Math.min(max, v));
}

/**
 * 表示用のモテスコア（0〜100）
 * 内部指標のモテレベル(-100〜100)を、ポジティブに分かりやすいスケールへ変換する
 */
export function calculateMoteScore(moteLevel: number): number {
  const clamped = clampInt(moteLevel, -100, 100);
  return clampInt((clamped + 100) / 2, 0, 100);
}

export type MoteRankKey =
  | "restart"
  | "rebuild"
  | "settling"
  | "clean芽"
  | "goodImpression"
  | "composed"
  | "refined"
  | "charming"
  | "noticeable"
  | "immaculate";

export interface MoteRank {
  key: MoteRankKey;
  name: string;
  desc: string;
  /** UIで使う色味（Tailwindのclass想定） */
  accentClass: string;
  /** バッジ用 */
  badgeClass: string;
  /** プログレス等のグラデーション用 */
  gradientClass: string;
}

/**
 * モテスコア(0〜100)から、少数段階の“ランク”を返す
 * モチベ維持（分かりやすい/下がりすぎない印象）を優先した表示専用区分
 */
export function getMoteRank(score: number): MoteRank {
  const s = clampInt(score, 0, 100);

  if (s <= 9) {
    return {
      key: "restart",
      name: "リスタート",
      desc: "まずは整えるところから",
      accentClass: "text-slate-600",
      badgeClass: "bg-slate-100 text-slate-700",
      gradientClass: "from-slate-300 to-slate-200",
    };
  }
  if (s <= 19) {
    return {
      key: "rebuild",
      name: "立て直し",
      desc: "生活リズムを戻していく",
      accentClass: "text-blue-700",
      badgeClass: "bg-blue-100 text-blue-700",
      gradientClass: "from-blue-400 to-cyan-300",
    };
  }
  if (s <= 29) {
    return {
      key: "settling",
      name: "整いはじめ",
      desc: "習慣が少しずつ安定",
      accentClass: "text-cyan-700",
      badgeClass: "bg-cyan-100 text-cyan-700",
      gradientClass: "from-cyan-400 to-teal-300",
    };
  }
  if (s <= 39) {
    return {
      key: "clean芽",
      name: "清潔感の芽",
      desc: "見た目が整ってきた",
      accentClass: "text-emerald-700",
      badgeClass: "bg-emerald-100 text-emerald-700",
      gradientClass: "from-emerald-400 to-emerald-200",
    };
  }
  if (s <= 49) {
    return {
      key: "goodImpression",
      name: "好印象",
      desc: "話しかけやすい雰囲気",
      accentClass: "text-emerald-700",
      badgeClass: "bg-emerald-100 text-emerald-700",
      gradientClass: "from-emerald-400 to-cyan-300",
    };
  }
  if (s <= 59) {
    return {
      key: "composed",
      name: "余裕が出る",
      desc: "落ち着きがにじむ",
      accentClass: "text-sky-700",
      badgeClass: "bg-sky-100 text-sky-700",
      gradientClass: "from-sky-400 to-blue-300",
    };
  }
  if (s <= 69) {
    return {
      key: "refined",
      name: "洗練",
      desc: "言動に品が出てくる",
      accentClass: "text-indigo-700",
      badgeClass: "bg-indigo-100 text-indigo-700",
      gradientClass: "from-indigo-400 to-sky-300",
    };
  }
  if (s <= 79) {
    return {
      key: "charming",
      name: "魅力が乗る",
      desc: "自然と目を引く",
      accentClass: "text-fuchsia-700",
      badgeClass: "bg-fuchsia-100 text-fuchsia-700",
      gradientClass: "from-fuchsia-400 to-pink-300",
    };
  }
  if (s <= 89) {
    return {
      key: "noticeable",
      name: "注目される",
      desc: "存在感がはっきりする",
      accentClass: "text-rose-700",
      badgeClass: "bg-rose-100 text-rose-700",
      gradientClass: "from-rose-400 to-orange-300",
    };
  }
  return {
    key: "immaculate",
    name: "圧倒的清潔感",
    desc: "空気が変わるレベル",
    accentClass: "text-amber-700",
    badgeClass: "bg-amber-100 text-amber-800",
    gradientClass: "from-amber-400 via-yellow-300 to-amber-200",
  };
}

/**
 * ストリーク日数からConfidence(自信)属性値を計算する (-100 to 100)
 * リセット直後はマイナスから始まり、継続日数に応じてプラス方向へ成長
 */
export function calculateConfidence(streakDays: number): number {
  // ストリーク日数に基づいて0-100の範囲で計算
  let baseValue = 0;
  if (streakDays <= 5) {
    baseValue = streakDays * 2; // 0-10
  } else if (streakDays <= 20) {
    baseValue = 10 + Math.floor((streakDays - 5) * (30 / 15)); // 10-40
  } else if (streakDays <= 60) {
    baseValue = 40 + Math.floor((streakDays - 20) * (40 / 40)); // 40-80
  } else {
    baseValue = Math.min(80 + Math.floor((streakDays - 60) * (20 / 40)), 100); // 80-100
  }
  // -100から100の範囲にクランプ
  return Math.max(-100, Math.min(100, baseValue));
}

/**
 * リセット時の属性減少ロジック
 * リセット時は大幅に減少し、マイナス値に落ちる可能性がある
 */
export function calculateResetAttributes(currentAttributes: {
  confidence: number;
  vitality: number;
  calmness: number;
  cleanliness: number;
}) {
  // 各属性を0.7倍に減少（モチベ維持のため、落ちすぎない調整）
  // マイナス値も許容するため、下限を-100に設定
  const factor = 0.7;
  return {
    confidence: Math.max(-100, Math.floor(currentAttributes.confidence * factor)),
    vitality: Math.max(-100, Math.floor(currentAttributes.vitality * factor)),
    calmness: Math.max(-100, Math.floor(currentAttributes.calmness * factor)),
    cleanliness: Math.max(-100, Math.floor(currentAttributes.cleanliness * factor)),
  };
}

/**
 * カテゴリ別の称号を取得する
 */
export function getTitles(level: number) {
  const tiers = [
    { min: 1, name: "見習い" },
    { min: 6, name: "熟練" },
    { min: 16, name: "マスター" },
    { min: 26, name: "レジェンド" }
  ];

  const getTierName = (lv: number) => {
    return [...tiers].reverse().find(t => lv >= t.min)?.name || "見習い";
  };

  const tier = getTierName(level);

  return {
    study: `${tier}受験生`,
    work: `${tier}ビジネスマン`,
    love: `${tier}ラバー`,
  };
}

