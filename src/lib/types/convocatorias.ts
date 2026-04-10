export interface Convocatoria {
  id: number;
  titulo: string;
  tipo: string;
  sector: string;
  ubicacion: string;
  fuente: string;
  fechaCierre: string;
}

export interface ConvocatoriasPageResponse {
  convocatorias: Convocatoria[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

