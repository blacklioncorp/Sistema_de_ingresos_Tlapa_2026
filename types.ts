
export type UserRole = 'admin' | 'cajero';

export interface Permisos {
  agua: boolean;
  catastro: boolean;
  comercio: boolean;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
  permisos: Permisos;
  lastActivity?: string;
}

export interface DeudaItem {
  id: number;
  descripcion: string;
  monto: number;
  estado: 'pendiente' | 'pagado';
  fecha_vencimiento: string;
}

export interface Predio {
  id: number;
  clave_catastral: string;
  direccion_predio: string;
  valor_catastral: number;
  tipo_predio: 'urbano' | 'rustico';
  latitud?: number;
  longitud?: number;
  deudas: DeudaItem[];
}

export interface TomaAgua {
  id: number;
  numero_contrato: string;
  direccion_toma: string;
  tipo_servicio: string;
  latitud?: number;
  longitud?: number;
  ultimo_pago_historico?: string;
  deudas: DeudaItem[];
  estado?: 'activo' | 'pausado' | 'cancelado';
}

export interface LicenciaComercio {
  id: number;
  numero_licencia: string;
  nombre_negocio: string;
  giro: string;
  direccion_local: string;
  latitud?: number;
  longitud?: number;
  deudas: DeudaItem[];
  estado?: 'activo' | 'pausado' | 'cancelado';
}

export interface ContribuyentePerfil {
  id: number;
  rfc: string;
  nombre_completo: string;
  direccion_fiscal: string;
  telefono: string;
  email: string;
  latitud?: number;
  longitud?: number;
  predios: Predio[];
  tomas: TomaAgua[];
  licencias: LicenciaComercio[];
}

export interface Contribuyente {
  id: number;
  rfc: string;
  nombre_completo: string;
  direccion: string;
  telefono: string;
  latitud?: number;
  longitud?: number;
}

export interface Concepto {
  id: number;
  area: 'agua' | 'catastro' | 'comercio';
  clave: string;
  nombre: string;
  precio: number;
  calculado?: boolean;
  frecuencia_cobro?: 'mensual' | 'anual' | 'unico';
}
