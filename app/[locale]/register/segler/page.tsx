"use client";
import { useState } from "react";
import { Link, useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

export default function RegisterSegler() {
  const t = useTranslations("Auth");
  const router = useRouter();

  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [geburtsjahr, setGeburtsjahr] = useState("");
  const [nation, setNation] = useState("");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [confirmPasswort, setConfirmPasswort] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (step === "form") {
      if (!vorname || !nachname || !geburtsjahr || !nation || !email || !passwort || !confirmPasswort) {
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
          body: JSON.stringify({
            type: "segler",
            vorname,
            nachname,
            geburtsjahr,
            nation,
            email,
            passwort,
            vereine: [],
          }),
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
        router.replace(`/dashboard/segler/${data.id}`);
      } catch (error) {
        console.error(error);
        setLoading(false);
        setMessage(t("errorVerification"));
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-blue-900/30 backdrop-blur-md p-14 rounded-3xl shadow-xl w-[400px] sm:w-[450px]"
      >
        {step === "form" && (
          <>
            <h1 className="text-3xl font-bold text-white text-center">
              {t("registerSeglerTitle")}
            </h1>

            <input
              className="w-full rounded-md p-2 bg-gray-800/70 text-white placeholder-white/70"
              placeholder={t("firstNamePlaceholder")}
              value={vorname}
              onChange={(e) => setVorname(e.target.value)}
            />
            <input
              className="w-full rounded-md p-2 bg-gray-800/70 text-white placeholder-white/70"
              placeholder={t("lastNamePlaceholder")}
              value={nachname}
              onChange={(e) => setNachname(e.target.value)}
            />
            <input
              className="w-full rounded-md p-2 bg-gray-800/70 text-white placeholder-white/70"
              placeholder={t("birthYearPlaceholder")}
              value={geburtsjahr}
              onChange={(e) => setGeburtsjahr(e.target.value)}
            />
            <input
              className="w-full rounded-md p-2 bg-gray-800/70 text-white placeholder-white/70"
              placeholder={t("nationPlaceholder")}
              value={nation}
              onChange={(e) => setNation(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
            />
            <input
              className="w-full rounded-md p-2 bg-gray-800/70 text-white placeholder-white/70"
              placeholder={t("emailPlaceholder")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              className="w-full rounded-md p-2 bg-gray-800/70 text-white placeholder-white/70"
              placeholder={t("passwordPlaceholder")}
              type="password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
            />
            <input
              className="w-full rounded-md p-2 bg-gray-800/70 text-white placeholder-white/70"
              placeholder={t("confirmPasswordPlaceholder")}
              type="password"
              value={confirmPasswort}
              onChange={(e) => setConfirmPasswort(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-500 p-2 text-white font-semibold hover:bg-blue-400 transition"
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