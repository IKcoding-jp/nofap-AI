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
 * ストリーク日数からモテレベル(0-30)を計算する
 */
export function calculateMoteLevel(streakDays: number): number {
  if (streakDays <= 5) return streakDays;
  if (streakDays <= 20) return 5 + Math.floor((streakDays - 5) * (10 / 15));
  if (streakDays <= 60) return 15 + Math.floor((streakDays - 20) * (10 / 40));
  return Math.min(25 + Math.floor((streakDays - 60) * (5 / 30)), 30);
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

