"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

export default function RegisterFederation() {
  const t = useTranslations("Auth");
  const router = useRouter();

  const [name, setName] = useState("");
  const [kuerzel, setKuerzel] = useState("");
  const [region, setRegion] = useState("");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [confirmPasswort, setConfirmPasswort] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (step === "form") {
      if (!name || !kuerzel || !region || !email || !passwort || !confirmPasswort) {
        setMessage(t("errorFields"));
        return;
      }
      if (passwort !== confirmPasswort) {
        setMessage(t("errorPasswordMismatch"));
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/accounts/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "federation", name, kuerzel, region, email, passwort }),
        });
        const data = await res.json();
        setLoading(false);

        if (data.success) {
          setMessage(t("verifyCodeSent"));
          setStep("verify");
        } else {
          setMessage(data.message || t("errorAccountCreation"));
        }
      } catch (error) {
        console.error(error);
        setLoading(false);
        setMessage(t("errorAccountCreation"));
      }
    }

    if (step === "verify") {
      if (!code) {
        setMessage(t("errorEmptyCode"));
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/accounts/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        const data = await res.json();
        setLoading(false);

        if (!data.success) {
          setMessage(data.message || t("errorInvalidCode"));
          return;
        }

        setMessage(t("verifySuccess"));
        // Föderationen müssen vom Admin freigegeben werden -> Warteseite.
        router.refresh();
        setTimeout(() => {
          router.replace(`/dashboard/pending-approval`);
        }, 100);
      } catch (error) {
        console.error(error);
        setLoading(false);
        setMessage(t("errorVerification"));
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-blue-900/30 backdrop-blur-md p-14 rounded-3xl shadow-xl w-[400px] sm:w-[450px]"
      >
        {step === "form" && (
          <>
            <h1 className="text-4xl font-bold text-white text-center mb-4">
              {t("registerFederationTitle")}
            </h1>

            <input
              type="text"
              placeholder={t("vereinNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-4 rounded-xl border border-white/50 bg-white/20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder={t("kuerzelPlaceholder")}
              value={kuerzel}
              onChange={(e) => setKuerzel(e.target.value)}
              className="p-4 rounded-xl border border-white/50 bg-white/20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder={t("regionPlaceholder")}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="p-4 rounded-xl border border-white/50 bg-white/20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
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
            <input
              type="password"
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPasswort}
              onChange={(e) => setConfirmPasswort(e.target.value)}
              className="p-4 rounded-xl border border-white/50 bg-white/20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="bg-teal-700/50 hover:bg-teal-600/80 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? t("creatingAccountLoading") : t("createAccountButton")}
            </button>
          </>
        )}

        {step === "verify" && (
          <>
            <h1 className="text-3xl font-bold text-white text-center">
              {t("verifyCodeTitle")}
            </h1>
            <p className="text-white/80 text-center text-sm">
              {t("verifyCodeDescription")}
            </p>
            <input
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="p-4 rounded-xl border border-white/50 bg-white/20 text-white placeholder-white text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors"
            >
              {loading ? t("verifyingLoading") : t("confirmCodeButton")}
            </button>
          </>
        )}

        {message && <p className="text-center text-white/70 mt-2">{message}</p>}
      </form>
    </div>
  );
}
