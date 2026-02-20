"use client";
import { useState, useEffect } from "react";

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [codeConfirm, setCodeConfirm] = useState("");
  const [verified, setVerified] = useState(false);

  // Profilfelder
  const [email, setEmail] = useState("");
  const [passwort, setPasswort] = useState("");
  const [name, setName] = useState(""); // Vereinsname oder Vorname Nachname

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      setEmail(u.email || "");
      setName(u.name || "");
    }
  }, []);

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (user && codeConfirm === user.passwort) {
      setVerified(true);
      alert("Code verifiziert. Sie können nun Änderungen vornehmen.");
    } else {
      alert("Falscher Code!");
    } 
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/accounts/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, passwort, name }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Profil erfolgreich aktualisiert!");
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      setPasswort(""); // Passwort zurücksetzen
      setVerified(false); // erneute Verifikation nötig
    } else {
      alert("Fehler beim Speichern!");
    }
  }

  if (!user) return <p>Lade Profil…</p>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="flex flex-col gap-4 bg-white p-8 rounded-lg shadow-xl w-96">
        <h2 className="text-2xl font-bold text-gray-900 text-center">
          Profil
        </h2>

        {/* Anzeige der Daten immer sichtbar außer Passwort */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Name</label>
          <input
            type="text"
            value={name}
            readOnly={!verified}
            onChange={(e) => setName(e.target.value)}
            className={`p-2 rounded border ${
              verified ? "border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" : "border-gray-300 bg-gray-100"
            }`}
          />

          <label className="font-semibold">E-Mail</label>
          <input
            type="email"
            value={email}
            readOnly={!verified}
            onChange={(e) => setEmail(e.target.value)}
            className={`p-2 rounded border ${
              verified ? "border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" : "border-gray-300 bg-gray-100"
            }`}
          />
        </div>

        {/* Passwortfeld nur sichtbar nach Verifikation */}
        {verified && (
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Neues Passwort</label>
            <input
              type="password"
              value={passwort}
              onChange={(e) => setPasswort(e.target.value)}
              className="p-2 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Formular für Code-Eingabe wenn nicht verifiziert */}
        {!verified && (
          <form onSubmit={handleVerify} className="flex flex-col gap-2">
            <label className="font-semibold">Aktuelles Passwort eingeben</label>
            <input
              type="password"
              placeholder="Passwort"
              value={codeConfirm}
              onChange={(e) => setCodeConfirm(e.target.value)}
              className="p-2 rounded border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-2 rounded transition-colors mt-2"
            >
              Verifizieren
            </button>
          </form>
        )}

        {/* Speichern Button nur sichtbar nach Verifikation */}
        {verified && (
          <button
            onClick={handleSave}
            className="bg-green-700 hover:bg-green-800 text-white font-bold py-2 rounded transition-colors mt-2"
          >
            Änderungen speichern
          </button>
        )}
      </div>
    </div>
  );
}
