import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Droplet, Map, Store, CheckCircle, AlertCircle,
  ArrowLeft, Printer, Info, Calendar, X, RefreshCw, User,
  FileText, Check, ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

// Teclado Virtual para Pantalla Táctil
interface VirtualKeyboardProps {
  onKeyPress: (char: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onClose: () => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress, onDelete, onClear, onClose }) => {
  const rows = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ' ', '@']
  ];

  return (
    <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-700 p-6 shadow-2xl animate-in slide-in-from-bottom duration-350 select-none">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Teclado en Pantalla habilitado
          </span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition-all border border-slate-700 active:scale-95"
          >
            Ocultar Teclado
          </button>
        </div>
        
        {rows.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-2">
            {row.map((char) => (
              <button
                key={char}
                onClick={() => onKeyPress(char)}
                className={`h-14 flex-1 font-bold text-lg rounded-xl transition-all active:scale-90 flex items-center justify-center ${
                  char === ' ' 
                    ? 'bg-slate-800 text-white hover:bg-slate-700 max-w-[250px]' 
                    : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
              >
                {char === ' ' ? 'ESPACIO' : char}
              </button>
            ))}
            {rIdx === 3 && (
              <>
                <button
                  onClick={onDelete}
                  className="h-14 px-6 bg-red-650/90 text-white hover:bg-red-700 font-bold rounded-xl active:scale-90 flex items-center gap-1.5"
                >
                  BORRAR
                </button>
                <button
                  onClick={onClear}
                  className="h-14 px-6 bg-slate-700 text-white hover:bg-slate-600 font-bold rounded-xl active:scale-90"
                >
                  LIMPIAR
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Kiosco() {
  const [step, setStep] = useState<'welcome' | 'search' | 'results' | 'print'>('welcome');
  const [query, setQuery] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Resultados de búsqueda
  const [multipleMatches, setMultipleMatches] = useState<any[]>([]);
  const [perfil, setPerfil] = useState<any | null>(null);
  
  // Selección de adeudos
  const [selectedDebts, setSelectedDebts] = useState<any[]>([]);
  
  // Referencia generada
  const [referenciaFolio, setReferenciaFolio] = useState('');
  const [referenciaId, setReferenciaId] = useState<number | null>(null);

  // Auto-regreso al inicio por inactividad
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const printRedirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [printCountdown, setPrintCountdown] = useState(25);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (step !== 'welcome' && step !== 'print') {
      inactivityTimerRef.current = setTimeout(() => {
        handleGoHome();
      }, 90000); // 1.5 minutos de inactividad
    }
  };

  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [step, query, selectedDebts]);

  // Manejo de redirección tras ticket
  useEffect(() => {
    if (step === 'print') {
      if (printRedirectTimerRef.current) clearInterval(printRedirectTimerRef.current);
      setPrintCountdown(25);
      const interval = setInterval(() => {
        setPrintCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleGoHome();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleGoHome = () => {
    setStep('welcome');
    setQuery('');
    setMultipleMatches([]);
    setPerfil(null);
    setSelectedDebts([]);
    setReferenciaFolio('');
    setReferenciaId(null);
    setShowKeyboard(false);
    setErrorMsg('');
  };

  const handleKeyPress = (char: string) => {
    setQuery((prev) => prev + char);
  };

  const handleDelete = () => {
    setQuery((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setQuery('');
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setMultipleMatches([]);
    setPerfil(null);

    try {
      const resp = await api.buscarAdeudosKiosco(query);
      if (resp.success) {
        if (resp.multiple) {
          setMultipleMatches(resp.contribuyentes);
          setStep('search'); // Se mantiene en search pero muestra la lista de opciones
        } else {
          setPerfil(resp.perfil);
          // Pre-seleccionar todos los cargos pendientes por defecto
          const allDebts: any[] = [];
          resp.perfil.predios?.forEach((p: any) => {
            p.deudas?.forEach((d: any) => allDebts.push({ ...d, area: 'catastro', clave_referencia: p.clave_catastral }));
          });
          resp.perfil.tomas?.forEach((t: any) => {
            t.deudas?.forEach((d: any) => allDebts.push({ ...d, area: 'agua', clave_referencia: t.numero_contrato }));
          });
          resp.perfil.licencias?.forEach((l: any) => {
            l.deudas?.forEach((d: any) => allDebts.push({ ...d, area: 'comercio', clave_referencia: l.numero_licencia }));
          });
          setSelectedDebts(allDebts);
          setStep('results');
          setShowKeyboard(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No se encontraron resultados para la búsqueda.');
    } finally {
      setLoading(false);
    }
  };

  const seleccionarContribuyenteDirecto = async (id: number) => {
    setLoading(true);
    setErrorMsg('');
    setMultipleMatches([]);
    try {
      const resp = await api.getContribuyentePorId(id);
      setPerfil(resp.perfil);
      const allDebts: any[] = [];
      resp.perfil.predios?.forEach((p: any) => {
        p.deudas?.forEach((d: any) => allDebts.push({ ...d, area: 'catastro', clave_referencia: p.clave_catastral }));
      });
      resp.perfil.tomas?.forEach((t: any) => {
        t.deudas?.forEach((d: any) => allDebts.push({ ...d, area: 'agua', clave_referencia: t.numero_contrato }));
      });
      resp.perfil.licencias?.forEach((l: any) => {
        l.deudas?.forEach((d: any) => allDebts.push({ ...d, area: 'comercio', clave_referencia: l.numero_licencia }));
      });
      setSelectedDebts(allDebts);
      setStep('results');
      setShowKeyboard(false);
    } catch (err: any) {
      setErrorMsg('Error al cargar la información del contribuyente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDebtSelection = (debt: any) => {
    setSelectedDebts(prev => 
      prev.some(d => d.id === debt.id)
        ? prev.filter(d => d.id !== debt.id)
        : [...prev, debt]
    );
  };

  const totalPagar = selectedDebts.reduce((acc, d) => acc + d.monto, 0);

  const handleGenerarReferencia = async () => {
    if (!perfil || selectedDebts.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        contribuyente_id: perfil.id,
        monto_total: totalPagar,
        carrito: selectedDebts.map(d => ({
          concepto_id: d.concepto_id,
          nombre: d.descripcion,
          monto: d.monto,
          activo_ref: d.clave_referencia,
          frecuencia: d.frecuencia,
          anio_fiscal: d.anio_fiscal,
          mes_fiscal: d.mes_fiscal
        }))
      };

      const resp = await api.crearReferenciaKiosco(payload);
      if (resp.success) {
        setReferenciaFolio(resp.folio);
        setReferenciaId(resp.id);
        setStep('print');

        // Disparar la impresión automática
        setTimeout(() => {
          window.print();
        }, 800);
      }
    } catch (err: any) {
      alert(err.message || 'Error al generar la referencia de pago.');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar deudas agrupadas por servicio
  const getAreaLabel = (area: string) => {
    if (area === 'catastro') return 'PREDIAL';
    if (area === 'agua') return 'AGUA POTABLE';
    return 'LICENCIA DE COMERCIO';
  };

  const getAreaColor = (area: string) => {
    if (area === 'catastro') return 'bg-emerald-600 text-white';
    if (area === 'agua') return 'bg-blue-600 text-white';
    return 'bg-amber-600 text-white';
  };

  const getAreaIcon = (area: string) => {
    if (area === 'catastro') return <Map className="w-5 h-5" />;
    if (area === 'agua') return <Droplet className="w-5 h-5" />;
    return <Store className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-950 text-white flex flex-col justify-between font-sans relative overflow-hidden select-none">
      
      {/* Estilos CSS específicos para la impresión térmica de 80mm */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-ticket-container, .print-ticket-container * {
            visibility: visible;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
          }
          .print-ticket-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 4mm;
            background: #ffffff;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          /* Ocultar encabezados del navegador en la impresión */
          @page {
            size: auto;
            margin: 0mm;
          }
        }
      `}</style>

      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-800/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* HEADER DE MUNICIPALIDAD */}
      <header className="py-6 px-10 bg-slate-900/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-white p-2 rounded-2xl flex items-center justify-center shadow-lg">
            <img
              src="https://lh3.googleusercontent.com/d/1Yc5hGNVkFDwXbld_sUq2V5ZNhjMc7sgb"
              alt="Logo Tlapa"
              className="w-12 h-12 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-wider text-emerald-400">Tlapa de Comonfort</h1>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">Kiosco Digital de Ingresos</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Gobierno Municipal • 2024 - 2027</span>
          <div className="h-1 w-16 bg-emerald-500 rounded-full ml-auto mt-1"></div>
        </div>
      </header>

      {/* RENDER POR PASOS */}

      {/* 1. BIENVENIDA */}
      {step === 'welcome' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10 animate-in fade-in duration-300">
          <div className="max-w-2xl space-y-8">
            <h2 className="text-5xl font-black text-white tracking-tight leading-tight uppercase font-serif">
              Consulta y Genera tu <br />
              <span className="text-emerald-400">Referencia de Pago</span>
            </h2>
            <p className="text-lg text-slate-300 font-medium max-w-lg mx-auto">
              Realiza la consulta de tus adeudos de Agua, Predial o Comercio e imprime tu recibo para pago en ventanilla municipal.
            </p>

            <div className="pt-8">
              <button
                onClick={() => setStep('search')}
                className="group relative px-14 py-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-2xl uppercase tracking-widest rounded-3xl transition-all shadow-2xl shadow-emerald-900/30 hover:scale-105 active:scale-95 border-2 border-emerald-400/20 overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                Toca aquí para comenzar
              </button>
            </div>

            <div className="pt-16 grid grid-cols-3 gap-6 text-center text-xs uppercase tracking-widest font-bold text-slate-400">
              <div className="space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-emerald-400"><Droplet size={20} /></div>
                <p>Agua Potable</p>
              </div>
              <div className="space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-emerald-400"><Map size={20} /></div>
                <p>Impuesto Predial</p>
              </div>
              <div className="space-y-2.5">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-emerald-400"><Store size={20} /></div>
                <p>Licencia Comercio</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BUSCADOR */}
      {step === 'search' && (
        <div className="flex-1 flex flex-col items-center justify-start p-8 pt-16 z-10 animate-in fade-in duration-300 max-w-4xl mx-auto w-full">
          <div className="w-full space-y-8">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleGoHome}
                className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider transition-colors"
              >
                <ArrowLeft size={16} /> Regresar
              </button>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Paso 1 de 2: Buscar Cuenta</span>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black uppercase text-white tracking-wide">Búsqueda de Servicio</h3>
              <p className="text-sm text-slate-400">Ingrese cualquiera de sus credenciales para consultar adeudos</p>
            </div>

            {/* Input de búsqueda */}
            <div className="space-y-3">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={26} />
                <input
                  type="text"
                  readOnly
                  placeholder="Número de Contrato, Clave Catastral, RFC, CURP o Nombre..."
                  value={query}
                  onClick={() => setShowKeyboard(true)}
                  className="w-full pl-16 pr-24 py-6 bg-slate-800/80 border-2 border-slate-700/80 rounded-3xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-xl font-bold text-white placeholder-slate-500 shadow-inner cursor-pointer"
                />
                {!showKeyboard && (
                  <button
                    onClick={() => setShowKeyboard(true)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Activar Teclado
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 pl-4 leading-relaxed">
                💡 **Consejo:** Para tomas de agua use el formato de su recibo (ej. **W-12345**). Para Predial use su Clave Catastral.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-red-950/40 border-2 border-red-500/30 text-red-300 rounded-2xl flex items-center gap-3 text-sm font-bold animate-pulse">
                <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            {/* Lista de coincidencias múltiples si aplica */}
            {multipleMatches.length > 0 && (
              <div className="bg-slate-800/60 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-300">
                <div className="bg-slate-700/50 px-6 py-3 border-b border-slate-700 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    Se encontraron {multipleMatches.length} coincidencias. Selecciona tu nombre:
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-700">
                  {multipleMatches.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => seleccionarContribuyenteDirecto(c.id)}
                      className="w-full flex items-center justify-between p-5 hover:bg-emerald-950/40 text-left transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-base text-white">{c.nombre_completo}</p>
                          <p className="text-xs text-slate-400 font-mono tracking-wider mt-0.5">{c.rfc}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-emerald-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Botón de buscar */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                className="w-full px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-950 transition-all disabled:opacity-30 active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? 'Buscando en padrón...' : 'Buscar Adeudos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. RESULTADOS / ESTADO DE CUENTA */}
      {step === 'results' && perfil && (
        <div className="flex-1 flex flex-col p-8 z-10 animate-in fade-in duration-300 max-w-5xl mx-auto w-full">
          <div className="space-y-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <button 
                onClick={() => setStep('search')}
                className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm uppercase tracking-wider transition-colors"
              >
                <ArrowLeft size={16} /> Nueva Búsqueda
              </button>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Paso 2 de 2: Seleccionar Conceptos</span>
            </div>

            {/* Ficha de Contribuyente */}
            <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-3xl flex items-center justify-between shrink-0 shadow-lg">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-emerald-950 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center font-bold">
                  <User size={26} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{perfil.nombre_completo}</h4>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] font-mono font-bold bg-slate-700 text-slate-300 px-2 py-0.5 rounded uppercase tracking-wider">{perfil.rfc}</span>
                    <span className="text-xs text-slate-400 truncate max-w-sm">{perfil.direccion}</span>
                  </div>
                </div>
              </div>
              <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                Expediente Cargado
              </div>
            </div>

            {/* Listado de adeudos */}
            <div className="flex-1 overflow-y-auto min-h-[250px] pr-2 space-y-4">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2">Adeudos Pendientes</h5>
              
              {/* Contenedor unificado de adeudos */}
              {(() => {
                const tomasAdeudos = perfil.tomas?.flatMap((t: any) => t.deudas?.map((d: any) => ({ ...d, area: 'agua', refLabel: `Contrato Agua: ${t.numero_contrato}`, address: t.direccion_toma })) || []) || [];
                const prediosAdeudos = perfil.predios?.flatMap((p: any) => p.deudas?.map((d: any) => ({ ...d, area: 'catastro', refLabel: `Clave Catastral: ${p.clave_catastral}`, address: p.direccion_predio })) || []) || [];
                const licenciasAdeudos = perfil.licencias?.flatMap((l: any) => l.deudas?.map((d: any) => ({ ...d, area: 'comercio', refLabel: `Licencia Comercio: ${l.numero_licencia}`, address: l.direccion_local })) || []) || [];
                
                const allAdeudos = [...tomasAdeudos, ...prediosAdeudos, ...licenciasAdeudos];

                if (allAdeudos.length === 0) {
                  return (
                    <div className="py-16 text-center bg-slate-800/40 rounded-3xl border border-slate-800 flex flex-col items-center justify-center gap-3">
                      <CheckCircle size={48} className="text-emerald-400" />
                      <p className="text-lg font-bold text-slate-300 uppercase tracking-wider">¡Te encuentras al corriente!</p>
                      <p className="text-xs text-slate-500">No se detectaron deudas pendientes en este ejercicio fiscal.</p>
                    </div>
                  );
                }

                return allAdeudos.map((deuda) => {
                  const isSelected = selectedDebts.some(d => d.id === deuda.id);
                  return (
                    <div 
                      key={deuda.id}
                      onClick={() => toggleDebtSelection(deuda)}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/20' 
                          : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-650'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3.5 rounded-2xl flex items-center justify-center shrink-0 ${getAreaColor(deuda.area)}`}>
                          {getAreaIcon(deuda.area)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{getAreaLabel(deuda.area)}</span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">{deuda.refLabel}</span>
                          </div>
                          <h6 className="font-bold text-base text-white mt-1 leading-tight">{deuda.descripcion}</h6>
                          <p className="text-xs text-slate-400 mt-1 truncate max-w-md">{deuda.address}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-5">
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Monto</p>
                          <p className="text-xl font-mono font-bold text-white mt-0.5">
                            ${deuda.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-emerald-500 border-emerald-400 text-white' 
                            : 'border-slate-600 bg-slate-800 text-transparent'
                        }`}>
                          <Check size={18} strokeWidth={3} />
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer de resumen y cobro */}
            <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/5 flex items-center justify-between shrink-0 shadow-2xl">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Servicios Seleccionados: {selectedDebts.length}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total:</span>
                  <span className="text-3xl font-mono font-black text-emerald-400">
                    ${totalPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleGoHome}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl uppercase tracking-wider text-xs border border-slate-700 transition-all active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerarReferencia}
                  disabled={loading || selectedDebts.length === 0}
                  className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-wider text-xs shadow-lg shadow-emerald-950 transition-all disabled:opacity-20 active:scale-95 flex items-center gap-2"
                >
                  <Printer size={16} /> Imprimir Referencia de Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PANTALLA DE IMPRESIÓN Y FOLIO */}
      {step === 'print' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 z-10 animate-in fade-in duration-300">
          <div className="max-w-xl bg-slate-800/50 p-10 rounded-3xl border border-slate-700 shadow-2xl space-y-6 relative overflow-hidden">
            
            {/* Animación del ticket */}
            <div className="w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
              <Printer size={40} />
            </div>

            <h3 className="text-3xl font-black uppercase text-emerald-400 tracking-wide">¡Imprimiendo Ticket!</h3>
            <p className="text-base text-slate-200">
              Tu ticket de referencia de pago se está imprimiendo en la bandeja del equipo.
            </p>

            <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-750">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Folio de Referencia</span>
              <span className="text-3xl font-mono font-black text-white tracking-widest block mt-1.5">{referenciaFolio}</span>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs font-bold leading-relaxed text-left">
              ⚠️ **Instrucciones:** Lleva este ticket físico a cualquiera de las ventanillas de tesorería del ayuntamiento para procesar tu cobro en efectivo.
            </div>

            <div className="pt-4 flex flex-col items-center gap-3">
              <button
                onClick={handleGoHome}
                className="px-10 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95"
              >
                Terminar / Volver al Inicio
              </button>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                El kiosco se reiniciará automáticamente en {printCountdown} segundos.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER GENERAL DE KIOSCO */}
      <footer className="py-4 px-10 bg-slate-950/60 backdrop-blur-md border-t border-white/5 flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider shrink-0 z-10">
        <span>Ayuda técnica: Acuda a la ventanilla de información</span>
        <span>Módulo K-01 • Recaudación Municipal</span>
      </footer>

      {/* TECLADO VIRTUAL INCRUSTADO */}
      {showKeyboard && step === 'search' && (
        <div className="shrink-0 z-20">
          <VirtualKeyboard
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            onClear={handleClear}
            onClose={() => setShowKeyboard(false)}
          />
        </div>
      )}

      {/* COMPONENTE DE TICKET OCULTO PARA IMPRESIÓN EXCLUSIVA (window.print) */}
      {referenciaFolio && perfil && (
        <div className="hidden print-ticket-container">
          <div style={{ textAlign: 'center', marginBottom: '4mm' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 1mm 0' }}>MUNICIPIO DE TLAPA</h2>
            <h3 style={{ fontSize: '11px', margin: '0 0 2mm 0', letterSpacing: '0.5px' }}>H. AYUNTAMIENTO DE TLAPA DE COMONFORT</h3>
            <p style={{ fontSize: '9px', margin: '0', textTransform: 'uppercase' }}>Kiosco de Ingresos - Orden de Pago</p>
            <p style={{ fontSize: '9px', margin: '1mm 0 0 0' }}>--------------------------------</p>
          </div>

          <div style={{ fontSize: '10px', lineHeight: '1.4', marginBottom: '3mm' }}>
            <p style={{ margin: '0 0 1mm 0' }}><strong>Folio Ref:</strong> {referenciaFolio}</p>
            <p style={{ margin: '0 0 1mm 0' }}><strong>Fecha:</strong> {new Date().toLocaleDateString('es-MX')} {new Date().toLocaleTimeString('es-MX')}</p>
            <p style={{ margin: '0 0 1mm 0', textTransform: 'uppercase' }}><strong>Contribuyente:</strong> {perfil.nombre_completo}</p>
            <p style={{ margin: '0 0 1mm 0', textTransform: 'uppercase' }}><strong>RFC:</strong> {perfil.rfc}</p>
            <p style={{ margin: '0' }}>--------------------------------</p>
          </div>

          <div style={{ fontSize: '9px', marginBottom: '3mm' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px dashed #000' }}>
                  <th style={{ textAlign: 'left', paddingBottom: '1mm' }}>CONCEPTO</th>
                  <th style={{ textAlign: 'right', paddingBottom: '1mm' }}>IMPORTE</th>
                </tr>
              </thead>
              <tbody>
                {selectedDebts.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ paddingTop: '1mm', verticalAlign: 'top', textTransform: 'uppercase' }}>
                      {item.descripcion}<br />
                      <span style={{ fontSize: '8px', color: '#555' }}>Ref: {item.clave_referencia}</span>
                    </td>
                    <td style={{ paddingTop: '1mm', textAlign: 'right', verticalAlign: 'top' }}>
                      ${item.monto.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ margin: '3mm 0 0 0' }}>--------------------------------</p>
          </div>

          <div style={{ textAlign: 'right', fontSize: '11px', marginBottom: '4mm' }}>
            <p style={{ margin: '0' }}><strong>TOTAL A PAGAR:</strong></p>
            <p style={{ fontSize: '15px', fontWeight: 'bold', margin: '1mm 0 0 0', fontFamily: 'monospace' }}>
              ${totalPagar.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
            </p>
          </div>

          {/* Código QR generado mediante Google Charts API */}
          <div style={{ textAlign: 'center', marginBottom: '4mm' }}>
            <img
              src={`https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=${referenciaFolio}&choe=UTF-8`}
              alt="QR Referencia"
              style={{ width: '38mm', height: '38mm', display: 'inline-block' }}
            />
            <p style={{ fontSize: '8px', margin: '1mm 0 0 0', letterSpacing: '2px' }}>{referenciaFolio}</p>
          </div>

          <div style={{ textAlign: 'center', fontSize: '8px', lineHeight: '1.3' }}>
            <p style={{ margin: '0 0 1mm 0', fontWeight: 'bold', textTransform: 'uppercase' }}>Presente este ticket en ventanilla</p>
            <p style={{ margin: '0' }}>Los cajeros escanearán el código para procesar su pago en efectivo.</p>
            <p style={{ margin: '2mm 0 0 0' }}>¡Gracias por tu contribución!</p>
          </div>
        </div>
      )}
    </div>
  );
}
