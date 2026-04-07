"use client";

import { useEffect, useState } from "react";
import { getUser, logout } from "@/lib/auth";
import { perfilApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import Cookies from "js-cookie";
import {
  User,
  Mail,
  Building2,
  MapPin,
  Phone,
  LogOut,
  Save,
  Shield,
  Bell,
  ChevronRight,
  Pencil,
  X,
} from "lucide-react";

interface PerfilData {
  nombre: string;
  email: string;
  empresa?: string;
  provincia?: string;
  telefono?: string;
  rol?: string;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-5">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-primary">{icon}</span>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  icon,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 rounded-xl border bg-surface text-sm text-foreground focus:outline-none transition-colors ${
            disabled
              ? "bg-surface-muted text-foreground-muted cursor-not-allowed border-border/50"
              : "border-border focus:ring-2 focus:ring-primary/30 focus:border-primary"
          }`}
        />
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const jwtUser = getUser();
  const toast = useToast();
  const [form, setForm] = useState<PerfilData>({
    nombre: "",
    email: jwtUser?.sub ?? "",
    empresa: "",
    provincia: "",
    telefono: "",
    rol: jwtUser?.rol ?? "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ nuevoEmail: "", passwordActual: "" });
  const [emailSaving, setEmailSaving] = useState(false);

  useEffect(() => {
    perfilApi
      .get()
      .then((res) => {
        const d = res.data as PerfilData;
        setForm((prev) => ({ ...prev, ...d }));
      })
      .catch(() => {
        // If perfil endpoint not available, use JWT info only
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof PerfilData) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCambiarEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailSaving(true);
    try {
      const res = await perfilApi.cambiarEmail(emailForm);
      Cookies.set("syntia_token", res.data.token, {
        expires: 1,
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
      });
      setForm((prev) => ({ ...prev, email: res.data.email }));
      setEmailModal(false);
      setEmailForm({ nuevoEmail: "", passwordActual: "" });
      toast.success("Email actualizado correctamente");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 409) {
        toast.error("Este email ya está en uso");
      } else if (status === 400) {
        toast.error(msg ?? "Contraseña incorrecta o email inválido");
      } else {
        toast.error("Error al cambiar el email. Inténtalo de nuevo.");
      }
    } finally {
      setEmailSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const loadingId = toast.loading("Guardando cambios...");
    try {
      await perfilApi.save(form as Record<string, string>);
      toast.update(loadingId, "success", "Cambios guardados correctamente");
    } catch {
      toast.update(loadingId, "error", "No se pudieron guardar los cambios. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-surface rounded-2xl border border-border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
          <p className="text-foreground-muted mt-1">
            Gestiona tu información personal y preferencias
          </p>
        </div>
        {/* Avatar */}
        <div className="w-14 h-14 rounded-2xl bg-primary-light border border-primary/20 flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-primary" />
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Personal info */}
        <Section icon={<User className="w-4 h-4" />} title="Información personal">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Nombre completo"
              value={form.nombre}
              onChange={set("nombre")}
              icon={<User className="w-4 h-4" />}
            />
            <div>
              <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                Correo electrónico
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-surface-muted text-sm text-foreground-muted cursor-not-allowed border-border/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setEmailModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-border text-sm text-foreground hover:text-primary hover:border-primary transition-colors shrink-0"
                  title="Cambiar email"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
            <Field
              label="Empresa u organización"
              value={form.empresa ?? ""}
              onChange={set("empresa")}
              icon={<Building2 className="w-4 h-4" />}
            />
            <Field
              label="Provincia"
              value={form.provincia ?? ""}
              onChange={set("provincia")}
              icon={<MapPin className="w-4 h-4" />}
            />
            <Field
              label="Teléfono"
              value={form.telefono ?? ""}
              onChange={set("telefono")}
              type="tel"
              icon={<Phone className="w-4 h-4" />}
            />
          </div>
        </Section>

        {/* Account info */}
        <Section icon={<Shield className="w-4 h-4" />} title="Cuenta">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Rol de cuenta</p>
                <p className="text-xs text-foreground-muted mt-0.5 capitalize">
                  {form.rol ?? "Usuario"}
                </p>
              </div>
              <span className="text-xs bg-primary-light text-primary font-semibold px-2.5 py-1 rounded-full capitalize">
                {form.rol ?? "usuario"}
              </span>
            </div>
            <button
              type="button"
              className="w-full flex items-center justify-between py-3 text-sm text-foreground hover:text-primary transition-colors group"
              onClick={() => {}}
            >
              <span className="font-medium">Cambiar contraseña</span>
              <ChevronRight className="w-4 h-4 text-foreground-subtle group-hover:text-primary transition-colors" />
            </button>
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={<Bell className="w-4 h-4" />} title="Notificaciones">
          <div className="space-y-4">
            {[
              {
                label: "Nuevas convocatorias compatibles",
                description: "Recibe un aviso cuando aparezca una subvención que coincida con tus proyectos",
              },
              {
                label: "Recordatorios de plazo",
                description: "Alertas antes de que cierren las convocatorias en las que estás interesado",
              },
              {
                label: "Novedades de Syntia",
                description: "Actualizaciones del producto, nuevas funcionalidades y mejoras",
              },
            ].map(({ label, description }) => (
              <label key={label} className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-10 h-6 rounded-full bg-border peer-checked:bg-primary transition-colors" />
                  <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-foreground-muted mt-0.5">{description}</p>
                </div>
              </label>
            ))}
          </div>
        </Section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal cambiar email */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-foreground">Cambiar email</h2>
              <button
                type="button"
                onClick={() => { setEmailModal(false); setEmailForm({ nuevoEmail: "", passwordActual: "" }); }}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCambiarEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                  Nuevo email
                </label>
                <input
                  type="email"
                  required
                  value={emailForm.nuevoEmail}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, nuevoEmail: e.target.value }))}
                  className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="nuevo@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                  Contraseña actual
                </label>
                <input
                  type="password"
                  required
                  value={emailForm.passwordActual}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, passwordActual: e.target.value }))}
                  className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="Tu contraseña actual"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setEmailModal(false); setEmailForm({ nuevoEmail: "", passwordActual: "" }); }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={emailSaving}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {emailSaving ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </span>
                  ) : (
                    "Confirmar cambio"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
