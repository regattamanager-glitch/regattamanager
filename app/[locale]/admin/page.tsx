"use client";

import React, { useEffect, useState } from "react";

type ActiveTab = "overview" | "segler" | "vereine" | "events";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
    async function fetchAdminData() {
      try {
        const res = await fetch("/api/admin/data");
        const json = await res.json();
        if (json.success) setData(json);
      } catch (err) {
        console.error("Fehler beim Laden der Dashboard-Daten:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, []); // <-- So ist es syntaktisch korrekt

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001f3f] flex items-center justify-center text-white font-sans">
        <div className="text-xl animate-pulse">Lade Regatta Manager Live-Daten...</div>
      </div>
    );
  }

  const { stats, segler, vereine, events } = data || {};

  return (
    <div className="flex h-screen bg-[#001f3f] text-slate-200 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 bg-[#0b3d91] p-6 flex flex-col justify-between border-r border-blue-900/30">
        <div>
          <div className="mb-8">
            <h1 className="text-xl font-bold text-white tracking-wide">Regatta Manager</h1>
            <p className="text-xs text-blue-200">Built by Sailors for Sailors</p>
          </div>
          
          <nav className="space-y-2">
            {(["overview", "segler", "vereine", "events"] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab
                    ? "bg-[#2563eb] text-white shadow-lg shadow-blue-600/20"
                    : "text-blue-100 hover:bg-[#112d5c] hover:text-white"
                }`}
              >
                {tab === "overview" && "🔮 Übersicht"}
                {tab === "segler" && "🧑‍✈️ Segler"}
                {tab === "vereine" && "🏢 Vereine"}
                {tab === "events" && "📅 Events"}
              </button>
            ))}
          </nav>
        </div>
        <div className="text-xs text-blue-300/60 font-mono">Status: Connected to Neon DB</div>
      </div>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-[#0a192f]">
        
        {/* TAB: ÜBERSICHT */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white">Dashboard Übersicht</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Registrierte Segler</p>
                <p className="text-4xl font-extrabold mt-2 text-blue-400">{stats?.seglerCount}</p>
              </div>
              <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Vereine / Clubs</p>
                <p className="text-4xl font-extrabold mt-2 text-emerald-400">{stats?.vereineCount}</p>
              </div>
              <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Geplante Events</p>
                <p className="text-4xl font-extrabold mt-2 text-purple-400">{stats?.eventsCount}</p>
              </div>
              <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
                <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Davon Test-User</p>
                <p className="text-4xl font-extrabold mt-2 text-amber-400">{stats?.testCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SEGLER */}
        {activeTab === "segler" && (
          <div className="space-y-4">
            <h2 class="text-2xl font-bold text-white">Segler Datenbank ({segler?.length})</h2>
            <div className="bg-[#112d5c] rounded-2xl overflow-hidden border border-blue-900/40 shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0b3d91] text-blue-100 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Name</th>
                    <th className="p-4">E-Mail</th>
                    <th className="p-4">Nation</th>
                    <th className="p-4">Geburtsdatum</th>
                    <th className="p-4">Typ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30 text-sm text-slate-300">
                  {segler?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#0b3d91]/30 transition-colors">
                      <td className="p-4 font-medium text-white">{s.vorname} {s.nachname}</td>
                      <td className="p-4 text-slate-400">{s.email}</td>
                      <td className="p-4">
                        <span className="bg-[#0a192f] px-2.5 py-1 rounded-md text-xs font-mono text-blue-300">{s.nation}</span>
                      </td>
                      <td className="p-4 text-slate-400">
                        {s.geburtsdatum ? new Date(s.geburtsdatum).toLocaleDateString("de-DE") : "-"}
                      </td>
                      <td className="p-4">
                        {s.test ? (
                          <span className="text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full text-xs font-medium">Test</span>
                        ) : (
                          <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full text-xs font-medium">Live</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: VEREINE */}
        {activeTab === "vereine" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Registrierte Vereine ({vereine?.length})</h2>
            <div className="bg-[#112d5c] rounded-2xl overflow-hidden border border-blue-900/40 shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0b3d91] text-blue-100 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Vereinsname</th>
                    <th className="p-4">Kürzel</th>
                    <th className="p-4">E-Mail</th>
                    <th className="p-4">Adresse</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30 text-sm text-slate-300">
                  {vereine?.map((v: any) => (
                    <tr key={v.id} className="hover:bg-[#0b3d91]/30 transition-colors">
                      <td className="p-4 font-medium text-white">{v.name}</td>
                      <td className="p-4 font-mono text-xs text-blue-300">{v.kuerzel}</td>
                      <td className="p-4 text-slate-400">{v.email}</td>
                      <td className="p-4 text-slate-400 max-w-xs truncate">{v.adresse}</td>
                      <td className="p-4">
                        {v.isApproved ? (
                          <span className="text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full text-xs font-medium">✓ Aktiv</span>
                        ) : (
                          <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full text-xs font-medium">⏳ Offen</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: EVENTS */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Regatta Regalkalender ({events?.length})</h2>
            <div className="bg-[#112d5c] rounded-2xl overflow-hidden border border-blue-900/40 shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0b3d91] text-blue-100 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Event Name</th>
                    <th className="p-4">Startdatum</th>
                    <th className="p-4">Enddatum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30 text-sm text-slate-300">
                  {events?.map((e: any) => (
                    <tr key={e.id} className="hover:bg-[#0b3d91]/30 transition-colors">
                      <td className="p-4 font-semibold text-emerald-400">{e.name}</td>
                      <td className="p-4 text-slate-300">{new Date(e.datumVon).toLocaleDateString("de-DE")}</td>
                      <td className="p-4 text-slate-300">{new Date(e.datumBis).toLocaleDateString("de-DE")}</td>
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
