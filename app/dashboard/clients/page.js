'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [frequency, setFrequency] = useState('weekly')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchClients()
  }, [])

  async function fetchClients() {
    const { data, error } = await supabase.from('clients').select('*')
    if (data) setClients(data)
  }

  async function addClient() {
    setLoading(true)
    const { error } = await supabase.from('clients').insert({
      name, phone, address, frequency
    })
    if (!error) {
      setName('')
      setPhone('')
      setAddress('')
      fetchClients()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Clients</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push('/dashboard')}
          >
            ← Back
          </button>
        </div>

        {/* Add Client Form */}
        <div className="bg-gray-900 p-6 rounded-xl mb-8 flex flex-col gap-4">
          <h2 className="text-white text-xl font-semibold">Add New Client</h2>
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="bg-gray-800 text-white p-3 rounded-lg outline-none" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
          <select className="bg-gray-800 text-white p-3 rounded-lg outline-none" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
            <option value="other">Other</option>
          </select>
          <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500" onClick={addClient}>
            {loading ? 'Adding...' : 'Add Client'}
          </button>
        </div>

        {/* Client List */}
        <div className="flex flex-col gap-4">
          {clients.map((client) => (
            <div key={client.id} className="bg-gray-900 p-4 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">{client.name}</p>
                <p className="text-gray-400 text-sm">{client.address}</p>
                <p className="text-gray-400 text-sm">{client.phone}</p>
              </div>
              <span className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm">{client.frequency}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}