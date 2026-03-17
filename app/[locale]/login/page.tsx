"use client";

import { useState } from "react";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

// Definition der möglichen Ansichten
type LoginStep = "login" | "code" | "forgot";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const router = useRouter();

  // Formular-States
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [code, setCode] = useState("");
  
  // UI-States
  const [step, setStep] = useState<LoginStep>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(""); // Für Erfolgsmeldungen (z.B. E-Mail gesendet)

  /**
   * 1. Login-Versuch (E-Mail & Passwort)
   */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/accounts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, passwort }),
      });

      const data = await res.json();
      
      if (res.ok) {
        // Wechsel zur 2FA-Code-Eingabe
        setStep("code");
      } else {
        alert(data.error || "Login fehlgeschlagen");
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * 2. 2FA-Code Verifizierung
   */
  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/accounts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (res.ok) {
        // --- NEU: ID IM LOCALSTORAGE SPEICHERN ---
        if (data.type === "segler") {
          localStorage.setItem("seglerId", data.id);
        }
        // -----------------------------------------

        router.refresh(); 
        
        setTimeout(() => {
          if (data.type === "segler") {
            router.replace(`/dashboard/segler/${data.id}`);
          } else {
            router.replace(`/dashboard/verein/${data.id}`);
          }
        }, 100); 
      } else {
        alert(data.error || "Fehler beim Verifizieren");
      }
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setLoading(false);
    }
  }

  /**
   * 3. Passwort vergessen (E-Mail für Reset-Link senden)
   */
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/accounts/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage(t("resetEmailSentSuccess")); // "Wir haben dir einen Link gesendet!"
      } else {
        const data = await res.json();
        alert(data.error || "Fehler beim Senden der E-Mail");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
    } finally {
      setLoading(false);
    }
  }

  // Gemeinsame CSS-Klassen für die Formulare
  const formClasses = "flex flex-col gap-6 bg-blue-900/30 backdrop-blur-md p-14 rounded-3xl shadow-xl w-[400px] sm:w-[450px]";
  const inputClasses = "p-4 rounded-xl border border-white/50 bg-white/20 text-white placeholder-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const buttonClasses = "bg-blue-700/70 hover:bg-blue-800/70 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors shadow-lg";

  return (
    <div className="flex min-h-screen items-center justify-center relative">
      
      {/* ================= STEP 1: LOGIN ================= */}
      {step === "login" && (
        <form onSubmit={handleLogin} className={formClasses}>
          <h2 className="text-4xl font-bold text-white text-center">
            {t("loginTitle")}
          </h2>

          <input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClasses}
            required
          />

          <input
            type="password"
            placeholder={t("passwordPlaceholder")}
            value={passwort}
            onChange={(e) => setPasswort(e.target.value)}
            className={inputClasses}
            required
          />

          <button type="submit" disabled={loading} className={buttonClasses}>
            {loading ? t("checkingLoading") : t("loginButton")}
          </button>

          <button 
            type="button" 
            onClick={() => { setMessage(""); setStep("forgot"); }}
            className="text-white/70 hover:text-white text-sm transition-colors text-center mt-[-10px]"
          >
            {t("forgotPasswordLink")}
          </button>
        </form>
      )}

      {/* ================= STEP 2: PASSWORT VERGESSEN ================= */}
      {step === "forgot" && (
        <form onSubmit={handleForgotPassword} className={formClasses}>
          <h2 className="text-3xl font-bold text-white text-center">
            {t("forgotPasswordTitle")}
          </h2>

          <p className="text-white/80 text-center text-sm leading-relaxed">
            {message || t("forgotPasswordDescription")}
          </p>

          {!message && (
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClasses}
              required
            />
          )}

          {!message && (
            <button type="submit" disabled={loading} className={buttonClasses}>
              {loading ? t("sendingLoading") : t("sendResetLink")}
            </button>
          )}

          <button 
            type="button" 
            onClick={() => setStep("login")}
            className="text-white/70 hover:text-white text-sm transition-colors text-center"
          >
            {t("backToLogin")}
          </button>
        </form>
      )}

      {/* ================= STEP 3: SECURITY CODE (2FA) ================= */}
      {step === "code" && (
        <form onSubmit={handleVerifyCode} className={formClasses}>
          <h2 className="text-3xl font-bold text-white text-center">
            {t("verifyCodeTitle")}
          </h2>

          <p className="text-white/80 text-center text-sm leading-relaxed">
            {t("verifyCodeDescription")}
          </p>

          <input
            type="text"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className={`${inputClasses} text-center tracking-widest text-lg`}
            required
          />

          <button type="submit" disabled={loading} className={buttonClasses}>
            {loading ? t("verifyingLoading") : t("confirmButton")}
          </button>

          <button 
            type="button" 
            onClick={() => setStep("login")}
            className="text-white/70 hover:text-white text-sm transition-colors text-center"
          >
            {t("backToLogin")}
          </button>
        </form>
      )}
    </div>
  );
}