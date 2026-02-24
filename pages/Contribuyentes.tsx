
import React, { useState } from 'react';
import { Search, UserPlus, Eye, Filter, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Contribuyente } from '../types';

const Contribuyentes: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [data] = useState<Contribuyente[]>([
    { id: 1, rfc: 'GOMR800101XYZ', nombre_completo: 'Roberto Gómez Martínez', direccion: 'Calle Mina #45, Centro', telefono: '7571234567' },
    { id: 2, rfc: 'LOPJ900512ABC', nombre_completo: 'Juana López Pérez', direccion: 'Av. Constitución #12, San Francisco', telefono: '7579876543' },
    { id: 3, rfc: 'HERM850320DEF', nombre_completo: 'Miguel Hernández Ruiz', direccion: 'Barrio del Calvario, Calle s/n', telefono: '7571122334' },
    { id: 4, rfc: 'MART780715GHI', nombre_completo: 'Tomasa Martínez Flores', direccion: 'Calle Hidalgo #202, Centro', telefono: '7575566778' },
  ]);

  const filtered = data.filter(c => 
    c.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.rfc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Contribuyentes</h2>
          <p className="text-slate-500 text-sm">Padrón municipal de ciudadanos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 text-sm font-medium transition-all">
            <Download size={18} /> <span className="hidden xs:inline">Exportar</span>
          </button>
          <button 
            onClick={() => navigate('/contribuyentes/nuevo')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 text-sm font-bold shadow-lg shadow-emerald-200 transition-all active:scale-95"
          >
            <UserPlus size={18} /> Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por Nombre o RFC..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm">
            <Filter size={20} /> Filtros
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre del Ciudadano</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">RFC</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Domicilio</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {c.nombre_completo.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <span className="font-bold text-slate-700 text-sm truncate max-w-[200px]">{c.nombre_completo}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">{c.rfc}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-[250px] truncate">{c.direccion}</td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/contribuyentes/${c.id}`} 
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-all font-bold text-[10px] uppercase"
                    >
                      <Eye size={14} /> <span className="hidden sm:inline">Expediente</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Contribuyentes;
