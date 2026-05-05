"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

export default function RegisterSegler() {
  const t = useTranslations("Auth");
  const router = useRouter();

  // States für die Picker
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [nation, setNation] = useState("");
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [confirmPasswort, setConfirmPasswort] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Monatsnamen Liste
  const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember"
  ];

  // Dynamische Berechnung der Tage im Monat
  const [daysArray, setDaysArray] = useState<string[]>([]);
  
  useEffect(() => {
    const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
    const currentYear = year ? parseInt(year) : 2000; // Default Jahr für Berechnung
    const currentMonth = month ? parseInt(month) : 1;
    
    const count = daysInMonth(currentYear, currentMonth);
    const newDays = Array.from({ length: count }, (_, i) => (i + 1).toString().padStart(2, '0'));
    setDaysArray(newDays);

    // Falls der gewählte Tag im neuen Monat nicht existiert (z.B. 31. Februar), zurücksetzen
    if (day && parseInt(day) > count) {
      setDay("");
    }
  }, [month, year, day]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (step === "form") {
      const geburtsdatum = (year && month && day) ? `${year}-${month}-${day}` : "";

      if (!vorname || !nachname || !geburtsdatum || !nation || !email || !passwort || !confirmPasswort) {
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
            geburtsdatum, 
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

  // Gemeinsame Styles für die Inputs (basierend auf dem Screenshot)
  const inputStyle = "w-full rounded-md p-3 bg-[#112d5c]/50 text-white placeholder-white/50 border border-blue-400/30 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all";

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-blue-900/30 backdrop-blur-md p-14 rounded-3xl shadow-xl w-[400px] sm:w-[450px]"
      >
        {step === "form" && (
          <>
            <h1 className="text-3xl font-bold text-white text-center mb-4">
              {t("registerSeglerTitle")}
            </h1>

            <input
              className={inputStyle}
              placeholder={t("firstNamePlaceholder")}
              value={vorname}
              onChange={(e) => setVorname(e.target.value)}
            />
            
            <input
              className={inputStyle}
              placeholder={t("lastNamePlaceholder")}
              value={nachname}
              onChange={(e) => setNachname(e.target.value)}
            />

            {/* Datum Picker Sektion */}
            <div className="flex gap-2">
              <select
                className={`${inputStyle} flex-1 cursor-pointer`}
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                <option value="" disabled>{t("dayPlaceholder")}</option>
                {daysArray.map(d => <option key={d} value={d} className="bg-[#0b2545]">{d}.</option>)}
              </select>

              <select
                className={`${inputStyle} flex-[2] cursor-pointer`}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="" disabled>{t("monthPlaceholder")}</option>
                {monthNames.map((name, i) => (
                  <option key={name} value={(i + 1).toString().padStart(2, '0')} className="bg-[#0b2545]">
                    {name}
                  </option>
                ))}
              </select>

              <select
                className={`${inputStyle} flex-[1.5] cursor-pointer`}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                <option value="" disabled>{t("yearPlaceholder")}</option>
                {years.map(y => <option key={y} value={y} className="bg-[#0b2545]">{y}</option>)}
              </select>
            </div>

            <input
              className={inputStyle}
              placeholder={t("nationPlaceholder")}
              value={nation}
              onChange={(e) => setNation(e.target.value.toUpperCase().slice(0, 3))}
              maxLength={3}
            />

            <input
              className={inputStyle}
              placeholder={t("emailPlaceholder")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              className={inputStyle}
              placeholder={t("passwordPlaceholder")}
              type="password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
            />

            <input
              className={inputStyle}
              placeholder={t("confirmPasswordPlaceholder")}
              type="password"
              value={confirmPasswort}
              onChange={(e) => setConfirmPasswort(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 rounded-lg bg-blue-600 p-3 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50"
            >
              {loading ? t("creatingAccountLoading") : t("createAccountButton")}
            </button>
          </>
        )}

        {step === "verify" && (
          <div className="flex flex-col gap-6">
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
              className={`${inputStyle} text-center tracking-[1rem] text-2xl font-bold`}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors mt-2"
            >
              {loading ? t("verifyingLoading") : t("confirmCodeButton")}
            </button>
          </div>
        )}

        {message && <p className="text-center text-white/70 mt-2 text-sm font-medium">{message}</p>}
      </form>
    </div>
  );
}
