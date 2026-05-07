'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    getUser()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return <div className="min-h-screen bg-gray-950" />

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Tidly</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div
            className="bg-gray-900 p-6 rounded-xl cursor-pointer hover:bg-gray-800"
            onClick={() => router.push('/dashboard/clients')}
          >
            <h2 className="text-white text-xl font-semibold mb-2">👥 Clients</h2>
            <p className="text-gray-400">Manage your client list</p>
          </div>
          <div
            className="bg-gray-900 p-6 rounded-xl cursor-pointer hover:bg-gray-800"
            onClick={() => router.push('/dashboard/workers')}
          >
            <h2 className="text-white text-xl font-semibold mb-2">👷 Workers</h2>
            <p className="text-gray-400">Manage your team</p>
          </div>
          <div
            className="bg-gray-900 p-6 rounded-xl cursor-pointer hover:bg-gray-800"
            onClick={() => router.push('/dashboard/appointments')}
          >
            <h2 className="text-white text-xl font-semibold mb-2">📅 Schedule</h2>
            <p className="text-gray-400">View and manage appointments</p>
          </div>
          <div
            className="bg-gray-900 p-6 rounded-xl cursor-pointer hover:bg-gray-800"
            onClick={() => router.push('/dashboard/revenue')}
          >
            <h2 className="text-white text-xl font-semibold mb-2">💰 Revenue</h2>
            <p className="text-gray-400">Track your earnings</p>
          </div>
        </div>
      </div>
    </main>
  )
}