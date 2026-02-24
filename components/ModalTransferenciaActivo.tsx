
import React, { useState } from 'react';
import { X, ArrowRightLeft, Search, UserCheck, AlertTriangle } from 'lucide-react';
import { Contribuyente } from '../types';

interface ModalTransferenciaProps {
  isOpen: boolean;
  onClose: () => void;
  activo: any;
  tipo: 'predio' | 'toma' | 'licencia';
  onConfirm: (activoId: number, nuevoDueñoId: number) => void;
}

const ModalTransferenciaActivo: React.FC<ModalTransferenciaProps> = ({ isOpen, onClose, activo, tipo, onConfirm }) => {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<Contribuyente[]>([]);
  const [seleccionado, setSeleccionado] = useState<Contribuyente | null>(null);
  const [buscando, setBuscando] = useState(false);

  if (!isOpen || !activo) return null;

  const handleSearch = () => {
    if (!query) return;
    setBuscando(true);
    // Mock de búsqueda
    setTimeout(() => {
      setResultados([
        { id: 99, rfc: 'LOMA900101XYZ', nombre_completo: 'María López Jiménez', direccion: 'Calle Hidalgo #10', telefono: '7571112233' }
      ]);
      setBuscando(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-amber-100 flex items-center justify-between bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 text-white rounded-xl">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Transferencia de Dominio</h3>
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest">Cambio de Propietario Legal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Activo a transferir:</p>
            <p className="font-bold text-slate-700 text-sm">
              {tipo === 'predio' ? activo.clave_catastral : tipo === 'toma' ? activo.numero_contrato : activo.nombre_negocio}
            </p>
            <p className="text-xs text-slate-500">{tipo === 'predio' ? activo.direccion_predio : tipo === 'toma' ? activo.direccion_toma : activo.direccion_local}</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-600">Buscar Nuevo Propietario (RFC o Nombre)</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej. GOMR800..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button onClick={handleSearch} className="px-4 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors">
                {buscando ? '...' : <Search size={18} />}
              </button>
            </div>
          </div>

          {resultados.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {resultados.map(r => (
                <button 
                  key={r.id}
                  onClick={() => setSeleccionado(r)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${seleccionado?.id === r.id ? 'border-emerald-600 bg-emerald-50' : 'border-slate-100 hover:bg-slate-50'}`}
                >
                  <p className="font-bold text-slate-800 text-sm">{r.nombre_completo}</p>
                  <p className="text-xs font-mono text-emerald-700">{r.rfc}</p>
                </button>
              ))}
            </div>
          )}

          {seleccionado && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
              <div className="text-xs text-amber-800 leading-relaxed">
                <p className="font-bold mb-1">Confirmación de Responsabilidad Financiera</p>
                <p>Al confirmar, este activo y **todos sus adeudos pendientes** serán transferidos a <strong>{seleccionado.nombre_completo}</strong>. Esta acción es irreversible y quedará registrada en la bitácora de auditoría.</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 text-slate-500 font-bold text-sm">Cancelar</button>
          <button 
            disabled={!seleccionado}
            onClick={() => onConfirm(activo.id, seleccionado!.id)}
            className="px-8 py-2 bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 disabled:opacity-50 flex items-center gap-2"
          >
            <UserCheck size={18} /> Confirmar Traspaso
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalTransferenciaActivo;
