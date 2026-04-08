"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { RolBadge, ScoreBadge } from "@/components/ui/Badge";

interface UsuarioDetalle {
  usuario: {
    id: number;
    email: string;
    rol: string;
    creadoEn: string;
    empresa: string;
    provincia: string;
    telefono: string;
  };
  proyectos: { id: number; nombre: string; sector: string }[];
  recsPerProyecto: Record<number, number>;
  historialCorreo: { anterior: string; nuevo: string; fecha: string; actor: string }[];
  emailCambiado: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim() !== "") return value;
  }
  return "";
}

function toDateLabel(value: string): string {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("es");
}

function normalizeHistorialCorreo(input: unknown): { anterior: string; nuevo: string; fecha: string; actor: string }[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (typeof item === "string") {
        return { anterior: item, nuevo: "", fecha: "", actor: "" };
      }
      if (!isRecord(item)) return null;

      return {
        anterior: pickString(item, ["anterior", "oldEmail", "emailAnterior", "from", "previousEmail"]),
        nuevo: pickString(item, ["nuevo", "newEmail", "emailNuevo", "to", "currentEmail"]),
        fecha: pickString(item, ["fecha", "changedAt", "updatedAt", "timestamp"]),
        actor: pickString(item, ["actor", "changedBy", "updatedBy"]),
      };
    })
    .filter((entry): entry is { anterior: string; nuevo: string; fecha: string; actor: string } => !!entry)
    .filter((entry) => entry.anterior || entry.nuevo || entry.fecha || entry.actor);
}

function normalizeUsuarioDetalle(payload: unknown, routeId: string): UsuarioDetalle | null {
  if (!isRecord(payload)) return null;

  const container = isRecord(payload.data)
    ? payload.data
    : isRecord(payload.content)
      ? payload.content
      : payload;

  const usuarioSource = isRecord(container.usuario)
    ? container.usuario
    : isRecord(container.user)
      ? container.user
      : container;

  const emailValue = pickString(usuarioSource, ["email", "correo"]);
  if (typeof emailValue !== "string" || emailValue.trim() === "") return null;

  const proyectosRaw = container.proyectos;
  const recsRaw = container.recsPerProyecto;

  const empresa = pickString(usuarioSource, ["empresa", "organizacion", "organizacionNombre", "organization", "company"]);
  const provincia = pickString(usuarioSource, ["provincia", "province"]);
  const telefono = pickString(usuarioSource, ["telefono", "phone", "telefonoMovil"]);

  const historialRaw =
    container.historialCorreo ??
    container.emailHistory ??
    container.cambiosCorreo ??
    usuarioSource.historialCorreo ??
    usuarioSource.emailHistory ??
    usuarioSource.cambiosCorreo;

  const historialCorreo = normalizeHistorialCorreo(historialRaw);
  const emailAnterior = pickString(container, ["emailAnterior", "previousEmail", "correoAnterior"]);
  if (emailAnterior && !historialCorreo.some((h) => h.anterior === emailAnterior)) {
    historialCorreo.unshift({ anterior: emailAnterior, nuevo: emailValue, fecha: "", actor: "" });
  }

  const emailCambiado =
    Boolean(container.emailCambiado) ||
    Boolean(container.hasEmailChanges) ||
    Boolean(usuarioSource.emailCambiado) ||
    historialCorreo.length > 0;

  return {
    usuario: {
      id: Number(usuarioSource.id ?? routeId),
      email: emailValue,
      rol: String(usuarioSource.rol ?? "USUARIO"),
      creadoEn: String(usuarioSource.creadoEn ?? ""),
      empresa,
      provincia,
      telefono,
    },
    proyectos: Array.isArray(proyectosRaw)
      ? proyectosRaw.filter((p): p is { id: number; nombre: string; sector: string } => isRecord(p))
        .map((p) => ({
          id: Number(p.id ?? 0),
          nombre: String(p.nombre ?? ""),
          sector: String(p.sector ?? ""),
        }))
      : [],
    recsPerProyecto: isRecord(recsRaw)
      ? Object.fromEntries(
          Object.entries(recsRaw).map(([k, v]) => [Number(k), Number(v ?? 0)])
        )
      : {},
    historialCorreo,
    emailCambiado,
  };
}

export default function AdminUsuarioDetallePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<UsuarioDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) {
      setError("ID de usuario invalido");
      setLoading(false);
      return;
    }

    adminApi.usuarios.get(numericId)
      .then((r) => {
        const normalized = normalizeUsuarioDetalle(r.data, id);
        if (!normalized) {
          setError("No se pudo cargar el detalle del usuario");
          setData(null);
          return;
        }
        setError(null);
        setData(normalized);
      })
      .catch(() => {
        setError("No se pudo cargar el detalle del usuario");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link href="/admin/usuarios" className="text-sm text-primary hover:underline mb-6 block">
          ← Volver a usuarios
        </Link>
        <Card>
          <p className="text-sm text-foreground-muted">{error ?? "No hay datos para mostrar"}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/admin/usuarios" className="text-sm text-primary hover:underline mb-6 block">
        ← Volver a usuarios
      </Link>
      <h1 className="text-2xl font-bold text-foreground mb-6">Detalle de usuario</h1>

      <Card className="mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted w-40">Correo:</span>
            <span className="font-medium text-foreground">{data.usuario.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted w-40">Empresa u organizacion:</span>
            <span className="text-foreground">{data.usuario.empresa || "-"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted w-40">Provincia:</span>
            <span className="text-foreground">{data.usuario.provincia || "-"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted w-40">Telefono:</span>
            <span className="text-foreground">{data.usuario.telefono || "-"}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted w-40">Rol:</span>
            <RolBadge rol={data.usuario.rol} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted w-40">Registro:</span>
            <span className="text-sm text-foreground">{toDateLabel(data.usuario.creadoEn)}</span>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <h2 className="font-semibold text-foreground mb-3">Estado e historial de correo</h2>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-foreground-muted w-40">Estado:</span>
            <span className="text-foreground">{data.emailCambiado ? "Correo cambiado" : "Sin cambios registrados"}</span>
          </div>
          {data.historialCorreo.length === 0 ? (
            <p className="text-sm text-foreground-muted">No hay historial de cambios de correo.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {data.historialCorreo.map((h, idx) => (
                <div key={`${h.anterior}-${h.nuevo}-${idx}`} className="text-sm text-foreground-muted border border-border rounded-lg px-3 py-2">
                  <p>
                    {h.anterior || "(sin anterior)"} → {h.nuevo || data.usuario.email}
                  </p>
                  <p>
                    {toDateLabel(h.fecha)}{h.actor ? ` - ${h.actor}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <h2 className="font-semibold text-foreground mb-3">Proyectos ({data.proyectos.length})</h2>
      {data.proyectos.length === 0 ? (
        <Card>
          <p className="text-foreground-muted text-sm">Sin proyectos</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {data.proyectos.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{p.nombre}</p>
                  <p className="text-xs text-foreground-muted">{p.sector}</p>
                </div>
                <div className="text-sm text-foreground-muted">
                  {data.recsPerProyecto[p.id] ?? 0} recomendaciones
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Suppress unused import warning - ScoreBadge may be used in future
void ScoreBadge;
