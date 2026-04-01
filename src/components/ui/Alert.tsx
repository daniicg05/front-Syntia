import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { ReactNode } from "react";

type AlertVariant = "success" | "error" | "warning" | "info";

const variantConfig: Record<
  AlertVariant,
  { bg: string; border: string; text: string; icon: ReactNode }
> = {
  success: {
    bg: "bg-primary-light",
    border: "border-primary/20",
    text: "text-primary",
    icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  },
  error: {
    bg: "bg-destructive-light",
    border: "border-destructive/20",
    text: "text-destructive",
    icon: <XCircle className="w-4 h-4 shrink-0" />,
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: <AlertCircle className="w-4 h-4 shrink-0" />,
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: <Info className="w-4 h-4 shrink-0" />,
  },
};

interface AlertProps {
  variant?: AlertVariant;
  message: string;
  className?: string;
}

export function Alert({ variant = "info", message, className = "" }: AlertProps) {
  const { bg, border, text, icon } = variantConfig[variant];
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${bg} ${border} ${text} ${className}`}
      role="alert"
    >
      {icon}
      <span>{message}</span>
    </div>
  );
}
