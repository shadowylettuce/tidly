'use client'

import { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// ─── CALENDAR SETUP ───────────────────────────────────────
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS }
})

export default function CalendarPage() {

  // ─── STATE ───────────────────────────────────────────────
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const router = useRouter()

  // ─── LIFECYCLE ───────────────────────────────────────────
  useEffect(() => {
    fetchAppointments()
  }, [])

  // ─── DATA FETCHING ────────────────────────────────────────
  async function fetchAppointments() {
    const { data } = await supabase
      .from('appointments')
      .select('*, clients(name, address)')
    
    if (data) {
      const calendarEvents = data.map((apt) => ({
        id: apt.id,
        title: `${apt.clients?.name} - $${apt.price}`,
        start: new Date(`${apt.date}T${apt.time || '09:00:00'}`),
        end: new Date(`${apt.date}T${apt.time || '09:00:00'}`),
        resource: apt
      }))
      setEvents(calendarEvents)
    }
  }

  // ─── ACTIONS ──────────────────────────────────────────────
  function handleSelectEvent(event) {
    setSelectedEvent(event.resource)
  }

  function handleCloseModal() {
    setSelectedEvent(null)
  }

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Calendar</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push('/dashboard')}
          >
            ← Back
          </button>
        </div>
        {/* ── END HEADER ── */}

        {/* ── CALENDAR ── */}
        <div className="bg-white rounded-xl p-4" style={{ height: 600 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            onSelectEvent={handleSelectEvent}
            style={{ height: '100%' }}
          />
        </div>
        {/* ── END CALENDAR ── */}

        {/* ── EVENT DETAIL MODAL ── */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-xl w-96 flex flex-col gap-4">
              <h2 className="text-white text-xl font-bold">{selectedEvent.clients?.name}</h2>
              <p className="text-gray-400">📅 {selectedEvent.date} at {selectedEvent.time}</p>
              <p className="text-gray-400">📍 {selectedEvent.clients?.address}</p>
              <p className="text-green-400 font-semibold text-lg">${selectedEvent.price}</p>
              <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm w-fit">
                {selectedEvent.status}
              </span>
              {selectedEvent.notes && (
                <p className="text-gray-500 italic">{selectedEvent.notes}</p>
              )}
              <div className="flex gap-3 mt-2">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 flex-1"
                  onClick={() => router.push(`/dashboard/appointments/${selectedEvent.id}`)}
                >
                  Edit
                </button>
                <button
                  className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 flex-1"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── END EVENT DETAIL MODAL ── */}

      </div>
    </main>
  )
}