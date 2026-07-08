// 予定のカテゴリ定義。ここに追加すれば選択肢と色分けが増える。
// 色は暗い背景でも映える、少し明るめのトーンにしている。
export const CATEGORIES = [
  { id: 'class', label: '授業・学校', color: '#6ea8fe' },
  { id: 'study', label: '勉強', color: '#f472b6' },
  { id: 'baito', label: 'バイト', color: '#f0a94e' },
  { id: 'side', label: '副業', color: '#b48bfa' },
  { id: 'job', label: '就活', color: '#f2777a' },
  { id: 'private', label: 'プライベート', color: '#46c98a' },
  { id: 'other', label: 'その他', color: '#94a3b8' },
]

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
