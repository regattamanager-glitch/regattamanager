"use client";

import { useState } from "react";
import { useRouter } from '@/navigation';
import { useTranslations } from "next-intl";

export default function CreateAccountPage() {
  const t = useTranslations("Register");
  const router = useRouter();
  
  const [accountType, setAccountType] = useState<"verein" | "segler" | "">("");
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountType) return setError(t("selectType"));

    try {
      const res = await fetch("/api/accounts/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: accountType, ...formData }), 
      });

      const data = await res.json();
      if (!res.ok) return setError(data.error);

      alert(t("success"));
      router.push("/login");
    } catch (err) {
      setError(t("errorGeneric"));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-black p-8">
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-white">
        {t("title")}
      </h1>

      {!accountType ? (
        <div className="flex flex-col gap-4">
          <button
            onClick={() => setAccountType("verein")}
            className="px-6 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors"
          >
            {t("btnVerein")}
          </button>
          <button
            onClick={() => setAccountType("segler")}
            className="px-6 py-3 bg-green-600 text-white rounded font-bold hover:bg-green-700 transition-colors"
          >
            {t("btnSegler")}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
          {accountType === "verein" && (
            <>
              <input
                type="text"
                name="name"
                placeholder={t("fields.clubName")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
              <input
                type="text"
                name="kuerzel"
                placeholder={t("fields.shorthand")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
              <input
                type="text"
                name="adresse"
                placeholder={t("fields.address")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
              <input
                type="email"
                name="email"
                placeholder={t("fields.email")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
            </>
          )}
          {accountType === "segler" && (
            <>
              <input
                type="text"
                name="vorname"
                placeholder={t("fields.firstName")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
              <input
                type="text"
                name="nachname"
                placeholder={t("fields.lastName")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
              <input
                type="number"
                name="geburtsjahr"
                placeholder={t("fields.birthYear")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
              <input
                type="text"
                name="nation"
                placeholder={t("fields.nation")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
              <input
                type="text"
                name="verein"
                placeholder={t("fields.club")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
              <input
                type="email"
                name="email"
                placeholder={t("fields.email")}
                required
                onChange={handleChange}
                className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
              />
            </>
          )}

          <input
            type="password"
            name="passwort"
            placeholder={t("fields.password")}
            required
            onChange={handleChange}
            className="p-2 border rounded dark:bg-zinc-900 dark:border-zinc-700"
          />

          <button type="submit" className="px-6 py-3 bg-blue-700 text-white rounded mt-4 font-bold hover:bg-blue-800 transition-colors">
            {t("submit")}
          </button>

          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          
          <button 
            type="button" 
            onClick={() => setAccountType("")}
            className="text-zinc-500 text-sm hover:underline"
          >
            Zurück zur Auswahl
          </button>
        </form>
      )}
    </div>
  );
}