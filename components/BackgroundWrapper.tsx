"use client";

import { useEffect, useState } from "react";

// Bilder dynamisch aus dem public/backgrounds-Ordner laden
// Einfach die Dateinamen hier eintragen, alle weiteren Bilder werden automatisch unterstützt
const imageNames = [
  "bg1.jpg",
  "bg2.jpg",
  "bg3.jpg",
  "bg4.jpg",
  "bg5.jpg",
  "bg6.jpg",
];

const images = imageNames.map((name) => `/backgrounds/${name}`);

export default function BackgroundWrapper() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 8000); // Wechsel alle 8 Sekunden 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      {images.map((src, index) => (
        <div
          key={index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
      {/* Overlay für besseren Kontrast */}
      <div className="absolute inset-0 bg-black/50" />
    </div>
  );
}
