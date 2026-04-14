export interface AdminDashboardStats {
  adminEmail: string;
  totalUsuarios: number;
  totalConvocatorias: number;
  totalProyectos: number;
  totalRecomendaciones: number;
}
export interface AdminUsuarioListItem {
  id: number;
  email: string;
  rol: "USUARIO" | "ADMIN";
  plan?: "GRATUITO" | "PREMIUM";
  creadoEn: string;
}
export interface AdminUsuarioDetalle {
  usuario: {
    id: number;
    email: string;
    rol: "USUARIO" | "ADMIN";
    creadoEn: string;
    empresa?: string;
    provincia?: string;
    telefono?: string;
  };
  proyectos: Array<{ id: number; nombre: string; sector: string }>;
  recsPerProyecto: Record<number, number>;
  emailCambiado: boolean;
  historialCorreo: Array<{ anterior: string; nuevo: string; fecha: string; actor: string }>;
}
