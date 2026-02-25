import React, { useState, useEffect } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { Droplet, Home, Store, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

// ⚠️ REEMPLAZA ESTA CLAVE CON TU API KEY DE GOOGLE CLOUD CONSOLE
const GOOGLE_MAPS_API_KEY = 'TU_API_KEY_AQUI';
const TLAPA_CENTER = { lat: 17.5461, lng: -98.5762 };

export default function MapaCobertura() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({ agua: [], catastro: [], comercio: [] });
    const [filtros, setFiltros] = useState({
        agua: true, catastro: true, comercio: true,
        moroso: true, cumplidor: true
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

    const toggleFiltro = (tipo: 'agua' | 'catastro' | 'comercio' | 'moroso' | 'cumplidor') => {
        setFiltros(prev => ({ ...prev, [tipo]: !prev[tipo] }));
        setSelectedAsset(null); // Cerrar InfoWindow si se apaga una capa
    };

    // Íconos personalizados o colores simples
    const getMarkerIcon = (estado: string, tipo: string) => {
        if (estado === 'moroso') return 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
        if (estado === 'cumplidor') return 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';

        switch (tipo) {
            case 'agua': return 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';
            case 'catastro': return 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
            case 'comercio': return 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png';
            default: return 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
        }
    };

    const allAssets = [
        ...(filtros.agua ? data.agua : []),
        ...(filtros.catastro ? data.catastro : []),
        ...(filtros.comercio ? data.comercio : [])
    ].filter((asset: any) => {
        if (asset.estado_pago === 'moroso' && !filtros.moroso) return false;
        if (asset.estado_pago === 'cumplidor' && !filtros.cumplidor) return false;
        // Si el estado es 'desconocido', lo mostramos siempre que su capa esté activa
        return true;
    });

    return (
        <div className="h-[calc(100vh-80px)] w-full flex flex-col space-y-4 animate-in fade-in duration-500">

            {/* HEADER DE FILTROS */}
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-900 text-white rounded-xl shadow-lg shadow-emerald-900/20">
                        <Layers size={22} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Mapa de Cobertura</h1>
                        <p className="text-xs text-slate-500 font-medium">Filtrar activos por departamento</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => toggleFiltro('agua')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all font-bold text-sm ${filtros.agua ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                        <Droplet size={18} />
                        Agua Potable ({data.agua.length})
                    </button>
                    <button
                        onClick={() => toggleFiltro('catastro')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all font-bold text-sm ${filtros.catastro ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                        <Home size={18} />
                        Catastro ({data.catastro.length})
                    </button>
                    <button
                        onClick={() => toggleFiltro('comercio')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all font-bold text-sm ${filtros.comercio ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                        <Store size={18} />
                        Comercio ({data.comercio.length})
                    </button>
                    <div className="w-[2px] h-8 bg-slate-200 mx-2"></div>
                    <button
                        onClick={() => toggleFiltro('moroso')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all font-bold text-sm ${filtros.moroso ? 'border-red-600 bg-red-50 text-red-800 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                        <AlertCircle size={18} />
                        Morosos
                    </button>
                    <button
                        onClick={() => toggleFiltro('cumplidor')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all font-bold text-sm ${filtros.cumplidor ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                    >
                        <CheckCircle2 size={18} />
                        Cumplidores
                    </button>
                </div>
            </div>

            {/* CONTENEDOR DEL MAPA */}
            <div className="flex-1 w-full bg-slate-100 rounded-3xl shadow-inner border-2 border-slate-200 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-700 rounded-full animate-spin"></div>
                    </div>
                )}

                <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                    <Map
                        defaultCenter={TLAPA_CENTER}
                        defaultZoom={15}
                        gestureHandling="greedy"
                        disableDefaultUI={false}
                        mapTypeControl={true}
                        streetViewControl={false}
                        fullscreenControl={true}
                        style={{ width: '100%', height: '100%' }}
                        onClick={() => setSelectedAsset(null)}
                    >
                        {allAssets.map((asset: any) => (
                            <Marker
                                key={`${asset.tipo}-${asset.id}`}
                                position={{ lat: Number(asset.latitud), lng: Number(asset.longitud) }}
                                icon={getMarkerIcon(asset.estado_pago, asset.tipo)}
                                onClick={() => setSelectedAsset(asset)}
                            />
                        ))}

                        {selectedAsset && (
                            <InfoWindow
                                position={{ lat: Number(selectedAsset.latitud), lng: Number(selectedAsset.longitud) }}
                                onCloseClick={() => setSelectedAsset(null)}
                            >
                                <div className="p-1 min-w-[200px]">
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 px-2 py-1 rounded-md inline-block mr-2
                    ${selectedAsset.tipo === 'agua' ? 'bg-blue-100 text-blue-800' :
                                            selectedAsset.tipo === 'catastro' ? 'bg-purple-100 text-purple-800' :
                                                'bg-amber-100 text-amber-800'}`}
                                    >
                                        {selectedAsset.tipo}
                                    </div>
                                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 px-2 py-1 rounded-md inline-block
                    ${selectedAsset.estado_pago === 'moroso' ? 'bg-red-100 text-red-800' :
                                            selectedAsset.estado_pago === 'cumplidor' ? 'bg-emerald-100 text-emerald-800' :
                                                'bg-slate-100 text-slate-800'}`}
                                    >
                                        {selectedAsset.estado_pago}
                                    </div>
                                    <h3 className="font-bold text-slate-800 text-base mb-1">{selectedAsset.contribuyente}</h3>
                                    <p className="text-sm text-slate-600 mb-1"><span className="font-bold text-slate-400">ID/Cve:</span> {selectedAsset.identificador}</p>
                                    <p className="text-sm text-slate-600"><span className="font-bold text-slate-400">Detalle:</span> <span className="capitalize">{selectedAsset.extradata}</span></p>
                                </div>
                            </InfoWindow>
                        )}
                    </Map>
                </APIProvider>
            </div>

        </div>
    );
}
