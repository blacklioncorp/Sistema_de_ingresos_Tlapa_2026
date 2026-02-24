
import React, { useState } from 'react';
import { UserPlus, Trash2, Shield, Activity, Search } from 'lucide-react';
import { Usuario } from '../types';

const Cajeros: React.FC = () => {
  const [cajeros, setCajeros] = useState<Usuario[]>([
    { id: 10, nombre: 'Juan Pérez', email: 'juan@tlapa.gob.mx', rol: 'cajero', permisos: { agua: true, catastro: false, comercio: false }, lastActivity: 'Cobro Agua #1234 - Hace 10 min' },
    { id: 11, nombre: 'María García', email: 'maria@tlapa.gob.mx', rol: 'cajero', permisos: { agua: true, catastro: true, comercio: true }, lastActivity: 'Inicio sesión - Hace 2 horas' },
    { id: 12, nombre: 'Luis Flores', email: 'luis@tlapa.gob.mx', rol: 'cajero', permisos: { agua: false, catastro: true, comercio: false }, lastActivity: 'Reporte generado - Ayer' },
  ]);

  const togglePermiso = (id: number, modulo: keyof Usuario['permisos']) => {
    setCajeros(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, permisos: { ...c.permisos, [modulo]: !c.permisos[modulo] } };
      }
      return c;
    }));
  };

  const eliminarCajero = (id: number) => {
    if (confirm('¿Estás seguro de eliminar este acceso?')) {
      setCajeros(prev => prev.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Control de Accesos y Cajeros</h2>
          <p className="text-slate-500 text-sm">Administra los permisos de los módulos de recaudación</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 font-bold shadow-lg shadow-emerald-100 transition-all">
          <UserPlus size={20} /> Registrar Nuevo Cajero
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cajeros.map(cajero => (
          <div key={cajero.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
            <div className="p-6 border-b border-slate-50">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center font-bold text-lg">
                  {cajero.nombre.charAt(0)}
                </div>
                <button 
                  onClick={() => eliminarCajero(cajero.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{cajero.nombre}</h3>
              <p className="text-xs text-slate-400 mb-4">{cajero.email}</p>
              
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
                <Activity size={12} className="text-emerald-500" />
                <span className="text-[10px] text-emerald-700 font-bold truncate">{cajero.lastActivity}</span>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                <Shield size={12} /> Permisos de Módulo
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-600">Agua Potable</span>
                  <div 
                    onClick={() => togglePermiso(cajero.id, 'agua')}
                    className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${cajero.permisos.agua ? 'bg-emerald-700' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${cajero.permisos.agua ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </label>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-600">Catastro</span>
                  <div 
                    onClick={() => togglePermiso(cajero.id, 'catastro')}
                    className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${cajero.permisos.catastro ? 'bg-emerald-700' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${cajero.permisos.catastro ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-600">Comercio</span>
                  <div 
                    onClick={() => togglePermiso(cajero.id, 'comercio')}
                    className={`w-10 h-5 rounded-full p-1 transition-colors duration-200 ${cajero.permisos.comercio ? 'bg-emerald-700' : 'bg-slate-200'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-200 ${cajero.permisos.comercio ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </label>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 flex justify-between items-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase">ID Cajero: #{cajero.id}</span>
              <button className="text-[10px] text-emerald-700 font-bold hover:underline uppercase">Auditar Sesiones</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cajeros;
