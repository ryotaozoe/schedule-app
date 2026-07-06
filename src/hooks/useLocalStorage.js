import { useEffect, useState } from 'react'

// useState と同じ使い方で、値が変わるたびに localStorage へ自動保存するフック。
// localStorage はブラウザ本体にデータを持つので、タブを閉じても
// 開発サーバーを止めてもデータは消えない。
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}
