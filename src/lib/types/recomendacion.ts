export interface RecomendacionDTO {
  id: number;
  puntuacion: number;
  explicacion?: string;
  guia?: string;
  guiaEnriquecida?: string;
  usadaIa: boolean;
  vigente: boolean;
  convocatoriaId: number;
  titulo: string;
  tipo?: string;
  sector?: string;
  ubicacion?: string;
  urlOficial?: string;
  fuente?: string;
  fechaCierre?: string;
  organismo?: string;
  presupuesto?: number;
  fechaPublicacion?: string;
  numeroConvocatoria?: string;
  abierto?: boolean;
}
