
import React, { useState } from 'react';
import { Tag, Droplet, Home, Store, Edit2, Plus, Search } from 'lucide-react';
import ModalNuevoConcepto from '../components/ModalNuevoConcepto';
import { Concepto } from '../types';

const INITIAL_CONCEPTOS: Concepto[] = [
  // AGUA POTABLE
  { id: 1, area: 'agua', clave: 'AGU-001', nombre: 'Mensualidad Abastecimiento de Agua', precio: 150.00 },
  { id: 2, area: 'agua', clave: 'AGU-002', nombre: 'Anualidad Abastecimiento de Agua', precio: 1600.00 },
  { id: 3, area: 'agua', clave: 'AGU-003', nombre: 'Conexión de Agua Potable (Contrato)', precio: 2500.00 },
  { id: 4, area: 'agua', clave: 'AGU-004', nombre: 'Reconexión de Servicio', precio: 300.00 },
  { id: 5, area: 'agua', clave: 'AGU-005', nombre: 'Conexión de Drenaje', precio: 2000.00 },
  { id: 6, area: 'agua', clave: 'AGU-006', nombre: 'Constancia de No Adeudo', precio: 100.00 },
  { id: 7, area: 'agua', clave: 'AGU-007', nombre: 'Cambio de Propietario', precio: 250.00 },
  { id: 8, area: 'agua', clave: 'AGU-008', nombre: 'Baja de Cuenta', precio: 150.00 },
  
  // CATASTRO
  { id: 9, area: 'catastro', clave: 'CAT-001', nombre: 'Impuesto Predial Urbano', precio: 0, calculado: true },
  { id: 10, area: 'catastro', clave: 'CAT-002', nombre: 'Impuesto Predial Rústico', precio: 0, calculado: true },
  { id: 11, area: 'catastro', clave: 'CAT-003', nombre: 'Traslado de Dominio (ISAI)', precio: 0, calculado: true },
  { id: 12, area: 'catastro', clave: 'CAT-004', nombre: 'Certificado de Valor Catastral', precio: 150.00, calculado: false },
  { id: 13, area: 'catastro', clave: 'CAT-005', nombre: 'Constancia de No Adeudo Predial', precio: 100.00, calculado: false },
  { id: 14, area: 'catastro', clave: 'CAT-006', nombre: 'Deslinde Catastral', precio: 0, calculado: true },
  { id: 15, area: 'catastro', clave: 'CAT-007', nombre: 'Subdivisión / Fusión', precio: 500.00, calculado: false },

  // COMERCIO
  { id: 16, area: 'comercio', clave: 'COM-001', nombre: 'Alta Licencia de Funcionamiento', precio: 1200.00 },
  { id: 17, area: 'comercio', clave: 'COM-002', nombre: 'Refrendo Anual de Licencia', precio: 800.00 },
  { id: 18, area: 'comercio', clave: 'COM-003', nombre: 'Constancia de Protección Civil', precio: 500.00 },
  { id: 19, area: 'comercio', clave: 'COM-004', nombre: 'Permiso de Anuncios / Publicidad', precio: 300.00 },
  { id: 20, area: 'comercio', clave: 'COM-005', nombre: 'Licencia de Alcoholes', precio: 5000.00 },
  { id: 21, area: 'comercio', clave: 'COM-006', nombre: 'Baja de Licencia', precio: 200.00 },
];

const AdminConceptos: React.FC = () => {
  const [conceptos, setConceptos] = useState<Concepto[]>(INITIAL_CONCEPTOS);
  const [filtro, setFiltro] = useState('agua');
  const [busqueda, setBusqueda] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const listaFiltrada = conceptos.filter(item => 
    item.area === filtro && 
    (item.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
     item.clave.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const handleSaveConcepto = (data: Omit<Concepto, 'id'>) => {
    const nuevoConcepto: Concepto = {
      ...data,
      id: conceptos.length + 1
    };
    setConceptos([...conceptos, nuevoConcepto]);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="text-emerald-700" size={28}/> Catálogo de Conceptos de Cobro
          </h1>
          <p className="text-slate-500 text-sm mt-1">Administración de tarifas y claves presupuestales del municipio.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-emerald-100 transition-all active:scale-95"
        >
          <Plus size={20}/> Nuevo Concepto
        </button>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 flex flex-wrap bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <button 
            onClick={() => setFiltro('agua')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${filtro === 'agua' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Droplet size={18}/> Agua
          </button>
          <button 
            onClick={() => setFiltro('catastro')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${filtro === 'catastro' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Home size={18}/> Catastro
          </button>
          <button 
            onClick={() => setFiltro('comercio')}
            className={`flex-1 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${filtro === 'comercio' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Store size={18}/> Comercio
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
                    <div className="flex justify-center">
                      <button className="p-2 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Edit2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {listaFiltrada.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
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
    </div>
  );
};

export default AdminConceptos;
