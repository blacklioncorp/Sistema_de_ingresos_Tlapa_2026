import React, { useState, useCallback, useEffect, useRef } from 'react';
import { APIProvider, Map, Marker, useMapsLibrary, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { Search, MapPin } from 'lucide-react';

const TLAPA_CENTER = { lat: 17.5461, lng: -98.5762 };

interface MapPickerProps {
    onLocationSelect: (coords: { lat: number; lng: number }, address: string) => void;
    initialPosition?: { lat: number; lng: number };
    initialAddress?: string;
    height?: string;
}

// Sub-componente para el Autocomplete
const PlaceAutocomplete = ({ onPlaceSelect, initialValue }: { onPlaceSelect: (place: google.maps.places.PlaceResult) => void, initialValue?: string }) => {
    const [inputValue, setInputValue] = useState(initialValue || '');
    const places = useMapsLibrary('places');
    const inputRef = useRef<HTMLInputElement>(null);
    const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (!places || !inputRef.current) return;

        const options = {
            fields: ['geometry', 'formatted_address', 'name'],
            componentRestrictions: { country: 'mx' }
        };

        const ac = new places.Autocomplete(inputRef.current, options);
        setAutocomplete(ac);

        ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (place.geometry?.location) {
                onPlaceSelect(place);
                setInputValue(place.formatted_address || '');
            }
        });

        return () => {
            if (autocomplete) {
                google.maps.event.clearInstanceListeners(autocomplete);
            }
        };
    }, [places]);

    useEffect(() => {
        if (initialValue !== undefined) {
            setInputValue(initialValue);
        }
    }, [initialValue]);

    return (
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                <Search size={18} />
            </div>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Busca una dirección (ej. Calle Morelos, Tlapa)..."
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-600 transition-all font-medium text-slate-700 placeholder:text-slate-400 outline-none"
            />
        </div>
    );
};

const MapPicker: React.FC<MapPickerProps> = ({
    onLocationSelect,
    initialPosition,
    initialAddress = '',
    height = '400px'
}) => {
    const [markerPosition, setMarkerPosition] = useState(initialPosition || TLAPA_CENTER);
    const [address, setAddress] = useState(initialAddress);
    const maps = useMapsLibrary('maps');
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

    useEffect(() => {
        if (!maps) return;
        setGeocoder(new google.maps.Geocoder());
    }, [maps]);

    const reverseGeocode = useCallback((lat: number, lng: number) => {
        if (!geocoder) return;

        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
                const formattedAddress = results[0].formatted_address;
                setAddress(formattedAddress);
                onLocationSelect({ lat, lng }, formattedAddress);
            } else {
                onLocationSelect({ lat, lng }, "");
            }
        });
    }, [geocoder, onLocationSelect]);

    const handleMapClick = (e: MapMouseEvent) => {
        if (e.detail.latLng) {
            const newPos = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
            setMarkerPosition(newPos);
            reverseGeocode(newPos.lat, newPos.lng);
        }
    };

    const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setMarkerPosition(newPos);
            reverseGeocode(newPos.lat, newPos.lng);
        }
    };

    const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
        if (place.geometry?.location) {
            const newPos = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
            };
            setMarkerPosition(newPos);
            const addr = place.formatted_address || '';
            setAddress(addr);
            onLocationSelect(newPos, addr);
        }
    };

    return (
        <div className="space-y-4">
            <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} initialValue={address} />
            
            <div className="relative group overflow-hidden rounded-3xl border-2 border-slate-100 shadow-sm" style={{ height }}>
                <Map
                    defaultCenter={markerPosition}
                    center={markerPosition}
                    defaultZoom={17}
                    gestureHandling={'greedy'}
                    disableDefaultUI={false}
                    mapTypeControl={false}
                    streetViewControl={false}
                    fullscreenControl={true}
                    onClick={handleMapClick}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Marker 
                        position={markerPosition} 
                        draggable={true} 
                        onDragEnd={handleMarkerDragEnd}
                        animation={google.maps.Animation.DROP}
                    />
                </Map>
                
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/50 flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <MapPin size={16} />
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Haz clic o arrastra para ajustar
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 px-2">
                <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Latitud</span>
                    <span className="text-xs font-mono text-slate-600">{markerPosition.lat.toFixed(6)}</span>
                </div>
                <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Longitud</span>
                    <span className="text-xs font-mono text-slate-600">{markerPosition.lng.toFixed(6)}</span>
                </div>
            </div>
        </div>
    );
};

export default MapPicker;
