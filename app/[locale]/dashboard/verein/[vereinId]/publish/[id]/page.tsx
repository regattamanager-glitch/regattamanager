'use client';

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/navigation";
import { useTranslations } from "next-intl";

interface SeglerAnmeldung {
  skipper: { seglerId: string; name: string };
  crew?: { name: string }[];
  boot: { segelnummer: string };
}

interface EventData {
  id: string;
  name: string;
  segler: { [bootsklasse: string]: SeglerAnmeldung[] };
  bootsklassen: string[];
}

export default function PublishResultsPage() {
  const t = useTranslations('PublishResults');
  const params = useParams() as { vereinId: string; id: string };
  const router = useRouter();
  const vereinId = params.vereinId;
  const eventId = params.id;

  const [event, setEvent] = useState<EventData | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [raceCount, setRaceCount] = useState(4);
  const [results, setResults] = useState<(string | undefined)[][]>([]);
  const [showRanking, setShowRanking] = useState(false);
  const [savedResults, setSavedResults] = useState<(string | undefined)[][]>([]);

  // ICONS
  const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>;
  const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>;
  const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V4h5a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2h5v7.586l-1.293-1.293z" /></svg>;
  const ChevronLeft = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;

  // Load Event
  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/events?eventId=${eventId}`)
      .then(res => res.json())
      .then((data: EventData) => {
        setEvent(data);
        setSelectedClass(data.bootsklassen[0] || null);
      })
      .catch(console.error);
  }, [eventId]);

  const sailorCount = event && selectedClass ? event.segler[selectedClass]?.length ?? 0 : 0;

  useEffect(() => {
    if (!event || !selectedClass) return;
    const sailors = event.segler[selectedClass] || [];
    const sorted = [...sailors].sort((a, b) => a.skipper.name.localeCompare(b.skipper.name));

    fetch(`/api/events/results?eventId=${eventId}&klasse=${selectedClass}`)
      .then(res => res.json())
      .then(data => {
        let mappedResults: (string | undefined)[][];
        if (data.success && data.results) {
          mappedResults = sorted.map(sailor => data.results?.[sailor.skipper?.seglerId] ?? []);
          if (mappedResults.some(r => r.length > 0)) setShowRanking(true);
        } else {
          mappedResults = sorted.map(() => []);
        }

        const maxRaces = Math.max(0, ...mappedResults.map(r => r.length));
        const finalRaceCount = maxRaces || raceCount;
        const normalized = mappedResults.map(row => Array.from({ length: finalRaceCount }, (_, i) => row[i]));

        setRaceCount(finalRaceCount);
        setResults(normalized);
        setSavedResults(normalized);
      })
      .catch(console.error);
  }, [eventId, selectedClass, sailorCount]);

  useEffect(() => {
    setResults(prev => prev.map(row => Array.from({ length: raceCount }, (_, i) => row[i])));
  }, [raceCount]);

  const handleResultChange = (sailorIdx: number, raceIdx: number, value: string) => {
    setResults(prev => {
      const copy = prev.map(row => [...row]);
      copy[sailorIdx][raceIdx] = value === "" ? undefined : value.toUpperCase();
      return copy;
    });
  };

  const addRace = () => {
    setRaceCount(prev => prev + 1);
    setResults(prev => prev.map(row => [...row, undefined]));
  };

  const removeRace = () => {
    if (raceCount <= 1) return;
    setRaceCount(prev => prev - 1);
    setResults(prev => prev.map(row => row.slice(0, -1)));
  };

  const handlePublish = async () => {
    if (!selectedClass || !event) return;
    const sailors = event.segler[selectedClass] || [];
    const sorted = [...sailors].sort((a,b) => a.skipper.name.localeCompare(b.skipper.name));

    const payload = sorted.map((sailor, i) => ({
      seglerId: sailor.skipper?.seglerId,
      scores: results[i] || Array(raceCount).fill(undefined)
    }));

    try {
      const response = await fetch('/api/events/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, klasse: selectedClass, results: payload })
      });
      const data = await response.json();
      if (data.success) {
        setShowRanking(true);
        setSavedResults([...results]);
      } else {
        alert(`${t('error')}: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert(`${t('errorSaving')} ${(err as Error).message}`);
    }
  };

  const calculateScore = (scores: (string|undefined)[], allScores: (string|undefined)[][]) => {
    if(scores.length === 0) return "";
    const numStarted = allScores.length - allScores.filter(s => s.every(v => v === "DNC")).length;
    let points = 0;
    scores.forEach(s => {
      if (!s || s === "") return;
      if(!isNaN(Number(s))) points += Number(s);
      else switch(s.toUpperCase()) {
        case "DNS": case "DNF": case "OCS": case "DSQ": case "RET": points += numStarted + 1; break;
        case "DNC": points += allScores.length + 1; break;
        case "RDG": points += 0; break;
        default: points += 0;
      }
    });
    const numericScores = scores.map(s => {
      if(!s || s==="") return 0;
      if(!isNaN(Number(s))) return Number(s);
      switch(s?.toUpperCase()) {
        case "DNS": case "DNF": case "OCS": case "DSQ": case "RET": return numStarted + 1;
        case "DNC": return allScores.length + 1;
        case "RDG": return 0;
        default: return 0;
      }
    });
    if(numericScores.length >= 4) points = numericScores.reduce((a,b)=>a+b,0)-Math.max(...numericScores);
    return points;
  };

  if (!event) return <div className="text-white">{t('loading')}</div>;

  const sailors = selectedClass ? event.segler[selectedClass] || [] : [];
  const sortedSailors = [...sailors]
    .sort((a,b)=>a.skipper.name.localeCompare(b.skipper.name))
    .map((sailor, i) => ({
      sailor,
      scores: savedResults[i] || [],
      total: calculateScore(savedResults[i] || [], savedResults)
    }))
    .sort((a,b)=>Number(a.total||0)-Number(b.total||0));

  return (
  <div className="min-h-screen bg-[#0a192f]/90 md:rounded-[2.5rem] text-white p-4 md:p-8 font-sans">
    <div className="max-w-7xl mx-auto">
      {/* BACK TO DASHBOARD BUTTON */}
      <button
        onClick={() => router.push(`/dashboard/verein/${vereinId}`)}
        className="flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors group"
      >
        <div className="bg-white/5 group-hover:bg-white/10 p-2 rounded-lg transition-colors">
          <ChevronLeft />
        </div>
        <span className="text-sm font-medium tracking-wide">{t('backToDashboard')}</span>
      </button>

      {/* HEADER CARD */}
      <div className="bg-blue-900/20 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent italic tracking-tight">
              {t('manageResults')}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-white/50 uppercase tracking-widest text-[10px] font-bold">
                {t('liveSystem')} &bull; {event.name}
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={addRace}
              className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 px-4 py-2 rounded-xl transition-all active:scale-95"
            >
              <PlusIcon /> {t('addRace')}
            </button>
            <button
              onClick={removeRace}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 px-4 py-2 rounded-xl transition-all active:scale-95 text-red-300"
            >
              <TrashIcon /> {t('removeRace')}
            </button>
            <button
              onClick={handlePublish}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-blue-950 font-bold px-6 py-2 rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95"
            >
              <SaveIcon /> {t('publish')}
            </button>
          </div>
        </div>

        {/* CLASS TABS */}
        <div className="flex gap-2 mt-10 overflow-x-auto pb-2 scrollbar-hide">
          {event.bootsklassen.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                selectedClass === cls
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/50"
                  : "bg-white/5 text-white/40 hover:bg-white/10"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {sailors.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
          {t('noRegistrations', { cls: selectedClass ?? "-" })}
        </div>
      ) : (
        <div className="space-y-8">
          {/* EINGABE TABELLE */}
          <div className="bg-blue-900/10 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
              <h3 className="font-bold uppercase tracking-tight text-sm text-blue-300">{t('resultsEntry')}</h3>
              <span className="text-xs bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                {sailors.length} {t('participants')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-white/40">
                    <th className="px-6 py-4 font-bold border-b border-white/5">{t('total')}</th>
                    <th className="px-6 py-4 font-bold border-b border-white/5">{t('sailorCrew')}</th>
                    <th className="px-6 py-4 font-bold border-b border-white/5 text-center">{t('number')}</th>
                    {Array.from({ length: raceCount }).map((_, idx) => (
                      <th key={idx} className="px-4 py-4 font-bold border-b border-white/5 text-center">
                        {t('race', { idx: idx + 1 })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sailors
                    .sort((a, b) => a.skipper.name.localeCompare(b.skipper.name))
                    .map((sailor, i) => {
                      const scores = results[i] || [];
                      return (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <span className="bg-blue-500/20 text-blue-300 font-mono font-bold px-3 py-1 rounded-lg">
                              {calculateScore(scores, results)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white group-hover:text-blue-300 transition-colors">{sailor.skipper.name}</div>
                            <div className="text-[10px] text-white/30 truncate max-w-[150px]">
                              {sailor.crew?.map((c) => c.name).join(", ") || t('noCrew')}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-mono text-xs text-white/60">{sailor.boot.segelnummer}</td>
                          {Array.from({ length: raceCount }).map((_, idx) => (
                            <td key={idx} className="px-2 py-3">
                              <input
                                type="text"
                                placeholder="-"
                                value={results[i]?.[idx] ?? ""}
                                onChange={(e) => handleResultChange(i, idx, e.target.value)}
                                className="w-12 h-10 bg-white/5 border border-white/10 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500 focus:bg-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-white/10"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RANGLISTE */}
          {savedResults.some((row) => row.some((cell) => cell)) && (
            <div className="bg-gradient-to-br from-blue-600/20 to-indigo-900/20 border border-blue-400/20 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700 mt-12">
              <div className="p-8 text-center border-b border-white/5">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">{t('rankingPreview')}</h2>
                <div className="h-1 w-20 bg-blue-500 mx-auto mt-2 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              </div>

              <div className="overflow-x-auto px-4 pb-8">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-white/40 text-[10px] uppercase font-black tracking-widest">
                      <th className="px-6 py-4">{t('rank')}</th>
                      <th className="px-6 py-4">{t('netPoints')}</th>
                      <th className="px-6 py-4">{t('nameNumber')}</th>
                      {Array.from({ length: raceCount }).map((_, idx) => (
                        <th key={idx} className="px-4 py-4 text-center">{t('race', { idx: idx + 1 })}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedSailors.map((entry, index) => {
                      const scores = entry.scores;
                      const numericScores = scores.map((s) => (!s || s === "" ? 0 : !isNaN(Number(s)) ? Number(s) : 999));
                      let discardIdx = -1;
                      if (numericScores.length >= 4) discardIdx = numericScores.indexOf(Math.max(...numericScores));

                      return (
                        <tr key={index} className={`${index < 3 ? "bg-blue-500/10" : "bg-white/5"} rounded-xl overflow-hidden`}>
                          <td className="px-6 py-4 font-black text-xl italic first:rounded-l-xl">
                            {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`}
                          </td>
                          <td className="px-6 py-4 font-mono font-bold text-blue-300 text-lg">{entry.total}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-white">{entry.sailor.skipper.name}</div>
                            <div className="text-[10px] text-white/40 font-mono">{entry.sailor.boot.segelnummer}</div>
                          </td>
                          {scores.map((val, idx) => (
                            <td key={idx} className="px-4 py-4 text-center last:rounded-r-xl">
                              <span className={`inline-block min-w-[2rem] font-bold py-1 px-2 rounded-md ${
                                idx === discardIdx
                                  ? "text-red-500 line-through decoration-red-500/80 bg-red-500/10 border border-red-500/20"
                                  : "text-white/80 bg-white/5"
                              }`}>{val || "-"}</span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
);
}
