
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, CreditCard,
  Droplet, Home, Store, AlertCircle, Clock,
  Edit2, FileText, User, Hash, Calendar, Download,
  Plus, ChevronDown, ChevronUp, ArrowRightLeft,
  Pause, Play, Trash2, Ban, CheckCircle, XCircle,
  Shield, Activity, TrendingUp
} from 'lucide-react';
import { ContribuyentePerfil, DeudaItem, Predio, TomaAgua, LicenciaComercio } from '../types';
import ModalEditarContribuyente from '../components/ModalEditarContribuyente';
import ModalEditarDeuda from '../components/ModalEditarDeuda';
import ModalNuevoActivo from '../components/ModalNuevoActivo';
import ModalTransferenciaActivo from '../components/ModalTransferenciaActivo';
import ModalEditarActivo from '../components/ModalEditarActivo';
import { api } from '../services/api';

const ContribuyenteDetalle: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Modales states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditDeudaModalOpen, setIsEditDeudaModalOpen] = useState(false);
  const [isNuevoActivoModalOpen, setIsNuevoActivoModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isEditActivoModalOpen, setIsEditActivoModalOpen] = useState(false);

  const [deudaAEditar, setDeudaAEditar] = useState<DeudaItem | null>(null);
  const [activoATransferir, setActivoATransferir] = useState<any | null>(null);
  const [activoAEditar, setActivoAEditar] = useState<any | null>(null);
  const [tipoActivoActual, setTipoActivoActual] = useState<'predio' | 'toma' | 'licencia'>('predio');

  // Accordion states
  const [openSections, setOpenSections] = useState<string[]>(['predios', 'tomas', 'licencias']);

  // Estado de pago (AL CORRIENTE / REZAGADO)
  const [estadoPago, setEstadoPago] = useState<any>(null);
  const [loadingEstado, setLoadingEstado] = useState(false);

  useEffect(() => {
    const fetchEstado = async () => {
      if (!id) return;
      setLoadingEstado(true);
      try {
        const data = await api.getEstadoPago(Number(id));
        setEstadoPago(data);
      } catch (err) {
        console.error('Error obteniendo estado de pago:', err);
      } finally {
        setLoadingEstado(false);
      }
    };
    fetchEstado();
  }, [id]);

  // Helpers para buscar estado de un activo específico
  const getEstadoToma = (contrato: string) => {
    if (!estadoPago?.tomas) return null;
    return estadoPago.tomas.find((t: any) => t.numero_contrato === contrato);
  };
  const getEstadoPredio = (clave: string) => {
    if (!estadoPago?.predios) return null;
    return estadoPago.predios.find((p: any) => p.clave_catastral === clave);
  };
  const getEstadoLicencia = (num: string) => {
    if (!estadoPago?.licencias) return null;
    return estadoPago.licencias.find((l: any) => l.numero_licencia === num);
  };

  const [perfil, setPerfil] = useState<ContribuyentePerfil | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);

  const cargarPerfil = async () => {
    if (!id) return;
    setLoadingPerfil(true);
    try {
      const data = await api.getContribuyentePorId(Number(id));
      if (data.success && data.perfil) {
        setPerfil({
          ...data.perfil,
          predios: (data.perfil.predios || []).map((p: any) => ({ ...p, deudas: p.deudas || [] })),
          tomas: (data.perfil.tomas || []).map((t: any) => ({ ...t, deudas: t.deudas || [], estado: t.estado || 'activo' })),
          licencias: (data.perfil.licencias || []).map((l: any) => ({ ...l, deudas: l.deudas || [], estado: l.estado || 'activo' }))
        });
      }
    } catch (err) {
      console.error('Error cargando perfil del contribuyente:', err);
    } finally {
      setLoadingPerfil(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, [id]);

  const handleEliminarContribuyente = async () => {
    if (!window.confirm("¿Está seguro de eliminar COMPLETAMENTE este contribuyente y todos sus activos? Esta acción no se puede deshacer.")) return;
    try {
      await api.eliminarContribuyente(Number(id));
      navigate('/contribuyentes');
    } catch (err: any) {
      alert("Error eliminando contribuyente: " + err.message);
    }
  };

  if (loadingPerfil) {
    return (
      <div className="flex justify-center items-center h-64 text-slate-500 font-bold">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin mr-3"></div>
        Cargando expediente ciudadano...
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="text-center p-12 text-slate-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-rose-300" />
        <p className="text-lg font-bold text-slate-700">Contribuyente no encontrado</p>
        <p className="text-sm">El expediente que intentas buscar no existe o fue eliminado.</p>
        <button onClick={() => navigate('/contribuyentes')} className="mt-4 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-bold transition-colors">Volver a Ciudadanos</button>
      </div>
    );
  }

  // Deudas (En el mockup asume que vienen con deudas, pero del query DB tal vez vengan planas o no traigan la key deudas)
  // Como aún no tenemos endpoints de deuda mapeados en el query sql de activos, evitemos un crash y aseguremos el map
  const todasLasDeudas = [
    ...(perfil.predios || []).flatMap(p => (p.deudas || []).map(d => ({ ...d, origen: 'Catastro', ref: p.clave_catastral }))),
    ...(perfil.tomas || []).flatMap(t => (t.deudas || []).map(d => ({ ...d, origen: 'Agua Potable', ref: t.numero_contrato }))),
    ...(perfil.licencias || []).flatMap(l => (l.deudas || []).map(d => ({ ...d, origen: 'Comercio', ref: l.numero_licencia })))
  ];

  const totalDeuda = todasLasDeudas.reduce((acc, d) => acc + d.monto, 0);

  const toggleSection = (section: string) => {
    setOpenSections(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);
  };

  const handleEditDeuda = (deuda: any) => {
    setDeudaAEditar(deuda);
    setIsEditDeudaModalOpen(true);
  };

  const handleEditActivo = (activo: any, tipo: 'predio' | 'toma' | 'licencia') => {
    setActivoAEditar(activo);
    setTipoActivoActual(tipo);
    setIsEditActivoModalOpen(true);
  };

  const saveEditedActivo = async (activoActualizado: any) => {
    const mapTipo = tipoActivoActual === 'toma' ? 'agua' : (tipoActivoActual === 'predio' ? 'catastro' : 'comercio');
    try {
      const payload = { ...activoActualizado };
      delete payload.deudas; // We do not send deudas to backend
      const res = await api.actualizarActivo(mapTipo as any, activoActualizado.id, payload);
      if (res.success) {
        await cargarPerfil();
      } else {
        alert('Error actualizando activo');
      }
    } catch (err) {
      alert('Error actualizando activo');
    }
  };

  // Funciones para estados de activos
  const handlePausarActivo = async (id: number, tipo: 'toma' | 'licencia') => {
    const isPausado = tipo === 'toma'
      ? perfil?.tomas.find(t => t.id === id)?.estado === 'pausado'
      : perfil?.licencias.find(l => l.id === id)?.estado === 'pausado';

    const confirmMsg = `¿Está seguro de ${isPausado ? 'reactivar' : 'pausar'} este activo?`;
    if (window.confirm(confirmMsg)) {
      const nuevoEstado = isPausado ? 'activo' : 'pausado';
      const mapTipo = tipo === 'toma' ? 'agua' : 'comercio';
      try {
        const res = await api.actualizarActivo(mapTipo, id, { estado: nuevoEstado });
        if (res.success) {
          await cargarPerfil();
        }
      } catch (err) {
        alert("Error cambiando el estado del activo en el servidor.");
      }
    }
  };

  const handleCancelarActivo = async (id: number, tipo: 'toma' | 'licencia') => {
    const confirmMsg = `¿Está seguro de CANCELAR definitivamente este activo? Esta acción dará de baja el registro en el padrón municipal.`;
    if (window.confirm(confirmMsg)) {
      const mapTipo = tipo === 'toma' ? 'agua' : 'comercio';
      try {
        const res = await api.actualizarActivo(mapTipo, id, { estado: 'cancelado' });
        if (res.success) {
          await cargarPerfil();
        }
      } catch (err) {
        alert("Error cancelando activo en el servidor.");
      }
    }
  };

  const saveEditedDeuda = (deudaActualizada: DeudaItem) => {
    const updateDeudas = (items: any[]) => items.map(item => ({
      ...item,
      deudas: item.deudas.map((d: DeudaItem) => d.id === deudaActualizada.id ? deudaActualizada : d)
    }));

    setPerfil({
      ...perfil,
      predios: updateDeudas(perfil.predios),
      tomas: updateDeudas(perfil.tomas),
      licencias: updateDeudas(perfil.licencias || [])
    });
  };

  const handleTransfer = (activo: any, tipo: 'predio' | 'toma' | 'licencia') => {
    setActivoATransferir(activo);
    setTipoActivoActual(tipo);
    setIsTransferModalOpen(true);
  };

  const onTransferConfirm = (activoId: number, nuevoDueñoId: number) => {
    alert(`Activo #${activoId} transferido con éxito al contribuyente #${nuevoDueñoId}`);
    setIsTransferModalOpen(false);
  };

  const handleSaveNuevoActivo = async (payload: any) => {
    if (!perfil) return false;
    try {
      const respuesta = await api.crearActivo(payload.contribuyente_id, payload.tipo_activo, payload.datos_especificos);
      if (respuesta.success) {
        alert('Activo registrado y vinculado con éxito');
        await cargarPerfil();
        return true;
      } else {
        alert('Error: ' + respuesta.message);
        return false;
      }
    } catch (e: any) {
      alert('Error conectando al servidor: ' + e.message);
      return false;
    }
  };

  const StatusBadge = ({ estado }: { estado?: string }) => {
    if (estado === 'pausado') return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-bold uppercase tracking-widest border border-amber-200">Suspendido</span>;
    if (estado === 'cancelado') return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[9px] font-bold uppercase tracking-widest border border-red-200">Cancelado</span>;
    return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-bold uppercase tracking-widest border border-emerald-200">Activo</span>;
  };

  const PaymentStatusBadge = ({ alCorriente }: { alCorriente: boolean | null | undefined }) => {
    if (alCorriente === null || alCorriente === undefined) {
      return <span className="px-2.5 py-1 bg-slate-50 text-slate-400 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-slate-200 flex items-center gap-1 animate-pulse"><Clock size={10} /> Verificando...</span>;
    }
    if (alCorriente) {
      return (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-emerald-200 flex items-center gap-1 shadow-sm shadow-emerald-100">
          <CheckCircle size={10} /> Al Corriente
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-red-200 flex items-center gap-1 shadow-sm shadow-red-100 animate-pulse">
        <XCircle size={10} /> Rezagado
      </span>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/contribuyentes')}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors font-bold text-xs"
        >
          <ArrowLeft size={14} /> VOLVER AL DIRECTORIO
        </button>
        <div className="flex gap-2">
          <button className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-[10px] font-bold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
            PDF
          </button>
          <button
            onClick={() => setIsNuevoActivoModalOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-[10px] font-bold hover:bg-emerald-800 shadow-lg shadow-emerald-200 transition-all active:scale-95"
          >
            <Plus size={14} /> VINCULAR ACTIVO
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100 text-center relative group">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-4 right-4 p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all"
            >
              <Edit2 size={16} />
            </button>
            <div className="w-24 h-24 bg-emerald-950 text-white rounded-3xl flex items-center justify-center font-bold text-3xl font-serif mx-auto mb-5 shadow-xl">
              {perfil.nombre_completo.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">{perfil.nombre_completo}</h2>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
              <span className="text-xs font-mono font-bold uppercase tracking-widest">{perfil.rfc}</span>
            </div>

            <div className="mt-8 space-y-3">
              <div className="flex gap-3 items-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50">
                <MapPin size={14} className="text-slate-400" />
                <p className="text-[10px] text-slate-500 font-medium text-left leading-relaxed">{perfil.direccion || perfil.direccion_fiscal || 'Sin Dirección Registrada'}</p>
              </div>
              <div className="flex gap-3 items-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50">
                <Phone size={14} className="text-slate-400" />
                <p className="text-xs text-slate-600 font-bold">{perfil.telefono || 'Sin Teléfono Registrado'}</p>
              </div>
            </div>

            <button
              onClick={handleEliminarContribuyente}
              className="mt-6 w-full flex items-center justify-center gap-2 p-3 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-xl transition-all font-bold text-xs"
            >
              <Trash2 size={16} /> Eliminar Expediente
            </button>
          </div>

          <div className={`p-8 rounded-3xl shadow-xl text-white relative overflow-hidden transition-all duration-500 ${estadoPago?.resumen?.estatus_general === 'AL CORRIENTE'
            ? 'bg-gradient-to-br from-emerald-800 to-emerald-950'
            : estadoPago?.resumen?.estatus_general === 'REZAGADO'
              ? 'bg-gradient-to-br from-red-800 to-red-950'
              : 'bg-emerald-900'
            }`}>
            <div className="relative z-10">
              {estadoPago?.resumen ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/60">Estado Fiscal {estadoPago.anio_fiscal}</h3>
                    <div className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${estadoPago.resumen.estatus_general === 'AL CORRIENTE'
                      ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30'
                      : 'bg-red-400/20 text-red-200 border border-red-400/30 animate-pulse'
                      }`}>
                      {estadoPago.resumen.estatus_general === 'AL CORRIENTE'
                        ? <><Shield size={12} /> AL CORRIENTE</>
                        : <><AlertCircle size={12} /> REZAGADO</>
                      }
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-3 bg-white/5 rounded-2xl backdrop-blur-sm">
                      <p className="text-2xl font-black">{estadoPago.resumen.total_activos}</p>
                      <p className="text-[8px] uppercase tracking-widest text-white/50 font-bold mt-0.5">Total</p>
                    </div>
                    <div className="text-center p-3 bg-emerald-400/10 rounded-2xl">
                      <p className="text-2xl font-black text-emerald-300">{estadoPago.resumen.al_corriente}</p>
                      <p className="text-[8px] uppercase tracking-widest text-emerald-300/70 font-bold mt-0.5">Pagados</p>
                    </div>
                    <div className="text-center p-3 bg-red-400/10 rounded-2xl">
                      <p className="text-2xl font-black text-red-300">{estadoPago.resumen.rezagados}</p>
                      <p className="text-[8px] uppercase tracking-widest text-red-300/70 font-bold mt-0.5">Rezagados</p>
                    </div>
                  </div>

                  <p className="text-[9px] text-white/40 font-medium flex items-center gap-1.5">
                    <Activity size={10} /> Periodo analizado: Año {estadoPago.anio_fiscal}, Mes {estadoPago.mes_actual}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1">Adeudo Consolidado</h3>
                  <p className="text-4xl font-bold">${totalDeuda.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-emerald-200 mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} /> {loadingEstado ? 'Consultando estado fiscal...' : 'Suma de activos municipales'}
                  </p>
                </>
              )}
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <CreditCard size={160} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-800">Expediente de Activos</h3>
            <p className="text-xs text-slate-400">Historial y estado de obligaciones municipales</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('predios')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <Home size={18} />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-sm text-slate-700">Predios (Catastro)</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{perfil.predios.length} activos</p>
                </div>
              </div>
              {openSections.includes('predios') ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
            </button>

            {openSections.includes('predios') && (
              <div className="px-6 pb-6 space-y-4">
                {perfil.predios.map(predio => {
                  const ep = getEstadoPredio(predio.clave_catastral);
                  return (
                    <div key={predio.id} className={`p-5 border rounded-2xl group transition-all ${ep && !ep.al_corriente ? 'border-red-200 bg-red-50/20' : 'border-slate-100 bg-slate-50/30'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-bold text-slate-800">{predio.clave_catastral}</p>
                            <PaymentStatusBadge alCorriente={ep?.al_corriente ?? (loadingEstado ? null : undefined)} />
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12} /> {predio.direccion_predio}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditActivo(predio, 'predio')}
                            className="p-2 text-slate-400 hover:text-emerald-700 transition-colors"
                            title="Editar predio"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleTransfer(predio, 'predio')}
                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
                            title="Transferir predio"
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                        </div>
                      </div>
                      {predio.deudas.map(deuda => (
                        <div key={deuda.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 mt-2">
                          <div>
                            <p className="text-[10px] font-bold text-slate-700 uppercase">{deuda.descripcion}</p>
                            <p className="text-[9px] text-slate-400">Vence: {deuda.fecha_vencimiento}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-mono font-bold text-slate-800">${deuda.monto.toFixed(2)}</span>
                            <button
                              onClick={() => navigate('/modulo-catastro')}
                              className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-bold uppercase hover:bg-emerald-100"
                            >
                              IR A COBRO
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('tomas')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Droplet size={18} />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-sm text-slate-700">Tomas de Agua</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{perfil.tomas.length} activos</p>
                </div>
              </div>
              {openSections.includes('tomas') ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
            </button>
            {openSections.includes('tomas') && (
              <div className="px-6 pb-6 space-y-4">
                {perfil.tomas.map(toma => {
                  const et = getEstadoToma(toma.numero_contrato);
                  return (
                    <div key={toma.id} className={`p-5 border rounded-2xl transition-all group ${toma.estado === 'pausado' ? 'border-amber-200 bg-amber-50/30' : toma.estado === 'cancelado' ? 'border-red-200 bg-red-50/30 opacity-75' : et && !et.al_corriente ? 'border-red-200 bg-red-50/20' : 'border-slate-100 bg-slate-50/30'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-slate-800">{toma.numero_contrato}</p>
                            <StatusBadge estado={toma.estado} />
                            {toma.estado !== 'cancelado' && <PaymentStatusBadge alCorriente={et?.al_corriente ?? (loadingEstado ? null : undefined)} />}
                          </div>
                          <p className="text-xs text-slate-500">{toma.direccion_toma}</p>
                          {toma.ultimo_pago_historico && (
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                              Último Pago Historico: <span className="text-slate-600">{toma.ultimo_pago_historico}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {toma.estado !== 'cancelado' && (
                            <>
                              <button
                                onClick={() => handlePausarActivo(toma.id, 'toma')}
                                className={`p-2 transition-colors ${toma.estado === 'pausado' ? 'text-emerald-600' : 'text-amber-500'}`}
                                title={toma.estado === 'pausado' ? "Reactivar facturación" : "Pausar facturación"}
                              >
                                {toma.estado === 'pausado' ? <Play size={14} /> : <Pause size={14} />}
                              </button>
                              <button
                                onClick={() => handleCancelarActivo(toma.id, 'toma')}
                                className="p-2 text-red-400 hover:text-red-700 transition-colors"
                                title="Cancelar contrato (Baja definitiva)"
                              >
                                <Ban size={14} />
                              </button>
                              <button
                                onClick={() => handleEditActivo(toma, 'toma')}
                                className="p-2 text-slate-400 hover:text-emerald-700 transition-colors"
                                title="Editar contrato"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleTransfer(toma, 'toma')}
                                className="p-2 text-slate-400 hover:text-amber-600"
                                title="Transferir contrato"
                              >
                                <ArrowRightLeft size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {toma.deudas.map(deuda => (
                        <div key={deuda.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 mt-2">
                          <p className="text-[10px] font-bold text-slate-700 uppercase">{deuda.descripcion}</p>
                          <span className="text-xs font-mono font-bold text-slate-800">${deuda.monto.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleSection('licencias')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Store size={18} />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-sm text-slate-700">Licencias Comerciales</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{perfil.licencias?.length || 0} activos</p>
                </div>
              </div>
              {openSections.includes('licencias') ? <ChevronUp size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300" />}
            </button>
            {openSections.includes('licencias') && (
              <div className="px-6 pb-6 space-y-4">
                {perfil.licencias?.map(licencia => {
                  const el = getEstadoLicencia(licencia.numero_licencia);
                  return (
                    <div key={licencia.id} className={`p-5 border rounded-2xl transition-all group ${licencia.estado === 'cancelado' ? 'border-red-200 bg-red-50/30 opacity-75' : el && !el.al_corriente ? 'border-red-200 bg-red-50/20' : 'border-slate-100 bg-slate-50/30'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-slate-800">{licencia.nombre_negocio}</p>
                            <StatusBadge estado={licencia.estado} />
                            {licencia.estado !== 'cancelado' && <PaymentStatusBadge alCorriente={el?.al_corriente ?? (loadingEstado ? null : undefined)} />}
                          </div>
                          <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest">{licencia.numero_licencia}</p>
                          <p className="text-xs text-slate-500 mt-1">{licencia.giro}</p>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {licencia.estado !== 'cancelado' && (
                            <>
                              <button
                                onClick={() => handleCancelarActivo(licencia.id, 'licencia')}
                                className="p-2 text-red-400 hover:text-red-700 transition-colors"
                                title="Cancelar licencia (Baja definitiva)"
                              >
                                <Ban size={14} />
                              </button>
                              <button
                                onClick={() => handleEditActivo(licencia, 'licencia')}
                                className="p-2 text-slate-400 hover:text-emerald-700 transition-colors"
                                title="Editar licencia"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleTransfer(licencia, 'licencia')}
                                className="p-2 text-slate-400 hover:text-amber-600"
                                title="Transferir licencia"
                              >
                                <ArrowRightLeft size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {licencia.deudas.map(deuda => (
                        <div key={deuda.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 mt-2">
                          <p className="text-[10px] font-bold text-slate-700 uppercase">{deuda.descripcion}</p>
                          <span className="text-xs font-mono font-bold text-slate-800">${deuda.monto.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
                {(!perfil.licencias || perfil.licencias.length === 0) && (
                  <div className="py-12 text-center">
                    <p className="text-sm text-slate-400">No hay licencias registradas para este contribuyente.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalEditarContribuyente
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        perfil={perfil}
        onSave={async (d) => {
          try {
            const res = await api.actualizarContribuyente(perfil.id, d);
            if (res.success) {
              await cargarPerfil();
            } else {
              alert('Error actualizando perfil');
            }
          } catch (err) {
            alert('Error actualizando perfil');
          }
        }}
      />

      <ModalEditarDeuda
        isOpen={isEditDeudaModalOpen}
        onClose={() => setIsEditDeudaModalOpen(false)}
        deuda={deudaAEditar}
        onSave={saveEditedDeuda}
      />

      <ModalNuevoActivo
        isOpen={isNuevoActivoModalOpen}
        onClose={() => setIsNuevoActivoModalOpen(false)}
        contribuyenteId={perfil.id}
        onSave={handleSaveNuevoActivo}
      />

      <ModalTransferenciaActivo
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        activo={activoATransferir}
        tipo={tipoActivoActual}
        onConfirm={onTransferConfirm}
      />

      <ModalEditarActivo
        isOpen={isEditActivoModalOpen}
        onClose={() => setIsEditActivoModalOpen(false)}
        activo={activoAEditar}
        tipo={tipoActivoActual}
        onSave={saveEditedActivo}
      />
    </div>
  );
};

export default ContribuyenteDetalle;
