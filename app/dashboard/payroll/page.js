"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";
import {
  eachDayOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from "date-fns";

export default function PayrollPage() {
  const router = useRouter();

  // ─── STATE ───────────────────────────────────────────────
  const [workers, setWorkers] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [logWorkerId, setLogWorkerId] = useState("");
  const [logDate, setLogDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  );
  const [logHours, setLogHours] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [hourDrafts, setHourDrafts] = useState({});
  const [updatingKey, setUpdatingKey] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [updateHoursOpen, setUpdateHoursOpen] = useState(false);
  const [expandedWorkerId, setExpandedWorkerId] = useState(null);

  // ─── WEEK RANGE (Monday–Sunday) ──────────────────────────
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  // ─── LIFECYCLE ───────────────────────────────────────────
  useEffect(() => {
    fetchWorkers();
  }, []);

  useEffect(() => {
    fetchTimesheetsForWeek();
  }, [weekStartStr, weekEndStr]);

  // ─── DATA FETCHING ────────────────────────────────────────
  async function fetchWorkers() {
    const { data, error } = await supabase
      .from("workers")
      .select("id, name, phone, hourly_rate")
      .order("name", { ascending: true });
    if (error) return;
    if (data) setWorkers(data);
  }

  async function fetchTimesheetsForWeek() {
    const { data, error } = await supabase
      .from("timesheets")
      .select("id, worker_id, hours_worked, date")
      .gte("date", weekStartStr)
      .lte("date", weekEndStr);
    if (error) return;
    if (data) setTimesheets(data);
  }

  // ─── DERIVED: WEEKLY SUMMARY ─────────────────────────────
  const weeklyRows = useMemo(() => {
    return workers.map((w) => {
      const totalHours = timesheets
        .filter((t) => t.worker_id === w.id)
        .reduce((sum, t) => sum + Number(t.hours_worked || 0), 0);
      const rate = Number(w.hourly_rate || 0);
      const weeklyPay = totalHours * rate;
      return {
        id: w.id,
        name: w.name,
        hourlyRate: rate,
        totalHours,
        weeklyPay,
      };
    });
  }, [workers, timesheets]);

  const totalPayrollCost = useMemo(
    () => weeklyRows.reduce((sum, row) => sum + row.weeklyPay, 0),
    [weeklyRows],
  );

  const dayGroups = useMemo(() => {
    const nameById = Object.fromEntries(workers.map((w) => [w.id, w.name]));
    const map = new Map();
    for (const t of timesheets) {
      const groupKey = `${t.worker_id}|${t.date}`;
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          worker_id: t.worker_id,
          date: t.date,
          workerName: nameById[t.worker_id] || "Unknown",
          rowIds: [],
          totalHours: 0,
        });
      }
      const g = map.get(groupKey);
      g.rowIds.push(t.id);
      g.totalHours += Number(t.hours_worked || 0);
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.workerName.localeCompare(b.workerName);
    });
  }, [timesheets, workers]);

  const dayGroupByKey = useMemo(
    () => new Map(dayGroups.map((g) => [g.groupKey, g])),
    [dayGroups],
  );

  const weekDates = useMemo(() => {
    const start = parseISO(weekStartStr);
    const end = parseISO(weekEndStr);
    return eachDayOfInterval({ start, end }).map((d) => ({
      date: format(d, "yyyy-MM-dd"),
      label: format(d, "EEE, MMM d"),
    }));
  }, [weekStartStr, weekEndStr]);

  function resolveDayGroup(workerId, dateStr) {
    const groupKey = `${workerId}|${dateStr}`;
    const existing = dayGroupByKey.get(groupKey);
    if (existing) return existing;
    const w = workers.find((x) => x.id === workerId);
    return {
      groupKey,
      worker_id: workerId,
      date: dateStr,
      workerName: w?.name || "Unknown",
      rowIds: [],
      totalHours: 0,
    };
  }

  // ─── ACTIONS ──────────────────────────────────────────────
  async function handleLogHours(e) {
    e.preventDefault();
    setFormError(null);

    if (!logWorkerId) {
      setFormError("Select a worker.");
      return;
    }
    const hoursNum = Number(logHours);
    if (!logHours || Number.isNaN(hoursNum) || hoursNum <= 0) {
      setFormError("Enter a valid number of hours.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("timesheets").insert({
      worker_id: logWorkerId,
      date: logDate,
      hours_worked: hoursNum,
    });
    setSubmitting(false);

    if (error) {
      setFormError(error.message || "Could not save timesheet.");
      return;
    }

    setLogHours("");
    await fetchTimesheetsForWeek();
  }

  async function handleUpdateDayGroup(group) {
    const { groupKey, rowIds, totalHours, worker_id, date } = group;
    setUpdateError(null);
    const raw = hourDrafts[groupKey] ?? String(totalHours);
    const hoursNum = Number(raw);
    if (raw === "" || Number.isNaN(hoursNum) || hoursNum < 0) {
      setUpdateError("Enter a valid number of hours (0 or greater).");
      return;
    }

    setUpdatingKey(groupKey);
    let error = null;

    if (hoursNum === 0) {
      if (rowIds.length === 0) {
        setUpdatingKey(null);
        return;
      }
      const { error: delErr } = await supabase
        .from("timesheets")
        .delete()
        .in("id", rowIds);
      error = delErr;
    } else if (rowIds.length === 0) {
      const { error: insErr } = await supabase.from("timesheets").insert({
        worker_id,
        date,
        hours_worked: hoursNum,
      });
      error = insErr;
    } else if (rowIds.length === 1) {
      const { error: e } = await supabase
        .from("timesheets")
        .update({ hours_worked: hoursNum })
        .eq("id", rowIds[0]);
      error = e;
    } else {
      const rest = rowIds.slice(1);
      const { error: delErr } = await supabase
        .from("timesheets")
        .delete()
        .in("id", rest);
      if (delErr) {
        error = delErr;
      } else {
        const { error: upErr } = await supabase
          .from("timesheets")
          .update({ hours_worked: hoursNum })
          .eq("id", rowIds[0]);
        error = upErr;
      }
    }

    setUpdatingKey(null);

    if (error) {
      setUpdateError(error.message || "Could not update timesheet.");
      return;
    }

    setHourDrafts((prev) => {
      const next = { ...prev };
      delete next[groupKey];
      return next;
    });
    await fetchTimesheetsForWeek();
  }

  function toggleWorkerExpand(workerId) {
    setExpandedWorkerId((prev) => (prev === workerId ? null : workerId));
  }

  function formatMoney(n) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number.isFinite(n) ? n : 0);
  }

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* ── HEADER ── */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl font-bold">Payroll</h1>
          <button
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
            onClick={() => router.push("/dashboard")}
          >
            ← Back
          </button>
        </div>
        {/* ── END HEADER ── */}

        {/* ── WORKERS LIST ── */}
        <section className="mb-8">
          <h2 className="text-white text-xl font-semibold mb-4">Workers</h2>
          <div className="bg-gray-900 rounded-xl divide-y divide-gray-800">
            {workers.length === 0 ? (
              <p className="text-gray-400 p-6">No workers yet.</p>
            ) : (
              workers.map((w) => (
                <div
                  key={w.id}
                  className="flex justify-between items-center p-4 gap-4"
                >
                  <div>
                    <p className="text-white font-semibold">{w.name}</p>
                    {w.phone ? (
                      <p className="text-gray-500 text-sm">{w.phone}</p>
                    ) : null}
                  </div>
                  <p className="text-gray-300 shrink-0">
                    {formatMoney(Number(w.hourly_rate || 0))}
                    <span className="text-gray-500 text-sm"> /hr</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
        {/* ── END WORKERS LIST ── */}

        {/* ── LOG HOURS FORM ── */}
        <section className="mb-8">
          <h2 className="text-white text-xl font-semibold mb-4">Log hours</h2>
          <form
            onSubmit={handleLogHours}
            className="bg-gray-900 p-6 rounded-xl flex flex-col gap-4"
          >
            <label className="flex flex-col gap-2">
              <span className="text-gray-400 text-sm">Worker</span>
              <select
                className="bg-gray-800 text-white p-3 rounded-lg outline-none border border-gray-700"
                value={logWorkerId}
                onChange={(e) => setLogWorkerId(e.target.value)}
              >
                <option value="">Select worker…</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-gray-400 text-sm">Date</span>
              <input
                type="date"
                className="bg-gray-800 text-white p-3 rounded-lg outline-none border border-gray-700"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-gray-400 text-sm">Hours worked</span>
              <input
                type="number"
                min="0"
                step="0.25"
                placeholder="e.g. 8"
                className="bg-gray-800 text-white p-3 rounded-lg outline-none border border-gray-700"
                value={logHours}
                onChange={(e) => setLogHours(e.target.value)}
              />
            </label>
            {formError ? (
              <p className="text-red-400 text-sm">{formError}</p>
            ) : null}
            <button
              type="submit"
              disabled={submitting || workers.length === 0}
              className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Saving…" : "Save timesheet"}
            </button>
          </form>
        </section>
        {/* ── END LOG HOURS FORM ── */}

        {/* ── THIS WEEK (summary + update hours) ── */}
        <section className="mb-8">
          <h2 className="text-white text-xl font-semibold mb-2">This week</h2>
          <p className="text-gray-500 text-sm mb-4">{weekLabel}</p>
          <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium text-right">Hours</th>
                    <th className="p-4 font-medium text-right">Rate</th>
                    <th className="p-4 font-medium text-right">Weekly pay</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-gray-400 text-center"
                      >
                        Add workers to see payroll summary.
                      </td>
                    </tr>
                  ) : (
                    weeklyRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-800 last:border-0"
                      >
                        <td className="p-4 text-white font-medium">
                          {row.name}
                        </td>
                        <td className="p-4 text-right text-gray-300">
                          {row.totalHours.toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-gray-400">
                          {formatMoney(row.hourlyRate)}
                        </td>
                        <td className="p-4 text-right text-white">
                          {formatMoney(row.weeklyPay)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {weeklyRows.length > 0 ? (
              <div className="border-t border-gray-800 p-4 flex justify-between items-center bg-gray-950/50">
                <span className="text-gray-300 font-semibold">
                  Total payroll (this week)
                </span>
                <span className="text-green-400 font-bold text-lg">
                  {formatMoney(totalPayrollCost)}
                </span>
              </div>
            ) : null}

            {workers.length > 0 ? (
              <div className="border-t border-gray-800 bg-gray-950/30 p-4">
                <button
                  type="button"
                  className="w-full rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    setUpdateHoursOpen((open) => {
                      const next = !open;
                      if (!next) setExpandedWorkerId(null);
                      return next;
                    });
                  }}
                >
                  {updateHoursOpen ? "Hide update hours" : "Update hours"}
                </button>

                {updateHoursOpen ? (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-gray-500">
                      This week ({weekLabel}). Open a worker to change hours by
                      day. Save clears duplicate rows for that day into one
                      total.
                    </p>
                    {updateError ? (
                      <p className="text-sm text-red-400">{updateError}</p>
                    ) : null}

                    <div className="space-y-2">
                      {workers.map((w) => {
                        const row = weeklyRows.find((r) => r.id === w.id);
                        const total = row?.totalHours ?? 0;
                        const open = expandedWorkerId === w.id;
                        return (
                          <div
                            key={w.id}
                            className="overflow-hidden rounded-lg border border-gray-800 bg-gray-900"
                          >
                            <button
                              type="button"
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-white transition-colors hover:bg-gray-800/60"
                              onClick={() => toggleWorkerExpand(w.id)}
                            >
                              <span className="font-semibold">{w.name}</span>
                              <span className="flex shrink-0 items-center gap-2 text-sm text-gray-400">
                                <span>{total.toFixed(2)} hr this week</span>
                                <svg
                                  className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                  aria-hidden
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            </button>

                            {open ? (
                              <div className="space-y-2 border-t border-gray-800 bg-gray-950/50 p-3">
                                {weekDates.map(({ date, label }) => {
                                  const g = resolveDayGroup(w.id, date);
                                  return (
                                    <div
                                      key={date}
                                      className="flex flex-col gap-3 rounded-lg border border-gray-800 bg-gray-900 p-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                      <span className="text-sm font-medium text-gray-300">
                                        {label}
                                      </span>
                                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.25"
                                          className="w-full rounded-lg border border-gray-700 bg-gray-800 p-3 text-white outline-none sm:w-28"
                                          value={
                                            hourDrafts[g.groupKey] ??
                                            String(g.totalHours)
                                          }
                                          onChange={(e) =>
                                            setHourDrafts((prev) => ({
                                              ...prev,
                                              [g.groupKey]: e.target.value,
                                            }))
                                          }
                                          disabled={updatingKey === g.groupKey}
                                        />
                                        <button
                                          type="button"
                                          className="rounded-lg bg-blue-600 px-4 py-3 text-sm text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:shrink-0"
                                          onClick={() =>
                                            handleUpdateDayGroup(g)
                                          }
                                          disabled={
                                            updatingKey === g.groupKey
                                          }
                                        >
                                          {updatingKey === g.groupKey
                                            ? "Saving…"
                                            : "Save"}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>
        {/* ── END THIS WEEK ── */}
      </div>
    </main>
  );
}
