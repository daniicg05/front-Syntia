"use client";

import { createContext, useContext, useCallback, useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X, Loader2 } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info" | "loading";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => string;
    error: (message: string, duration?: number) => string;
    warning: (message: string, duration?: number) => string;
    info: (message: string, duration?: number) => string;
    loading: (message: string) => string;
    dismiss: (id: string) => void;
    update: (id: string, type: ToastType, message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
  loading: <Loader2 className="w-5 h-5 text-primary animate-spin" />,
};

const backgrounds: Record<ToastType, string> = {
  success: "bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800",
  error: "bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800",
  warning: "bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
  info: "bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
  loading: "bg-surface border-border",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-right-full fade-in duration-300 ${backgrounds[toast.type]}`}
      role="alert"
    >
      {icons[toast.type]}
      <p className="text-sm font-medium text-foreground flex-1">{toast.message}</p>
      {toast.type !== "loading" && (
        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4 text-foreground-muted" />
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number): string => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (type !== "loading" && duration !== 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration ?? 4000);
      }

      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const update = useCallback(
    (id: string, type: ToastType, message: string, duration?: number) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, type, message } : t))
      );

      if (type !== "loading" && duration !== 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration ?? 4000);
      }
    },
    []
  );

  const toast = {
    success: (message: string, duration?: number) =>
      addToast("success", message, duration),
    error: (message: string, duration?: number) =>
      addToast("error", message, duration),
    warning: (message: string, duration?: number) =>
      addToast("warning", message, duration),
    info: (message: string, duration?: number) =>
      addToast("info", message, duration),
    loading: (message: string) => addToast("loading", message),
    dismiss,
    update,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context.toast;
}
