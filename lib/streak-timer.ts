/**
 * ストリーク自動カウント機能のユーティリティ関数
 * 開始日時から経過時間を計算する
 */

export interface ElapsedTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

/**
 * 開始日時から現在時刻までの経過時間を計算する
 * @param startedAt 開始日時（Date または null）
 * @returns 経過時間（ElapsedTime）または null（未開始の場合）
 */
export function calculateElapsedTime(startedAt: Date | null): ElapsedTime | null {
  if (!startedAt) {
    return null;
  }

  const now = new Date();
  const started = new Date(startedAt);

  // 未来日時の場合はエラー（データ不整合）
  if (started > now) {
    console.warn("startedAt is in the future");
    return null;
  }

  const diffMs = now.getTime() - started.getTime();
  const totalSeconds = Math.floor(diffMs / 1000);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds,
  };
}

/**
 * 24時間ベースでストリーク日数を算出する
 * 0〜<24h を0日目とする
 * @param elapsedSeconds 経過秒数
 * @returns ストリーク日数（0日から開始）
 */
export function calculateStreakDays(elapsedSeconds: number): number {
  // 24時間ベース: floor(elapsedSeconds / 86400)
  return Math.floor(elapsedSeconds / 86400);
}

/**
 * 経過時間をフォーマットした文字列に変換する
 * @param elapsed 経過時間（ElapsedTime）
 * @returns フォーマット済み文字列（例: "3日 12:34:56"）
 */
export function formatElapsedTime(elapsed: ElapsedTime | null): string {
  if (!elapsed) {
    return "計算中...";
  }

  const hoursStr = String(elapsed.hours).padStart(2, "0");
  const minutesStr = String(elapsed.minutes).padStart(2, "0");
  const secondsStr = String(elapsed.seconds).padStart(2, "0");

  return `${elapsed.days}日 ${hoursStr}:${minutesStr}:${secondsStr}`;
}

/**
 * 開始日時をフォーマットした文字列に変換する
 * @param startedAt 開始日時（Date）
 * @returns フォーマット済み文字列（例: "2025/12/27 21:30"）
 */
export function formatStartDate(startedAt: Date): string {
  return startedAt.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

