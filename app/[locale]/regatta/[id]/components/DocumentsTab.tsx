"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { EventDocument } from "../types";

export default function DocumentsTab({ documents }: { documents: EventDocument[] }) {
  const t = useTranslations("regattaDetail");
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* Linke Seite: Liste der Dokumente */}
      <div className="space-y-3">
        <h3 className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-4">
          {t("documents.available")}
        </h3>
        {documents.length === 0 && (
          <p className="text-white/40 italic text-sm">{t("documents.none")}</p>
        )}
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li key={doc.id}>
              <button
                onClick={() => setSelectedDoc(doc.url)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border transition text-left ${
                  selectedDoc === doc.url
                    ? "bg-blue-700 border-blue-500 text-white"
                    : "bg-blue-900/20 border-white/10 text-white/70 hover:bg-blue-800/40"
                }`}
              >
                <span className="text-2xl">
                  {doc.name.toLowerCase().includes("pdf") ? "📄" : "📝"}
                </span>
                <div className="flex-1 overflow-hidden">
                  <div className="font-semibold truncate">{doc.name}</div>
                  <div className="text-[10px] opacity-50 uppercase">{t("documents.viewDownload")}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Rechte Seite: Dokumenten-Viewer */}
      <div className="lg:col-span-2">
        <div className="bg-blue-950/40 border border-white/10 rounded-2xl overflow-hidden h-[600px] flex flex-col">
          {selectedDoc ? (
            <>
              <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                <span className="text-xs text-white/50 truncate pr-4">{selectedDoc}</span>
                <a
                  href={selectedDoc}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-md transition"
                >
                  {t("documents.openExternal")}
                </a>
              </div>
              <iframe
                src={selectedDoc}
                className="w-full h-full bg-white"
                title={t("documents.previewTitle")}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/30 space-y-4">
              <span className="text-5xl opacity-20">🔎</span>
              <p className="text-sm">{t("documents.selectToPreview")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
