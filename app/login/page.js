'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  async function handleSignUp() {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
      <h1 className="text-white text-4xl font-bold">Tidly</h1>
      <div className="bg-gray-900 p-8 rounded-xl flex flex-col gap-4 w-80">
        <input
          className="bg-gray-800 text-white p-3 rounded-lg outline-none"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="bg-gray-800 text-white p-3 rounded-lg outline-none"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500"
          onClick={handleLogin}
        >
          {loading ? 'Loading...' : 'Log In'}
        </button>
        <button
          className="bg-gray-700 text-white p-3 rounded-lg hover:bg-gray-600"
          onClick={handleSignUp}
        >
          Sign Up
        </button>
      </div>
    </main>
  )
}