
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Download, Droplet, Home, Store, DollarSign, FileText, Users, Loader2, AlertCircle, CreditCard, Award, ChevronDown } from 'lucide-react';
import { api } from '../services/api';

interface ReporteData {
  periodo: { desde: string; hasta: string };
  resumen: { total: number; num_pagos: number; promedio_ticket: number };
  por_area: { area: string; total: number; num_pagos: number; porcentaje: number }[];
  top_conceptos: { nombre: string; area: string; total: number; cantidad: number }[];
  recaudacion_diaria: { dia: string; total: number; num_pagos: number }[];
  top_cajeros: { nombre: string; total: number; num_pagos: number }[];
}

type PeriodPreset = 'hoy' | 'semana' | 'mes' | 'mes_anterior' | 'anio' | 'custom';

const Reportes: React.FC = () => {
  const [data, setData] = useState<ReporteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [periodo, setPeriodo] = useState<PeriodPreset>('mes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const calcularFechas = (preset: PeriodPreset): { desde: string; hasta: string } => {
    const ahora = new Date();
    const hoy = ahora.toISOString().split('T')[0];

    switch (preset) {
      case 'hoy':
        return { desde: hoy, hasta: hoy };
      case 'semana': {
        const hace7 = new Date(ahora);
        hace7.setDate(hace7.getDate() - 6);
        return { desde: hace7.toISOString().split('T')[0], hasta: hoy };
      }
      case 'mes': {
        const primerDia = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-01`;
        return { desde: primerDia, hasta: hoy };
      }
      case 'mes_anterior': {
        const mesAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
        const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth(), 0);
        return {
          desde: mesAnt.toISOString().split('T')[0],
          hasta: ultimoDia.toISOString().split('T')[0]
        };
      }
      case 'anio': {
        return { desde: `${ahora.getFullYear()}-01-01`, hasta: hoy };
      }
      case 'custom':
        return { desde: fechaDesde, hasta: fechaHasta };
    }
  };

  const fetchReportes = async () => {
    const { desde, hasta } = calcularFechas(periodo);
    if (!desde || !hasta) return;

    setLoading(true);
    setError('');
    try {
      const result = await api.getReportes(desde, hasta);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Error cargando reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReportes(); }, [periodo]);

  const formatMoney = (val: number) =>
    '$' + val.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const areaConfig: Record<string, { label: string; icon: any; color: string; bg: string; bar: string }> = {
    agua: { label: 'Agua Potable', icon: Droplet, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
    catastro: { label: 'Catastro', icon: Home, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
    comercio: { label: 'Comercio', icon: Store, color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' }
  };

  const maxDiaria = data ? Math.max(...data.recaudacion_diaria.map(d => d.total), 1) : 1;

  const formatFechaCorta = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  const formatFechaLarga = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleDescargarPDF = () => {
    if (!data) return;

    const areaLabels: Record<string, string> = { agua: 'Agua Potable', catastro: 'Catastro', comercio: 'Comercio' };

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte de Recaudación — Tlapa de Comonfort</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 32px; }
          h1 { font-size: 20px; font-weight: 900; color: #064e3b; margin-bottom: 2px; }
          .subtitle { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; }
          .periodo-badge { display:inline-block; background:#f0fdf4; border:1px solid #bbf7d0; color:#065f46; padding:4px 12px; border-radius:20px; font-size:9px; font-weight:700; text-transform:uppercase; margin-bottom:24px; }
          .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:24px; }
          .card { border:1px solid #e2e8f0; border-radius:8px; padding:14px; }
          .card-label { font-size:8px; text-transform:uppercase; letter-spacing:0.1em; color:#64748b; font-weight:700; margin-bottom:4px; }
          .card-value { font-size:18px; font-weight:900; color:#0f172a; }
          h2 { font-size:13px; font-weight:800; color:#064e3b; margin:20px 0 10px; border-bottom:2px solid #d1fae5; padding-bottom:6px; }
          table { width:100%; border-collapse:collapse; margin-bottom:20px; }
          th { background:#f8fafc; text-align:left; padding:8px 12px; font-size:8px; text-transform:uppercase; letter-spacing:0.1em; color:#64748b; border-bottom:2px solid #e2e8f0; }
          td { padding:8px 12px; border-bottom:1px solid #f1f5f9; font-size:10px; vertical-align:middle; }
          tr:last-child td { border-bottom:none; }
          .badge { display:inline-block; padding:2px 8px; border-radius:10px; font-size:8px; font-weight:700; text-transform:uppercase; }
          .badge-agua { background:#eff6ff; color:#1d4ed8; }
          .badge-catastro { background:#f0fdf4; color:#065f46; }
          .badge-comercio { background:#fff7ed; color:#c2410c; }
          .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e2e8f0; font-size:8px; color:#94a3b8; text-align:center; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <h1>Reporte de Recaudación Municipal</h1>
        <p class="subtitle">Tlapa de Comonfort, Guerrero — Sistema de Ingresos</p>
        <div class="periodo-badge">Período: ${formatFechaLarga(data.periodo.desde)} &mdash; ${formatFechaLarga(data.periodo.hasta)}</div>

        <div class="grid3">
          <div class="card">
            <div class="card-label">Recaudación Total</div>
            <div class="card-value">${formatMoney(data.resumen.total)}</div>
          </div>
          <div class="card">
            <div class="card-label">Pagos Procesados</div>
            <div class="card-value">${data.resumen.num_pagos}</div>
          </div>
          <div class="card">
            <div class="card-label">Ticket Promedio</div>
            <div class="card-value">${formatMoney(data.resumen.promedio_ticket)}</div>
          </div>
        </div>

        <h2>Recaudación por Área</h2>
        <table>
          <thead><tr><th>Área</th><th>Monto Total</th><th>Pagos</th><th>Porcentaje</th></tr></thead>
          <tbody>
            ${data.por_area.map(a => `
              <tr>
                <td><span class="badge badge-${a.area}">${areaLabels[a.area] || a.area}</span></td>
                <td><strong>${formatMoney(a.total)}</strong></td>
                <td>${a.num_pagos}</td>
                <td>${a.porcentaje}%</td>
              </tr>`).join('')}
          </tbody>
        </table>

        ${data.top_cajeros.length > 0 ? `
        <h2>Top Cajeros</h2>
        <table>
          <thead><tr><th>#</th><th>Cajero</th><th>Cobros</th><th>Total Recaudado</th></tr></thead>
          <tbody>
            ${data.top_cajeros.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${c.nombre}</td>
                <td>${c.num_pagos}</td>
                <td><strong>${formatMoney(c.total)}</strong></td>
              </tr>`).join('')}
          </tbody>
        </table>` : ''}

        ${data.top_conceptos.length > 0 ? `
        <h2>Top Conceptos Cobrados</h2>
        <table>
          <thead><tr><th>#</th><th>Concepto</th><th>Área</th><th>Cantidad</th><th>Monto Total</th></tr></thead>
          <tbody>
            ${data.top_conceptos.map((c, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${c.nombre}</td>
                <td><span class="badge badge-${c.area}">${areaLabels[c.area] || c.area}</span></td>
                <td>${c.cantidad}</td>
                <td><strong>${formatMoney(c.total)}</strong></td>
              </tr>`).join('')}
          </tbody>
        </table>` : ''}

        <div class="footer">
          Generado el ${new Date().toLocaleString('es-MX')} | Sistema de Ingresos — H. Ayuntamiento de Tlapa de Comonfort
        </div>
      </body>
      </html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Permite las ventanas emergentes para imprimir el reporte.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 600);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 size={28} className="text-emerald-700" /> Reporte de Recaudación
          </h2>
          <p className="text-slate-500 text-sm">Resumen financiero consolidado del municipio</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data && !loading && (
            <button
              onClick={handleDescargarPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              <Download size={15} /> Descargar PDF
            </button>
          )}
          {[
            { id: 'hoy' as PeriodPreset, label: 'Hoy' },
            { id: 'semana' as PeriodPreset, label: '7 Días' },
            { id: 'mes' as PeriodPreset, label: 'Este Mes' },
            { id: 'mes_anterior' as PeriodPreset, label: 'Mes Anterior' },
            { id: 'anio' as PeriodPreset, label: 'Este Año' },
          ].map(p => (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${periodo === p.id
                ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-200'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* FILTRO CUSTOM */}
      {periodo === 'custom' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20" />
          </div>
          <button onClick={fetchReportes}
            className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-800 transition-all">
            Consultar
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={36} className="animate-spin text-emerald-600" />
        </div>
      )}

      {/* ERROR */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <AlertCircle size={32} className="text-red-300 mx-auto mb-3" />
          <p className="text-sm text-red-600 font-bold">{error}</p>
          <button onClick={fetchReportes} className="mt-3 px-5 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold">Reintentar</button>
        </div>
      )}

      {/* DATA */}
      {data && !loading && (
        <>
          {/* Periodo badge */}
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Periodo: {formatFechaCorta(data.periodo.desde)} — {formatFechaCorta(data.periodo.hasta)}
            </span>
          </div>

          {/* RESUMEN CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 rounded-2xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-1">Recaudación Total</p>
                <p className="text-3xl font-black font-mono">{formatMoney(data.resumen.total)}</p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10"><DollarSign size={100} /></div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600"><FileText size={20} /></div>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Pagos Procesados</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{data.resumen.num_pagos}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><CreditCard size={20} /></div>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Ticket Promedio</p>
              <p className="text-2xl font-black text-slate-800 font-mono mt-1">{formatMoney(data.resumen.promedio_ticket)}</p>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

            {/* Comparativo por Área */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <BarChart3 size={20} className="text-emerald-600" /> Comparativo por Área
              </h3>
              {data.por_area.length > 0 ? (
                <div className="space-y-6">
                  {data.por_area.map(item => {
                    const cfg = areaConfig[item.area] || areaConfig.comercio;
                    const Icon = cfg.icon;
                    return (
                      <div key={item.area} className="space-y-2.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${cfg.bg} ${cfg.color}`}><Icon size={16} /></div>
                            <div>
                              <span className="font-bold text-slate-700 text-sm">{cfg.label}</span>
                              <span className="text-[9px] text-slate-400 ml-2 font-bold">{item.num_pagos} pagos</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-800 text-sm">{formatMoney(item.total)}</span>
                            <span className="text-[9px] text-slate-400 ml-2 font-bold">{item.porcentaje}%</span>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cfg.bar} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${item.porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-bold">Sin datos en este periodo</p>
                </div>
              )}
            </div>

            {/* Top Cajeros */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Award size={20} className="text-amber-500" /> Top Cajeros
              </h3>
              {data.top_cajeros.length > 0 ? (
                <div className="space-y-4">
                  {data.top_cajeros.map((cajero, idx) => (
                    <div key={cajero.nombre} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 border border-slate-50">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-50 text-orange-400'
                        }`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{cajero.nombre}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{cajero.num_pagos} cobros</p>
                      </div>
                      <p className="text-sm font-mono font-bold text-slate-800">{formatMoney(cajero.total)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-sm text-slate-400 font-bold">Sin datos</p>
                </div>
              )}
            </div>
          </div>

          {/* TIMELINE DIARIA */}
          {data.recaudacion_diaria.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-emerald-600" /> Recaudación Diaria
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{data.recaudacion_diaria.length} días</span>
              </h3>
              <div className="h-48 flex items-end gap-1 overflow-x-auto pb-2">
                {data.recaudacion_diaria.map((dia, i) => {
                  const pct = maxDiaria > 0 ? (dia.total / maxDiaria) * 100 : 0;
                  return (
                    <div key={dia.dia} className="flex flex-col items-center gap-1.5 group" style={{ minWidth: data.recaudacion_diaria.length > 15 ? '28px' : '40px', flex: 1 }}>
                      <div className="text-[7px] font-mono font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity text-center whitespace-nowrap">
                        {formatMoney(dia.total)}
                      </div>
                      <div
                        className="w-full bg-emerald-600/70 hover:bg-emerald-600 rounded-t-md transition-all duration-500"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                      <span className="text-[7px] font-bold text-slate-400 whitespace-nowrap">
                        {formatFechaCorta(typeof dia.dia === 'string' ? dia.dia : new Date(dia.dia).toISOString().split('T')[0])}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TOP CONCEPTOS */}
          {data.top_conceptos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={20} className="text-emerald-600" /> Top Conceptos Cobrados
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-4 text-left">#</th>
                      <th className="px-6 py-4 text-left">Concepto</th>
                      <th className="px-6 py-4 text-center">Área</th>
                      <th className="px-6 py-4 text-center">Cantidad</th>
                      <th className="px-6 py-4 text-right">Monto Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_conceptos.map((concepto, idx) => {
                      const cfg = areaConfig[concepto.area] || areaConfig.comercio;
                      return (
                        <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-black text-slate-300">{idx + 1}</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-700">{concepto.nombre}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-tight border ${concepto.area === 'agua' ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : concepto.area === 'catastro' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-orange-50 text-orange-700 border-orange-200'
                              }`}>
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-bold text-slate-600">{concepto.cantidad}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm font-mono font-bold text-slate-800">{formatMoney(concepto.total)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {data.resumen.num_pagos === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <DollarSign size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-lg font-bold text-slate-400 mb-2">Sin transacciones en este periodo</p>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">Selecciona un rango de fechas diferente o procesa pagos en los módulos de cobro para ver los datos reflejados aquí.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reportes;
