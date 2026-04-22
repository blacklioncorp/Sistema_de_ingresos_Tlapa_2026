import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Map, useMap, InfoWindow } from '@vis.gl/react-google-maps';
import { useNavigate } from 'react-router-dom';
import { Droplet, Home, Store, Layers, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { api } from '../services/api';

const TLAPA_CENTER = { lat: 17.5461, lng: -98.5762 };

// Componente para manejar los marcadores con clustering
const MarkersWithClustering = ({ assets, onMarkerClick }: { assets: any[], onMarkerClick: (asset: any) => void }) => {
    const map = useMap();
    const clusterer = useRef<MarkerClusterer | null>(null);

    // Inicializar el clusterer
    useEffect(() => {
        if (!map) return;
        if (!clusterer.current) {
            clusterer.current = new MarkerClusterer({ map });
        }
    }, [map]);

    // Actualizar marcadores cuando cambian los assets
    useEffect(() => {
        if (!clusterer.current || !map) return;

        // Limpiar marcadores anteriores
        clusterer.current.clearMarkers();
        
        const markerArray: google.maps.Marker[] = [];

        assets.forEach(asset => {
            const marker = new google.maps.Marker({
                position: { lat: Number(asset.latitud), lng: Number(asset.longitud) },
                icon: getMarkerIcon(asset.estado_pago, asset.tipo),
                title: asset.contribuyente
            });

            marker.addListener('click', () => onMarkerClick(asset));
            markerArray.push(marker);
        });

        clusterer.current.addMarkers(markerArray);

        return () => {
            if (clusterer.current) {
                clusterer.current.clearMarkers();
            }
        };
    }, [assets, map]);

    return null;
};

const getMarkerIcon = (estado: string, tipo: string) => {
    // Colores basados en estado
    let color = 'blue';
    if (estado === 'moroso') color = 'red';
    else if (estado === 'proximo') color = 'orange';
    else if (estado === 'cumplidor') color = 'green';
    else {
        // Fallback por tipo si no hay estado claro
        if (tipo === 'catastro') color = 'purple';
        if (tipo === 'comercio') color = 'yellow';
    }

    return `http://maps.google.com/mapfiles/ms/icons/${color}-dot.png`;
};

export default function MapaCobertura() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ agua: [], catastro: [], comercio: [] });
    const [filtros, setFiltros] = useState({
        agua: true, catastro: true, comercio: true,
        moroso: true, proximo: true, cumplidor: true
    });
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    useEffect(() => {
        cargarCobertura();
    }, []);

    const cargarCobertura = async () => {
        try {
            const res = await api.obtenerCobertura();
            if (res.success) {
                setData({
                    agua: res.agua || [],
                    catastro: res.catastro || [],
                    comercio: res.comercio || []
                });
            }
        } catch (error) {
            console.error("Error al cargar datos del mapa:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFiltro = (tipo: keyof typeof filtros) => {
        setFiltros(prev => ({ ...prev, [tipo]: !prev[tipo] }));
        setSelectedAsset(null);
    };

    // Filtrado optimizado con useMemo
    const filteredAssets = useMemo(() => {
        const assets = [
            ...(filtros.agua ? data.agua : []),
            ...(filtros.catastro ? data.catastro : []),
            ...(filtros.comercio ? data.comercio : [])
        ];

        return assets.filter((asset: any) => {
            if (asset.estado_pago === 'moroso' && !filtros.moroso) return false;
            if (asset.estado_pago === 'proximo' && !filtros.proximo) return false;
            if (asset.estado_pago === 'cumplidor' && !filtros.cumplidor) return false;
            return true;
        });
    }, [data, filtros]);

    return (
        <div className="h-[calc(100vh-80px)] w-full flex flex-col space-y-4 animate-in fade-in duration-500 p-2">
            
            {/* HEADER DE FILTROS */}
            <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-900 text-white rounded-2xl shadow-xl shadow-emerald-900/20">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Mapa de Cobertura</h1>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tlapa de Comonfort • Guerrero</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    <button
                        onClick={() => toggleFiltro('agua')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${filtros.agua ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Droplet size={14} /> Agua ({data.agua.length})
                    </button>
                    <button
                        onClick={() => toggleFiltro('catastro')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${filtros.catastro ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Home size={14} /> Catastro ({data.catastro.length})
                    </button>
                    <button
                        onClick={() => toggleFiltro('comercio')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${filtros.comercio ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Store size={14} /> Comercio ({data.comercio.length})
                    </button>
                    
                    <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
                    
                    <button
                        onClick={() => toggleFiltro('moroso')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${filtros.moroso ? 'bg-red-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <AlertCircle size={14} /> Morosos
                    </button>
                    <button
                        onClick={() => toggleFiltro('proximo')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${filtros.proximo ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <Clock size={14} /> Próximos
                    </button>
                    <button
                        onClick={() => toggleFiltro('cumplidor')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${filtros.cumplidor ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                        <CheckCircle2 size={14} /> Cumplidores
                    </button>
                </div>
            </div>

            {/* CONTENEDOR DEL MAPA */}
            <div className="flex-1 w-full bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center">
                        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-bold text-emerald-900/60 uppercase tracking-widest animate-pulse">Cargando Mapa...</p>
                    </div>
                )}

                <Map
                    defaultCenter={TLAPA_CENTER}
                    defaultZoom={15}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    style={{ width: '100%', height: '100%' }}
                    onClick={() => setSelectedAsset(null)}
                >
                    <MarkersWithClustering 
                        assets={filteredAssets} 
                        onMarkerClick={(asset) => setSelectedAsset(asset)} 
                    />

                    {selectedAsset && (
                        <InfoWindow
                            position={{ lat: Number(selectedAsset.latitud), lng: Number(selectedAsset.longitud) }}
                            onCloseClick={() => setSelectedAsset(null)}
                        >
                            <div className="p-3 min-w-[240px] max-w-[300px]">
                                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                                        selectedAsset.tipo === 'agua' ? 'bg-blue-100 text-blue-700' :
                                        selectedAsset.tipo === 'catastro' ? 'bg-indigo-100 text-indigo-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {selectedAsset.tipo}
                                    </span>
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${
                                        selectedAsset.estado_pago === 'moroso' ? 'bg-red-100 text-red-700' :
                                        selectedAsset.estado_pago === 'proximo' ? 'bg-orange-100 text-orange-700' :
                                        'bg-emerald-100 text-emerald-700'
                                    }`}>
                                        {selectedAsset.estado_pago}
                                    </span>
                                </div>
                                
                                <h3 className="font-bold text-slate-800 text-lg leading-tight mb-3 italic">
                                    {selectedAsset.contribuyente}
                                </h3>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            <span className="text-slate-400">ID/Clave:</span> {selectedAsset.identificador}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                        <p className="text-xs text-slate-500 font-medium tracking-tight">
                                            <span className="text-slate-400">Detalle:</span> <span className="capitalize">{selectedAsset.extradata}</span>
                                        </p>
                                    </div>
                                    {selectedAsset.ultimo_vencimiento && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                            <p className="text-xs text-slate-500 font-medium tracking-tight">
                                                <span className="text-slate-400">Último Vencimiento:</span> {new Date(selectedAsset.ultimo_vencimiento).toLocaleDateString()}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => navigate(`/contribuyentes/${selectedAsset.contribuyente_id}`)}
                                    className="w-full mt-4 bg-slate-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                                >
                                    Ver Expediente Completo
                                </button>
                            </div>
                        </InfoWindow>
                    )}
                </Map>
            </div>
        </div>
    );
}
