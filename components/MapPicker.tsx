import React, { useState, useCallback } from 'react';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';

// ⚠️ REEMPLAZA ESTA CLAVE CON TU API KEY DE GOOGLE CLOUD CONSOLE
const GOOGLE_MAPS_API_KEY = 'TU_API_KEY_AQUI';

// Coordenadas de Tlapa de Comonfort, Guerrero
const TLAPA_CENTER = { lat: 17.5461, lng: -98.5762 };

interface MapPickerProps {
    onLocationSelect: (coords: { lat: number; lng: number }) => void;
    initialPosition?: { lat: number; lng: number };
    height?: string;
}

const MapPicker: React.FC<MapPickerProps> = ({
    onLocationSelect,
    initialPosition,
    height = '280px'
}) => {
    const [markerPosition, setMarkerPosition] = useState(initialPosition || TLAPA_CENTER);

    const handleMarkerDrag = useCallback((e: any) => {
        if (e.latLng) {
            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setMarkerPosition(newPos);
            onLocationSelect(newPos);
        }
    }, [onLocationSelect]);

    const handleMapClick = useCallback((e: any) => {
        if (e.detail?.latLng) {
            const newPos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
            setMarkerPosition(newPos);
            onLocationSelect(newPos);
        }
    }, [onLocationSelect]);

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <MapPin size={14} className="text-emerald-600" />
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Geolocalización (Arrastra el pin o haz clic en el mapa)
                </label>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner" style={{ height }}>
                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                    <Map
                        defaultCenter={markerPosition}
                        defaultZoom={15}
                        gestureHandling="greedy"
                        disableDefaultUI={false}
                        mapTypeControl={true}
                        streetViewControl={false}
                        fullscreenControl={false}
                        onClick={handleMapClick}
                        style={{ width: '100%', height: '100%' }}
                    >
                        <Marker
                            position={markerPosition}
                            draggable={true}
                            onDrag={handleMarkerDrag}
                        />
                    </Map>
                </APIProvider>
            </div>

            <div className="flex items-center justify-between px-1">
                <p className="text-[9px] text-slate-400 font-mono">
                    Lat: {markerPosition.lat.toFixed(6)}, Lng: {markerPosition.lng.toFixed(6)}
                </p>
                <span className="text-[8px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Google Maps
                </span>
            </div>
        </div>
    );
};

export default MapPicker;
