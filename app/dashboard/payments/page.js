"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function PaymentsPage() {
  const router = useRouter();

  // ─── STATE ───────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);

  // ─── LIFECYCLE ───────────────────────────────────────────
  useEffect(() => {
    fetchAppointments();
  }, []);

  // ─── DATA FETCHING ────────────────────────────────────────
  async function fetchAppointments() {
    const { data } = await supabase
      .from("appointments")
      .select("id, date, price, status, clients(name), payments(id, amount, paid, paid_date)")
      .order("date", { ascending: false });
    if (data) setAppointments(data);
  }

  function isPaid(apt) {
    const rows = apt.payments;
    if (!rows || !Array.isArray(rows)) return false;
    return rows.some((p) => p.paid === true);
  }

  function paidPayment(apt) {
    const rows = apt.payments;
    if (!rows || !Array.isArray(rows)) return null;
    return rows.find((p) => p.paid === true) ?? null;
  }

  const { unpaidAppointments, paidAppointments } = useMemo(() => {
    const unpaid = [];
    const paid = [];
    for (const apt of appointments) {
      if (isPaid(apt)) paid.push(apt);
      else unpaid.push(apt);
    }
    return { unpaidAppointments: unpaid, paidAppointments: paid };
  }, [appointments]);

  function formatMoney(n) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number.isFinite(Number(n)) ? Number(n) : 0);
  }

  function formatPaidDate(isoOrDate) {
    if (!isoOrDate) return "—";
    try {
      const d =
        typeof isoOrDate === "string"
          ? parseISO(isoOrDate.slice(0, 10))
          : isoOrDate;
      return format(d, "MMM d, yyyy");
    } catch {
      return String(isoOrDate);
    }
  }

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ── HEADER ── */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Payments</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push("/dashboard")}
          >
            ← Back
          </button>
        </div>
        {/* ── END HEADER ── */}

        {/* ── UNPAID ── */}
        <section className="mb-10">
          <h2 className="text-white text-xl font-semibold mb-2">
            Unpaid appointments
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Appointments without a paid payment on file.
          </p>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {unpaidAppointments.length === 0 ? (
              <p className="text-gray-400 p-6 text-center">None right now.</p>
            ) : (
              <ul className="divide-y divide-gray-800">
                {unpaidAppointments.map((apt) => (
                  <li
                    key={apt.id}
                    className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-white font-semibold">
                        {apt.clients?.name ?? "Client"}
                      </p>
                      <p className="text-gray-400 text-sm">{apt.date}</p>
                    </div>
                    <p className="text-red-300 font-semibold sm:text-right">
                      {formatMoney(apt.price)} owed
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
        {/* ── END UNPAID ── */}

        {/* ── PAID ── */}
        <section>
          <h2 className="text-white text-xl font-semibold mb-2">
            Paid appointments
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            Appointments with a recorded payment.
          </p>
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            {paidAppointments.length === 0 ? (
              <p className="text-gray-400 p-6 text-center">None yet.</p>
            ) : (
              <ul className="divide-y divide-gray-800">
                {paidAppointments.map((apt) => {
                  const p = paidPayment(apt);
                  return (
                    <li
                      key={apt.id}
                      className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-white font-semibold">
                          {apt.clients?.name ?? "Client"}
                        </p>
                        <p className="text-gray-400 text-sm">{apt.date}</p>
                      </div>
                      <div className="flex flex-col gap-0.5 sm:items-end">
                        <p className="text-green-400 font-semibold">
                          {formatMoney(p?.amount ?? apt.price)} paid
                        </p>
                        <p className="text-gray-500 text-sm">
                          Paid {formatPaidDate(p?.paid_date)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
        {/* ── END PAID ── */}
      </div>
    </main>
  );
}
