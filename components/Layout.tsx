
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  UserCog,
  FileText,
  LogOut,
  Droplet,
  Map,
  Store,
  ChevronRight,
  Menu,
  X,
  Tag,
  Globe
} from 'lucide-react';
import { Usuario } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: Usuario;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navItems = [
    { type: 'header', label: 'Principal' },
    { path: '/', label: 'Inicio', icon: Home, adminOnly: false },
    { type: 'header', label: 'Administración' },
    { path: '/contribuyentes', label: 'Contribuyentes', icon: Users, adminOnly: false },
    { path: '/cajeros', label: 'Cajeros', icon: UserCog, adminOnly: true },
    { path: '/admin/conceptos', label: 'Conceptos de Cobro', icon: Tag, adminOnly: true },
    { path: '/admin/mapa', label: 'Mapa de Cobertura', icon: Globe, adminOnly: true },
    { path: '/reporte', label: 'Recaudación', icon: FileText, adminOnly: true },
    { type: 'header', label: 'Módulos de Cobro' },
    { path: '/modulo-agua', label: 'Agua Potable', icon: Droplet, adminOnly: false, permiso: 'agua' },
    { path: '/modulo-catastro', label: 'Catastro', icon: Map, adminOnly: false, permiso: 'catastro' },
    { path: '/modulo-comercio', label: 'Comercio', icon: Store, adminOnly: false, permiso: 'comercio' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-emerald-900/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden">
            <img
              src="https://lh3.googleusercontent.com/d/1Yc5hGNVkFDwXbld_sUq2V5ZNhjMc7sgb"
              alt="Logo Tlapa"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-base leading-tight truncate">Tlapa de Comonfort</h1>
            <p className="text-[10px] uppercase tracking-widest text-emerald-400">Sistema de Ingresos</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          if (item.type === 'header') {
            return <p key={idx} className="text-[11px] font-bold text-emerald-500 uppercase px-4 mb-2 mt-4 first:mt-0">{item.label}</p>;
          }

          if (item.adminOnly && user.rol !== 'admin') return null;
          if (item.permiso && !user.permisos[item.permiso as keyof typeof user.permisos]) return null;

          return (
            <Link
              key={idx}
              to={item.path!}
              onClick={closeMobileMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive(item.path!) ? 'bg-emerald-800 text-white shadow-lg' : 'text-emerald-200 hover:bg-emerald-900/50'}`}
            >
              {item.icon && <item.icon size={20} />}
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-emerald-900/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-red-300 hover:bg-red-900/40 hover:text-red-200 transition-all font-medium text-sm"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-emerald-950/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-emerald-950 text-white flex flex-col shadow-2xl transition-transform duration-300 transform
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <SidebarContent />
      </aside>

      <main className="flex-1 lg:ml-72 min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center text-slate-500 text-sm">
              <span>Sistema</span>
              <ChevronRight size={14} className="mx-2" />
              <span className="text-emerald-900 font-bold capitalize">
                {location.pathname === '/' ? 'Inicio' : location.pathname.split('/').pop()?.replace('-', ' ')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden xs:block">
              <p className="text-sm font-bold text-slate-800 leading-none">{user.nombre}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.rol}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold shadow-sm border border-emerald-200">
              {user.nombre.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
