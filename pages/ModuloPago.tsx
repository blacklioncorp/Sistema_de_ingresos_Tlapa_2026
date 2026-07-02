
import React, { useState, useEffect } from 'react';
import {
  Search, Droplet, Map, Store, CheckCircle, AlertCircle,
  CreditCard, Printer, ChevronRight, User, Home, ArrowLeft,
  Clock, Edit2, Plus, Tag, ChevronDown, Trash2, Box, Info,
  DollarSign, Calendar, CalendarDays
} from 'lucide-react';
import { ContribuyentePerfil, DeudaItem, Predio, TomaAgua, LicenciaComercio } from '../types';

import { api } from '../services/api';

interface ModuloPagoProps {
  tipo: 'agua' | 'catastro' | 'comercio';
}

const ModuloPago: React.FC<ModuloPagoProps> = ({ tipo }) => {
  const [query, setQuery] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState<any[]>([]);
  const [perfil, setPerfil] = useState<ContribuyentePerfil | null>(null);
  const [cargosEnSesion, setCargosEnSesion] = useState<(DeudaItem & { activoRef?: string, concepto_id?: number, frecuencia?: string, anio_fiscal?: number, mes_fiscal?: number })[]>([]);
  const [loading, setLoading] = useState(false);

  const [conceptoSeleccionadoId, setConceptoSeleccionadoId] = useState<string>("");
  const [montoSugerido, setMontoSugerido] = useState<string>("0.00");
  const [activoSeleccionadoId, setActivoSeleccionadoId] = useState<string>("general");
  const [frecuenciaSeleccionada, setFrecuenciaSeleccionada] = useState<string>('');
  const [anioFiscal, setAnioFiscal] = useState<number>(new Date().getFullYear());
  const [mesFiscal, setMesFiscal] = useState<number>(new Date().getMonth() + 1);

  const [refQuery, setRefQuery] = useState('');
  const [loadingRef, setLoadingRef] = useState(false);
  const [referenciaFolioAplicada, setReferenciaFolioAplicada] = useState<string | null>(null);

  const config = {
    agua: { title: 'Agua Potable', icon: Droplet, color: 'text-blue-600', bg: 'bg-blue-50', accent: 'blue' },
    catastro: { title: 'Catastro', icon: Map, color: 'text-emerald-700', bg: 'bg-emerald-50', accent: 'emerald' },
    comercio: { title: 'Comercio', icon: Store, color: 'text-orange-600', bg: 'bg-orange-50', accent: 'orange' }
  };

  const { title, icon: Icon, color, bg, accent } = config[tipo];
  const [conceptosDisponibles, setConceptosDisponibles] = useState<any[]>([]);

  useEffect(() => {
    const fetchConceptos = async () => {
      try {
        const result = await api.getConceptosPorArea(tipo);
        setConceptosDisponibles(result.conceptos || []);
      } catch (err) {
        console.error("Error cargando conceptos", err);
      }
    };
    fetchConceptos();
  }, [tipo]);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setResultadosBusqueda([]);

    try {
      const resp = await api.buscarContribuyentesMulti(query);
      if (resp.contribuyentes && resp.contribuyentes.length > 0) {
        setResultadosBusqueda(resp.contribuyentes);
        setPerfil(null);
        setCargosEnSesion([]);
      } else {
        alert("No se encontraron resultados para ese Nombre o RFC.");
      }
    } catch (err: any) {
      alert("Error buscando el contribuyente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarPerfil = async (id: number) => {
    setLoading(true);
    setResultadosBusqueda([]);
    try {
      const resp = await api.getContribuyentePorId(id);
      setPerfil(resp.perfil);
      setCargosEnSesion([]);
      setReferenciaFolioAplicada(null);
    } catch (err: any) {
      alert("Error al cargar el expediente del contribuyente.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarReferencia = async (folioToSearch = refQuery) => {
    if (!folioToSearch) return;
    setLoadingRef(true);
    try {
      const resp = await api.getReferenciaKiosco(folioToSearch);
      if (resp.success) {
        const { referencia } = resp;
        
        // Cargar el perfil del contribuyente completo
        const respPerfil = await api.getContribuyentePorId(referencia.contribuyente_id);
        setPerfil(respPerfil.perfil);

        // Mapear detalles de referencia al carrito
        const cargosMapeados = referencia.detalles.map((d: any) => ({
          id: Math.floor(Math.random() * 100000),
          descripcion: d.nombre,
          monto: parseFloat(d.monto),
          estado: 'pendiente',
          fecha_vencimiento: new Date().toISOString().split('T')[0],
          activoRef: d.activo_ref !== 'general' ? d.activo_ref : undefined,
          concepto_id: d.concepto_id,
          frecuencia: d.frecuencia,
          anio_fiscal: d.anio_fiscal,
          mes_fiscal: d.mes_fiscal
        }));

        setCargosEnSesion(cargosMapeados);
        setReferenciaFolioAplicada(referencia.folio);
        setRefQuery('');
        setResultadosBusqueda([]);
      }
    } catch (err: any) {
      alert(err.message || 'Error al buscar la referencia.');
    } finally {
      setLoadingRef(false);
    }
  };

  const handleConceptoSelect = (id: string) => {
    setConceptoSeleccionadoId(id);
    const concepto = conceptosDisponibles.find(c => c.id === parseInt(id));
    if (concepto) {
      setMontoSugerido(concepto.precio.toFixed(2));
      setFrecuenciaSeleccionada(concepto.frecuencia_cobro || 'unico');
    } else {
      setFrecuenciaSeleccionada('');
    }
  };

  const addSelectedConcept = () => {
    if (!perfil || !conceptoSeleccionadoId) return;

    const conceptoObj = conceptosDisponibles.find(c => c.id === parseInt(conceptoSeleccionadoId));
    if (!conceptoObj) return;

    const nuevoCargo: DeudaItem & { activoRef?: string, concepto_id?: number, frecuencia?: string, anio_fiscal?: number, mes_fiscal?: number } = {
      id: Math.floor(Math.random() * 100000),
      descripcion: conceptoObj.nombre + (frecuenciaSeleccionada === 'mensual'
        ? ` (${MESES_NOMBRES[mesFiscal - 1]} ${anioFiscal})`
        : frecuenciaSeleccionada === 'anual'
          ? ` (Año ${anioFiscal})`
          : ''),
      monto: parseFloat(montoSugerido) || 0,
      estado: 'pendiente',
      fecha_vencimiento: new Date().toISOString().split('T')[0],
      activoRef: activoSeleccionadoId !== 'general' ? activoSeleccionadoId : undefined,
      concepto_id: conceptoObj.id,
      frecuencia: frecuenciaSeleccionada,
      anio_fiscal: frecuenciaSeleccionada !== 'unico' ? anioFiscal : undefined,
      mes_fiscal: frecuenciaSeleccionada === 'mensual' ? mesFiscal : undefined
    };

    setCargosEnSesion([...cargosEnSesion, nuevoCargo]);
    setConceptoSeleccionadoId("");
    setMontoSugerido("0.00");
    setFrecuenciaSeleccionada('');
  };

  const updateCargoMonto = (id: number, nuevoMonto: string) => {
    const valor = parseFloat(nuevoMonto) || 0;
    setCargosEnSesion(cargosEnSesion.map(c => c.id === id ? { ...c, monto: valor } : c));
  };

  const autoCargarCargosActivo = (ref: string) => {
    const conceptoBase = conceptosDisponibles[0];
    if (conceptoBase) {
      const nuevoCargo: DeudaItem & { activoRef?: string, concepto_id?: number } = {
        id: Math.floor(Math.random() * 100000),
        descripcion: conceptoBase.nombre,
        monto: conceptoBase.precio,
        estado: 'pendiente',
        fecha_vencimiento: new Date().toISOString().split('T')[0],
        activoRef: ref,
        concepto_id: conceptoBase.id
      };
      setCargosEnSesion([...cargosEnSesion, nuevoCargo]);
      setActivoSeleccionadoId(ref);
    }
  };

  const removeCargo = (id: number) => {
    setCargosEnSesion(cargosEnSesion.filter(c => c.id !== id));
  };

  const totalPagar = cargosEnSesion.reduce((acc, c) => acc + c.monto, 0);

  const handleProcesarPago = async () => {
    if (!perfil || cargosEnSesion.length === 0) return;

    const userStr = localStorage.getItem('tlapa_user');
    const user = userStr ? JSON.parse(userStr) : { id: 1 };

    setLoading(true);
    try {
      const payload = {
        cajero_id: user.id,
        contribuyente_id: perfil.id,
        monto_total: totalPagar,
        notas: referenciaFolioAplicada 
          ? `Pago de Referencia Kiosco #${referenciaFolioAplicada} procesado en módulo ${title}` 
          : `Pago procesado en módulo ${title}`,
        referencia_folio: referenciaFolioAplicada || undefined,
        carrito: cargosEnSesion.map(c => ({
          concepto_id: c.concepto_id || conceptosDisponibles[0]?.id || 1,
          monto: c.monto,
          activo_ref: c.activoRef || 'general',
          frecuencia: c.frecuencia || 'unico',
          anio_fiscal: c.anio_fiscal,
          mes_fiscal: c.mes_fiscal
        }))
      };

      const resp = await api.procesarPago(payload);
      alert(`¡Pago exitoso! Folio BBDD: ${resp.folio}`);
      setCargosEnSesion([]);
      setReferenciaFolioAplicada(null);
    } catch (err: any) {
      alert(err.message || 'Error procesando el cobro en el servidor');
    } finally {
      setLoading(false);
    }
  };

  const getActivosMódulo = () => {
    if (!perfil) return [];
    if (tipo === 'agua') return perfil.tomas.map(t => ({ id: t.numero_contrato, label: `Contrato: ${t.numero_contrato}`, sub: t.direccion_toma }));
    if (tipo === 'catastro') return perfil.predios.map(p => ({ id: p.clave_catastral, label: `Clave: ${p.clave_catastral}`, sub: p.direccion_predio }));
    return perfil.licencias.map(l => ({ id: l.numero_licencia, label: l.nombre_negocio, sub: l.numero_licencia }));
  };

  const activosDisponibles = getActivosMódulo();

  const MESES_NOMBRES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const anioActual = new Date().getFullYear();
  const aniosDisponibles = [anioActual - 2, anioActual - 1, anioActual, anioActual + 1];

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl ${bg} ${color}`}>
          <Icon size={32} className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Módulo de {title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium font-serif">Ajuste Manual de Cobros e Ingresos</p>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 relative space-y-6">
        {/* BUSCADOR DE REFERENCIA DE KIOSCO */}
        <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex items-center gap-3 text-emerald-800 flex-shrink-0">
            <Printer size={22} className="text-emerald-700" />
            <div>
              <p className="text-sm font-bold">Escanear Ticket de Kiosco</p>
              <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Lector de Código de Barras / QR</p>
            </div>
          </div>
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Escanee o ingrese el folio de la referencia (ej. 260701...)"
              className="w-full px-4 py-3 bg-white border border-emerald-250 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/15 font-mono font-bold text-slate-800 text-sm"
              value={refQuery}
              onChange={(e) => setRefQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarReferencia()}
            />
          </div>
          <button
            onClick={() => handleBuscarReferencia()}
            disabled={loadingRef || !refQuery}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs uppercase tracking-wider font-bold rounded-xl disabled:opacity-50 transition-all active:scale-95"
          >
            {loadingRef ? 'Buscando...' : 'Cargar Referencia'}
          </button>
        </div>

        <div className="relative flex items-center justify-center shrink-0">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-150"></div></div>
          <span className="relative px-4 bg-white text-xs font-bold text-slate-400 uppercase tracking-widest">O Buscar Contribuyente Manualmente</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por RFC o Nombre..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full sm:w-auto px-10 py-4 bg-emerald-700 text-white font-bold rounded-2xl hover:bg-emerald-800 shadow-lg shadow-emerald-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {resultadosBusqueda.length > 0 && (
          <div className="absolute left-0 right-0 top-[110%] bg-white border border-emerald-100 shadow-2xl rounded-2xl overflow-hidden z-50">
            <div className="bg-emerald-50 px-6 py-2 border-b border-emerald-100 flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                Seleccione un Contribuyente
              </span>
              <button
                onClick={() => setResultadosBusqueda([])}
                className="text-xs text-slate-500 hover:text-slate-700 font-bold"
              >
                Cerrar
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {resultadosBusqueda.map((c) => (
                <button
                  key={c.id}
                  onClick={() => seleccionarPerfil(c.id)}
                  className="w-full flex items-center justify-between p-4 border-b border-slate-50 hover:bg-emerald-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.nombre_completo}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{c.rfc}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-emerald-500 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {perfil && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-950 text-white rounded-xl flex items-center justify-center font-bold">
                  <User size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 leading-tight truncate">{perfil.nombre_completo}</h3>
                  <p className="text-[10px] font-mono text-emerald-700 font-bold uppercase tracking-wider">{perfil.rfc}</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-bold uppercase tracking-widest">Activo</div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Activos Vinculados</h4>
              <div className="space-y-3">
                {activosDisponibles.map((activo) => (
                  <button
                    key={activo.id}
                    onClick={() => autoCargarCargosActivo(activo.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left group ${activoSeleccionadoId === activo.id ? `border-${accent}-500 bg-${accent}-50` : 'border-slate-100 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${activoSeleccionadoId === activo.id ? `bg-${accent}-600 text-white` : 'bg-slate-100 text-slate-400'}`}>
                        <Box size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{activo.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium truncate">{activo.sub}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm ring-2 ring-emerald-500/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><Plus size={20} /></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Nuevo Cargo</h3>
                  <p className="text-[10px] text-slate-500 font-medium">Configure el monto a cobrar</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Concepto Sugerido</label>
                  <div className="relative">
                    <select
                      value={conceptoSeleccionadoId}
                      onChange={(e) => handleConceptoSelect(e.target.value)}
                      className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl appearance-none focus:ring-4 focus:ring-emerald-500/10 text-xs font-bold text-slate-700 outline-none"
                    >
                      <option value="">-- Seleccionar --</option>
                      {conceptosDisponibles.map((c) => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Importe a Cobrar</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                        <DollarSign size={14} />
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={montoSugerido}
                        onChange={(e) => setMontoSugerido(e.target.value)}
                        className="w-full pl-9 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-mono font-bold text-slate-800 outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Activo Destino</label>
                    <select
                      value={activoSeleccionadoId}
                      onChange={(e) => setActivoSeleccionadoId(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none"
                    >
                      <option value="general">Uso General</option>
                      {activosDisponibles.map((a) => (
                        <option key={a.id} value={a.id}>{a.id}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SELECTOR DE PERIODO FISCAL */}
                {frecuenciaSeleccionada === 'mensual' && (
                  <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDays size={14} className="text-blue-600" />
                      <label className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Periodo Mensual a Pagar</label>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {MESES_NOMBRES.map((mes, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMesFiscal(idx + 1)}
                          className={`px-2 py-2 rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all ${mesFiscal === idx + 1
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'bg-white text-slate-500 hover:bg-blue-50 border border-slate-100'
                            }`}
                        >
                          {mes.substring(0, 3)}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-blue-500" />
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Año Fiscal</label>
                      <div className="flex gap-1.5 ml-auto">
                        {aniosDisponibles.map(a => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => setAnioFiscal(a)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${anioFiscal === a
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-white text-slate-500 hover:bg-blue-50 border border-slate-100'
                              }`}
                          >
                            {a}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[8px] text-blue-500 font-medium">⚠️ Cobrando: {MESES_NOMBRES[mesFiscal - 1]} {anioFiscal}</p>
                  </div>
                )}

                {frecuenciaSeleccionada === 'anual' && (
                  <div className="space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={14} className="text-emerald-600" />
                      <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Año Fiscal a Pagar</label>
                    </div>
                    <div className="flex gap-2">
                      {aniosDisponibles.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setAnioFiscal(a)}
                          className={`flex-1 px-3 py-3 rounded-xl text-xs font-bold transition-all ${anioFiscal === a
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                            : 'bg-white text-slate-500 hover:bg-emerald-50 border border-slate-100'
                            }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                    <p className="text-[8px] text-emerald-500 font-medium">📅 Cobrando año fiscal: {anioFiscal}</p>
                  </div>
                )}

                {frecuenciaSeleccionada === 'unico' && (
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <Info size={12} className="text-slate-400" />
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pago único — No requiere periodo fiscal</p>
                  </div>
                )}

                <button
                  onClick={addSelectedConcept}
                  disabled={!conceptoSeleccionadoId}
                  className="w-full py-4 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30 text-xs uppercase tracking-widest active:scale-95"
                >
                  <Plus size={18} /> Añadir al Carrito
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col min-h-[600px]">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-base">Carrito de Cobro</h4>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest flex items-center gap-1"><Info size={12} /> Los montos son editables individualmente</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Consolidado</p>
                  <p className="text-3xl font-mono font-bold text-emerald-800">
                    ${totalPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto">
                {cargosEnSesion.length > 0 ? (
                  cargosEnSesion.map((deuda) => (
                    <div key={deuda.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-slate-100 bg-white gap-4 group/deuda hover:border-emerald-200 transition-all">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`p-2.5 rounded-xl ${bg} ${color}`}><Tag size={18} /></div>
                        <div className="space-y-1 flex-1">
                          <h5 className="font-bold text-slate-800 text-sm leading-tight">{deuda.descripcion}</h5>
                          <div className="flex items-center gap-2 flex-wrap">
                            {deuda.activoRef && (
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md bg-${accent}-50 text-${accent}-700 border border-${accent}-100 flex items-center gap-1`}>
                                <Box size={8} /> Ref: {deuda.activoRef}
                              </span>
                            )}
                            {deuda.frecuencia === 'mensual' && deuda.mes_fiscal && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                                <CalendarDays size={8} /> {MESES_NOMBRES[(deuda.mes_fiscal || 1) - 1]?.substring(0, 3)} {deuda.anio_fiscal}
                              </span>
                            )}
                            {deuda.frecuencia === 'anual' && deuda.anio_fiscal && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                                <Calendar size={8} /> Año {deuda.anio_fiscal}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</div>
                          <input
                            type="number"
                            step="0.01"
                            value={deuda.monto}
                            onChange={(e) => updateCargoMonto(deuda.id, e.target.value)}
                            className="w-32 pl-7 pr-3 py-2 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-emerald-500 focus:bg-white text-right font-mono font-bold text-slate-800 text-sm outline-none transition-all shadow-inner"
                          />
                        </div>
                        <button
                          onClick={() => removeCargo(deuda.id)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <CreditCard size={48} className="text-slate-300 mb-4" />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin Cargos en la Sesión</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
                <button disabled={cargosEnSesion.length === 0} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 disabled:opacity-50">
                  <Printer size={16} /> Imprimir Pre-ticket
                </button>
                <button onClick={handleProcesarPago} disabled={cargosEnSesion.length === 0 || loading} className="px-10 py-3 bg-emerald-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-800 shadow-xl shadow-emerald-200 active:scale-95 disabled:opacity-50">
                  <CreditCard size={16} /> {loading ? "Procesando..." : "Procesar Pago Consolidado"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!perfil && !loading && (
        <div className="py-32 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
            <Search size={32} className="text-slate-200" />
          </div>
          <h3 className="text-xl font-bold text-slate-400 font-serif">Panel de Recaudación Activo</h3>
          <p className="text-sm text-slate-300 mt-2 max-w-xs leading-relaxed uppercase font-bold tracking-widest text-[10px]">Busque un contribuyente para iniciar</p>
        </div>
      )}
    </div>
  );
};

export default ModuloPago;
