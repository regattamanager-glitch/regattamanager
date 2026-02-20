'use client';

import { useEffect, useState } from "react";

interface Event {
  id: string;
  name: string;
  datumVon: string;
  datumBis: string;
  location: string;
  land: string;
  verein?: string;
  vereinId: string; // <--- hier die ID
  bootsklassen: string[];
}


interface User {
  type: "verein" | "segler";
  name: string;
  email: string;   
}

const BOOTSKLASSEN = [
  "ILCA","ILCA 4","ILCA 6","ILCA 7","Optimist","420","470","49er","49erFX",
  "Finn","Europe","RS:X","iQFoil","Nacra 17","Nacra 15","Vaurien","FJ","Fireball","505",
  "Hobie Cat 16","RS Aero","OK Dinghy","Topper","Dragon","Star","Soling",
  "Flying Dutchman","Tornado","J70","J80","Snipe","RS200","RS400","RS500",
  "RS700","RS800","RS100","Moth","Formula 18","A-Cat","Elliott 6m","O-Jolle","Firefly",
  "Sharpie","Swallow ","Tempest","Laser II","International 14","RS Feva","RS Vision",
  "Yngling","5,5m-R-Klasse","6m-R-Klasse","J24","8m-R-Klasse","Contender","Splash","Zoom8",
  "Sunfish","B14","Musto Skiff","RS Tera","O’pen BIC","Sonstige"
];

export default function RegattaÜbersicht({ currentUser }: { currentUser: User }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [filterLand, setFilterLand] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterBootsklasse, setFilterBootsklasse] = useState("");

  useEffect(() => {
    async function fetchEvents() {
      try {
        // 1️⃣ Events laden
        const resEvents = await fetch("/api/events");
        const eventsData: Event[] = await resEvents.json();

        // 2️⃣ Accounts laden
        const resAccounts = await fetch("/api/accounts");
        const accounts: { id: string; name: string }[] = await resAccounts.json();

        // 3️⃣ Vereinsnamen auflösen anhand von vereinId
        const eventsWithVerein = eventsData.map((e: any) => {
          const account = accounts.find(acc => acc.id === e.vereinId);
          return {
            ...e,
            verein: account?.name ?? "—",
          };
        });

        setEvents(eventsWithVerein);
      } catch (err) {
        console.error("Fehler beim Laden der Events oder Accounts:", err);
      }
    }

    fetchEvents();
  }, []);



  const filtered = events.filter((e) => {
    // Land-Filter safe prüfen
    const land = e.land ?? "";

    // Datum-Filter
    const eventDate = new Date(e.datumVon);
    const eventYear = eventDate.getFullYear().toString();
    const eventMonth = (eventDate.getMonth() + 1).toString().padStart(2, "0"); // 01-12

    return (
      e.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterLand ? land.toLowerCase().includes(filterLand.toLowerCase()) : true) &&
      (filterYear ? eventYear === filterYear : true) &&
      (filterMonth ? eventMonth === filterMonth.padStart(2, "0") : true) &&
      (filterBootsklasse ? e.bootsklassen.includes(filterBootsklasse) : true)
    );
  });

  return (
    <div className="min-h-screen bg-transparent text-white p-8 flex justify-center">
      <div className="w-full max-w-5xl bg-gray-900/40 backdrop-blur-lg rounded-3xl p-8 shadow-lg">
        <h1 className="text-4xl font-bold mb-4 text-center">Regatta Übersicht</h1>
        <p className="text-gray-300 mb-6 text-center italic">
          Finde Regatten nach Land, Monat/Jahr oder Boots-Klasse
        </p>

        {/* Suchfeld */}
        <input
          type="text"
          placeholder="Nach Regatta suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full p-3 rounded-xl bg-gray-800/50 backdrop-blur-md text-white placeholder-gray-400"
        />

        {/* Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Land filtern..."
            value={filterLand}
            onChange={(e) => setFilterLand(e.target.value)}
            className="p-2 rounded-xl bg-gray-800/50 backdrop-blur-md text-white placeholder-gray-400 flex-1"
          />

          {/* Datum Filter: Jahr */}
          <input
            type="number"
            placeholder="Jahr filtern..."
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="p-2 rounded-xl bg-gray-800/50 backdrop-blur-md text-white placeholder-gray-400 flex-1"
            min={2000}
            max={2100}
          />

          {/* Datum Filter: Monat */}
          <input
            type="number"
            placeholder="Monat filtern..."
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="p-2 rounded-xl bg-gray-800/50 backdrop-blur-md text-white placeholder-gray-400 flex-1"
            min={1}
            max={12}
          />

          <select
            value={filterBootsklasse}
            onChange={(e) => setFilterBootsklasse(e.target.value)}
            className="p-2 rounded-xl bg-gray-800/50 backdrop-blur-md text-white placeholder-gray-400 flex-1"
          >
            <option value="">Alle Bootsklassen</option>
            {BOOTSKLASSEN.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* Event Liste */}
        <ul className="space-y-6">
          {filtered.length === 0 && (
            <li className="text-gray-400 text-center">Keine Regatten gefunden.</li>
          )}
          {filtered.map((event) => (
            <li
              key={event.id}
              className="p-4 rounded-2xl shadow-lg bg-gray-700/50 backdrop-blur-md hover:shadow-xl transition-colors flex justify-between items-center"
            >
              <div>
                <h2 className="text-2xl font-semibold">{event.name}</h2>
                <p className="mt-1 text-sm text-gray-300">
                  {event.datumVon} – {event.datumBis} | {event.location}, {event.land}
                </p>
                <p className="mt-1 text-sm italic text-gray-400">
                  Verein: {event.verein}
                </p>
              </div>
        
              <div className="flex gap-2">
                <a href={`/regatta/${event.id}`}>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold">
                    Details
                  </button>
                </a>
        
                <a href="/login">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold">
                    Anmelden
                  </button>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}