'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Revenue() {
  const [appointments, setAppointments] = useState([])
  const [workers, setWorkers] = useState([])
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: appts } = await supabase
      .from('appointments')
      .select('*, clients(name)')
      .eq('status', 'completed')
      .order('date', { ascending: false })
    if (appts) setAppointments(appts)

    const { data: wrks } = await supabase.from('workers').select('*')
    if (wrks) setWorkers(wrks)
  }

  function getTotal(period) { // Filters the appointments array by date range and usese reduce in order to to sum up all the prices
    const now = new Date()
    return appointments
      .filter((apt) => {
        const aptDate = new Date(apt.date)
        if (period === 'week') {
          const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
          return aptDate >= weekAgo
        }
        if (period === 'month') {
          return aptDate.getMonth() === now.getMonth() &&
            aptDate.getFullYear() === now.getFullYear()
        }
        return true
      })
      .reduce((sum, apt) => sum + (apt.price || 0), 0)
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Revenue</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push('/dashboard')}
          >
            ← Back
          </button>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 p-6 rounded-xl text-center">
            <p className="text-gray-400 text-sm mb-2">This Week</p>
            <p className="text-green-400 text-3xl font-bold">${getTotal('week').toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl text-center">
            <p className="text-gray-400 text-sm mb-2">This Month</p>
            <p className="text-green-400 text-3xl font-bold">${getTotal('month').toFixed(2)}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-xl text-center">
            <p className="text-gray-400 text-sm mb-2">All Time</p>
            <p className="text-green-400 text-3xl font-bold">${getTotal('all').toFixed(2)}</p>
          </div>
        </div>

        {/* Recent Completed Jobs */}
        <h2 className="text-white text-xl font-semibold mb-4">Completed Jobs</h2>
        <div className="flex flex-col gap-3">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-gray-900 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">{apt.clients?.name}</p>
                <p className="text-gray-400 text-sm">{apt.date}</p>
              </div>
              <span className="text-green-400 font-bold">${apt.price}</span>
            </div>
          ))}
          {appointments.length === 0 && (
            <p className="text-gray-500 text-center py-8">No completed appointments yet. Mark appointments as completed to see revenue.</p>
          )}
        </div>
      </div>
    </main>
  )
}