
import React, { useState } from 'react';
import { X, Tag, Save, Droplet, Home, Store, CalendarDays, Calendar, Zap } from 'lucide-react';
import { Concepto } from '../types';

interface ModalNuevoConceptoProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Concepto, 'id'>) => void;
}

const ModalNuevoConcepto: React.FC<ModalNuevoConceptoProps> = ({ isOpen, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    area: 'agua' as 'agua' | 'catastro' | 'comercio',
    clave: '',
    nombre: '',
    precio: 0,
    calculado: false,
    frecuencia_cobro: 'unico' as 'mensual' | 'anual' | 'unico'
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? parseFloat(value) : value)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave(formData);
      setFormData({
        area: 'agua',
        clave: '',
        nombre: '',
        precio: 0,
        calculado: false,
        frecuencia_cobro: 'unico'
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-100">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Nuevo Concepto de Cobro</h3>
              <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Catálogo Municipal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Área Responsable</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'agua', label: 'Agua', icon: Droplet },
                  { id: 'catastro', label: 'Catastro', icon: Home },
                  { id: 'comercio', label: 'Comercio', icon: Store }
                ].map((area) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, area: area.id as any })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.area === area.id
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-800'
                      : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    <area.icon size={16} />
                    <span className="text-xs font-bold uppercase">{area.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clave Oficial</label>
                <input
                  required
                  type="text"
                  name="clave"
                  value={formData.clave}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold uppercase"
                  placeholder="Ej. AGU-009"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Monto ($)</label>
                <input
                  required
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  disabled={formData.calculado}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold disabled:opacity-50"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción del Concepto</label>
              <input
                required
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold"
                placeholder="Nombre completo del concepto"
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <input
                type="checkbox"
                name="calculado"
                id="calculado"
                checked={formData.calculado}
                onChange={handleChange}
                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="calculado" className="flex-1 cursor-pointer">
                <p className="text-xs font-bold text-amber-900">Monto Variable / Calculado</p>
                <p className="text-[10px] text-amber-700">Marque esta opción si el monto depende de un avalúo o cálculo externo.</p>
              </label>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Frecuencia de Cobro</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mensual', label: 'Mensual', icon: CalendarDays, color: 'blue' },
                  { id: 'anual', label: 'Anual', icon: Calendar, color: 'emerald' },
                  { id: 'unico', label: 'Único', icon: Zap, color: 'slate' }
                ].map((freq) => (
                  <button
                    key={freq.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, frecuencia_cobro: freq.id as any })}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.frecuencia_cobro === freq.id
                      ? freq.color === 'blue' ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : freq.color === 'emerald' ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-500 bg-slate-50 text-slate-800'
                      : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                  >
                    <freq.icon size={16} />
                    <span className="text-xs font-bold uppercase">{freq.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-slate-400 mt-1 ml-1">
                {formData.frecuencia_cobro === 'mensual' && '⚠️ Este concepto genera un cobro cada mes (ej. servicio de agua).'}
                {formData.frecuencia_cobro === 'anual' && '📅 Este concepto se cobra una vez al año (ej. predial, refrendo).'}
                {formData.frecuencia_cobro === 'unico' && '⚡ Pago único, no recurrente (ej. conexión, certificado).'}
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors uppercase tracking-widest">Cancelar</button>
            <button type="submit" disabled={loading} className="px-8 py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
              {loading ? 'Guardando...' : 'Guardar Concepto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNuevoConcepto;
