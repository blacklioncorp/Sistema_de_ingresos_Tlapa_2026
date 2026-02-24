
import React, { useState, useEffect } from 'react';
import { Usuario } from '../types';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, Droplet, Home, Store, Clock, CreditCard, Loader2, AlertCircle, RefreshCw, UserPlus, FileText } from 'lucide-react';
import { api } from '../services/api';

interface DashboardStats {
  recaudacion_hoy: number;
  recaudacion_mes: number;
  variacion_mensual: number;
  total_contribuyentes: number;
  nuevos_contribuyentes_hoy: number;
  pagos_hoy: number;
  pagos_mes: number;
  recaudacion_por_area: { area: string; total: number }[];
  recaudacion_semanal: { dia: string; dia_nombre: string; total: number }[];
}

interface ActividadItem {
  id: number;
  monto_total: number;
  fecha_pago: string;
  notas: string;
  cajero_nombre: string;
  contribuyente_nombre: string;
  rfc: string;
}

const Dashboard: React.FC<{ user: Usuario }> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [actividad, setActividad] = useState<ActividadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, actData] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardActividad()
      ]);
      setStats(statsData);
      setActividad(actData.actividad || []);
    } catch (err: any) {
      setError(err.message || 'Error cargando Dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const formatMoney = (val: number) => {
    return '$' + val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  const areaIcon = (area: string) => {
    if (area === 'agua') return <Droplet size={14} />;
    if (area === 'catastro') return <Home size={14} />;
    return <Store size={14} />;
  };

  const areaColor = (area: string) => {
    if (area === 'agua') return 'text-blue-600 bg-blue-50';
    if (area === 'catastro') return 'text-emerald-600 bg-emerald-50';
    return 'text-orange-600 bg-orange-50';
  };

  const maxSemanal = stats ? Math.max(...stats.recaudacion_semanal.map(d => d.total), 1) : 1;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* HEADER CARD */}
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
              <p className="font-bold text-base sm:text-lg">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <button
              onClick={fetchDashboard}
              className="sm:ml-auto bg-white/10 backdrop-blur px-5 py-3 rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2 self-start"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="text-xs font-bold uppercase tracking-widest">Actualizar</span>
            </button>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-800 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={36} className="animate-spin text-emerald-600" />
        </div>
      )}

      {/* ERROR */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <AlertCircle size={32} className="text-red-300 mx-auto mb-3" />
          <p className="text-sm text-red-600 font-bold">{error}</p>
          <button onClick={fetchDashboard} className="mt-3 px-5 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold hover:bg-red-200 transition-all">Reintentar</button>
        </div>
      )}

      {/* STATS CARDS */}
      {stats && !loading && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Recaudación Hoy */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-110 transition-transform">
                  <DollarSign size={24} />
                </div>
                {stats.recaudacion_hoy > 0 && (
                  <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-100">Hoy</span>
                )}
              </div>
              <h3 className="text-slate-500 text-xs sm:text-sm font-medium">Recaudación Hoy</h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1 font-mono">{formatMoney(stats.recaudacion_hoy)}</p>
              <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">Mes: {formatMoney(stats.recaudacion_mes)}</p>
            </div>

            {/* Contribuyentes */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-700 group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
                {stats.nuevos_contribuyentes_hoy > 0 && (
                  <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold border border-blue-100">+{stats.nuevos_contribuyentes_hoy} hoy</span>
                )}
              </div>
              <h3 className="text-slate-500 text-xs sm:text-sm font-medium">Contribuyentes</h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{stats.total_contribuyentes.toLocaleString()}</p>
              <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">Padrón municipal total</p>
            </div>

            {/* Pagos hoy */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-700 group-hover:scale-110 transition-transform">
                  <FileText size={24} />
                </div>
              </div>
              <h3 className="text-slate-500 text-xs sm:text-sm font-medium">Trámites Hoy</h3>
              <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">{stats.pagos_hoy}</p>
              <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">Este mes: {stats.pagos_mes} pagos</p>
            </div>

            {/* Variación */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${stats.variacion_mensual >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {stats.variacion_mensual >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </div>
              </div>
              <h3 className="text-slate-500 text-xs sm:text-sm font-medium">Variación Mensual</h3>
              <p className={`text-xl sm:text-2xl font-bold mt-1 ${stats.variacion_mensual >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {stats.variacion_mensual >= 0 ? '+' : ''}{stats.variacion_mensual}%
              </p>
              <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase">vs mes anterior</p>
            </div>
          </div>

          {/* RECAUDACIÓN POR ÁREA (mini cards) */}
          {stats.recaudacion_por_area.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.recaudacion_por_area.map((area) => (
                <div key={area.area} className={`flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-white shadow-sm`}>
                  <div className={`p-3 rounded-xl ${areaColor(area.area)}`}>
                    {areaIcon(area.area)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{area.area} (hoy)</p>
                    <p className="text-lg font-bold text-slate-800 font-mono">{formatMoney(parseFloat(String(area.total)))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* GRID: Actividad + Gráfica */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Actividad Reciente */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Activity size={20} className="text-emerald-600" />
                Actividad Reciente
              </h3>
              <div className="space-y-4">
                {actividad.length > 0 ? (
                  actividad.map(item => (
                    <div key={item.id} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex-shrink-0 flex items-center justify-center text-emerald-600">
                        <CreditCard size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate text-slate-800">
                          {item.contribuyente_nombre || 'Contribuyente'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          Monto: <span className="font-mono font-bold">{formatMoney(parseFloat(String(item.monto_total)))}</span> • Cajero: {item.cajero_nombre}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] text-emerald-600 font-bold uppercase flex items-center gap-1">
                            <Clock size={9} /> {timeAgo(item.fecha_pago)}
                          </span>
                          <span className="text-[9px] text-slate-300 font-mono">Folio #{item.id}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CreditCard size={32} className="text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 font-bold">Sin actividad reciente</p>
                    <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Los pagos procesados aparecerán aquí</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recaudación Semanal */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign size={20} className="text-emerald-600" />
                  Recaudación Semanal
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Últimos 7 días</span>
              </h3>
              <div className="h-48 flex items-end justify-between gap-2 px-1">
                {stats.recaudacion_semanal.map((dia, i) => {
                  const pct = maxSemanal > 0 ? (dia.total / maxSemanal) * 100 : 0;
                  const isToday = i === stats.recaudacion_semanal.length - 1;
                  return (
                    <div key={dia.dia} className="flex-1 flex flex-col items-center gap-2 max-w-[50px] group">
                      {/* Tooltip monto */}
                      <div className="text-[8px] font-mono font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                        {dia.total > 0 ? formatMoney(dia.total) : '$0'}
                      </div>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-700 ease-out ${isToday ? 'bg-emerald-600 shadow-lg shadow-emerald-200' : 'bg-emerald-700/60 hover:bg-emerald-700'}`}
                        style={{ height: `${Math.max(pct, 3)}%` }}
                      ></div>
                      <span className={`text-[9px] font-bold uppercase ${isToday ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {dia.dia_nombre}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
