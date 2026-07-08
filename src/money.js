// お金ページ用のヘルパー

// 金額を「¥50,000」形式に
export function formatYen(n) {
  const v = Math.round(Number(n) || 0)
  return '¥' + v.toLocaleString('ja-JP')
}

// 'YYYY-MM-DD' → 'YYYY-MM'
export function monthOf(dateKey) {
  return dateKey.slice(0, 7)
}

// パスワードをSHA-256でハッシュ化する（平文は保存しない）。
// localhostは安全なコンテキスト扱いなので crypto.subtle が使える。
export async function hashPassword(pw) {
  const data = new TextEncoder().encode(pw)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// 収入＝緑、支出＝コーラル
export const MONEY_COLORS = {
  income: '#46c98a',
  expense: '#f2777a',
}
