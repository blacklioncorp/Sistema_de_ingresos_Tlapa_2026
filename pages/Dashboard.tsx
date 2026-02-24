
import React from 'react';
import { Usuario } from '../types';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

const Dashboard: React.FC<{ user: Usuario }> = ({ user }) => {
  const stats = [
    { label: 'Recaudación Hoy', value: '$24,500.00', icon: DollarSign, color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Nuevos Contribuyentes', value: '12', icon: Users, color: 'bg-blue-100 text-blue-700' },
    { label: 'Trámites Realizados', value: '85', icon: Activity, color: 'bg-purple-100 text-purple-700' },
    { label: 'Variación Mensual', value: '+14.5%', icon: TrendingUp, color: 'bg-orange-100 text-orange-700' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="bg-emerald-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-4xl font-bold mb-2">Bienvenido al sistema</h2>
          <p className="text-lg sm:text-xl text-emerald-200">Tlapa de Comonfort, Guerrero</p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4">
            <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-xl border border-white/20">
              <p className="text-[10px] uppercase tracking-wider text-emerald-300">Usuario Activo</p>
              <p className="font-bold text-base sm:text-lg">{user.nombre}</p>
            </div>
            <div className="bg-white/10 backdrop-blur px-6 py-3 rounded-xl border border-white/20">
              <p className="text-[10px] uppercase tracking-wider text-emerald-300">Fecha Actual</p>
              <p className="font-bold text-base sm:text-lg">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <h3 className="text-slate-500 text-xs sm:text-sm font-medium">{stat.label}</h3>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-emerald-600" />
            Actividad Reciente
          </h3>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 items-start pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex-shrink-0 flex items-center justify-center text-slate-400">
                  <DollarSign size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">Pago de Agua - Contribuyente #4521</p>
                  <p className="text-xs text-slate-500 truncate">Monto: $450.00 • Cajero: Juan Pérez</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase">Hace {i * 5} minutos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-6">Recaudación Semanal</h3>
          <div className="h-40 sm:h-48 flex items-end justify-between gap-1 sm:gap-2 px-2">
            {[35, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 max-w-[40px]">
                <div 
                  className="w-full bg-emerald-700 rounded-t-lg transition-all duration-1000" 
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase truncate">D{i+1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
