
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

const NuevoContribuyente: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    rfc: '',
    nombre_completo: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validación básica RFC
    if (formData.rfc.length < 12 || formData.rfc.length > 13) {
      setError("El RFC debe tener entre 12 y 13 caracteres.");
      setLoading(false);
      return;
    }

    try {
      await api.crearContribuyente(formData);
      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate('/contribuyentes'), 2000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar en la Base de Datos');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors font-bold text-sm"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center gap-4">
          <div className="p-3 bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-100">
            <UserPlus size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Registrar Contribuyente</h2>
            <p className="text-slate-500 text-sm font-medium">Ingrese los datos oficiales del ciudadano para el padrón municipal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold animate-bounce">
              <AlertTriangle size={18} /> {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
              <CheckCircle size={18} /> ¡Contribuyente registrado con éxito! Redireccionando...
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">RFC / Identificación</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all font-mono uppercase font-bold"
                placeholder="AAAA000000XXX"
                value={formData.rfc}
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
              <input
                type="tel"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all font-bold"
                placeholder="757 000 0000"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo / Razón Social</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all font-bold"
                placeholder="Ej. Juan Pérez García"
                value={formData.nombre_completo}
                onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Dirección Fiscal / Domicilio</label>
              <textarea
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all resize-none font-medium"
                placeholder="Calle, Número, Colonia, C.P."
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/contribuyentes')}
              className="px-6 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-8 py-3 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {loading ? 'Guardando...' : 'Guardar Contribuyente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoContribuyente;
