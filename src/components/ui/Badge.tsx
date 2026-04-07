// ── Score Badge (design system) ────────────────────────────────────────────────
interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md";
}

function getScoreColor(score: number) {
  if (score >= 80) return "bg-primary-light text-primary border-primary/20";
  if (score >= 60) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-600 border-red-200";
}

export function ScoreBadge({ score, size = "md" }: ScoreBadgeProps) {
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${getScoreColor(
        score
      )} ${sizeClass} whitespace-nowrap`}
    >
      {score}%
    </span>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const statusVariantMap = {
  default: "bg-surface-muted text-foreground-muted border-border",
  success: "bg-primary-light text-primary border-primary/20",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-600 border-red-200",
};

export function StatusBadge({ label, variant = "default" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusVariantMap[variant]}`}
    >
      {label}
    </span>
  );
}

// ── Generic Badge (used by admin) ──────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "gray";
  className?: string;
}

const badgeVariants = {
  success: "bg-primary-light text-primary",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-600",
  info: "bg-blue-50 text-blue-700",
  gray: "bg-surface-muted text-foreground-muted",
};

export function Badge({ children, variant = "gray", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeVariants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// ── Rol Badge (admin panel) ────────────────────────────────────────────────────
export function RolBadge({ rol }: { rol: string }) {
  return (
    <Badge variant={rol === "ADMIN" ? "info" : "gray"}>{rol}</Badge>
  );
}
