'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function EditAppointment() {
  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [price, setPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('scheduled')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const id = params.id

  useEffect(() => {
    fetchAppointment()
    fetchClients()
  }, [])

  async function fetchAppointment() {
    const { data } = await supabase.from('appointments').select('*').eq('id', id).single()
    if (data) {
      setClientId(data.client_id)
      setDate(data.date)
      setTime(data.time)
      setPrice(data.price)
      setNotes(data.notes || '')
      setStatus(data.status)
    }
  }

  async function fetchClients() {
    const { data } = await supabase.from('clients').select('*')
    if (data) setClients(data)
  }

  async function updateAppointment() {
    setLoading(true)
    const { error } = await supabase.from('appointments').update({
      client_id: clientId,
      date,
      time,
      price: parseFloat(price),
      notes,
      status
    }).eq('id', id)
    if (!error) router.push('/dashboard/appointments')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Edit Appointment</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push('/dashboard/appointments')}
          >
            ← Back
          </button>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl flex flex-col gap-4">
          <select className="bg-gray-800 text-white p-3 rounded-lg outline-none" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Price ($)" value={price} onChange={(e) => setPrice(e.target.value)} />
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <select className="bg-gray-800 text-white p-3 rounded-lg outline-none" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500" onClick={updateAppointment}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </main>
  )
}