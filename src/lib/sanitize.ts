/**
 * ユーザー入力のサニタイズ（XSS対策）。
 * HTMLタグと危険なプロトコルを除去する。
 *
 * SEC-8: Unicodeエスケープや数値文字参照によるバイパスを防ぐため、
 * デコード後にも同じ検査を2パス走らせる。
 */

/** HTML数値文字参照（&#106; &#x6A; 等）をデコードする */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g,   (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

/** Unicodeエスケープ（\u006A 等）を展開する */
function decodeUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCodePoint(parseInt(h, 16)));
}

/** 危険なパターンを除去するコアサニタイズ（1パス） */
function stripDangerousPatterns(text: string): string {
  return text
    .replace(/<[^>]*>/g,      "")   // HTMLタグを除去
    .replace(/javascript:/gi, "")   // javascript: プロトコルを除去
    .replace(/data:/gi,       "")   // data: プロトコルを除去
    .replace(/vbscript:/gi,   "")   // vbscript: プロトコルを除去
    .replace(/on\w+\s*=/gi,   "");  // イベントハンドラ属性を除去
}

/**
 * ユーザー入力のサニタイズ。
 * SEC-8: エンコードされた危険文字列のバイパスを防ぐため
 * 「デコード → 除去」を2パス実施する。
 */
export function sanitizeText(text: string): string {
  // パス1: 生入力をそのまま除去
  let result = stripDangerousPatterns(text);
  // パス2: HTML数値参照・Unicodeエスケープをデコードしてから再度除去
  result = stripDangerousPatterns(decodeHtmlEntities(decodeUnicodeEscapes(result)));
  return result.trim();
}

/** 複数行テキストを行ごとにサニタイズする */
export function sanitizeMultilineText(text: string): string {
  return text
    .split("\n")
    .map((line) => sanitizeText(line))
    .join("\n")
    .trim();
}
