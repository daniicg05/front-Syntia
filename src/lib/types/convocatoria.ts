export interface ConvocatoriaPublicaDTO {
  id: number;
  titulo: string;
  sector?: string;
  organismo?: string;
  ubicacion?: string;
  fechaCierre?: string;
  fechaPublicacion?: string;
  abierto?: boolean;
  urlOficial?: string;
  idBdns?: string;
  numeroConvocatoria?: string;
  matchScore?: number;
  matchRazon?: string;
  tipo?: string;
}
export interface ConvocatoriasPageResponse<T = ConvocatoriaPublicaDTO> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
export interface ConvocatoriaAdminDTO {
  id: number;
  titulo: string;
  tipo?: string;
  sector?: string;
  ubicacion?: string;
  fuente?: string;
  idBdns?: string;
  numeroConvocatoria?: string;
  fechaCierre?: string;
  organismo?: string;
  fechaPublicacion?: string;
  descripcion?: string;
  presupuesto?: number;
  abierto?: boolean;
  finalidad?: string;
  fechaInicio?: string;
}
