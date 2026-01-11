import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface TrackingOverlayProps {
  userCoords: { lat: number, lng: number } | null;
  serviceName: string;
  onClose: () => void;
  arrivalMinutes?: number;
}

const FAKE_DRIVERS = [
  { name: 'Arjun Kumar', rating: '4.9', vehicle: 'KA-01-AB-1234', photo: '👨‍🔧' },
  { name: 'Rajesh Singh', rating: '4.8', vehicle: 'KA-05-CD-5678', photo: '🧑‍🔧' },
  { name: 'Vikram Rao', rating: '5.0', vehicle: 'MH-02-EF-9012', photo: '👷' },
];

const TrackingOverlay: React.FC<TrackingOverlayProps> = ({ userCoords, serviceName, onClose, arrivalMinutes = 20 }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const partnerMarkerRef = useRef<L.Marker | null>(null);
  const [status, setStatus] = useState('Finding nearest specialist...');
  const [phase, setPhase] = useState<'searching' | 'assigned' | 'arriving' | 'arrived'>('searching');
  const [driver] = useState(() => FAKE_DRIVERS[Math.floor(Math.random() * FAKE_DRIVERS.length)]);
  const [eta, setEta] = useState(arrivalMinutes);

  const center: [number, number] = userCoords ? [userCoords.lat, userCoords.lng] : [12.9716, 77.5946];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(center, 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);

    // User location with pulse
    L.marker(center, {
      icon: L.divIcon({
        className: 'user-pin',
        html: `<div style="width:20px;height:20px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 20px rgba(37,99,235,0.7);position:relative;">
                <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(37,99,235,0.3);animation:ping 1.5s infinite;"></div>
               </div>`,
        iconSize: [20, 20]
      })
    }).addTo(map);

    mapInstanceRef.current = map;

    // Start partner from a distance
    const startLat = center[0] + 0.008;
    const startLng = center[1] + 0.006;

    // Searching phase (3s)
    setTimeout(() => {
      setPhase('assigned');
      setStatus(`${driver.name} is on the way`);

      // Create partner marker (Rapido/Zomato style bike icon)
      const partnerIcon = L.divIcon({
        className: 'partner-marker',
        html: `<div style="background:#1e293b;padding:8px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.3);border:2px solid white;">
                <span style="font-size:24px;">🛵</span>
               </div>`,
        iconSize: [48, 48]
      });

      const partner = L.marker([startLat, startLng], { icon: partnerIcon }).addTo(map);
      partnerMarkerRef.current = partner;

      // Animate partner movement synced with ETA
      const totalDuration = arrivalMinutes * 60 * 1000; // Convert to ms
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        const currentLat = startLat + (center[0] - startLat) * progress;
        const currentLng = startLng + (center[1] - startLng) * progress;
        partner.setLatLng([currentLat, currentLng]);

        const remainingMin = Math.max(0, Math.ceil(arrivalMinutes * (1 - progress)));
        setEta(remainingMin);

        if (progress >= 1) {
          setPhase('arrived');
          setStatus('Specialist has arrived!');
        } else {
          setPhase('arriving');
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, 3000);

    return () => { map.remove(); };
  }, []);

  return (
    <div className="fixed inset-0 z-[3000] bg-white flex flex-col overflow-hidden">
      <div ref={mapContainerRef} className="flex-1 w-full" />
      
      {/* Live Header - Zomato Style */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${phase === 'arrived' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
          <div className="flex-1">
            <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{status}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">{serviceName}</p>
          </div>
          {phase !== 'searching' && (
            <div className="bg-green-500 text-white px-3 py-1 rounded-lg text-[10px] font-black">
              OTP: 5824
            </div>
          )}
        </div>
      </div>

      {/* Bottom Card - Rapido Style */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-2xl p-6 z-10">
        {phase === 'searching' ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-2xl">🔍</span>
            </div>
            <p className="font-black text-slate-800 uppercase text-sm">Connecting to specialists...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-4xl">{driver.photo}</div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Specialist</p>
                <p className="text-lg font-black text-slate-900">{driver.name}</p>
                <p className="text-[10px] text-slate-400 font-bold">★ {driver.rating} • {driver.vehicle}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900">{eta}</p>
                <p className="text-[10px] text-slate-400 font-black uppercase">min away</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest ${
                phase === 'arrived' ? 'bg-green-500 text-white' : 'bg-slate-900 text-white'
              }`}
            >
              {phase === 'arrived' ? 'Complete Service' : 'Close Tracking'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TrackingOverlay;
