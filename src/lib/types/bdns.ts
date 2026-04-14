export interface ImportacionBdnsEstadoDTO {
  estado: "INACTIVO" | "EN_CURSO" | "COMPLETADO" | "FALLIDO";
  registrosImportados: number;
  ejeActual: string | null;
  iniciadoEn: string | null;
  finalizadoEn: string | null;
  error: string | null;
  modo: "FULL" | "INCREMENTAL" | null;
}
export interface ResumenEjecucionDTO {
  ejecucionId: string;
  tsInicio: string | null;
  tsFin: string | null;
  totalRegistrosNuevos: number;
  totalRegistrosActualizados: number;
  totalErrores: number;
  ejesProcesados: number;
  totalPaginas: number;
}
export interface SyncStateDTO {
  eje: string;
  estado: "PENDIENTE" | "EN_PROGRESO" | "COMPLETADO" | "ERROR";
  ultimaPaginaOk: number;
  registrosNuevos: number;
  registrosActualizados: number;
  tsInicio: string | null;
  tsUltimaCarga: string | null;
}
export interface CoberturaDTO {
  totalConvocatorias: number;
  campos: Array<{ campo: string; conValor: number; porcentaje: number }>;
}
