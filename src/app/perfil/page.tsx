"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { getUser, logout } from "@/lib/auth";
import { perfilApi } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { staggerChildren, staggerItem, fadeIn } from "@/lib/motion";
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
  KeyRound,
  ChevronRight,
  X,
} from "lucide-react";

interface PerfilData {
  nombre: string;
  email: string;
  empresa?: string;
  provincia?: string;
  telefono?: string;
  rol?: string;
  notificacionesConvocatorias?: boolean;
  notificacionesRecordatorios?: boolean;
  notificacionesNovedades?: boolean;
}

type NotificacionKey =
    | "notificacionesConvocatorias"
    | "notificacionesRecordatorios"
    | "notificacionesNovedades";

const NOTIFICACIONES_STORAGE_KEY = "syntia_perfil_notificaciones";

const DEFAULT_NOTIFICACIONES: Record<NotificacionKey, boolean> = {
  notificacionesConvocatorias: true,
  notificacionesRecordatorios: true,
  notificacionesNovedades: true,
};

function leerNotificacionesGuardadas(): Partial<Record<NotificacionKey, boolean>> {
  const raw = localStorage.getItem(NOTIFICACIONES_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<Record<NotificacionKey, boolean>>;
    return {
      notificacionesConvocatorias:
          typeof parsed.notificacionesConvocatorias === "boolean"
              ? parsed.notificacionesConvocatorias
              : undefined,
      notificacionesRecordatorios:
          typeof parsed.notificacionesRecordatorios === "boolean"
              ? parsed.notificacionesRecordatorios
              : undefined,
      notificacionesNovedades:
          typeof parsed.notificacionesNovedades === "boolean"
              ? parsed.notificacionesNovedades
              : undefined,
    };
  } catch {
    localStorage.removeItem(NOTIFICACIONES_STORAGE_KEY);
    return {};
  }
}

function extraerNotificaciones(perfil: PerfilData): Record<NotificacionKey, boolean> {
  return {
    notificacionesConvocatorias: Boolean(perfil.notificacionesConvocatorias),
    notificacionesRecordatorios: Boolean(perfil.notificacionesRecordatorios),
    notificacionesNovedades: Boolean(perfil.notificacionesNovedades),
  };
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
          <span className="text-primary dark:text-blue-300">{icon}</span>
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted dark:text-blue-300">
            {icon}
          </span>
          )}
          <input
              type={type}
              value={value ?? ""}
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

function ModalCambiarEmail({
                             onClose,
                             onSuccess,
                           }: {
  onClose: () => void;
  onSuccess: (nuevoEmail: string, token: string) => void;
}) {
  const toast = useToast();
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [passwordActual, setPasswordActual] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await perfilApi.cambiarEmail({ nuevoEmail, passwordActual });
      onSuccess(res.data.email, res.data.token);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) toast.error("Este email ya está en uso");
      else if (status === 401) toast.error("Contraseña incorrecta");
      else toast.error("Error al cambiar el email");
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Cambiar email</h3>
            <button type="button" onClick={onClose} className="text-foreground-muted hover:text-foreground transition-colors">
              <X className="w-5 h-5 dark:text-blue-300" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                Nuevo email
              </label>
              <input
                  type="email"
                  required
                  value={nuevoEmail}
                  onChange={(e) => setNuevoEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="nuevo@ejemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                Contraseña actual
              </label>
              <input
                  type="password"
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="Tu contraseña actual"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
  );
}

function ModalCambiarPassword({
                                onClose,
                                onSuccess,
                              }: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nuevaPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setSubmitting(true);
    try {
      await perfilApi.cambiarPassword({
        passwordActual,
        nuevaPassword,
        confirmarPassword,
      });
      onSuccess();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) toast.error("La contraseña actual no es correcta");
      else if (status === 404) toast.error("No se encontró el servicio para cambiar contraseña");
      else toast.error("Error al cambiar la contraseña");
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="bg-surface rounded-2xl border border-border shadow-xl w-full max-w-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-foreground">Cambiar contraseña</h3>
            <button type="button" onClick={onClose} className="text-foreground-muted hover:text-foreground transition-colors">
              <X className="w-5 h-5 dark:text-blue-300" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                Contraseña actual
              </label>
              <input
                  type="password"
                  required
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="Tu contraseña actual"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                Nueva contraseña
              </label>
              <input
                  type="password"
                  required
                  minLength={6}
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-1.5">
                Confirmar nueva contraseña
              </label>
              <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder="Repite la nueva contraseña"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Guardando..." : "Actualizar"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
  );

  if (!isMounted) return null;

  return createPortal(modalContent, document.body);
}

