
import React from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, Download } from 'lucide-react';

const Reportes: React.FC = () => {
  const data = [
    { label: 'Agua Potable', value: '$120,500.00', color: 'bg-blue-500' },
    { label: 'Catastro', value: '$340,200.00', color: 'bg-emerald-500' },
    { label: 'Comercio', value: '$85,300.00', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reporte de Recaudación</h2>
          <p className="text-slate-500 text-sm">Resumen financiero consolidado del municipio</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold text-sm">
            <Calendar size={18} /> Este Mes
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm">
            <Download size={18} /> Descargar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" /> Comparativo por Concepto
          </h3>
          <div className="space-y-8">
            {data.map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-600">{item.label}</span>
                  <span className="font-mono font-bold text-slate-800">{item.value}</span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: item.label === 'Catastro' ? '70%' : item.label === 'Agua Potable' ? '30%' : '15%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-8 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" /> Metas del Mes
          </h3>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-slate-100 stroke-current"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-blue-600 stroke-current"
                  strokeWidth="3"
                  strokeDasharray="75, 100"
                  strokeLinecap="round"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">75%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Avance</span>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500 px-4">
              Hemos alcanzado el <span className="font-bold text-blue-600">75%</span> de la meta proyectada para este periodo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
