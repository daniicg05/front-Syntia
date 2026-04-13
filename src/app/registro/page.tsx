"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { registro } from "@/lib/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

const BENEFITS = [
  "Matching automático con más de 12.000 convocatorias",
  "Datos actualizados desde la BDNS oficial",
  "Guías de solicitud personalizadas",
  "Completamente gratis para empezar",
];

export default function RegistroPage() {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "", confirmarPassword: "" });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate() {
    const errors: Record<string, string> = {};
    if (!form.email.includes("@")) errors.email = "Introduce un correo válido";
    if (form.password.length < 6) errors.password = "Mínimo 6 caracteres";
    if (form.password !== form.confirmarPassword)
      errors.confirmarPassword = "Las contraseñas no coinciden";
    return errors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Por favor, corrige los errores en el formulario");
      return;
    }
    setLoading(true);
    const loadingId = toast.loading("Creando tu cuenta...");
    try {
      await registro(form.email, form.password, form.confirmarPassword);
      toast.update(loadingId, "success", "Cuenta creada correctamente. ¡Bienvenido!");
      router.push("/perfil/completar");
    } catch (err: unknown) {
      toast.update(
        loadingId,
        "error",
        err instanceof Error
          ? err.message
          : "No se pudo crear la cuenta. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 bg-primary px-12 py-16">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/syntia-grants-logo.png"
            alt="Syntia Grants"
            width={140}
            height={48}
            className="h-16 w-auto brightness-0 invert"
          />
        </Link>

        <div>
          <h2 className="text-3xl font-bold text-white leading-snug mb-6">
            Encuentra financiación pública para tu proyecto
          </h2>
          <ul className="space-y-3">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-white/90 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-white shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/50 text-xs">
          © {new Date().getFullYear()} Syntia. Todos los derechos reservados.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 lg:px-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center mb-8 lg:hidden">
          <Image
            src="/images/syntia-grants-logo.png"
            alt="Syntia Grants"
            width={140}
            height={48}
            className="h-16 w-auto"
            priority
          />
        </Link>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-foreground mb-1">Crear cuenta gratis</h1>
            <p className="text-sm text-foreground-muted">
              Empieza a encontrar subvenciones en minutos
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@empresa.es"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              leftIcon={<Mail className="w-4 h-4" />}
              error={fieldErrors.email}
              required
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              leftIcon={<Lock className="w-4 h-4" />}
              error={fieldErrors.password}
              helper="Mínimo 6 caracteres"
              required
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              placeholder="Repite tu contraseña"
              value={form.confirmarPassword}
              onChange={(e) => setForm({ ...form, confirmarPassword: e.target.value })}
              leftIcon={<Lock className="w-4 h-4" />}
              error={fieldErrors.confirmarPassword}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              className="mt-2 w-full justify-center"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
            </Button>
          </form>

          <p className="mt-4 text-xs text-center text-foreground-subtle">
            Al registrarte aceptas nuestro{" "}
            <Link href="/aviso-legal" className="underline hover:text-foreground">
              aviso legal
            </Link>
          </p>

          <div className="mt-6 text-center">
            <p className="text-sm text-foreground-muted">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
