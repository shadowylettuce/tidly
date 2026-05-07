'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter, useParams } from 'next/navigation'

export default function EditClient() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [frequency, setFrequency] = useState('weekly')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useParams() //grabs the id from the url
  const id = params.id // params.id equals the end of the link

  useEffect(() => {
    fetchClient()
  }, [])

  async function fetchClient() {
    const { data } = await supabase.from('clients').select('*').eq('id', id).single() // This tells supabase that one row is expected back not an array of objects
    if (data) {
      setName(data.name)
      setPhone(data.phone)
      setAddress(data.address)
      setFrequency(data.frequency)
    }
  }

  async function updateClient() {
    setLoading(true)
    const { error } = await supabase.from('clients').update({
      name, phone, address, frequency
    }).eq('id', id)
    if (!error) router.push('/dashboard/clients')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Edit Client</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push('/dashboard/clients')}
          >
            ← Back
          </button>
        </div>
        <div className="bg-gray-900 p-6 rounded-xl flex flex-col gap-4">
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <select className="bg-gray-800 text-white p-3 rounded-lg outline-none" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="other">Other</option>
          </select>
          <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500" onClick={updateClient}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </main>
  )
}