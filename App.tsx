
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
import { api } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('tlapa_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [email, setEmail] = useState('admin@tlapa.gob.mx');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      const resp = await api.login({ email, password });
      setUser(resp.user);
      localStorage.setItem('tlapa_user', JSON.stringify(resp.user));
    } catch (err: any) {
      setLoginError(err.message || 'Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
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

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100 text-center">
                {loginError}
              </div>
            )}
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Correo electrónico"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium outline-none"
                required
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-800 text-white py-4 rounded-xl font-bold hover:bg-emerald-900 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-4">
              <button type="button" onClick={() => { setEmail('admin@tlapa.gob.mx'); setPassword('admin123'); }}>Demo Admin</button>
              <button type="button" onClick={() => { setEmail('cajero1@tlapa.gob.mx'); setPassword('12345'); }}>Demo Cajero</button>
            </div>
          </form>
          <p className="mt-8 text-center text-[10px] text-emerald-900/40 uppercase font-bold tracking-widest">Sistema de Recaudación Municipal • 2025</p>
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
