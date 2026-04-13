"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { login } from "@/lib/auth";
import { perfilApi } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Por favor, completa todos los campos.");
      return;
    }
    setLoading(true);
    const loadingId = toast.loading("Iniciando sesión...");
    try {
      const result = await login(email, password);
      toast.update(loadingId, "success", "Sesión iniciada correctamente");
      if (result.rol === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        let perfilCompleto = true;
        try {
          const { data } = await perfilApi.estado();
          perfilCompleto = Boolean(data?.perfilCompleto);
        } catch (estadoErr: unknown) {
          const status = (estadoErr as { response?: { status?: number } })?.response?.status;
          if (status !== 404) {
            throw estadoErr;
          }
        }

        router.push(perfilCompleto ? "/home" : "/perfil/completar");
      }
    } catch (err: unknown) {
      toast.update(
        loadingId,
        "error",
        err instanceof Error
          ? err.message
          : "Credenciales incorrectas. Inténtalo de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center mb-10">
        <Image
          src="/images/syntia-grants-logo.png"
          alt="Syntia Grants"
          width={160}
          height={54}
          className="h-18 w-auto"
          priority
        />
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl shadow-sm p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-foreground mb-1">Bienvenido de nuevo</h1>
          <p className="text-sm text-foreground-muted">
            Inicia sesión para acceder a tu panel de subvenciones
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="tu@empresa.es"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            required
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            required
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={<ArrowRight className="w-4 h-4" />}
            className="mt-2 w-full justify-center"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-foreground-muted">
            ¿No tienes cuenta?{" "}
            <Link
              href="/registro"
              className="text-primary font-semibold hover:underline"
            >
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="mt-6 text-sm text-foreground-subtle hover:text-foreground transition-colors"
      >
        ← Volver al inicio
      </Link>
    </div>
  );
}
