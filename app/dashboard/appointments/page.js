"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAppointments();
    fetchClients();
  }, []);

  async function fetchAppointments() {
    const { data } = await supabase
      .from("appointments")
      .select("*, clients(name, address)") // This is a join, it fetches appointment data along with client data allowing for the use of both tables
      .order("date", { ascending: true });
    if (data) setAppointments(data);
  }

  async function fetchClients() {
    const { data } = await supabase.from("clients").select("*");
    if (data) setClients(data);
  }

  async function addAppointment() {
    setLoading(true);
    const { error } = await supabase.from("appointments").insert({
      client_id: clientId,
      date,
      time,
      price: parseFloat(price),
      notes,
      status: "scheduled",
    });
    if (!error) {
      setClientId("");
      setDate("");
      setTime("");
      setPrice("");
      setNotes("");
      fetchAppointments();
    }
    setLoading(false);
  }

  async function deleteAppointment(id) {
    const confirmed = window.confirm("Delete this appointment?");
    if (!confirmed) return;
    await supabase.from("appointments").delete().eq("id", id);
    fetchAppointments();
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Schedule</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push("/dashboard")}
          >
            ← Back
          </button>
        </div>

        {/* Add Appointment Form */}
        <div className="bg-gray-900 p-6 rounded-xl mb-8 flex flex-col gap-4">
          <h2 className="text-white text-xl font-semibold">
            Schedule Appointment
          </h2>
          <select
            className="bg-gray-800 text-white p-3 rounded-lg outline-none"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select a client...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <input
            className="bg-gray-800 text-white p-3 rounded-lg outline-none"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            className="bg-gray-800 text-white p-3 rounded-lg outline-none"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <input
            className="bg-gray-800 text-white p-3 rounded-lg outline-none"
            placeholder="Price ($)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <input
            className="bg-gray-800 text-white p-3 rounded-lg outline-none"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500"
            onClick={addAppointment}
          >
            {loading ? "Scheduling..." : "Schedule Appointment"}
          </button>
        </div>

        {/* Appointment List */}
        <div className="flex flex-col gap-4">
          {appointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-gray-900 p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <p className="text-white font-semibold">{apt.clients?.name}</p>
                <p className="text-gray-400 text-sm">
                  {apt.date} at {apt.time}
                </p>
                <p className="text-gray-400 text-sm">{apt.clients?.address}</p>
                {apt.notes && (
                  <p className="text-gray-500 text-sm italic">{apt.notes}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-green-400 font-semibold">
                  ${apt.price}
                </span>
                <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
                  {apt.status}
                </span>
                <div className="flex gap-2 items-center">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-500 text-sm"
                    onClick={() =>
                      router.push(`/dashboard/appointments/${apt.id}`)
                    }
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-500 text-sm"
                    onClick={() => deleteAppointment(apt.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
