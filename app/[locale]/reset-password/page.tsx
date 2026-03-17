"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      alert(t("passwordsDoNotMatch")); // Neuer Key
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/accounts/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setStatus("success");
        // Navigation nach dem Erfolg
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <form 
        onSubmit={handleSubmit}
        className="flex flex-col gap-6 bg-blue-900/30 backdrop-blur-md p-14 rounded-3xl shadow-xl w-[400px] sm:w-[450px]"
      >
        <h2 className="text-3xl font-bold text-white text-center">
          {t("resetPasswordTitle")}
        </h2>

        {status === "success" ? (
          <div className="text-green-300 text-center bg-green-500/20 p-4 rounded-xl">
            {t("resetPasswordSuccessMessage")}
          </div>
        ) : (
          <>
            <p className="text-white/70 text-sm text-center">
              {t("resetPasswordInstructions")}
            </p>

            <input
              type="password"
              placeholder={t("newPasswordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-4 rounded-xl border border-white/50 bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="password"
              placeholder={t("confirmPasswordPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="p-4 rounded-xl border border-white/50 bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <button
              type="submit"
              disabled={loading || !token}
              className="bg-blue-700/70 hover:bg-blue-800/70 text-white font-bold py-4 rounded-xl transition-all shadow-lg"
            >
              {loading ? t("savingLoading") : t("savePasswordButton")}
            </button>
          </>
        )}
        
        {status === "error" && (
          <p className="text-red-400 text-center text-sm bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {t("resetPasswordTokenError")}
          </p>
        )}
      </form>
    </div>
  );
}