export default function PerfilPage() {
  const jwtUser = getUser();
  const toast = useToast();
  const shouldReduce = useReducedMotion();
  const [form, setForm] = useState<PerfilData>({
    nombre: "",
    email: jwtUser?.sub ?? "",
    empresa: "",
    provincia: "",
    telefono: "",
    rol: jwtUser?.rol ?? "",
    ...DEFAULT_NOTIFICACIONES,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    perfilApi
        .get()
        .then((res) => {
          const d = res.data as PerfilData;
          const notificacionesGuardadas = leerNotificacionesGuardadas();
          setForm((prev) => ({
            ...prev,
            ...DEFAULT_NOTIFICACIONES,
            ...d,
            ...notificacionesGuardadas,
          }));
        })
        .catch(() => {
        })
        .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const notificacionesGuardadas = leerNotificacionesGuardadas();
    setForm((prev) => ({ ...prev, ...notificacionesGuardadas }));
  }, []);

  const set = (key: keyof PerfilData) => (value: string) =>
      setForm((prev) => ({ ...prev, [key]: value }));

  const setNotificacion = (key: NotificacionKey) => (checked: boolean) =>
      setForm((prev) => ({ ...prev, [key]: checked }));

  const handleEmailSuccess = (nuevoEmail: string, token: string) => {
    Cookies.set("syntia_token", token, {
      expires: 1,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    });
    setForm((prev) => ({ ...prev, email: nuevoEmail }));
    setShowEmailModal(false);
    toast.success("Email actualizado correctamente");
  };

  const handlePasswordSuccess = () => {
    setShowPasswordModal(false);
    toast.success("Contraseña actualizada correctamente");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const loadingId = toast.loading("Guardando cambios...");
    try {
      await perfilApi.save(form as unknown as Record<string, string>);
      await perfilApi.save(form as unknown as Record<string, unknown>);
      localStorage.setItem(
          NOTIFICACIONES_STORAGE_KEY,
          JSON.stringify(extraerNotificaciones(form))
      );
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

  const motionProps = shouldReduce ? {} : { initial: "hidden", animate: "visible" };

  return (
      <div>
        <AnimatePresence>
          {showEmailModal && (
              <ModalCambiarEmail
                  onClose={() => setShowEmailModal(false)}
                  onSuccess={handleEmailSuccess}
              />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showPasswordModal && (
              <ModalCambiarPassword
                  onClose={() => setShowPasswordModal(false)}
                  onSuccess={handlePasswordSuccess}
              />
          )}
        </AnimatePresence>

        <motion.div {...motionProps} variants={fadeIn} className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
            <p className="text-foreground-muted mt-1">
              Gestiona tu información personal y preferencias
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-primary-light border border-primary/20 flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-primary dark:text-blue-300" />
          </div>
        </motion.div>

        <motion.form
            {...motionProps}
            variants={staggerChildren}
            onSubmit={handleSave}
            className="space-y-5"
        >
          <motion.div variants={staggerItem}>
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
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted dark:text-blue-300">
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
                        onClick={() => setShowEmailModal(true)}
                        className="px-3 py-2.5 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-surface-muted transition-colors whitespace-nowrap"
                    >
                      Cambiar
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
          </motion.div>

          <motion.div variants={staggerItem}>
            <Section icon={<Shield className="w-4 h-4" />} title="Cuenta">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">Rol de cuenta</p>
                    <p className="text-xs text-foreground-muted mt-0.5 capitalize dark:text-blue-300">
                      {form.rol ?? "Usuario"}
                    </p>
                  </div>
                  <span className="text-xs bg-primary-light text-primary dark:text-blue-300 font-semibold px-2.5 py-1 rounded-full capitalize">
                  {form.rol ?? "usuario"}
                </span>
                </div>
                <button
                    type="button"
                    className="w-full flex items-center justify-between py-3 px-3 rounded-xl border border-border text-sm text-foreground hover:text-primary dark:hover:text-blue-300 hover:bg-surface-muted transition-colors group cursor-pointer"
                    onClick={() => setShowPasswordModal(true)}
                >
                <span className="font-medium inline-flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-foreground dark:text-blue-300" />
                  Cambiar contraseña
                </span>
                  <ChevronRight className="w-4 h-4 text-foreground-subtle group-hover:text-primary dark:group-hover:text-blue-300 transition-colors" />
                </button>
              </div>
            </Section>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Section icon={<Bell className="w-4 h-4" />} title="Notificaciones">
              <div className="space-y-4">
                {([
                  {
                    key: "notificacionesConvocatorias",
                    label: "Nuevas convocatorias compatibles",
                    description: "Recibe un aviso cuando aparezca una subvención que coincida con tus proyectos",
                  },
                  {
                    key: "notificacionesRecordatorios",
                    label: "Recordatorios de plazo",
                    description: "Alertas antes de que cierren las convocatorias en las que estás interesado",
                  },
                  {
                    key: "notificacionesNovedades",
                    label: "Novedades de Syntia",
                    description: "Actualizaciones del producto, nuevas funcionalidades y mejoras",
                  },
                ] satisfies Array<{ key: NotificacionKey; label: string; description: string }>).map(({ key, label, description }) => (
                    <label key={label} className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5">
                        <input
                            type="checkbox"
                            checked={Boolean(form[key])}
                            onChange={(e) => setNotificacion(key)(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-10 h-6 rounded-full bg-border peer-checked:bg-primary dark:peer-checked:bg-blue-300 transition-colors" />
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
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4 dark:text-blue-300" />
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
                    <Save className="w-4 h-4 dark:text-blue-300" />
                    Guardar cambios
                  </>
              )}
            </button>
          </motion.div>
        </motion.form>
      </div>
  );
}