'use client';

import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, Gauge } from 'lucide-react';
import YardstickManager from '@/components/YardstickManager';

export default function FederationYardstickPage() {
  const router = useRouter();
  const params = useParams();
  const federationId = params?.federationId as string;

  return (
    <div className="min-h-screen bg-[#0a192f]/90 md:rounded-[2.5rem] text-white p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push(`/dashboard/federation/${federationId}`)}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Zurück zum Dashboard
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="bg-teal-600 p-2.5 rounded-xl">
            <Gauge className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Yardstick-Verwaltung</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8 ml-1">
          Lege die Yardstickzahlen für deine Meisterschaften fest und wähle die Berechnungsart.
        </p>

        <div className="bg-[#112d5c]/40 border border-slate-700/50 rounded-3xl p-6 md:p-8">
          <YardstickManager accent="teal" />
        </div>
      </div>
    </div>
  );
}
