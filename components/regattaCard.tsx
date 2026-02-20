import React from "react";

/* =========================
   Typen
========================= */

export interface Regatta {
  id: string;
  name: string;
  datumVon: string;
  datumBis: string;
  land: string;
  location: string;
  vereinId: string;
  bootsklassen: string[];
  alleKlassen: boolean;
}

interface RegattaCardProps {
  regatta: Regatta;
}

/* =========================
   Component
========================= */

export default function RegattaCard({ regatta }: RegattaCardProps) {
  return (
    <div>
      <h2>{regatta.name}</h2> 
      <p>{regatta.location}</p>
    </div>
  );
}

