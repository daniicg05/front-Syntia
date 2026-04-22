export type FavoriteApiDate = string;

export interface ConvocatoriaFavoritaDTO {
  convocatoriaId: number;
  titulo: string;
  tipo?: string | null;
  sector?: string | null;
  ubicacion?: string | null;
  urlOficial?: string | null;
  fuente?: string | null;
  fechaCierre?: FavoriteApiDate | null;
  organismo?: string | null;
  presupuesto?: number | null;
  fechaPublicacion?: FavoriteApiDate | null;
  fechaFavorita: string;
}

export interface FavoriteStatusResponse {
  convocatoriaId: number;
  favorita: boolean;
}

export interface FavoriteToggleResponse extends FavoriteStatusResponse {
  message: string;
}

export interface ApiError {
  status?: number;
  message: string;
  timestamp?: string;
  path?: string;
}
