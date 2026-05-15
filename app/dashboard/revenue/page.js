'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export default function Revenue() {
  // ─── STATE ───
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [workers, setWorkers] = useState([])
  const [timesheets, setTimesheets] = useState([])
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selectedDates, setSelectedDates] = useState(() => new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const [onedayInput, setOnedayInput] = useState('')
  const [rangeStart, setRangeStart] = useState('')
  const [rangeEnd, setRangeEnd] = useState('')

  // ─── LIFECYCLE ───
  useEffect(() => {
    fetchData()
  }, [])

  // ─── FETCH ───
  async function fetchData() {
    const { data: appts } = await supabase
      .from('appointments')
      .select('*, clients(name)')
      .eq('status', 'completed')
      .order('date', { ascending: false })
    if (appts) setAppointments(appts)

    const { data: wrks } = await supabase
      .from('workers')
      .select('id, hourly_rate')
    if (wrks) setWorkers(wrks)

    const { data: ts } = await supabase
      .from('timesheets')
      .select('worker_id, hours_worked, date')
    if (ts) setTimesheets(ts)
  }

  // ─── HELPERS ───
  function hourlyRateFor(workerId) {
    const w = workers.find((x) => x.id === workerId)
    return Number(w?.hourly_rate || 0)
  }

  function inPeriod(dateStr, period) {
    const d = new Date(dateStr)
    const now = new Date()
    if (period === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
      return d >= weekAgo
    }
    if (period === 'month') {
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
    }
    if (period === 'year') {
      return d.getFullYear() === now.getFullYear()
    }
    return true
  }

  function getGrossForDate(dateStr) {
    return appointments
      .filter((apt) => apt.date === dateStr)
      .reduce((sum, apt) => sum + (Number(apt.price) || 0), 0)
  }

  function getLaborForDate(dateStr) {
    return timesheets
      .filter((t) => t.date === dateStr)
      .reduce(
        (sum, t) =>
          sum + Number(t.hours_worked || 0) * hourlyRateFor(t.worker_id),
        0,
      )
  }

  function getNetForDate(dateStr) {
    return getGrossForDate(dateStr) - getLaborForDate(dateStr)
  }

  function getSummary(period) {
    const gross = appointments
      .filter((apt) => inPeriod(apt.date, period))
      .reduce((sum, apt) => sum + (Number(apt.price) || 0), 0)
    const labor = timesheets
      .filter((t) => inPeriod(t.date, period))
      .reduce(
        (sum, t) =>
          sum + Number(t.hours_worked || 0) * hourlyRateFor(t.worker_id),
        0,
      )
    return { gross, labor, net: gross - labor }
  }

  function toDateStr(year, month, day) {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  function buildCalendarDays(year, month) {
    const firstOfMonth = new Date(year, month, 1)
    const startOffset = firstOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()
    const cells = []

    for (let i = 0; i < startOffset; i++) {
      const day = daysInPrevMonth - startOffset + i + 1
      const prevMonth = month === 0 ? 11 : month - 1
      const prevYear = month === 0 ? year - 1 : year
      cells.push({
        day,
        dateStr: toDateStr(prevYear, prevMonth, day),
        inCurrentMonth: false,
      })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        dateStr: toDateStr(year, month, day),
        inCurrentMonth: true,
      })
    }

    let nextDay = 1
    while (cells.length % 7 !== 0) {
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      cells.push({
        day: nextDay,
        dateStr: toDateStr(nextYear, nextMonth, nextDay),
        inCurrentMonth: false,
      })
      nextDay++
    }

    return cells
  }

  function goToPrevMonth() {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }

  function goToNextMonth() {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }

  function getDatesBetween(startStr, endStr) {
    let start = new Date(`${startStr}T00:00:00`)
    let end = new Date(`${endStr}T00:00:00`)
    if (start > end) {
      const tmp = start
      start = end
      end = tmp
    }
    const dates = []
    const cur = new Date(start)
    while (cur <= end) {
      dates.push(toDateStr(cur.getFullYear(), cur.getMonth(), cur.getDate()))
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }

  function addRangeToSelection(startStr, endStr) {
    const range = getDatesBetween(startStr, endStr)
    setSelectedDates((prev) => {
      const next = new Set(prev)
      range.forEach((d) => next.add(d))
      return next
    })
  }

  function handleDayClick(dateStr) {
    setSelectedDates((prev) => {
      const next = new Set(prev)
      if (next.has(dateStr)) next.delete(dateStr)
      else next.add(dateStr)
      return next
    })
  }

  function handleDayMouseDown(dateStr) {
    setIsDragging(true)
    setDragStart(dateStr)
  }

  function handleDayMouseEnter(dateStr) {
    if (isDragging && dragStart) {
      addRangeToSelection(dragStart, dateStr)
    }
  }

  function endDrag() {
    setIsDragging(false)
    setDragStart(null)
  }

  function handleOneDayGo() {
    if (!onedayInput) return
    setSelectedDates(new Set([onedayInput]))
    const [y, m] = onedayInput.split('-').map(Number)
    setCurrentMonth({ year: y, month: m - 1 })
  }

  function handleRangeApply() {
    if (!rangeStart || !rangeEnd) return
    const dates = getDatesBetween(rangeStart, rangeEnd)
    setSelectedDates(new Set(dates))
    const [y, m] = rangeStart.split('-').map(Number)
    setCurrentMonth((prev) => {
      if (prev.year === y && prev.month === m - 1) return prev
      return { year: y, month: m - 1 }
    })
  }

  function handleClearAll() {
    setSelectedDates(new Set())
    setOnedayInput('')
    setRangeStart('')
    setRangeEnd('')
  }

  const selectedGross = Array.from(selectedDates).reduce(
    (sum, d) => sum + getGrossForDate(d),
    0,
  )
  const selectedNet = Array.from(selectedDates).reduce(
    (sum, d) => sum + getNetForDate(d),
    0,
  )

  const calendarDays = buildCalendarDays(currentMonth.year, currentMonth.month)
  const monthLabel = `${MONTH_NAMES[currentMonth.month]} ${currentMonth.year}`

  const statPeriods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
    { key: 'all', label: 'All Time' },
  ]

  // ─── RENDER ───
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Revenue</h1>
          <button
            type="button"
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push('/dashboard')}
          >
            ← Back
          </button>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statPeriods.map(({ key, label }) => {
            const { gross, labor, net } = getSummary(key)
            return (
              <div
                key={key}
                className="bg-gray-900 rounded-xl p-6 text-center"
              >
                <p className="text-gray-400 text-sm mb-2">{label}</p>
                <p
                  className={`text-3xl font-bold ${
                    net >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  ${net.toFixed(2)}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Gross ${gross.toFixed(2)} · Payroll ${labor.toFixed(2)}
                </p>
              </div>
            )
          })}
        </div>
        {/* ── END STAT CARDS ── */}

        {/* ── CALENDAR ── */}
        <section
          className="flex flex-col lg:flex-row gap-6"
          onMouseUp={endDrag}
        >
          <div className="w-full lg:w-[65%]">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700"
                onClick={goToPrevMonth}
                aria-label="Previous month"
              >
                ←
              </button>
              <h2 className="text-white text-xl font-semibold">{monthLabel}</h2>
              <button
                type="button"
                className="bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                →
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-gray-400 text-xs text-center font-medium"
                >
                  {day}
                </div>
              ))}
            </div>

            <div
              className="grid grid-cols-7 gap-2 select-none"
              onMouseLeave={endDrag}
            >
              {calendarDays.map((cell, idx) => {
                const gross = cell.inCurrentMonth
                  ? getGrossForDate(cell.dateStr)
                  : 0
                const net = cell.inCurrentMonth
                  ? getNetForDate(cell.dateStr)
                  : 0
                const showRevenue = cell.inCurrentMonth && gross > 0
                const isSelected =
                  cell.inCurrentMonth && selectedDates.has(cell.dateStr)

                return (
                  <div
                    key={`${cell.dateStr}-${idx}`}
                    role={cell.inCurrentMonth ? 'button' : undefined}
                    tabIndex={cell.inCurrentMonth ? 0 : undefined}
                    className={`rounded-lg p-2 min-h-[80px] flex flex-col ${
                      isSelected
                        ? 'ring-2 ring-blue-500 bg-gray-800'
                        : 'bg-gray-900'
                    } ${cell.inCurrentMonth ? 'cursor-pointer' : ''}`}
                    onClick={
                      cell.inCurrentMonth
                        ? () => handleDayClick(cell.dateStr)
                        : undefined
                    }
                    onMouseDown={
                      cell.inCurrentMonth
                        ? () => handleDayMouseDown(cell.dateStr)
                        : undefined
                    }
                    onMouseEnter={
                      cell.inCurrentMonth
                        ? () => handleDayMouseEnter(cell.dateStr)
                        : undefined
                    }
                  >
                    <span
                      className={`text-xs ${
                        cell.inCurrentMonth ? 'text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {showRevenue ? (
                      <div className="mt-1 space-y-0.5">
                        <p
                          className={`text-sm font-semibold ${
                            net < 0 ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          ${net.toFixed(2)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Gross ${gross.toFixed(2)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="w-full lg:w-[35%] flex flex-col gap-4">
            <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-white font-medium">One Day</p>
              <input
                type="date"
                className="bg-gray-800 text-white rounded-lg p-2 outline-none w-full"
                value={onedayInput}
                onChange={(e) => setOnedayInput(e.target.value)}
              />
              <button
                type="button"
                className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-500"
                onClick={handleOneDayGo}
              >
                Go
              </button>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-white font-medium">Date Range</p>
              <label className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs">Start</span>
                <input
                  type="date"
                  className="bg-gray-800 text-white rounded-lg p-2 outline-none w-full"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-gray-400 text-xs">End</span>
                <input
                  type="date"
                  className="bg-gray-800 text-white rounded-lg p-2 outline-none w-full"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="bg-blue-600 text-white rounded-lg p-2 hover:bg-blue-500"
                onClick={handleRangeApply}
              >
                Apply
              </button>
            </div>

            {/* ── SELECTION SUMMARY ── */}
            {selectedDates.size > 0 ? (
              <div className="bg-gray-900 rounded-xl p-4 flex flex-col gap-3">
                <p className="text-gray-400 text-sm">
                  {selectedDates.size} day(s) selected
                </p>
                <p className="text-green-400 font-semibold">
                  Gross: ${selectedGross.toFixed(2)}
                </p>
                <p
                  className={`font-semibold ${
                    selectedNet >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  Net: ${selectedNet.toFixed(2)}
                </p>
                <button
                  type="button"
                  className="bg-gray-700 text-white rounded-lg p-2 hover:bg-gray-600 text-sm"
                  onClick={handleClearAll}
                >
                  Clear All
                </button>
              </div>
            ) : null}
            {/* ── END SELECTION SUMMARY ── */}
          </div>
          {/* ── END RIGHT PANEL ── */}
        </section>
        {/* ── END CALENDAR ── */}
      </div>
    </main>
  )
}
