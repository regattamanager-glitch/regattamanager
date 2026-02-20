"use client";
import { useState } from "react";
import { Link, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"login" | "code">("login");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/accounts/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, passwort }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      alert(data.message || t("errorLoginFailed"));
      return;
    }

    // ➜ Wechsel zur Code-Eingabe 
    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/accounts/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      alert(t("errorInvalidCode"));
      return;
    }

    // ➜ Weiterleitung nach Account-Typ
    if (data.type === "segler") {
      router.replace(`/dashboard/segler/${data.id}`);
    } else {
      router.replace(`/dashboard/verein/${data.id}`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      {/* Hintergrund kommt aus deinem Layout */}

      {/* ================= LOGIN ================= */}
      {step === "login" && (
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-6 bg-blue-900/30 backdrop-blur-md p-14 rounded-3xl shadow-xl w-[400px] sm:w-[450px]"
        >
          <h2 className="text-4xl font-bold text-white text-center">
            {t("loginTitle")}
          </h2>

          <input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-4 rounded-xl border border-white/50 bg-white/20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            placeholder={t("passwordPlaceholder")}
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            className="p-4 rounded-xl border border-white/50 bg-white/20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700/70 hover:bg-blue-800/70 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors"
          >
            {loading ? t("checkingLoading") : t("loginButton")}
          </button>
        </form>
      )}

      {/* ================= SECURITY CODE ================= */}
      {step === "code" && (
        <form
          onSubmit={handleVerifyCode}
          className="flex flex-col gap-6 bg-blue-900/30 backdrop-blur-md p-14 rounded-3xl shadow-xl w-[400px] sm:w-[450px]"
        >
          <h2 className="text-3xl font-bold text-white text-center">
            {t("verifyCodeTitle")}
          </h2>

          <p className="text-white/80 text-center text-sm">
            {t("verifyCodeDescription")}
          </p>

          <input
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="p-4 rounded-xl border border-white/50 bg-white/20 text-white placeholder-white text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700/70 hover:bg-blue-800/70 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors"
          >
            {loading ? t("verifyingLoading") : t("confirmButton")}
          </button>
        </form>
      )}
    </div>
  );
}