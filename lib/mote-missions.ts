/**
 * モテミッションのカタログ定義
 * 日次でランダムに3件選択される
 */

export type MoteAttribute = "confidence" | "vitality" | "calmness" | "cleanliness";

export interface MoteMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  attributeReward?: {
    attribute: MoteAttribute;
    amount: number;
  };
}

export const MOTE_MISSIONS: MoteMission[] = [
  {
    id: "smile_mirror",
    title: "鏡を見て笑顔を3回作る",
    description: "清潔感と自信がアップします",
    xpReward: 20,
    attributeReward: {
      attribute: "cleanliness",
      amount: 1,
    },
  },
  {
    id: "posture_check",
    title: "姿勢を正して5分間キープ",
    description: "自信と落ち着きが身につきます",
    xpReward: 25,
    attributeReward: {
      attribute: "confidence",
      amount: 1,
    },
  },
  {
    id: "deep_breath",
    title: "深呼吸を10回する",
    description: "心の落ち着きを取り戻します",
    xpReward: 15,
    attributeReward: {
      attribute: "calmness",
      amount: 1,
    },
  },
  {
    id: "grooming",
    title: "身だしなみを整える",
    description: "清潔感が高まります",
    xpReward: 20,
    attributeReward: {
      attribute: "cleanliness",
      amount: 1,
    },
  },
  {
    id: "positive_affirmation",
    title: "自分を褒める言葉を3つ言う",
    description: "自信が育まれます",
    xpReward: 20,
    attributeReward: {
      attribute: "confidence",
      amount: 1,
    },
  },
  {
    id: "stretch",
    title: "ストレッチを5分間する",
    description: "体のリフレッシュで活力が上がります",
    xpReward: 25,
    attributeReward: {
      attribute: "vitality",
      amount: 1,
    },
  },
  {
    id: "water_intake",
    title: "水をコップ2杯飲む",
    description: "体調管理で活力が向上します",
    xpReward: 15,
    attributeReward: {
      attribute: "vitality",
      amount: 1,
    },
  },
  {
    id: "meditation",
    title: "瞑想を3分間する",
    description: "心の平静を取り戻します",
    xpReward: 30,
    attributeReward: {
      attribute: "calmness",
      amount: 1,
    },
  },
  {
    id: "eye_contact_practice",
    title: "鏡を見ながら目をしっかり見る練習",
    description: "自信と清潔感がアップします",
    xpReward: 25,
    attributeReward: {
      attribute: "confidence",
      amount: 1,
    },
  },
  {
    id: "clean_space",
    title: "自分のスペースを5分間片付ける",
    description: "清潔感と落ち着きが向上します",
    xpReward: 20,
    attributeReward: {
      attribute: "cleanliness",
      amount: 1,
    },
  },
];

/**
 * ミッションIDからミッション定義を取得
 */
export function getMissionById(id: string): MoteMission | undefined {
  return MOTE_MISSIONS.find((m) => m.id === id);
}

/**
 * ランダムにミッションを選択（重複なし）
 */
export function selectRandomMissions(count: number, excludeIds: string[] = []): MoteMission[] {
  const available = MOTE_MISSIONS.filter((m) => !excludeIds.includes(m.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
