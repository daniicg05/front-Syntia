export interface CatalogoItem {
  id: number;
  nombre: string;
}

export interface Catalogos {
  regiones: CatalogoItem[];
  finalidades: CatalogoItem[];
  instrumentos: CatalogoItem[];
}

export interface FiltrosBdns {
  descripcion?: string;
  descripcionTipoBusqueda?: 0 | 1 | 2;
  numeroConvocatoria?: string;
  ayudaEstado?: string;
  tipoAdministracion?: 'C' | 'A' | 'L' | 'O';
  regiones?: number[];
  finalidad?: number;
  instrumentos?: number[];
  organos?: number[];
  tiposBeneficiario?: number[];
  mrr?: boolean;
  contribucion?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  pageSize?: number;
  order?: string;
  direccion?: 'asc' | 'desc';
}

export interface ConvocatoriaDetalle {
  idBdns: string;
  numeroConvocatoria: string;
  titulo: string;
  tituloAlternativo: string | null;
  tipo: string;
  ubicacion: string;
  sector: string | null;
  finalidad: string | null;
  instrumento: string | null;
  nivel1: string;
  nivel2: string;
  nivel3: string | null;
  fuente: string;
  objeto: string | null;
  beneficiarios: string | null;
  requisitos: string | null;
  documentacion: string | null;
  dotacion: string | null;
  ayudaEstado: string | null;
  mrr: boolean;
  contribucion: boolean;
  fechaRecepcion: string | null;
  fechaFinSolicitud: string | null;
  fechaCierre: string | null;
  plazoSolicitudes: string | null;
  procedimiento: string | null;
  basesReguladoras: string | null;
  urlOficial: string;
  puntuacion?: number;
  explicacion?: string;
  guia?: string;
  fechaAnalisis?: string;
}

export const FILTROS_INICIALES: FiltrosBdns = {
  descripcionTipoBusqueda: 1,
  page: 0,
  pageSize: 15,
};

