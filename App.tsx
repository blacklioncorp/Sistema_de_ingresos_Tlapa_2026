
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Contribuyentes from './pages/Contribuyentes';
import NuevoContribuyente from './pages/NuevoContribuyente';
import ContribuyenteDetalle from './pages/ContribuyenteDetalle';
import Cajeros from './pages/Cajeros';
import AdminConceptos from './pages/AdminConceptos';
import ModuloPago from './pages/ModuloPago';
import Reportes from './pages/Reportes';
import { Usuario } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('tlapa_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (userData: Usuario) => {
    setUser(userData);
    localStorage.setItem('tlapa_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('tlapa_user');
    localStorage.removeItem('tlapa_token');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-950 px-4 relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-800 rounded-full blur-[100px] opacity-20 -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-900 rounded-full blur-[100px] opacity-20 -ml-48 -mb-48"></div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-white/20 relative z-10">
          <div className="text-center mb-10">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-slate-100">
              <img 
                src="https://lh3.googleusercontent.com/d/1Yc5hGNVkFDwXbld_sUq2V5ZNhjMc7sgb" 
                alt="Logo Tlapa" 
                className="w-16 h-16 object-contain"
              />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Bienvenido</h2>
            <p className="text-slate-500 mt-2 font-medium">H. Ayuntamiento de Tlapa de Comonfort</p>
            <div className="h-1 w-12 bg-emerald-600 mx-auto mt-4 rounded-full"></div>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => handleLogin({
                id: 1, nombre: 'Admin General', email: 'admin@tlapa.gob.mx', rol: 'admin',
                permisos: { agua: true, catastro: true, comercio: true }
              })}
              className="w-full bg-emerald-800 text-white py-4 rounded-2xl font-bold hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              Ingresar como Administrador
            </button>
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-widest">O</span></div>
            </div>
            <button 
              onClick={() => handleLogin({
                id: 2, nombre: 'Cajero Modulo Agua', email: 'cajero1@tlapa.gob.mx', rol: 'cajero',
                permisos: { agua: true, catastro: false, comercio: false }
              })}
              className="w-full bg-slate-50 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all border border-slate-200 active:scale-[0.98]"
            >
              Ingresar como Cajero (Agua)
            </button>
          </div>
          <p className="mt-10 text-center text-[10px] text-emerald-900/40 uppercase font-bold tracking-widest">Sistema de Recaudación Municipal • 2025</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/contribuyentes" element={<Contribuyentes />} />
          <Route path="/contribuyentes/nuevo" element={user.rol === 'admin' ? <NuevoContribuyente /> : <Navigate to="/contribuyentes" />} />
          <Route path="/contribuyentes/:id" element={<ContribuyenteDetalle />} />
          <Route path="/cajeros" element={user.rol === 'admin' ? <Cajeros /> : <Navigate to="/" />} />
          <Route path="/admin/conceptos" element={user.rol === 'admin' ? <AdminConceptos /> : <Navigate to="/" />} />
          <Route path="/reporte" element={user.rol === 'admin' ? <Reportes /> : <Navigate to="/" />} />
          
          {user.permisos.agua && <Route path="/modulo-agua" element={<ModuloPago tipo="agua" />} />}
          {user.permisos.catastro && <Route path="/modulo-catastro" element={<ModuloPago tipo="catastro" />} />}
          {user.permisos.comercio && <Route path="/modulo-comercio" element={<ModuloPago tipo="comercio" />} />}
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
