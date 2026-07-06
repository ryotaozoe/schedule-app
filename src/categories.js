// 予定のカテゴリ定義。ここに追加すれば選択肢と色分けが増える
export const CATEGORIES = [
  { id: 'class', label: '授業・学校', color: '#2563eb' },
  { id: 'baito', label: 'バイト', color: '#d97706' },
  { id: 'side', label: '副業', color: '#7c3aed' },
  { id: 'deadline', label: '締切・提出', color: '#dc2626' },
  { id: 'private', label: 'プライベート', color: '#059669' },
  { id: 'other', label: 'その他', color: '#64748b' },
]

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
