
import React, { useState } from 'react';
import { X, Droplet, Home, Store, Save, ShieldCheck, Info } from 'lucide-react';

interface ModalNuevoActivoProps {
  isOpen: boolean;
  onClose: () => void;
  contribuyenteId: number;
  onSave: (data: any) => void;
}

const ModalNuevoActivo: React.FC<ModalNuevoActivoProps> = ({ isOpen, onClose, contribuyenteId, onSave }) => {
  const [tipoActivo, setTipoActivo] = useState<'agua' | 'catastro' | 'comercio'>('agua');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      contribuyente_id: contribuyenteId,
      tipo_activo: tipoActivo,
      datos_especificos: formData
    };

    setTimeout(() => {
      onSave(payload);
      setLoading(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-100">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Vincular Nuevo Activo</h3>
              <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Expediente Único Municipal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 max-h-[70vh] overflow-y-auto">
            {/* Paso 1: Selección de Categoría */}
            <div className="mb-8">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-4 text-center">¿Qué tipo de activo desea registrar?</label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'agua', label: 'Agua Potable', icon: Droplet, color: 'blue' },
                  { id: 'catastro', label: 'Catastro', icon: Home, color: 'emerald' },
                  { id: 'comercio', label: 'Comercio', icon: Store, color: 'orange' }
                ].map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => {
                      setTipoActivo(tipo.id as any);
                      setFormData({}); 
                    }}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                      tipoActivo === tipo.id 
                      ? `border-emerald-700 bg-emerald-50 text-emerald-800 ring-4 ring-emerald-500/10 shadow-lg` 
                      : 'border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <tipo.icon size={28} className={tipoActivo === tipo.id ? `text-${tipo.color === 'emerald' ? 'emerald' : tipo.color}-600` : ''} />
                    <span className="text-xs font-bold uppercase tracking-tight">{tipo.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-2 text-emerald-700 mb-2">
                <Info size={16} />
                <h4 className="text-sm font-bold uppercase tracking-wide">Datos del Activo: {tipoActivo}</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tipoActivo === 'agua' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número de Contrato / Medidor</label>
                      <input required type="text" name="numero_contrato" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold" placeholder="Ej. W-99220" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Servicio</label>
                      <select required name="tipo_servicio" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold">
                        <option value="">Seleccione...</option>
                        <option value="domestico">Doméstico</option>
                        <option value="comercial">Comercial</option>
                        <option value="industrial">Industrial</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección de la Toma</label>
                      <input required type="text" name="direccion_toma" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold" placeholder="Calle, Número y Colonia" />
                    </div>
                  </>
                )}

                {tipoActivo === 'catastro' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clave Catastral</label>
                      <input required type="text" name="clave_catastral" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-mono font-bold" placeholder="00-000-000-000" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor Catastral ($)</label>
                      <input required type="number" name="valor_catastral" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold" placeholder="0.00" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ubicación del Predio</label>
                      <input required type="text" name="ubicacion_predio" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold" placeholder="Calle, Lote, Manzana y Colonia" />
                    </div>
                  </>
                )}

                {tipoActivo === 'comercio' && (
                  <>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del Negocio</label>
                      <input required type="text" name="nombre_negocio" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold" placeholder="Ej. Abarrotes 'El Rosario'" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">No. Licencia Municipal</label>
                      <input required type="text" name="numero_licencia" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold" placeholder="Ej. LIC-2025-001" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giro</label>
                      <input required type="text" name="giro" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors uppercase tracking-widest">Cancelar</button>
            <button type="submit" disabled={loading} className="px-8 py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
              {loading ? 'Procesando...' : 'Vincular Activo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalNuevoActivo;
