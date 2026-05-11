export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-6">
      <h1 className="text-white text-6xl font-bold">Tidly</h1>
      <p className="text-gray-400 text-lg">Business management for cleaning companies</p>
      <div className="flex gap-4 mt-4">
        <a 
          href="/login" 
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-500 font-semibold"
        >
          Log In
        </a>
        <a 
          href="/login" 
          className="bg-gray-700 text-white px-8 py-3 rounded-lg hover:bg-gray-600 font-semibold"
        >
          Sign Up
        </a>
      </div>
    </main>
  )
}