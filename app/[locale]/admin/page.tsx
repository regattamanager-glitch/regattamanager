"use client";

import React, { useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts";

type ActiveTab = "overview" | "vereine" | "events";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [data, setData] = useState<any>(null);
  const [days, setDays] = useState<string>("30"); // Zustand für den flexiblen Zeitraum
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchAdminData() {
    try {
      setErrorMsg(null);
      const res = await fetch(`/api/admin/data?days=${days}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          "Accept": "application/json"
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP-Fehler! Status: ${res.status}`);
      }

      const json = await res.json();
      if (json && json.success) {
        setData(json);
      } else {
        throw new Error(json?.message || "Die Datenbank hat keine gültigen Daten geliefert.");
      }
    } catch (err: any) {
      console.error("Fehler beim Laden der Admin-Daten:", err);
      setErrorMsg(err.message || "Verbindung zur API fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusToggle(vereinId: string, currentStatus: boolean) {
    setUpdatingId(vereinId);
    try {
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vereinId, isApproved: !currentStatus }),
      });
      if (!res.ok) throw new Error("Fehler beim Senden des Status.");
      
      const json = await res.json();
      if (json.success) {
        setData((prev: any) => {
          if (!prev || !prev.vereine) return prev;
          return {
            ...prev,
            vereine: prev.vereine.map((v: any) => 
              v.id === vereinId ? { ...v, isApproved: !currentStatus } : v
            )
          };
        });
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Status-Update fehlgeschlagen.");
    } finally {
      setUpdatingId(null);
    }
  }

  useEffect(() => {
    fetchAdminData();
  }, [days]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001f3f] flex items-center justify-center text-white">
        <div className="text-xl animate-pulse font-medium">Verbinde mit globaler Regatta Manager API...</div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#001f3f] flex flex-col items-center justify-center p-4 text-white">
        <div className="bg-red-950/40 border border-red-500/50 p-6 rounded-2xl max-w-md w-full text-center shadow-xl">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold mt-3 text-red-400">Ladefehler</h2>
          <p className="text-sm text-slate-300 mt-2 bg-slate-900/50 p-3 rounded-lg font-mono break-words">
            {errorMsg}
          </p>
          <button 
            onClick={() => { setLoading(true); fetchAdminData(); }}
            className="mt-5 bg-[#2563eb] text-white px-5 py-2 rounded-xl font-medium text-sm hover:bg-blue-600 active:scale-95 transition-all"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const { stats, vereine = [], events = [], timeline = [], revenueTimeline = [], eventTimeline = [] } = data || {};
  const totalRevenue = events.reduce((sum: number, e: any) => sum + (e.revenue || 0), 0) || 0;

 const chartDaysSegler = timeline.map((t: any) => t.date);
  const chartZuwachsSegler = timeline.map((t: any) => t.zuwachs);
  const chartDaysRevenue = revenueTimeline.map((r: any) => r.date);
  const chartDailyRevenues = revenueTimeline.map((r: any) => r.revenue);
  const chartDaysEvents = eventTimeline.map((e: any) => e.date);
  const chartEventCount = eventTimeline.map((e: any) => e.count);
  return (
    <div className="flex h-screen bg-[#001f3f] text-slate-200 overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-[#0b3d91] p-6 flex flex-col justify-between border-r border-blue-900/40">
        <div>
          <div className="mb-10">
            <h1 className="text-xl font-bold text-white tracking-wide">Regatta Manager</h1>
            <p className="text-xs text-blue-200">Built by Sailors for Sailors</p>
          </div>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === "overview" ? "bg-[#2563eb] text-white shadow-lg" : "text-blue-100 hover:bg-[#112d5c]"
              }`}
            >
            Dashboard Übersicht
            </button>
            <button
              onClick={() => setActiveTab("vereine")}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === "vereine" ? "bg-[#2563eb] text-white shadow-lg" : "text-blue-100 hover:bg-[#112d5c]"
              }`}
            >
            Vereine verwalten
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === "events" ? "bg-[#2563eb] text-white shadow-lg" : "text-blue-100 hover:bg-[#112d5c]"
              }`}
            >
            Events & Finanzen
            </button>
          </nav>
        </div>
        <div className="text-xs text-blue-300/40 font-mono">Neon.tech Engine Active</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-[#0a192f]">
        
        {/* HEADER MIT ZEITFILTER */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white">
            {activeTab === "overview" && "Dashboard Übersicht"}
            {activeTab === "vereine" && `Vereine verwalten (${vereine.length})`}
            {activeTab === "events" && `Regatta Events & Einnahmen (${events.length})`}
          </h2>

          {/* Der interaktive Zeitraum-Filter */}
          <div className="flex items-center space-x-3 bg-[#112d5c] px-4 py-2 rounded-xl border border-blue-900/40">
            <label htmlFor="timeframe" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Zeitraum:
            </label>
            <select
              id="timeframe"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="bg-[#0a192f] text-white text-sm font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-900/60 cursor-pointer"
            >
              <option value="7">Letzte 7 Tage</option>
              <option value="30">Letzte 30 Tage</option>
              <option value="90">Letzte 90 Tage</option>
              <option value="all">Gesamter Zeitraum (Alles)</option>
            </select>
          </div>
        </div>
        
        {/* ÜBERSICHT TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Registrierte Segler insgesamt</p>
                <p className="text-4xl font-extrabold mt-2 text-blue-400">{stats?.seglerCount || 0}</p>
              </div>
              <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Aktive Vereine</p>
                <p className="text-4xl font-extrabold mt-2 text-emerald-400">{stats?.vereineCount || 0}</p>
              </div>
              <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Online Events</p>
                <p className="text-4xl font-extrabold mt-2 text-purple-400">{stats?.eventsCount || 0}</p>
              </div>
              <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Gesamteinnahmen (€)</p>
                <p className="text-4xl font-extrabold mt-2 text-amber-400">
                  {totalRevenue.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                </p>
              </div>
            </div>

            {/* DIAGRAMMTOPF: Benutzerentwicklung */}
            <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
              <h3 className="text-lg font-semibold text-white mb-4">
                Benutzerentwicklung auf der Seite ({days === "all" ? "Gesamter Verlauf" : `Letzte ${days} Tage`})
              </h3>
              <div className="h-72 w-full bg-[#0a192f]/50 rounded-xl p-2">
  <LineChart
    xAxis={[{ 
      scaleType: "point", 
      data: chartDaysSegler,
      tickLabelStyle: { fill: 'white' }
    }]}
    yAxis={[{
      tickLabelStyle: { fill: 'white' }
    }]}
    series={[{ 
      data: chartZuwachsSegler, 
      color: "#38bdf8", 
      area: true 
    }]}
    height={260}
    sx={{
      "& .MuiChartsAxis-line": { stroke: "white" },
      "& .MuiChartsAxis-tick": { stroke: "white" },
      "& .MuiChartsAxis-tickLabel": { fill: "white" }
    }}
  />
</div>
            </div>

            <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
  <h3 className="mb-4 text-white">Event-Wachstum (Anzahl Events)</h3>
  <LineChart 
    xAxis={[{ 
      scaleType: "point", 
      data: chartDaysEvents,
      tickLabelStyle: { fill: 'white' } // X-Achse weiß
    }]} 
    yAxis={[{
      tickLabelStyle: { fill: 'white' } // Y-Achse weiß
    }]}
    series={[{ 
      data: chartEventCount, 
      color: "#a855f7", 
      area: true 
    }]} 
    height={200}
    sx={{
      // Optional: Falls du die Achsenlinien selbst auch weiß willst
      "& .MuiChartsAxis-line": { stroke: "white" },
      "& .MuiChartsAxis-tick": { stroke: "white" },
    }}
  />
</div>
          </div>
        )}

        {/* VEREINE TAB */}
        {activeTab === "vereine" && (
          <div className="space-y-6">
            <div className="bg-[#112d5c] rounded-2xl overflow-hidden border border-blue-900/40">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0b3d91] text-blue-100 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Vereinsname</th>
                    <th className="p-4">Kürzel</th>
                    <th className="p-4">E-Mail</th>
                    <th className="p-4">Stripe-Konto ID</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30 text-sm text-slate-300">
                  {vereine.map((v: any) => (
                    <tr key={v.id} className="hover:bg-[#0b3d91]/20 transition-colors">
                      <td className="p-4 font-medium text-white">{v.name || "Kein Name"}</td>
                      <td className="p-4 font-mono text-xs text-blue-300">{v.kuerzel || "-"}</td>
                      <td className="p-4 text-slate-400">{v.email}</td>
                      <td className="p-4 font-mono text-xs text-slate-400">{v.stripeAccountId || "Nicht verknüpft"}</td>
                      <td className="p-4 text-center">
                        <button
                          disabled={updatingId === v.id}
                          onClick={() => handleStatusToggle(v.id, v.isApproved)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                            v.isApproved 
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/40" 
                              : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                          }`}
                        >
                          {updatingId === v.id ? "Speichert..." : v.isApproved ? "✓ Freigeschaltet" : "⏳ Gesperrt"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <div className="space-y-6">
            {/* Umsatzverlauf bleibt als visuelle Gedankenstütze auch hier drin */}
            <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
              <h3 className="text-lg font-semibold text-white mb-4">
                Umsatzverlauf ({days === "all" ? "Gesamter Verlauf" : `Letzte ${days} Tage`})
              </h3>
              <div className="h-64 w-full bg-[#0a192f]/50 rounded-xl p-2">
                <LineChart
                  xAxis={[{ scaleType: "point", data: chartDaysRevenue }]}
                  series={[{ data: chartDailyRevenues, color: "#34d399", area: true }]}
                  height={230}
                />
              </div>
            </div>

            <div className="bg-[#112d5c] rounded-2xl overflow-hidden border border-blue-900/40">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0b3d91] text-blue-100 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Regattaname</th>
                    <th className="p-4">Zeitraum</th>
                    <th className="p-4 text-right">Einnahmen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30 text-sm text-slate-300">
                  {events.map((e: any) => (
                    <tr key={e.id} className="hover:bg-[#0b3d91]/20 transition-colors">
                      <td className="p-4 font-semibold text-white">{e.name}</td>
                      <td className="p-4 text-slate-400">
                        {e.datumVon ? new Date(e.datumVon).toLocaleDateString("de-DE") : "-"} - {e.datumBis ? new Date(e.datumBis).toLocaleDateString("de-DE") : "-"}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-400">
                        {e.revenue?.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}