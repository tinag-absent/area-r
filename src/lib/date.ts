/**
 * UTC カレンダー日付ベースの日数差を計算する。
 * ミリ秒差を 86400000 で割る方式は「23:55→00:05」のような
 * 日付またぎで誤算するため、文字列から年月日を取り出して比較する。
 *
 * @param dateStrA "YYYY-MM-DD" or SQLite datetime string (UTC)
 * @param dateStrB "YYYY-MM-DD" or SQLite datetime string (UTC)
 * @returns dateStrA - dateStrB の日数（正 = A が後）
 */
export function utcDaysDiff(dateStrA: string, dateStrB: string): number {
  const toUtcMs = (s: string) => {
    const d = s.slice(0, 10); // "YYYY-MM-DD" を取り出す
    const parts = d.split("-").map(Number);
    const [y, m, day] = parts as [number, number, number];
    return Date.UTC(y, m - 1, day);
  };
  return Math.floor((toUtcMs(dateStrA) - toUtcMs(dateStrB)) / 86_400_000);
}

/**
 * Date オブジェクトを SQLite が解釈できる UTC 文字列に変換する。
 * SQLite の datetime('now') は "YYYY-MM-DD HH:MM:SS" 形式を返すため合わせる。
 */
export function toSqliteUtc(date: Date): string {
  return date.toISOString().replace("T", " ").slice(0, 19);
}
