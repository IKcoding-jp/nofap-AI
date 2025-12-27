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
  // 各属性を0.3倍に減少（より厳しいペナルティ）
  // マイナス値も許容するため、Math.maxで下限を-100に設定
  return {
    confidence: Math.max(-100, Math.floor(currentAttributes.confidence * 0.3)),
    vitality: Math.max(-100, Math.floor(currentAttributes.vitality * 0.3)),
    calmness: Math.max(-100, Math.floor(currentAttributes.calmness * 0.3)),
    cleanliness: Math.max(-100, Math.floor(currentAttributes.cleanliness * 0.3)),
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

