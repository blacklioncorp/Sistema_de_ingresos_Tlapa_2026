
import React, { useState, useEffect } from 'react';
import { UserPlus, Trash2, Shield, Activity, Search, X, Eye, EyeOff, Mail, User, Lock, Droplet, Home, Store, CheckCircle, AlertCircle, Loader2, Power, RefreshCw } from 'lucide-react';
import { Usuario } from '../types';
import { api } from '../services/api';

interface CajeroAPI {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  permisos: {
    agua: boolean;
    catastro: boolean;
    comercio: boolean;
  };
}

const Cajeros: React.FC = () => {
  const [cajeros, setCajeros] = useState<CajeroAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Form para nuevo cajero
  const [form, setForm] = useState({
    nombre: '', email: '', password: '',
    permiso_agua: false, permiso_catastro: false, permiso_comercio: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [creando, setCreando] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchCajeros = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getCajeros();
      setCajeros(data.cajeros || []);
    } catch (err: any) {
      setError(err.message || 'Error cargando los cajeros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCajeros(); }, []);

  const togglePermiso = async (id: number, modulo: 'agua' | 'catastro' | 'comercio') => {
    const cajero = cajeros.find(c => c.id === id);
    if (!cajero) return;

    const nuevoValor = !cajero.permisos[modulo];
    const fieldMap = { agua: 'permiso_agua', catastro: 'permiso_catastro', comercio: 'permiso_comercio' };

    // Optimistic update
    setCajeros(prev => prev.map(c =>
      c.id === id ? { ...c, permisos: { ...c.permisos, [modulo]: nuevoValor } } : c
    ));

    setSavingId(id);
    try {
      await api.actualizarCajero(id, { [fieldMap[modulo]]: nuevoValor });
      showToast(`${modulo.charAt(0).toUpperCase() + modulo.slice(1)} ${nuevoValor ? 'activado' : 'desactivado'} para ${cajero.nombre}`);
    } catch (err: any) {
      // Revert on error
      setCajeros(prev => prev.map(c =>
        c.id === id ? { ...c, permisos: { ...c.permisos, [modulo]: !nuevoValor } } : c
      ));
      showToast(err.message || 'Error actualizando permiso', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const toggleActivo = async (id: number) => {
    const cajero = cajeros.find(c => c.id === id);
    if (!cajero) return;

    const nuevoValor = !cajero.activo;

    setCajeros(prev => prev.map(c =>
      c.id === id ? { ...c, activo: nuevoValor } : c
    ));

    setSavingId(id);
    try {
      await api.actualizarCajero(id, { activo: nuevoValor });
      showToast(`Cajero ${cajero.nombre} ${nuevoValor ? 'habilitado' : 'deshabilitado'}`);
    } catch (err: any) {
      setCajeros(prev => prev.map(c =>
        c.id === id ? { ...c, activo: !nuevoValor } : c
      ));
      showToast(err.message || 'Error cambiando estado', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const eliminarCajero = async (id: number) => {
    const cajero = cajeros.find(c => c.id === id);
    if (!cajero) return;

    if (!window.confirm(`¿Estás seguro de ELIMINAR el acceso de "${cajero.nombre}"? Esta acción no se puede deshacer.`)) return;

    setSavingId(id);
    try {
      await api.eliminarCajero(id);
      setCajeros(prev => prev.filter(c => c.id !== id));
      showToast(`Acceso de ${cajero.nombre} eliminado`);
    } catch (err: any) {
      showToast(err.message || 'Error eliminando cajero', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || !form.email || !form.password) {
      showToast('Todos los campos son obligatorios', 'error');
      return;
    }
    if (form.password.length < 4) {
      showToast('La contraseña debe tener al menos 4 caracteres', 'error');
      return;
    }

    setCreando(true);
    try {
      await api.crearCajero(form);
      showToast(`Cajero "${form.nombre}" registrado exitosamente`);
      setForm({ nombre: '', email: '', password: '', permiso_agua: false, permiso_catastro: false, permiso_comercio: false });
      setIsModalOpen(false);
      fetchCajeros();
    } catch (err: any) {
      showToast(err.message || 'Error registrando cajero', 'error');
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* TOAST */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${toast.type === 'success' ? 'bg-emerald-900 text-emerald-100' : 'bg-red-900 text-red-100'
          }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-bold">{toast.msg}</p>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Control de Accesos y Cajeros</h2>
          <p className="text-slate-500 text-sm">Administra los permisos de los módulos de recaudación</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCajeros}
            className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
            title="Recargar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
          >
            <UserPlus size={20} /> Registrar Nuevo Cajero
          </button>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <Loader2 size={40} className="animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Cargando cajeros...</p>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle size={48} className="text-red-300 mb-4" />
          <p className="text-sm font-bold text-red-500 mb-3">{error}</p>
          <button onClick={fetchCajeros} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
            Reintentar
          </button>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && cajeros.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center mb-6">
            <Shield size={32} className="text-slate-200" />
          </div>
          <p className="text-lg font-bold text-slate-400 mb-2">Sin cajeros registrados</p>
          <p className="text-xs text-slate-300 max-w-xs">Registra el primer cajero para comenzar a asignar permisos de módulo.</p>
        </div>
      )}

      {/* GRID DE CAJEROS */}
      {!loading && !error && cajeros.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cajeros.map(cajero => (
            <div key={cajero.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden group transition-all duration-300 ${!cajero.activo ? 'border-red-100 opacity-60 grayscale-[30%]' : 'border-slate-100'
              } ${savingId === cajero.id ? 'ring-2 ring-emerald-400/30' : ''}`}>
              <div className="p-6 border-b border-slate-50">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-inner ${cajero.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-400'
                    }`}>
                    {cajero.nombre.charAt(0)}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => toggleActivo(cajero.id)}
                      className={`p-2 rounded-lg transition-all ${cajero.activo ? 'text-emerald-600 hover:bg-emerald-50' : 'text-red-400 hover:bg-red-50'}`}
                      title={cajero.activo ? 'Desactivar acceso' : 'Reactivar acceso'}
                    >
                      <Power size={16} />
                    </button>
                    <button
                      onClick={() => eliminarCajero(cajero.id)}
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar cajero"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{cajero.nombre}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Mail size={11} /> {cajero.email}
                </p>

                <div className="mt-4">
                  {cajero.activo ? (
                    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <CheckCircle size={12} className="text-emerald-500" />
                      <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest">Acceso Habilitado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-xl border border-red-100">
                      <AlertCircle size={12} className="text-red-400" />
                      <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Acceso Deshabilitado</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  <Shield size={12} /> Permisos de Módulo
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'agua' as const, label: 'Agua Potable', icon: Droplet, color: 'blue' },
                    { key: 'catastro' as const, label: 'Catastro', icon: Home, color: 'emerald' },
                    { key: 'comercio' as const, label: 'Comercio', icon: Store, color: 'orange' }
                  ].map(({ key, label, icon: Icono, color }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer group/perm">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${cajero.permisos[key] ? `bg-${color}-50 text-${color}-600` : 'bg-slate-50 text-slate-300'} transition-colors`}>
                          <Icono size={14} />
                        </div>
                        <span className={`text-sm font-medium transition-colors ${cajero.permisos[key] ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
                      </div>
                      <div
                        onClick={() => togglePermiso(cajero.id, key)}
                        className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 cursor-pointer ${cajero.permisos[key] ? 'bg-emerald-600 shadow-inner shadow-emerald-700' : 'bg-slate-200'
                          }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${cajero.permisos[key] ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 flex justify-between items-center border-t border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID Cajero: #{cajero.id}</span>
                {savingId === cajero.id && (
                  <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" /> Guardando...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL CREAR NUEVO CAJERO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-900 to-emerald-950 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Registrar Nuevo Cajero</h3>
                  <p className="text-[10px] text-emerald-200 uppercase tracking-widest font-bold">Crear credenciales de acceso</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCrear}>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="text"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold outline-none"
                      placeholder="Ej: María García López"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold outline-none"
                      placeholder="cajero@tlapa.gob.mx"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña de Acceso</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full pl-10 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-bold outline-none font-mono"
                      placeholder="Mínimo 4 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Shield size={12} /> Permisos Iniciales
                  </div>

                  {[
                    { key: 'permiso_agua', label: 'Agua Potable', icon: Droplet, color: 'blue' },
                    { key: 'permiso_catastro', label: 'Catastro', icon: Home, color: 'emerald' },
                    { key: 'permiso_comercio', label: 'Comercio', icon: Store, color: 'orange' }
                  ].map(({ key, label, icon: Icono, color }) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${(form as any)[key] ? `bg-${color}-50 text-${color}-600` : 'bg-white text-slate-300'} transition-colors border border-slate-100`}>
                          <Icono size={14} />
                        </div>
                        <span className={`text-sm font-medium ${(form as any)[key] ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
                      </div>
                      <div
                        onClick={() => setForm({ ...form, [key]: !(form as any)[key] })}
                        className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 cursor-pointer ${(form as any)[key] ? 'bg-emerald-600' : 'bg-slate-200'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${(form as any)[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="px-8 py-3 bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-800 shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {creando ? <><Loader2 size={14} className="animate-spin" /> Registrando...</> : <><UserPlus size={14} /> Crear Cajero</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cajeros;
