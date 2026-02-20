"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from '@/navigation';

interface Regatta {
  name: string;
  date: string;
  location: string;
  organizer: string;  // Vereinsname
  organizerShort: string; // Vereinskürzel
}

export default function CreateRegattaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const logged = localStorage.getItem("loggedInUser");
    if (!logged) router.push("/login");
    else {
      const parsed = JSON.parse(logged);
      if (parsed.role !== "verein") router.push("/"); // Nur Verein darf
      setUser(parsed);
    }
  }, [router]); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const stored = localStorage.getItem("regattas");
    const regattas: Regatta[] = stored ? JSON.parse(stored) : [];

    regattas.push({
      name,
      date,
      location: user.clubAddress,
      organizer: user.clubName,
      organizerShort: user.clubShort,
    });

    localStorage.setItem("regattas", JSON.stringify(regattas));
    alert("Regatta erstellt!");
    setName("");
    setDate("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-black font-sans">
      <h1 className="text-3xl font-bold mb-6 text-black dark:text-zinc-50">
        Regatta erstellen
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <input
          type="text"
          placeholder="Name der Regatta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="p-2 border border-gray-300 rounded"
          required
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="p-2 border border-gray-300 rounded"
          required
        />
        <button
          type="submit"
          className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
        >
          Regatta erstellen
        </button>
      </form>
    </div>
  );
}
