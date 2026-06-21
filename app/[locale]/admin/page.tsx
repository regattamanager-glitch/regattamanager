"use client";

import React, { useCallback, useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts";

type ActiveTab = "overview" | "vereine" | "federations" | "events";

interface VereinRow {
  id: string;
  name: string | null;
  kuerzel: string | null;
  email: string | null;
  stripeAccountId: string | null;
  isApproved: boolean;
}

interface FederationRow {
  id: string;
  name: string | null;
  kuerzel: string | null;
  email: string | null;
  region: string | null;
  isApproved: boolean;
}

interface EventRow {
  id: string;
  name: string | null;
  datumVon: string | null;
  datumBis: string | null;
  revenue: number;
}

interface AdminData {
  success: boolean;
  stats: { seglerCount: number; vereineCount: number; eventsCount: number; federationsCount?: number };
  vereine: VereinRow[];
  federations: FederationRow[];
  events: EventRow[];
  timeline: { date: string; zuwachs: number }[];
  revenueTimeline: { date: string; revenue: number }[];
  eventTimeline: { date: string; count: number }[];
}

// Einheitliches Chart-Styling (weiße Achsen/Labels auf dunklem Grund)
const chartSx = {
  "& .MuiChartsAxis-line": { stroke: "white" },
  "& .MuiChartsAxis-tick": { stroke: "white" },
  "& .MuiChartsAxis-tickLabel": { fill: "white" },
} as const;

function formatEUR(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("de-DE");
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [data, setData] = useState<AdminData | null>(null);
  const [days, setDays] = useState<string>("30");
  const [loading, setLoading] = useState(true); // Nur für den allerersten Ladevorgang
  const [refreshing, setRefreshing] = useState(false); // Für Zeitraum-Wechsel
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Admin-Login-Formular
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const fetchAdminData = useCallback(async (selectedDays: string, isFirstLoad: boolean) => {
    if (isFirstLoad) setLoading(true);
    else setRefreshing(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/data?days=${selectedDays}`, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (res.status === 401 || res.status === 403) {
        setForbidden(true);
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP-Fehler! Status: ${res.status}`);
      }

      const json = await res.json();
      if (json && json.success) {
        setForbidden(false);
        setData(json as AdminData);
      } else {
        throw new Error(json?.message || "Die Datenbank hat keine gültigen Daten geliefert.");
      }
    } catch (err) {
      console.error("Fehler beim Laden der Admin-Daten:", err);
      setErrorMsg(err instanceof Error ? err.message : "Verbindung zur API fehlgeschlagen.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // isFirstLoad nur, solange noch keine Daten vorliegen
    fetchAdminData(days, data === null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, fetchAdminData]);

  async function handleStatusToggle(
    id: string,
    currentStatus: boolean,
    kind: "verein" | "federation"
  ) {
    setUpdatingId(id);

    // Optimistisches Update (passende Liste)
    const applyStatus = (status: boolean) =>
      setData((prev) => {
        if (!prev) return prev;
        if (kind === "verein") {
          return {
            ...prev,
            vereine: prev.vereine.map((v) => (v.id === id ? { ...v, isApproved: status } : v)),
          };
        }
        return {
          ...prev,
          federations: prev.federations.map((f) =>
            f.id === id ? { ...f, isApproved: status } : f
          ),
        };
      });

    applyStatus(!currentStatus);

    try {
      const payload =
        kind === "verein"
          ? { vereinId: id, isApproved: !currentStatus }
          : { federationId: id, isApproved: !currentStatus };
      const res = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Status-Update fehlgeschlagen.");
      }
    } catch (err) {
      applyStatus(currentStatus); // Rollback
      alert(err instanceof Error ? err.message : "Status-Update fehlgeschlagen.");
    } finally {
      setUpdatingId(null);
    }
  }

  // --- Zustände: Erst-Ladevorgang ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#001f3f] flex items-center justify-center text-white">
        <div className="text-xl animate-pulse font-medium">
          Verbinde mit globaler Regatta Manager API...
        </div>
      </div>
    );
  }

  // --- Zustand: Kein Admin-Zugriff → Admin-Login-Formular ---
  if (forbidden) {
    const handleAdminLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError(null);
      setLoggingIn(true);
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json.message || "Login fehlgeschlagen.");
        }
        // Erfolg: Daten laden
        setForbidden(false);
        setLoginPassword("");
        fetchAdminData(days, true);
      } catch (err) {
        setLoginError(err instanceof Error ? err.message : "Login fehlgeschlagen.");
      } finally {
        setLoggingIn(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#001f3f] flex flex-col items-center justify-center p-4 text-white">
        <form
          onSubmit={handleAdminLogin}
          className="bg-[#112d5c] border border-blue-900/40 p-8 rounded-2xl max-w-sm w-full shadow-xl"
        >
          <div className="text-center mb-6">
            <span className="text-4xl">🔒</span>
            <h2 className="text-xl font-bold mt-2 text-white">Admin-Login</h2>
            <p className="text-xs text-slate-400 mt-1">Regatta Manager – geschützter Bereich</p>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            E-Mail
          </label>
          <input
            type="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
            className="w-full mb-4 bg-[#0a192f] text-white text-sm rounded-lg px-3 py-2.5 border border-blue-900/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="admin@example.com"
          />

          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Passwort
          </label>
          <input
            type="password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            className="w-full mb-5 bg-[#0a192f] text-white text-sm rounded-lg px-3 py-2.5 border border-blue-900/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />

          {loginError && (
            <p className="text-sm text-red-400 mb-4 text-center">{loginError}</p>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full bg-[#2563eb] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {loggingIn ? "Anmelden..." : "Anmelden"}
          </button>
        </form>
      </div>
    );
  }

  // --- Zustand: Fehler ---
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
            onClick={() => fetchAdminData(days, true)}
            className="mt-5 bg-[#2563eb] text-white px-5 py-2 rounded-xl font-medium text-sm hover:bg-blue-600 active:scale-95 transition-all"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? { seglerCount: 0, vereineCount: 0, eventsCount: 0 };
  const vereine = data?.vereine ?? [];
  const federations = data?.federations ?? [];
  const events = data?.events ?? [];
  const timeline = data?.timeline ?? [];
  const revenueTimeline = data?.revenueTimeline ?? [];
  const eventTimeline = data?.eventTimeline ?? [];
  const totalRevenue = events.reduce((sum, e) => sum + (e.revenue || 0), 0);

  const zeitraumLabel = days === "all" ? "Gesamter Verlauf" : `Letzte ${days} Tage`;

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
            {(
              [
                { key: "overview", label: "Dashboard Übersicht" },
                { key: "vereine", label: "Vereine verwalten" },
                { key: "federations", label: "Föderationen" },
                { key: "events", label: "Events & Finanzen" },
              ] as { key: ActiveTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-[#2563eb] text-white shadow-lg"
                    : "text-blue-100 hover:bg-[#112d5c]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="text-xs text-blue-300/40 font-mono">Neon.tech Engine Active</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-[#0a192f]">
        {/* HEADER MIT ZEITFILTER */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            {activeTab === "overview" && "Dashboard Übersicht"}
            {activeTab === "vereine" && `Vereine verwalten (${vereine.length})`}
            {activeTab === "federations" && `Föderationen verwalten (${federations.length})`}
            {activeTab === "events" && `Regatta Events & Einnahmen (${events.length})`}
            {refreshing && (
              <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
          </h2>

          <div className="flex items-center space-x-3 bg-[#112d5c] px-4 py-2 rounded-xl border border-blue-900/40">
            <label
              htmlFor="timeframe"
              className="text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
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
              <StatCard
                label="Registrierte Segler insgesamt"
                value={String(stats.seglerCount ?? 0)}
                color="text-blue-400"
              />
              <StatCard
                label="Aktive Vereine"
                value={String(stats.vereineCount ?? 0)}
                color="text-emerald-400"
              />
              <StatCard
                label="Online Events"
                value={String(stats.eventsCount ?? 0)}
                color="text-purple-400"
              />
              <StatCard
                label="Gesamteinnahmen (€)"
                value={`${formatEUR(totalRevenue)} €`}
                color="text-amber-400"
              />
            </div>

            {/* Benutzerentwicklung */}
            <ChartCard title={`Benutzerentwicklung auf der Seite (${zeitraumLabel})`}>
              {timeline.length > 0 ? (
                <LineChart
                  xAxis={[{ scaleType: "point", data: timeline.map((t) => t.date) }]}
                  series={[{ data: timeline.map((t) => t.zuwachs), color: "#38bdf8", area: true }]}
                  height={260}
                  sx={chartSx}
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            {/* Event-Wachstum */}
            <ChartCard title="Event-Wachstum (Anzahl Events)">
              {eventTimeline.length > 0 ? (
                <LineChart
                  xAxis={[{ scaleType: "point", data: eventTimeline.map((e) => e.date) }]}
                  series={[{ data: eventTimeline.map((e) => e.count), color: "#a855f7", area: true }]}
                  height={220}
                  sx={chartSx}
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
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
                  {vereine.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Keine Vereine vorhanden.
                      </td>
                    </tr>
                  ) : (
                    vereine.map((v) => (
                      <tr key={v.id} className="hover:bg-[#0b3d91]/20 transition-colors">
                        <td className="p-4 font-medium text-white">{v.name || "Kein Name"}</td>
                        <td className="p-4 font-mono text-xs text-blue-300">{v.kuerzel || "-"}</td>
                        <td className="p-4 text-slate-400">{v.email || "-"}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">
                          {v.stripeAccountId || "Nicht verknüpft"}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            disabled={updatingId === v.id}
                            onClick={() => handleStatusToggle(v.id, v.isApproved, "verein")}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 ${
                              v.isApproved
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/40"
                                : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                            }`}
                          >
                            {updatingId === v.id
                              ? "Speichert..."
                              : v.isApproved
                              ? "✓ Freigeschaltet"
                              : "⏳ Gesperrt"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FÖDERATIONEN TAB */}
        {activeTab === "federations" && (
          <div className="space-y-6">
            <div className="bg-[#112d5c] rounded-2xl overflow-hidden border border-blue-900/40">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0b3d91] text-blue-100 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Föderation</th>
                    <th className="p-4">Kürzel</th>
                    <th className="p-4">Region</th>
                    <th className="p-4">E-Mail</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30 text-sm text-slate-300">
                  {federations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Keine Föderationen vorhanden.
                      </td>
                    </tr>
                  ) : (
                    federations.map((f) => (
                      <tr key={f.id} className="hover:bg-[#0b3d91]/20 transition-colors">
                        <td className="p-4 font-medium text-white">{f.name || "Kein Name"}</td>
                        <td className="p-4 font-mono text-xs text-teal-300">{f.kuerzel || "-"}</td>
                        <td className="p-4 text-slate-400">{f.region || "-"}</td>
                        <td className="p-4 text-slate-400">{f.email || "-"}</td>
                        <td className="p-4 text-center">
                          <button
                            disabled={updatingId === f.id}
                            onClick={() => handleStatusToggle(f.id, f.isApproved, "federation")}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all disabled:opacity-50 ${
                              f.isApproved
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/40"
                                : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/40"
                            }`}
                          >
                            {updatingId === f.id
                              ? "Speichert..."
                              : f.isApproved
                              ? "✓ Freigeschaltet"
                              : "⏳ Gesperrt"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <ChartCard title={`Umsatzverlauf (${zeitraumLabel})`}>
              {revenueTimeline.length > 0 ? (
                <LineChart
                  xAxis={[{ scaleType: "point", data: revenueTimeline.map((r) => r.date) }]}
                  series={[{ data: revenueTimeline.map((r) => r.revenue), color: "#34d399", area: true }]}
                  height={230}
                  sx={chartSx}
                />
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

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
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500">
                        Keine Events vorhanden.
                      </td>
                    </tr>
                  ) : (
                    events.map((e) => (
                      <tr key={e.id} className="hover:bg-[#0b3d91]/20 transition-colors">
                        <td className="p-4 font-semibold text-white">{e.name || "Unbenannt"}</td>
                        <td className="p-4 text-slate-400">
                          {formatDate(e.datumVon)} - {formatDate(e.datumBis)}
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-emerald-400">
                          {formatEUR(e.revenue || 0)} €
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>
      <p className={`text-4xl font-extrabold mt-2 ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#112d5c] p-6 rounded-2xl border border-blue-900/40">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="w-full bg-[#0a192f]/50 rounded-xl p-2">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-56 flex items-center justify-center text-slate-500 text-sm">
      Keine Daten für diesen Zeitraum.
    </div>
  );
}
