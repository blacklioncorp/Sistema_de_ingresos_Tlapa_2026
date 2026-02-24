
import React, { useState } from 'react';
import { Tag, Droplet, Home, Store, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import ModalNuevoConcepto from '../components/ModalNuevoConcepto';
import ModalEditarConcepto from '../components/ModalEditarConcepto';
import { Concepto } from '../types';

import { api } from '../services/api';

const AdminConceptos: React.FC = () => {
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [filtro, setFiltro] = useState('agua');
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [conceptoAEditar, setConceptoAEditar] = useState<Concepto | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarConceptos = async () => {
    setLoading(true);
    try {
      const res = await api.getConceptos();
      if (res.success) setConceptos(res.conceptos || []);
    } catch (err) {
      console.error("Error cargando conceptos", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    cargarConceptos();
  }, []);

  const listaFiltrada = conceptos.filter(item =>
    item.area === filtro &&
    (item.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      item.clave.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const handleSaveConcepto = async (data: Omit<Concepto, 'id'>) => {
    try {
      const res = await api.crearConcepto(data);
      if (res.success) {
        await cargarConceptos();
      } else {
        alert(res.error || 'Error creando concepto');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  const handleEditConcepto = async (id: number, data: Omit<Concepto, 'id'>) => {
    try {
      const res = await api.actualizarConcepto(id, data);
      if (res.success) {
        await cargarConceptos();
      } else {
        alert(res.error || 'Error actualizando concepto');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión');
    }
  };

  const handleDeleteConcepto = async (id: number) => {
    if (!window.confirm("¿Seguro que desea eliminar este concepto de cobro del padrón municipal?")) return;
    try {
      const res = await api.eliminarConcepto(id);
      if (res.success) {
        await cargarConceptos();
      } else {
        alert(res.error || 'Error eliminando concepto');
      }
    } catch (err: any) {
      alert(err.message || 'Error de conexión. Es posible que el concepto ya esté vinculado a cobros.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="text-emerald-700" size={28} /> Catálogo de Conceptos de Cobro
          </h1>
          <p className="text-slate-500 text-sm mt-1">Administración de tarifas y claves presupuestales del municipio.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
        >
          <Plus size={20} /> Nuevo Concepto
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 flex flex-wrap bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <button
            onClick={() => setFiltro('agua')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${filtro === 'agua' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Droplet size={18} /> Agua
          </button>
          <button
            onClick={() => setFiltro('catastro')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${filtro === 'catastro' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Home size={18} /> Catastro
          </button>
          <button
            onClick={() => setFiltro('comercio')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${filtro === 'comercio' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Store size={18} /> Comercio
          </button>
        </div>

        <div className="lg:col-span-4 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por clave o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-700 transition-all text-sm font-medium outline-none shadow-sm"
          />
        </div>
      </div>

      {/* TABLA DE CONCEPTOS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-5">Clave Oficial</th>
                <th className="px-6 py-5">Descripción del Concepto</th>
                <th className="px-6 py-5 text-center">Frecuencia</th>
                <th className="px-6 py-5 text-right">Monto Unitario</th>
                <th className="px-6 py-5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {listaFiltrada.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-2 py-1 rounded-md font-bold uppercase">
                      {item.clave}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-700 text-sm">{item.nombre}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Área: {item.area}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {item.frecuencia_cobro === 'mensual' && (
                      <span className="bg-blue-100 text-blue-700 text-[9px] px-3 py-1 rounded-full font-bold border border-blue-200 uppercase tracking-tight">Mensual</span>
                    )}
                    {item.frecuencia_cobro === 'anual' && (
                      <span className="bg-emerald-100 text-emerald-700 text-[9px] px-3 py-1 rounded-full font-bold border border-emerald-200 uppercase tracking-tight">Anual</span>
                    )}
                    {(item.frecuencia_cobro === 'unico' || !item.frecuencia_cobro) && (
                      <span className="bg-slate-100 text-slate-500 text-[9px] px-3 py-1 rounded-full font-bold border border-slate-200 uppercase tracking-tight">Único</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {item.calculado ? (
                      <span className="bg-amber-100 text-amber-700 text-[9px] px-2.5 py-1 rounded-full font-bold border border-amber-200 uppercase tracking-tighter">
                        Variable (Avalúo)
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-slate-800 text-lg">
                        ${item.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setConceptoAEditar(item);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all"
                        title="Editar concepto"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteConcepto(item.id)}
                        className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar concepto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Tag size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold text-sm">No se encontraron conceptos para mostrar</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalNuevoConcepto
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveConcepto}
      />

      <ModalEditarConcepto
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        concepto={conceptoAEditar}
        onSave={handleEditConcepto}
      />
    </div>
  );
};

export default AdminConceptos;
