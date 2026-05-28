export interface Promocion {
  id: number;
  titulo: string;
  descripcion: string;
  marca: string;
  categoriaId: number;
  descuento: number;
  destacada: boolean;
  colorMarca: string;
  imagenUrl: string;
  vigenciaDias: number; // bitmask: 1=Lun,2=Mar,4=Mié,8=Jue,16=Vie,32=Sáb,64=Dom
  fechaDesde: string | null;
  fechaHasta: string | null;
  markers: string; // JSON de marcadores Leaflet
  whatsapp?: string;
  urlSitio?: string;
  instagram?: string;
  ciudadIds: number[];
  totalVisitas: number;
  creadoPor: string;
  modificadoPor: string;
}

export interface CrearPromocionRequest {
  titulo: string;
  descripcion: string;
  marca: string;
  categoriaId: number;
  descuento: number;
  destacada: boolean;
  colorMarca: string;
  imagenUrl: string;
  vigenciaDias: number;
  fechaDesde: string | null;
  fechaHasta: string | null;
  markers: string;
  whatsapp?: string;
  urlSitio?: string;
  instagram?: string;
  ciudadIds: number[];
  creadoPor: string;
}

export interface ActualizarPromocionRequest {
  id: number;
  titulo: string;
  descripcion: string;
  marca: string;
  categoriaId: number;
  descuento: number;
  destacada: boolean;
  colorMarca: string;
  imagenUrl: string;
  vigenciaDias: number;
  fechaDesde: string | null;
  fechaHasta: string | null;
  markers: string;
  whatsapp?: string;
  urlSitio?: string;
  instagram?: string;
  ciudadIds: number[];
  modificadoPor: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  icono: string | null;
  colorHex: string | null;
}

export interface Ciudad {
  id: number;
  nombre: string;
  departamento: string;
}

export interface MarkerData {
  lat: number;
  lng: number;
  label?: string;
}

export const DIAS_SEMANA = [
  { label: 'L', nombre: 'Lunes',     bit: 1 },
  { label: 'M', nombre: 'Martes',    bit: 2 },
  { label: 'X', nombre: 'Miércoles', bit: 4 },
  { label: 'J', nombre: 'Jueves',    bit: 8 },
  { label: 'V', nombre: 'Viernes',   bit: 16 },
  { label: 'S', nombre: 'Sábado',    bit: 32 },
  { label: 'D', nombre: 'Domingo',   bit: 64 },
];
