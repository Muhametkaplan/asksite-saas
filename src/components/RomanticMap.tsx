'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { MapMarker } from '@/types/couple';
import { addMapMarker, clearMapMarkers, getMapMarkers } from '@/lib/couples';

interface RomanticMapProps {
  coupleId: string;
}

export default function RomanticMap({ coupleId }: RomanticMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Dynamically import Leaflet client-side
    Promise.all([
      import('leaflet'),
      import('leaflet/dist/leaflet.css')
    ]).then(([L]) => {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        center: [39.0, 35.0],
        zoom: 5,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setIsLoaded(true);

      const heartIcon = L.divIcon({
        className: '',
        html: '<div style="font-size:24px; cursor:pointer;">❤️</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      // Load existing markers
      getMapMarkers(coupleId).then((existingMarkers) => {
        setMarkers(existingMarkers);
        existingMarkers.forEach((m) => {
          L.marker([m.lat, m.lng], { icon: heartIcon }).addTo(map);
        });
      });

      // Click to add marker
      map.on('click', async (e: any) => {
        const newLat = e.latlng.lat;
        const newLng = e.latlng.lng;

        const created = await addMapMarker({
          couple_id: coupleId,
          lat: newLat,
          lng: newLng,
          title: 'Bizim Aşk Noktamız ❤️',
        });

        if (created) {
          L.marker([newLat, newLng], { icon: heartIcon }).addTo(map);
          setMarkers((prev) => [...prev, created]);
        }
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coupleId]);

  const handleClear = async () => {
    if (confirm('Tüm harita anılarını silmek istediğine emin misin?')) {
      await clearMapMarkers(coupleId);
      setMarkers([]);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.eachLayer((layer: any) => {
          if (layer.options && layer.options.icon) {
            mapInstanceRef.current.removeLayer(layer);
          }
        });
      }
    }
  };

  return (
    <div className="box-style my-6 rounded-3xl bg-white/70 backdrop-blur-md p-6 border border-white/80 shadow-md">
      <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-gray-800 mb-1">
        <MapPin className="h-5 w-5 text-rose-500" /> Bizim Haritamız
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Haritaya dokunarak dilediğin yere kalp bırak! ❤️
      </p>

      <div
        ref={mapContainerRef}
        className="relative h-64 w-full rounded-2xl border-2 border-white overflow-hidden shadow-inner bg-rose-50"
      />

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-xl bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-200 active:scale-95"
        >
          <Trash2 className="h-4 w-4" /> Haritayı Temizle
        </button>
      </div>
    </div>
  );
}
