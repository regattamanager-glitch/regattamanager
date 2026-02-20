'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useState } from "react";

type Props = {
  lat: number;
  lng: number;
  title?: string;
};

// Hilfs-Komponente für die korrekte Größe
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, [map]);
  return null;
}

// Einzelner Marker-Pin im Regatta-Stil (Grün) 
const createSinglePin = () => {
  if (typeof window === 'undefined') return L.divIcon({});
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center" style="width: 40px; height: 40px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 3px 5px rgba(0,0,0,0.4));">
          <path d="M12 21L16 16H8L12 21Z" fill="#17791c"/>
          <circle cx="12" cy="9" r="8" fill="#17791c"/>
          <circle cx="12" cy="9" r="4" fill="#ffffff"/>
        </svg>
      </div>
    `,
    className: 'custom-event-pin',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
};

export default function EventMap({ lat, lng, title }: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return <div className="h-full w-full bg-[#011638] rounded-[2rem]" />;

  return (
    <div className="h-full w-full rounded-[2rem] overflow-hidden bg-[#011638] navy-map-container">
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <MapResizer />

        {/* Basiskarte: Blaues Land/Wasser, keine Straßen */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />

        {/* Städtenamen Layer: Sauber gefiltert */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
          pane="shadowPane"
        />

        <Marker position={[lat, lng]} icon={createSinglePin()}>
          {title && <Popup>{title}</Popup>}
        </Marker>
      </MapContainer>

      <style>{`
        /* Das Land und Wasser Design */
        .navy-map-container .leaflet-tile-container {
          filter: 
            sepia(100%) 
            hue-rotate(195deg) 
            brightness(1.4) 
            contrast(0.9) 
            saturate(400%) !important;
        }

        /* Der Schleier-Killer für die Ortsnamen */
        .navy-map-container .leaflet-shadow-pane {
          mix-blend-mode: screen; 
          z-index: 400;
          pointer-events: none;
        }

        .navy-map-container .leaflet-shadow-pane .leaflet-tile {
          filter: 
            brightness(1.5) 
            contrast(3) 
            grayscale(100%) !important;
          opacity: 0.8;
        }
        
        .leaflet-container {
          background: #011638 !important;
        }

        /* Popup Styling anpassen (optional) */
        .leaflet-popup-content-wrapper {
          background: #011638;
          color: white;
          border: 1px solid #17791c;
        }
        .leaflet-popup-tip {
          background: #011638;
        }
      `}</style>
    </div>
  );
}