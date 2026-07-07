import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import { monthKey, uid } from './utils'
import AiEventModal from './components/AiEventModal'
import AiPlanModal from './components/AiPlanModal'
import AiUsagePanel from './components/AiUsagePanel'
import Calendar from './components/Calendar'
import DayModal from './components/DayModal'
import EventModal from './components/EventModal'
import GoalPanel from './components/GoalPanel'
import MemoPanel from './components/MemoPanel'
import StatsPanel from './components/StatsPanel'
import './App.css'

export default function App() {
  const [events, setEvents] = useLocalStorage('schedule-app:events', [])
  const [goals, setGoals] = useLocalStorage('schedule-app:goals', [])
  // 月別のAI利用記録: { '2026-07': { count: 3, yen: 7.2 } }
  const [aiUsage, setAiUsage] = useLocalStorage('schedule-app:ai-usage', {})

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0〜11
  // { type: 'day', dateKey }（その日の予定一覧）
  // { type: 'form', dateKey, event? }（予定の追加・編集フォーム）
  // { type: 'ai-events' }（AIで予定登録） / { type: 'ai-plan', goal }（AIでプラン提案）
  const [modal, setModal] = useState(null)

  const moveMonth = (diff) => {
    const d = new Date(year, month + diff, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth())
  }

  const goToday = () => {
    const t = new Date()
    setYear(t.getFullYear())
    setMonth(t.getMonth())
  }

  const saveEvent = (event) => {
    setEvents((prev) =>
      prev.some((e) => e.id === event.id)
        ? prev.map((e) => (e.id === event.id ? event : e))
        : [...prev, event],
    )
    setModal({ type: 'day', dateKey: event.date })
  }

  const deleteEvent = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setModal(modal ? { type: 'day', dateKey: modal.dateKey } : null)
  }

  // AI呼び出し1回分のコストを今月の利用記録に足す
  const recordAiUsage = (costYen) => {
    setAiUsage((prev) => {
      const key = monthKey()
      const cur = prev[key] ?? { count: 0, yen: 0 }
      return {
        ...prev,
        [key]: { count: cur.count + 1, yen: Math.round((cur.yen + costYen) * 100) / 100 },
      }
    })
  }

  // AIが解析した予定をまとめて登録し、最初の予定の月へ移動する
  const addAiEvents = (newEvents) => {
    setEvents((prev) => [...prev, ...newEvents.map((ev) => ({ ...ev, id: uid() }))])
    if (newEvents.length > 0) {
      const [y, m] = newEvents[0].date.split('-').map(Number)
      setYear(y)
      setMonth(m - 1)
    }
    setModal(null)
  }

  // AIが提案したステップを目標に追加する
  const addAiSteps = (goalId, steps) => {
    setGoals((prev) =>
      prev.map((g) =>
        g.id === goalId
          ? { ...g, steps: [...(g.steps ?? []), ...steps.map((s) => ({ ...s, id: uid(), done: false }))] }
          : g,
      ),
    )
    setModal(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📅 スケジュール管理</h1>
        <div className="month-nav">
          <button className="ai-open-btn" onClick={() => setModal({ type: 'ai-events' })}>
            ✨ AIで予定登録
          </button>
          <button onClick={() => moveMonth(-1)} aria-label="前の月">
            ‹
          </button>
          <span className="month-label">
            {year}年{month + 1}月
          </span>
          <button onClick={() => moveMonth(1)} aria-label="次の月">
            ›
          </button>
          <button className="today-btn" onClick={goToday}>
            今日
          </button>
        </div>
      </header>
      <main className="app-main">
        <div className="main-col">
          <Calendar
            year={year}
            month={month}
            events={events}
            goals={goals}
            onSelectDate={(dateKey) => setModal({ type: 'day', dateKey })}
            onSelectEvent={(event) => setModal({ type: 'form', dateKey: event.date, event })}
          />
          <MemoPanel />
        </div>
        <div className="sidebar">
          <GoalPanel
            goals={goals}
            setGoals={setGoals}
            onRequestPlan={(goal) => setModal({ type: 'ai-plan', goal })}
          />
          <StatsPanel events={events} />
          <AiUsagePanel usage={aiUsage} />
        </div>
      </main>
      {modal?.type === 'day' && (
        <DayModal
          dateKey={modal.dateKey}
          events={events}
          goals={goals}
          onAddEvent={() => setModal({ type: 'form', dateKey: modal.dateKey })}
          onSelectEvent={(event) => setModal({ type: 'form', dateKey: modal.dateKey, event })}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'form' && (
        <EventModal
          dateKey={modal.dateKey}
          event={modal.event}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => setModal({ type: 'day', dateKey: modal.dateKey })}
        />
      )}
      {modal?.type === 'ai-events' && (
        <AiEventModal
          onAdd={addAiEvents}
          onRecordUsage={recordAiUsage}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'ai-plan' && (
        <AiPlanModal
          goal={modal.goal}
          onAddSteps={addAiSteps}
          onRecordUsage={recordAiUsage}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
