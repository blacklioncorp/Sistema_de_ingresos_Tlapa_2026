
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, Phone, Mail, CreditCard, 
  Droplet, Home, Store, AlertCircle, Clock, 
  Edit2, FileText, User, Hash, Calendar, Download,
  Plus, ChevronDown, ChevronUp, ArrowRightLeft,
  Pause, Play, Trash2, Ban
} from 'lucide-react';
import { ContribuyentePerfil, DeudaItem, Predio, TomaAgua, LicenciaComercio } from '../types';
import ModalEditarContribuyente from '../components/ModalEditarContribuyente';
import ModalEditarDeuda from '../components/ModalEditarDeuda';
import ModalNuevoActivo from '../components/ModalNuevoActivo';
import ModalTransferenciaActivo from '../components/ModalTransferenciaActivo';
import ModalEditarActivo from '../components/ModalEditarActivo';

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

  const [perfil, setPerfil] = useState<ContribuyentePerfil>({
    id: Number(id),
    rfc: 'GOMR800101XYZ',
    nombre_completo: 'Roberto Gómez Martínez',
    direccion_fiscal: 'Av. Heroico Colegio Militar #45, Centro, Tlapa de Comonfort',
    telefono: '757 123 4567',
    email: 'roberto.gomez@gmail.com',
    predios: [
      { 
        id: 10, 
        clave_catastral: '001-002-045', 
        direccion_predio: 'Calle Mina #45 (Casa)', 
        valor_catastral: 850000, 
        tipo_predio: 'urbano', 
        deudas: [{ id: 1, descripcion: 'Impuesto Predial 2025', monto: 1200, estado: 'pendiente', fecha_vencimiento: '2025-03-31' }] 
      },
      { 
        id: 11, 
        clave_catastral: '001-005-122', 
        direccion_predio: 'Av. Hidalgo #12 (Local)', 
        valor_catastral: 1450000, 
        tipo_predio: 'urbano', 
        deudas: [{ id: 3, descripcion: 'Impuesto Predial 2025', monto: 2100, estado: 'pendiente', fecha_vencimiento: '2025-03-31' }] 
      }
    ],
    tomas: [
      { 
        id: 20, 
        numero_contrato: 'W-12345', 
        direccion_toma: 'Calle Mina #45', 
        tipo_servicio: 'domestico', 
        estado: 'activo',
        deudas: [{ id: 2, descripcion: 'Servicio Agua Potable - Enero', monto: 150, estado: 'pendiente', fecha_vencimiento: '2025-02-05' }] 
      },
      { 
        id: 21, 
        numero_contrato: 'W-54321', 
        direccion_toma: 'Av. Hidalgo #12', 
        tipo_servicio: 'comercial', 
        estado: 'activo',
        deudas: [{ id: 4, descripcion: 'Servicio Agua Potable - Enero', monto: 450, estado: 'pendiente', fecha_vencimiento: '2025-02-05' }] 
      }
    ],
    licencias: [
      {
        id: 30,
        numero_licencia: 'LIC-2025-001',
        nombre_negocio: 'Abarrotes Roberto',
        giro: 'Venta de alimentos y bebidas',
        direccion_local: 'Calle Mina #45',
        estado: 'activo',
        deudas: [{ id: 5, descripcion: 'Refrendo de Licencia 2025', monto: 850, estado: 'pendiente', fecha_vencimiento: '2025-01-31' }]
      },
      {
        id: 31,
        numero_licencia: 'LIC-2025-002',
        nombre_negocio: 'Taller Mecánico Gómez',
        giro: 'Servicios Automotrices',
        direccion_local: 'Av. Hidalgo #12',
        estado: 'activo',
        deudas: [{ id: 6, descripcion: 'Refrendo de Licencia 2025', monto: 1200, estado: 'pendiente', fecha_vencimiento: '2025-01-31' }]
      }
    ]
  });

  const todasLasDeudas = [
    ...perfil.predios.flatMap(p => p.deudas.map(d => ({ ...d, origen: 'Catastro', ref: p.clave_catastral }))),
    ...perfil.tomas.flatMap(t => t.deudas.map(d => ({ ...d, origen: 'Agua Potable', ref: t.numero_contrato }))),
    ...(perfil.licencias || []).flatMap(l => l.deudas.map(d => ({ ...d, origen: 'Comercio', ref: l.numero_licencia })))
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

  const saveEditedActivo = (activoActualizado: any) => {
    if (tipoActivoActual === 'predio') {
      setPerfil({
        ...perfil,
        predios: perfil.predios.map(p => p.id === activoActualizado.id ? { ...p, ...activoActualizado } : p)
      });
    } else if (tipoActivoActual === 'toma') {
      setPerfil({
        ...perfil,
        tomas: perfil.tomas.map(t => t.id === activoActualizado.id ? { ...t, ...activoActualizado } : t)
      });
    } else {
      setPerfil({
        ...perfil,
        licencias: perfil.licencias.map(l => l.id === activoActualizado.id ? { ...l, ...activoActualizado } : l)
      });
    }
  };

  // Funciones para estados de activos
  const handlePausarActivo = (id: number, tipo: 'toma' | 'licencia') => {
    const confirmMsg = `¿Está seguro de pausar este activo? Se suspenderá la facturación temporalmente.`;
    if (window.confirm(confirmMsg)) {
      if (tipo === 'toma') {
        setPerfil({
          ...perfil,
          tomas: perfil.tomas.map(t => t.id === id ? { ...t, estado: t.estado === 'pausado' ? 'activo' : 'pausado' } : t)
        });
      }
    }
  };

  const handleCancelarActivo = (id: number, tipo: 'toma' | 'licencia') => {
    const confirmMsg = `¿Está seguro de CANCELAR definitivamente este activo? Esta acción dará de baja el registro en el padrón municipal.`;
    if (window.confirm(confirmMsg)) {
      if (tipo === 'toma') {
        setPerfil({
          ...perfil,
          tomas: perfil.tomas.map(t => t.id === id ? { ...t, estado: 'cancelado' } : t)
        });
      } else {
        setPerfil({
          ...perfil,
          licencias: perfil.licencias.map(l => l.id === id ? { ...l, estado: 'cancelado' } : l)
        });
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

  const handleSaveNuevoActivo = (data: any) => {
    console.log("Nuevo activo:", data);
  };

  const StatusBadge = ({ estado }: { estado?: string }) => {
    if (estado === 'pausado') return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-bold uppercase tracking-widest border border-amber-200">Suspendido</span>;
    if (estado === 'cancelado') return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[9px] font-bold uppercase tracking-widest border border-red-200">Cancelado</span>;
    return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-bold uppercase tracking-widest border border-emerald-200">Activo</span>;
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
                <p className="text-[10px] text-slate-500 font-medium text-left leading-relaxed">{perfil.direccion_fiscal}</p>
              </div>
              <div className="flex gap-3 items-center p-3.5 bg-slate-50 rounded-2xl border border-slate-100/50">
                <Phone size={14} className="text-slate-400" />
                <p className="text-xs text-slate-600 font-bold">{perfil.telefono}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1">Adeudo Consolidado</h3>
              <p className="text-4xl font-bold">${totalDeuda.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] text-emerald-200 mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
                <AlertCircle size={14} /> Suma de activos municipales
              </p>
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
                {perfil.predios.map(predio => (
                  <div key={predio.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/30 group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{predio.clave_catastral}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {predio.direccion_predio}</p>
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
                ))}
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
                {perfil.tomas.map(toma => (
                  <div key={toma.id} className={`p-5 border border-slate-100 rounded-2xl transition-all group ${toma.estado === 'pausado' ? 'bg-amber-50/30' : toma.estado === 'cancelado' ? 'bg-red-50/30 opacity-75' : 'bg-slate-50/30'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-800">{toma.numero_contrato}</p>
                          <StatusBadge estado={toma.estado} />
                        </div>
                        <p className="text-xs text-slate-500">{toma.direccion_toma}</p>
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
                ))}
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
                {perfil.licencias?.map(licencia => (
                  <div key={licencia.id} className={`p-5 border border-slate-100 rounded-2xl transition-all group ${licencia.estado === 'cancelado' ? 'bg-red-50/30 opacity-75' : 'bg-slate-50/30'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-bold text-slate-800">{licencia.nombre_negocio}</p>
                          <StatusBadge estado={licencia.estado} />
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
                ))}
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
        onSave={(d) => setPerfil({...perfil, ...d})} 
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
