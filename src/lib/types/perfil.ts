export interface PerfilDTO {
  nombre?: string;
  sector: string;
  ubicacion: string;
  empresa?: string;
  provincia?: string;
  telefono?: string;
  tipoEntidad?: string;
  objetivos?: string;
  necesidadesFinanciacion?: string;
  descripcionLibre?: string;
}
export interface PerfilCompletoDTO extends PerfilDTO {
  email: string;
  rol: "USUARIO" | "ADMIN";
  plan: "GRATUITO" | "PREMIUM";
  creadoEn: string;
}
