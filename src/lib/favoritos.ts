export type EstadoSolicitud = "no_solicitada" | "solicitada";

export interface ConvocatoriaFavorita {
  id: number;
  titulo: string;
  organismo?: string;
  ubicacion?: string;
  tipo?: string;
  sector?: string;
  fechaPublicacion?: string;
  fechaCierre?: string;
  presupuesto?: number;
  abierto?: boolean;
  urlOficial?: string;
  idBdns?: string;
  numeroConvocatoria?: string;
  estadoSolicitud: EstadoSolicitud;
  guardadaEn: string;
}

const FAVORITAS_STORAGE_KEY = "syntia_convocatorias_favoritas";
export const FAVORITAS_UPDATED_EVENT = "syntia:favoritas-updated";

function parseFavoritas(raw: string | null): ConvocatoriaFavorita[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Partial<ConvocatoriaFavorita> => Boolean(item && typeof item === "object"))
      .map((item) => ({
        id: Number(item.id),
        titulo: typeof item.titulo === "string" ? item.titulo : `Convocatoria #${String(item.id ?? "")}`,
        organismo: typeof item.organismo === "string" ? item.organismo : undefined,
        ubicacion: typeof item.ubicacion === "string" ? item.ubicacion : undefined,
        tipo: typeof item.tipo === "string" ? item.tipo : undefined,
        sector: typeof item.sector === "string" ? item.sector : undefined,
        fechaPublicacion:
          typeof item.fechaPublicacion === "string" ? item.fechaPublicacion : undefined,
        fechaCierre: typeof item.fechaCierre === "string" ? item.fechaCierre : undefined,
        presupuesto: (() => {
          if (typeof item.presupuesto === "number" && Number.isFinite(item.presupuesto)) {
            return item.presupuesto;
          }
          if (typeof item.presupuesto === "string" && item.presupuesto.trim()) {
            const cleaned = item.presupuesto.replace(/[^\d,.-]/g, "").trim();
            const normalized = cleaned.includes(",")
              ? cleaned.replace(/\./g, "").replace(",", ".")
              : cleaned;
            const parsed = Number(normalized);
            if (Number.isFinite(parsed)) return parsed;
          }
          return undefined;
        })(),
        abierto: typeof item.abierto === "boolean" ? item.abierto : undefined,
        urlOficial: typeof item.urlOficial === "string" ? item.urlOficial : undefined,
        idBdns: typeof item.idBdns === "string" ? item.idBdns : undefined,
        numeroConvocatoria:
          typeof item.numeroConvocatoria === "string" ? item.numeroConvocatoria : undefined,
        estadoSolicitud: item.estadoSolicitud === "solicitada" ? "solicitada" : "no_solicitada",
        guardadaEn:
          typeof item.guardadaEn === "string" ? item.guardadaEn : new Date().toISOString(),
      }))
      .filter((item) => Number.isFinite(item.id) && item.id > 0);
  } catch {
    return [];
  }
}

function readFavoritas(): ConvocatoriaFavorita[] {
  if (typeof window === "undefined") return [];
  return parseFavoritas(window.localStorage.getItem(FAVORITAS_STORAGE_KEY));
}

function writeFavoritas(items: ConvocatoriaFavorita[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FAVORITAS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(FAVORITAS_UPDATED_EVENT));
}

export function getFavoritas(): ConvocatoriaFavorita[] {
  return readFavoritas().sort((a, b) =>
    new Date(b.guardadaEn).getTime() - new Date(a.guardadaEn).getTime()
  );
}

export function getFavoritaById(convocatoriaId: number): ConvocatoriaFavorita | null {
  return readFavoritas().find((item) => item.id === convocatoriaId) ?? null;
}

export function toggleFavorita(
  convocatoria: Omit<ConvocatoriaFavorita, "estadoSolicitud" | "guardadaEn">
): { activa: boolean; favorita: ConvocatoriaFavorita | null } {
  const favoritas = readFavoritas();
  const existingIndex = favoritas.findIndex((item) => item.id === convocatoria.id);

  if (existingIndex >= 0) {
    favoritas.splice(existingIndex, 1);
    writeFavoritas(favoritas);
    return { activa: false, favorita: null };
  }

  const nuevaFavorita: ConvocatoriaFavorita = {
    ...convocatoria,
    estadoSolicitud: "no_solicitada",
    guardadaEn: new Date().toISOString(),
  };

  favoritas.push(nuevaFavorita);
  writeFavoritas(favoritas);

  return { activa: true, favorita: nuevaFavorita };
}

export function setEstadoSolicitud(convocatoriaId: number, estado: EstadoSolicitud): boolean {
  const favoritas = readFavoritas();
  const idx = favoritas.findIndex((item) => item.id === convocatoriaId);
  if (idx < 0) return false;

  favoritas[idx] = { ...favoritas[idx], estadoSolicitud: estado };
  writeFavoritas(favoritas);
  return true;
}

export function updateFavorita(
  convocatoriaId: number,
  patch: Partial<Omit<ConvocatoriaFavorita, "id" | "estadoSolicitud" | "guardadaEn">>
): boolean {
  const favoritas = readFavoritas();
  const idx = favoritas.findIndex((item) => item.id === convocatoriaId);
  if (idx < 0) return false;

  favoritas[idx] = {
    ...favoritas[idx],
    ...patch,
  };

  writeFavoritas(favoritas);
  return true;
}

export function removeFavorita(convocatoriaId: number): boolean {
  const favoritas = readFavoritas();
  const next = favoritas.filter((item) => item.id !== convocatoriaId);
  if (next.length === favoritas.length) return false;

  writeFavoritas(next);
  return true;
}

