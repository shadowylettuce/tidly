"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Workers() {
  const [Workers, setWorkers] = useState([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [hourly_rate, sethourly_rate] = useState("");
  const [loading, setLoading] = useState(false); // This lets the user know something is happening since it changes the button text to "Adding..."
  const router = useRouter(); // Gives access to Next.js's navigation system which enables to programmatically to move between pages

  useEffect(() => {
    fetchWorkers();
  }, []);
  // This is just saying as soon as the page opens, go grab workers from the database

  async function fetchWorkers() {
    const { data, error } = await supabase.from("workers").select("*");
    if (data) setWorkers(data);
  }

  async function addWorker() {
    setLoading(true);
    const { error } = await supabase.from("workers").insert({
      name,
      phone,
      hourly_rate,
    });
    if (!error) {
      setName("");
      setPhone("");
      sethourly_rate("");
      fetchWorkers();
    }
    setLoading(false);
  }

  async function deleteWorker(id) {
    // Async means a function is asynchronous: it takes time to complete, w/o JS would throw an error
    const confirmed = window.confirm(
      "Are you sure you want to delete this worker?",
    );
    if (!confirmed) return;
    await supabase.from("workers").delete().eq("id", id);
    fetchWorkers();
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Workers</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push("/dashboard")}
          >
            ← Back
          </button>
        </div>

        {/* Add Worker Form */}
        <div className="bg-gray-900 p-6 rounded-xl mb-8 flex flex-col gap-4">
          <h2 className="text-white text-xl font-semibold">Add New Worker</h2>
          <input
            className="bg-gray-800 text-white p-3 rounded-lg outline-none"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="bg-gray-800 text-white p-3 rounded-lg outline-none"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <input
            className="bg-gray-800 text-white p-3 rounded-lg outline-none"
            placeholder="hourly rate"
            value={hourly_rate}
            onChange={(e) => sethourly_rate(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500"
            onClick={addWorker}
          >
            {loading ? "Adding..." : "Add Worker"}
          </button>
        </div>

        {/* Worker List */}
        <div className="flex flex-col gap-4">
          {Workers.map((workers) => (
            <div
              key={workers.id}
              className="bg-gray-900 p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="text-white font-semibold">{workers.name}</p>
                <p className="text-gray-400 text-sm">{workers.phone}</p>
                <p className="text-gray-400 text-sm">{workers.hourly_rate}</p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-500 text-sm"
                  onClick={() => router.push(`/dashboard/workers/${workers.id}`)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-500 text-sm"
                  onClick={() => deleteWorker(workers.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
