'use client';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';

interface RegattaMapProps {
  events: any[];
  onMarkerClick: (coords: { lat: number, lng: number }) => void;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 100);
  }, [map]);
  return null;
}

const createClusterIcon = (count: number) => {
  if (typeof window === 'undefined') return L.divIcon({});
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center" style="width: 50px; height: 50px;">
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21L16 16H8L12 21Z" fill="#17791c"/>
          <circle cx="12" cy="9" r="8" fill="#17791c"/>
          <circle cx="12" cy="9" r="5.5" fill="#ffffff"/>
        </svg>
        <div style="
          .custom-div-icon { 
    background: transparent !important;
    border: none !important;
  }

  .marker-container {
    position: relative;
    width: 50px;
    height: 50px;
    display: flex;
    justify-content: center;
  }

  .marker-svg {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  .marker-number {
    position: absolute;
    /* Da der Kreis im SVG bei cy="9" (von 24) liegt, 
       entspricht das etwa 37% der Gesamthöhe von 50px */
    top: 18px; 
    left: 50%;
    transform: translate(-50%, -50%);
    
    color: #000000 !important;
    font-weight: 900;
    font-size: 13px;
    font-family: 'Inter', sans-serif;
    z-index: 10;
    pointer-events: none;
    line-height: 1;
  }
        ">
          ${count}
        </div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });
};

export default function RegattaMap({ events, onMarkerClick }: RegattaMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const groupedEvents = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    events.forEach(e => {
      if (e.lat && e.lng) {
        const key = `${e.lat.toFixed(4)}_${e.lng.toFixed(4)}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(e);
      }
    });
    return Object.values(groups);
  }, [events]);

  if (!isMounted) return <div className="h-full w-full bg-[#0446a8] rounded-[4rem]" />;

  return (
    <div className="h-full w-full rounded-[3.5rem] overflow-hidden bg-[#011638] navy-map-container">
  <MapContainer 
    center={[51.1657, 10.4515]} 
    zoom={6} 
    scrollWheelZoom={true}
    className="h-full w-full"
  >
    <MapResizer />
    
    {/* Basiskarte ohne alles */}
    <TileLayer
      url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
      attribution='&copy; CARTO'
    />

    {/* Städtenamen Layer */}
    <TileLayer
      url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
      pane="shadowPane"
    />
    
    {/* Deine Marker-Logik */}
    {groupedEvents.map((group, idx) => (
  <Marker 
    key={idx} 
    position={[group[0].lat, group[0].lng]} 
    icon={createClusterIcon(group.length)}
    // WICHTIG: Ohne diesen Handler passiert beim Klicken nichts
    eventHandlers={{
      click: () => onMarkerClick({ lat: group[0].lat, lng: group[0].lng })
    }}
  />
))}

  </MapContainer>

  <style>{`
    .navy-map-container .leaflet-tile-container {
      filter: 
        sepia(100%) 
        hue-rotate(195deg) 
        brightness(1.4) 
        contrast(0.9) 
        saturate(400%) !important;
    }

    .navy-map-container .leaflet-shadow-pane {
      mix-blend-mode: screen; 
      z-index: 400;
    }

    .navy-map-container .leaflet-shadow-pane .leaflet-tile {
      filter: 
        brightness(1.5) 
        contrast(3)    /* Extrem hoher Kontrast frisst den grauen Schleier auf */
        invert(0%) 
        grayscale(100%) !important;
      opacity: 0.8;    /* Macht die Schrift etwas dezenter */
    }
    
    .leaflet-container {
      background: #011638 !important;
    }
  `}</style>
</div>
  );
}