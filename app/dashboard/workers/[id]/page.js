'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function EditWorker() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [hourly_rate, setHourlyRate] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const id = params.id

  useEffect(() => {
    fetchWorker()
  }, [])

  async function fetchWorker() {
    const { data } = await supabase.from('workers').select('*').eq('id', id).single()
    if (data) {
      setName(data.name)
      setPhone(data.phone)
      setHourlyRate(data.hourly_rate)
    }
  }

  async function updateWorker() {
    setLoading(true)
    const { error } = await supabase.from('workers').update({
      name, phone, hourly_rate
    }).eq('id', id)
    if (!error) router.push('/dashboard/workers')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Edit Worker</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push('/dashboard/workers')}
          >
            ← Back
          </button>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl flex flex-col gap-4">
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Hourly Rate ($)" value={hourly_rate} onChange={(e) => setHourlyRate(e.target.value)} />
          <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500" onClick={updateWorker}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </main>
  )
}