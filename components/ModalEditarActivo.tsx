
import React, { useState, useEffect } from 'react';
import { X, Save, Edit2, MapPin, Hash, Info, Droplet, Home, Store } from 'lucide-react';

interface ModalEditarActivoProps {
  isOpen: boolean;
  onClose: () => void;
  activo: any;
  tipo: 'predio' | 'toma' | 'licencia';
  onSave: (activoActualizado: any) => void;
}

const ModalEditarActivo: React.FC<ModalEditarActivoProps> = ({ isOpen, onClose, activo, tipo, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (isOpen && activo) {
      setFormData({ ...activo });
    }
  }, [isOpen, activo]);

  if (!isOpen || !formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const getIcon = () => {
    if (tipo === 'predio') return <Home size={20} />;
    if (tipo === 'toma') return <Droplet size={20} />;
    return <Store size={20} />;
  };

  const getTitle = () => {
    if (tipo === 'predio') return 'Editar Predio';
    if (tipo === 'toma') return 'Editar Toma de Agua';
    return 'Editar Licencia Comercial';
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-emerald-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shadow-lg ${tipo === 'predio' ? 'bg-amber-600 text-white' :
                tipo === 'toma' ? 'bg-blue-600 text-white' :
                  'bg-emerald-700 text-white'
              }`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{getTitle()}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Corrección de Padrón Municipal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-5">
            {tipo === 'predio' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clave Catastral</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      name="clave_catastral"
                      value={formData.clave_catastral}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all font-mono font-bold text-slate-700 text-sm uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección del Predio</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-slate-400" size={16} />
                    <textarea
                      required
                      rows={2}
                      name="direccion_predio"
                      value={formData.direccion_predio}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all font-bold text-slate-700 text-sm resize-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Valor Catastral ($)</label>
                    <input
                      required
                      type="number"
                      name="valor_catastral"
                      value={formData.valor_catastral}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 font-mono font-bold text-slate-700"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Predio</label>
                    <select
                      name="tipo_predio"
                      value={formData.tipo_predio}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 font-bold"
                    >
                      <option value="urbano">Urbano</option>
                      <option value="rustico">Rústico</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {tipo === 'toma' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Número de Contrato</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      name="numero_contrato"
                      value={formData.numero_contrato}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 uppercase"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección de la Toma</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-slate-400" size={16} />
                    <textarea
                      required
                      rows={2}
                      name="direccion_toma"
                      value={formData.direccion_toma}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 text-sm resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tipo de Servicio</label>
                  <input
                    required
                    name="tipo_servicio"
                    value={formData.tipo_servicio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700"
                  />
                </div>
              </>
            )}

            {tipo === 'licencia' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      name="nombre_negocio"
                      value={formData.nombre_negocio}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">No. Licencia</label>
                    <input
                      required
                      name="numero_licencia"
                      value={formData.numero_licencia}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giro</label>
                    <input
                      required
                      name="giro"
                      value={formData.giro}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección del Establecimiento</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-slate-400" size={16} />
                    <textarea
                      required
                      rows={2}
                      name="direccion_local"
                      value={formData.direccion_local}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 font-bold text-slate-700 text-sm resize-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
              <Info size={18} className="text-emerald-600 flex-shrink-0" />
              <p className="text-[10px] text-emerald-800 leading-relaxed font-medium">
                La modificación de estos datos afectará directamente las órdenes de cobro generadas posteriormente para este activo.
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
              {loading ? 'Guardando...' : 'Actualizar Padrón'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarActivo;
