"use client";

import Link from "next/link";
import { X, LogIn, UserPlus, Sparkles } from "lucide-react";

interface Props {
  onClose: () => void;
  redirectAfter?: string;
}

export function ModalAccesoRequerido({ onClose, redirectAfter }: Props) {
  const loginHref = redirectAfter
    ? `/login?redirect=${encodeURIComponent(redirectAfter)}`
    : "/login";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-sm p-6">
        {/* Close */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">Acceso requerido</h3>
              <p className="text-xs text-foreground-muted mt-0.5">Para ver el detalle de esta subvención</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-foreground-muted hover:text-foreground transition-colors p-1 rounded-lg hover:bg-surface-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-foreground-muted mb-6 leading-relaxed">
          Inicia sesión o crea una cuenta gratuita para consultar el detalle de la subvención
          y recibir recomendaciones personalizadas basadas en tu perfil.
        </p>

        <div className="flex flex-col gap-2">
          <Link
            href={loginHref}
            className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Iniciar sesión
          </Link>
          <Link
            href="/registro"
            className="flex items-center justify-center gap-2 border border-border text-foreground px-4 py-3 rounded-xl font-semibold text-sm hover:bg-surface-muted transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Crear cuenta gratis
          </Link>
        </div>

        <p className="text-center text-xs text-foreground-subtle mt-4">
          Sin tarjeta de crédito · Gratis para empezar
        </p>
      </div>
    </div>
  );
}