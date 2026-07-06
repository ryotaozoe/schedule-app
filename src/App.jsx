import { useState } from 'react'
import { useLocalStorage } from './hooks/useLocalStorage'
import Calendar from './components/Calendar'
import EventModal from './components/EventModal'
import GoalPanel from './components/GoalPanel'
import './App.css'

export default function App() {
  const [events, setEvents] = useLocalStorage('schedule-app:events', [])
  const [goals, setGoals] = useLocalStorage('schedule-app:goals', [])

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth()) // 0〜11
  const [modal, setModal] = useState(null) // { dateKey, event? } または null

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
    setModal(null)
  }

  const deleteEvent = (id) => {
    setEvents((prev) => prev.filter((e) => e.id !== id))
    setModal(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>📅 スケジュール管理</h1>
        <div className="month-nav">
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
        <Calendar
          year={year}
          month={month}
          events={events}
          goals={goals}
          onSelectDate={(dateKey) => setModal({ dateKey })}
          onSelectEvent={(event) => setModal({ dateKey: event.date, event })}
        />
        <GoalPanel goals={goals} setGoals={setGoals} />
      </main>
      {modal && (
        <EventModal
          dateKey={modal.dateKey}
          event={modal.event}
          onSave={saveEvent}
          onDelete={deleteEvent}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
