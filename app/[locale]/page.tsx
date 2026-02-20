'use client';

import { Link } from "@/navigation";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface Account {
  id: string;
  name: string;
}

interface Regatta {
  id: string;
  name: string;
  datumVon: string;
  datumBis: string;
  land: string;
  location: string;
  verein?: string;
  vereinId: string;
  alleKlassen: boolean; 
  bootsklassen: string[];
  privat: boolean; // Feld hinzugefügt
}

export default function HomePage() {
  const t = useTranslations();
  const [regatten, setRegatten] = useState<Regatta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, accountsRes] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/accounts")
        ]);

        const events = await eventsRes.json();
        const accounts: Account[] = await accountsRes.json();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = events
          .filter((event: any) => {
            // 1. Filter: Nur öffentliche Regatten (privat: false)
            if (event.privat === true) return false;

            // 2. Filter: Datum vorhanden?
            if (!event.datumVon) return false;
            
            // Datum-Parsing
            let eventDate;
            if (typeof event.datumVon === 'string' && event.datumVon.includes('.')) {
              const parts = event.datumVon.split('.');
              eventDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
            } else {
              eventDate = new Date(event.datumVon);
            }

            // 3. Filter: Nur zukünftige Regatten
            return eventDate >= today;
          })
          .map((event: any) => {
            const verein = accounts.find(acc => acc.id === event.vereinId);
            return {
              ...event,
              verein: verein?.name ?? "—",
            };
          });

        setRegatten(upcoming);
      } catch (err) {
        console.error("Fehler beim Laden:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);

  if (loading) return <p className="text-white p-6">{t('Common.loading')}</p>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">{t('Common.title')}</h1>
        <p className="text-gray-300 text-lg mb-6">
          {t('Home.subtitle')}
        </p>

        
        <div className="flex justify-center gap-4 mb-4">
          <Link href="/regatten">
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              {t('Navigation.regattas')}
            </button>
          </Link>
        </div>

        <div className="flex justify-center gap-4 mb-4">
          <Link href="/login">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              {t('Navigation.login')}
            </button>
          </Link>
          <Link href="/register">
            <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
              {t('Auth.registerTitle')}
            </button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">{t('Regatta.listTitle')}</h2>

        {regatten.length === 0 ? (
          <p className="text-gray-300">
            {t('Regatta.noPublic')}
          </p>

        ) : (
          <div className="flex flex-col gap-4">
            {regatten.map(regatta => (
              <div key={regatta.id} className="bg-gray-800/50 backdrop-blur-md text-white p-4 rounded-2xl flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">{regatta.name}</h3>
                  <p className="text-gray-300 text-sm">
                    {regatta.datumVon} – {regatta.datumBis} | {regatta.land} | {regatta.location}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">{t('Regatta.organizer')}: {regatta.verein}</p>
                </div>
                <Link href={`/regatta/${regatta.id}`}>
                  <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold">
                    {t('Regatta.details')}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}