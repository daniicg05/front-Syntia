export interface RecomendacionDTO {
  id: number;
  puntuacion: number;
  explicacion?: string;
  guia?: string;
  guiaEnriquecida?: string | null;
  usadaIa: boolean;
  vigente: boolean;
  convocatoriaId: number;
  titulo: string;
  favorita?: boolean;
  tipo?: string | null;
  sector?: string | null;
  ubicacion?: string | null;
  urlOficial?: string | null;
  fuente?: string | null;
  fechaCierre?: string | null;
  organismo?: string | null;
  presupuesto?: number | null;
  fechaPublicacion?: string | null;
}
