
import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, FileText, AlertCircle } from 'lucide-react';
import { DeudaItem } from '../types';

interface ModalEditarDeudaProps {
  isOpen: boolean;
  onClose: () => void;
  deuda: DeudaItem | null;
  onSave: (deudaActualizada: DeudaItem) => void;
}

const ModalEditarDeuda: React.FC<ModalEditarDeudaProps> = ({ isOpen, onClose, deuda, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DeudaItem | null>(null);

  useEffect(() => {
    if (isOpen && deuda) {
      setFormData({ ...deuda });
    }
  }, [isOpen, deuda]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulación de actualización
    setTimeout(() => {
      onSave(formData);
      setLoading(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-100">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Rectificar Adeudo</h3>
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest">Ajuste de partida contable</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Concepto / Descripción</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  required
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all font-bold text-slate-700 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required
                    type="number"
                    step="0.01"
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: parseFloat(e.target.value)})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all font-mono font-bold text-slate-700 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Vencimiento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    required
                    type="date"
                    value={formData.fecha_vencimiento}
                    onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all font-bold text-slate-700 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
              <AlertCircle size={18} className="text-blue-500 flex-shrink-0" />
              <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                Este ajuste afectará el total consolidado del contribuyente y quedará registrado en el historial de modificaciones del sistema.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold text-xs uppercase tracking-widest hover:text-slate-800 transition-colors">Cancelar</button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
              {loading ? 'Guardando...' : 'Aplicar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarDeuda;
