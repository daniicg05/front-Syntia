import axios from "axios";
import Cookies from "js-cookie";
import type { ConvocatoriasPageResponse } from "@/lib/types/convocatorias";

const SKIP_AUTH_REDIRECT_HEADER = "x-skip-auth-redirect";

const api = axios.create({
    baseURL: "/api",
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    const token = Cookies.get("syntia_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (error) => {
        const skipAuthRedirect =
            String(error.config?.headers?.[SKIP_AUTH_REDIRECT_HEADER] ?? "").toLowerCase() === "true";

        if (
            error.response?.status === 401 &&
            !skipAuthRedirect &&
            typeof window !== "undefined"
        ) {
            Cookies.remove("syntia_token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
    login: (email: string, password: string) =>
        api.post<{ token: string; email: string; rol: string; expiration: number }>(
            "/auth/login",
            { email, password }
        ),
    registro: (email: string, password: string, confirmarPassword: string) =>
        api.post<{ token: string; email: string; rol: string; expiration: number }>(
            "/auth/registro",
            { email, password, confirmarPassword }
        ),
};

// ── Convocatorias públicas (sin autenticación) ────────────────────────────────
export interface ConvocatoriaPublica {
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
    tipo?: string;
    /** Puntuación de afinidad 0-100. Solo presente en endpoints autenticados. */
    matchScore?: number;
    matchRazon?: string;
    presupuesto?: number;
    regionId?: number;
    tiposBeneficiario?: string[];
}

export interface RegionNodo {
    id: number;
    descripcion: string;
    children: RegionNodo[];
}

export interface ConvocatoriaDetalle {
    id: number;
    titulo: string | null;
    tipo: string | null;
    sector: string | null;
    ubicacion: string | null;
    organismo: string | null;
    descripcion: string | null;
    textoCompleto: string | null;
    urlOficial: string | null;
    idBdns: string | null;
    numeroConvocatoria: string | null;
    finalidad: string | null;
    presupuesto: number | null;
    abierto: boolean | null;
    mrr: boolean | null;
    fechaCierre: string | null;
    fechaPublicacion: string | null;
    fechaInicio: string | null;
    regionId: number | null;
    provinciaId: number | null;
    tiposBeneficiario: string[];
    finalidades: string[];
    instrumentos: string[];
    organos: string[];
    regiones: string[];
    tipoAdmin: string | null;
    actividades: string[];
    reglamentos: string[];
    objetivos: string[];
    sectoresProducto: string[];
}

export interface BusquedaPublicaResponse {
    content: ConvocatoriaPublica[];
    totalElements: number;
    totalPages: number;
    page: number;
    size: number;
}

export const convocatoriasPublicasApi = {
    buscar: (params: { q?: string; sector?: string; tipo?: string; abierto?: boolean; regionId?: number; presupuestoMin?: number; page?: number; size?: number }) =>
        api.get<BusquedaPublicaResponse>("/convocatorias/publicas/buscar", { params }),
    destacadas: () => api.get<ConvocatoriaPublica[]>("/convocatorias/publicas/destacadas"),
    finalidades: () => api.get<string[]>("/convocatorias/publicas/finalidades"),
    tipos: () => api.get<string[]>("/convocatorias/publicas/tipos"),
    regiones: () => api.get<RegionNodo[]>("/convocatorias/publicas/regiones"),
    detalle: (id: number) => api.get<ConvocatoriaDetalle>(`/convocatorias/publicas/${id}`),
};

// ── Guía de subvención (generada por IA) ─────────────────────────────────────
export interface GuiaVisualStep {
    step: number;
    phase: string;
    title: string;
    description: string;
    screen_hint?: string;
    image_prompt?: string;
    official_link?: string;
}

export interface GuiaWorkflowStep {
    step: number;
    phase: string;
    title: string;
    description: string;
    user_action?: string;
    portal_action?: string;
    required_documents?: string[];
    official_link?: string;
    estimated_time_minutes?: number;
}

export interface GuiaSubvencion {
    grant_summary: {
        title: string;
        organism: string;
        objective: string;
        who_can_apply: string;
        deadline: string;
        official_link?: string;
        legal_basis?: string;
    };
    application_methods: { method: string; description: string; official_portal?: string }[];
    required_documents: string[];
    universal_requirements_lgs_art13: string[];
    workflows: { method: string; steps: GuiaWorkflowStep[] }[];
    visual_guides: { method: string; steps: GuiaVisualStep[] }[];
    legal_disclaimer: string;
}

// ── Análisis completo IA (nuevo) ────────────────────────────────────────────
export interface AnalisisCompleto {
    compatibilidad: {
        nivel: "ALTA" | "MEDIA" | "BAJA" | "NO_EVALUABLE";
        puntuacion: number;
        explicacion: string;
    };
    slides: AnalisisSlide[];
    recursos: {
        url_convocatoria?: string;
        url_bases_reguladoras?: string;
        url_sede_electronica?: string;
        documentos?: { nombre: string; descripcion?: string; url?: string }[];
    };
    disclaimer: string;
}

export interface AnalisisSlide {
    tipo: string;
    titulo: string;
    icono: string;
    contenido: string;
    items: AnalisisItem[];
    consejo?: string;
    alerta?: string;
}

export interface AnalisisItem {
    titulo: string;
    descripcion: string;
    tipo: string;
    estado?: "cumple" | "no_cumple" | "verificar" | null;
    url?: string;
    peso?: number;
    tiempo_minutos?: number;
    sub_items?: string[];
}

// ── Convocatorias autenticadas (con match score) ───────────────────────────────
export const convocatoriasUsuarioApi = {
    recomendadas: (params?: { page?: number; size?: number }) =>
        api.get<ConvocatoriaPublica[]>("/usuario/convocatorias/recomendadas", { params }),
    buscar: (params: { q?: string; sector?: string; tipo?: string; abierto?: boolean; regionId?: number; presupuestoMin?: number; sort?: string; page?: number; size?: number }) =>
        api.get<BusquedaPublicaResponse>("/usuario/convocatorias/buscar", { params }),
    analisis: (convocatoriaId: number, proyectoId?: number) =>
        api.get<AnalisisCompleto>(
            `/usuario/convocatorias/${convocatoriaId}/analisis`,
            { params: proyectoId ? { proyectoId } : {}, timeout: 120_000 }
        ),
};

// ── Dashboard usuario ─────────────────────────────────────────────────────────
export const dashboardApi = {
    get: () => api.get("/usuario/dashboard"),
};

// ── Perfil ────────────────────────────────────────────────────────────────────
export const perfilApi = {
    get: () => api.get("/usuario/perfil"),
    save: (data: Record<string, unknown>) => api.put("/usuario/perfil", data),
    cambiarEmail: (data: { nuevoEmail: string; passwordActual: string }) =>
        api.put<{ token: string; email: string; rol: string; expiration: number }>(
            "/usuario/perfil/email",
            data,
            {
                headers: {
                    [SKIP_AUTH_REDIRECT_HEADER]: "true",
                },
            }
        ),
    cambiarPassword: (data: { passwordActual: string; nuevaPassword: string; confirmarPassword: string }) =>
        api.put("/usuario/perfil/password", data, {
            headers: {
                [SKIP_AUTH_REDIRECT_HEADER]: "true",
            },
        }),
    estado: () => api.get<{ perfilCompleto: boolean }>("/usuario/perfil/estado"),
};

// ── Proyectos ─────────────────────────────────────────────────────────────────
export const proyectosApi = {
    list: () => api.get("/usuario/proyectos"),
    get: (id: number) => api.get(`/usuario/proyectos/${id}`),
    create: (data: Record<string, string>) => api.post("/usuario/proyectos", data),
    update: (id: number, data: Record<string, string>) =>
        api.put(`/usuario/proyectos/${id}`, data),
    delete: (id: number) => api.delete(`/usuario/proyectos/${id}`),
};

// ── Recomendaciones ───────────────────────────────────────────────────────────
export const recomendacionesApi = {
    list: (proyectoId: number) =>
        api.get(`/usuario/proyectos/${proyectoId}/recomendaciones`),
    buscar: (proyectoId: number) =>
        api.post<{ candidatas: number; mensaje: string }>(
            `/usuario/proyectos/${proyectoId}/recomendaciones/buscar`
        ),
    generar: (proyectoId: number) =>
        api.post(`/usuario/proyectos/${proyectoId}/recomendaciones/generar`),
    guiaEnriquecida: (proyectoId: number, recId: number) =>
        api.get(`/usuario/proyectos/${proyectoId}/recomendaciones/${recId}/guia-enriquecida`),
};

// ── Favoritos ────────────────────────────────────────────────────────────────
export const favoritosApi = {
    list: () => api.get<ConvocatoriaPublica[]>("/usuario/favoritos"),
    ids: () => api.get<number[]>("/usuario/favoritos/ids"),
    agregar: (convocatoriaId: number) => api.post(`/usuario/favoritos/${convocatoriaId}`),
    eliminar: (convocatoriaId: number) => api.delete(`/usuario/favoritos/${convocatoriaId}`),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
    dashboard: () => api.get("/admin/dashboard"),
    usuarios: {
        list: () => api.get("/admin/usuarios"),
        get: (id: number) => api.get(`/admin/usuarios/${id}`),
        changeRol: (id: number, rol: string) =>
            api.put(`/admin/usuarios/${id}/rol`, { rol }),
        delete: (id: number) => api.delete(`/admin/usuarios/${id}`),
    },
    convocatorias: {
        list: (page = 0, q?: string, sector?: string) =>
            api.get<ConvocatoriasPageResponse>("/admin/convocatorias", {
                params: { page, ...(q ? { q } : {}), ...(sector ? { sector } : {}) },
            }),
        get: (id: number) => api.get(`/admin/convocatorias/${id}`),
        create: (data: Record<string, unknown>) =>
            api.post("/admin/convocatorias", data),
        update: (id: number, data: Record<string, unknown>) =>
            api.put(`/admin/convocatorias/${id}`, data),
        delete: (id: number) => api.delete(`/admin/convocatorias/${id}`),
        importarBdns: (pagina = 0, tamano = 20) =>
            api.post(`/admin/convocatorias/importar-bdns?pagina=${pagina}&tamano=${tamano}`),
    },
    bdns: {
        importar: (modo: "FULL" | "INCREMENTAL" = "FULL", delayMs = -1) =>
            api.post(`/admin/bdns/importar?modo=${modo}&delayMs=${delayMs}`),
        cancelar: () => api.delete("/admin/bdns/importar"),
        estado: () => api.get("/admin/bdns/estado"),
        ultimaImportacion: () => api.get("/admin/bdns/ultima-importacion"),
        ejes: () => api.get("/admin/bdns/ejes"),
        historial: () => api.get("/admin/bdns/historial"),
        historialDetalle: (ejecucionId: string) =>
            api.get(`/admin/bdns/historial/${ejecucionId}`),
        cobertura: () => api.get("/admin/bdns/cobertura"),
        setSyncStatePagina: (pagina: number) =>
            api.put(`/admin/bdns/sync-state/pagina?pagina=${pagina}`),
        enriquecer: () => api.post("/admin/bdns/enriquecer"),
        estadoEnriquecimiento: () => api.get("/admin/bdns/enriquecer/estado"),
        cancelarEnriquecimiento: () => api.delete("/admin/bdns/enriquecer"),
    },
    etl: {
        // Fase 1: Catálogos
        conteoCatalogos: () => api.get("/admin/etl/catalogos"),
        importarCatalogos: () => api.post("/admin/etl/catalogos"),
        // Fase 2: Índices
        estadoIndices: () => api.get("/admin/etl/indices"),
        construirIndices: () => api.post("/admin/etl/indices"),
        cancelarIndices: () => api.delete("/admin/etl/indices"),
    },
};