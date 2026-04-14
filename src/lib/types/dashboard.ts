import type { RecomendacionDTO } from "./recomendacion";
export interface DashboardData {
  usuario?: {
    id: number;
    email: string;
    rol: "USUARIO" | "ADMIN";
    plan: "GRATUITO" | "PREMIUM";
    creadoEn: string;
  };
  topRecomendaciones: Array<{
    proyecto: { id: number; nombre: string; sector?: string; ubicacion?: string };
    recomendaciones: RecomendacionDTO[];
  }>;
  roadmap: Array<{
    proyecto: { id: number; nombre: string; sector?: string };
    recomendacion: RecomendacionDTO;
  }>;
  totalRecomendaciones: number;
}
