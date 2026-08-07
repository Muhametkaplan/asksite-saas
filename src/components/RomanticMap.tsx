'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Trash2 } from 'lucide-react';
import { MapMarker } from '@/types/couple';
import { addMapMarker, clearMapMarkers, getMapMarkers, deleteMapMarker } from '@/lib/couples';

interface RomanticMapProps {
  coupleId: string;
}

export default function RomanticMap({ coupleId }: RomanticMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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
        html: '<div style="font-size:24px; cursor:pointer;" title="Aşk Noktası">❤️</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const attachMarkerWithPopup = (m: MapMarker) => {
        const markerObj = L.marker([m.lat, m.lng], { icon: heartIcon }).addTo(map);

        const container = document.createElement('div');
        container.style.textAlign = 'center';
        container.style.padding = '4px';
        container.style.fontFamily = 'sans-serif';

        const titleDiv = document.createElement('div');
        titleDiv.style.fontWeight = 'bold';
        titleDiv.style.fontSize = '12px';
        titleDiv.style.color = '#1e293b';
        titleDiv.style.marginBottom = '6px';
        titleDiv.innerText = m.title || 'Bizim Aşk Noktamız ❤️';
        container.appendChild(titleDiv);

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = '🗑️ Bu Kalbi Sil';
        deleteBtn.style.backgroundColor = '#ff4d6d';
        deleteBtn.style.color = '#ffffff';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '8px';
        deleteBtn.style.padding = '5px 10px';
        deleteBtn.style.fontSize = '11px';
        deleteBtn.style.fontWeight = 'bold';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';

        deleteBtn.onclick = async (evt) => {
          evt.stopPropagation();
          if (m.id) {
            await deleteMapMarker(coupleId, m.id);
            map.removeLayer(markerObj);
            setMarkers((prev) => prev.filter((pin) => pin.id !== m.id));
            showToast('Kalp noktası haritadan silindi 💖');
          }
        };

        container.appendChild(deleteBtn);
        markerObj.bindPopup(container);
        return markerObj;
      };

      // Load existing markers
      getMapMarkers(coupleId).then((existingMarkers) => {
        setMarkers(existingMarkers);
        existingMarkers.forEach((m) => {
          attachMarkerWithPopup(m);
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
          attachMarkerWithPopup(created);
          setMarkers((prev) => [...prev, created]);
          showToast('Yeni kalp noktası eklendi! ❤️');
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
      showToast('Tüm harita anıları temizlendi 🗑️');
    }
  };

  return (
    <div className="box-style my-6 rounded-3xl bg-white/70 backdrop-blur-md p-6 border border-white/80 shadow-md relative">
      <h3 className="flex items-center justify-center gap-2 text-lg font-bold text-gray-800 mb-1">
        <MapPin className="h-5 w-5 text-rose-500" /> Bizim Haritamız
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Haritaya dokunarak kalp ekleyebilir, kalplere tıklayarak silebilirsiniz! ❤️
      </p>

      {toastMessage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-bold shadow-xl animate-in fade-in duration-200">
          {toastMessage}
        </div>
      )}

      <div
        ref={mapContainerRef}
        className="relative h-64 w-full rounded-2xl border-2 border-white overflow-hidden shadow-inner bg-rose-50"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 font-semibold">
          Toplam {markers.length} Aşk Noktası
        </span>
        <button
          onClick={handleClear}
          className="flex items-center gap-1.5 rounded-xl bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-200 active:scale-95"
        >
          <Trash2 className="h-4 w-4" /> Tümünü Temizle
        </button>
      </div>
    </div>
  );
}
