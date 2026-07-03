"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ToastProvider";
import type { Friend } from "../types";

export default function InviteFriendsModal({
  seglerId,
  eventId,
  eventName,
  onClose,
}: {
  seglerId: string;
  eventId: string;
  eventName: string;
  onClose: () => void;
}) {
  const t = useTranslations("regattaDetail");
  const tCommon = useTranslations("Common");
  const toast = useToast();

  const [userFriends, setUserFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetch(`/api/segler/${seglerId}/friends`)
      .then((res) => {
        if (!res.ok) {
          console.error("Friends API Fehler:", res.status);
          return [];
        }
        return res.json();
      })
      .then((data) => setUserFriends(data))
      .catch((err) => console.error("Fehler beim Laden der Freunde", err));
  }, [seglerId]);

  const sendInvitations = async () => {
    if (selectedFriends.length === 0) return;
    setIsSending(true);

    try {
      const res = await fetch("/api/friends/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: seglerId,
          friendIds: selectedFriends,
          eventId,
          eventName,
        }),
      });

      if (res.ok) {
        onClose();
      } else {
        toast(t("inviteError"));
      }
    } catch (error) {
      console.error(t("inviteError"), error);
      toast(tCommon("networkError"));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
              {t("inviteTitle.part1")} <span className="text-indigo-500">{t("inviteTitle.part2")}</span>
            </h2>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">
              {t("selectFriends", { event: eventName })}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">✕</button>
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-2 mb-8 custom-scrollbar">
          {userFriends.length > 0 ? (
            userFriends
              .filter((friend, index, self) =>
                index === self.findIndex((f) => f.id === friend.id)
              )
              .map((friend) => {
                // Wir bauen den Namen hier zusammen
                const displayName = friend.vorname || friend.nachname
                  ? `${friend.vorname ?? ""} ${friend.nachname ?? ""}`.trim()
                  : (friend.name || t("unknown"));

                // Wir holen die Initialen (z.B. "MA" für Max Mustermann)
                const initials = friend.vorname
                  ? (friend.vorname[0] + (friend.nachname?.[0] || "")).toUpperCase()
                  : displayName.substring(0, 2).toUpperCase();

                return (
                  <div
                    key={friend.id}
                    onClick={() => {
                      setSelectedFriends((prev) =>
                        prev.includes(friend.id) ? prev.filter((id) => id !== friend.id) : [...prev, friend.id]
                      );
                    }}
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition border ${
                      selectedFriends.includes(friend.id)
                        ? "bg-indigo-600/20 border-indigo-500 text-white"
                        : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-black italic border border-white/10 text-xs">
                      {initials}
                    </div>
                    <span className="font-bold uppercase italic text-sm">
                      {displayName}
                    </span>
                    {selectedFriends.includes(friend.id) && <span className="ml-auto text-indigo-400 font-bold">✓</span>}
                  </div>
                );
              })
          ) : (
            <p className="text-center text-slate-500 py-10 text-xs font-bold uppercase italic">{t("noFriends")}</p>
          )}
        </div>

        <button
          onClick={sendInvitations}
          disabled={selectedFriends.length === 0 || isSending}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
        >
          {isSending ? t("sending") : t("sendInvite")}
        </button>
      </div>
    </div>
  );
}
