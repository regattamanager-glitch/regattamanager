"use client";

import { useState } from "react";

export default function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

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
      setLoginPassword("");
      onSuccess();
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
