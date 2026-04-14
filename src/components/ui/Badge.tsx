// ── Score Badge (design system) ────────────────────────────────────────────────
interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "md";
}

function getScoreColor(score: number) {
  if (score >= 70) return "bg-success-light/20 text-success border-success/20";
  if (score >= 40) return "bg-warning-light text-warning border-warning/20";
  return "bg-destructive-light text-destructive border-destructive/20";
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
  success: "bg-success-light/20 text-success border-success/20",
  warning: "bg-warning-light text-warning border-warning/20",
  danger: "bg-destructive-light text-destructive border-destructive/20",
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
  variant?: "success" | "warning" | "danger" | "error" | "info" | "gray" | "plan" | "score";
  score?: number;
  className?: string;
}

function getScoreBadgeVariant(score: number): string {
  if (score >= 70) return "bg-success-light/20 text-success";
  if (score >= 40) return "bg-warning-light text-warning";
  return "bg-destructive-light text-destructive";
}

const badgeVariants = {
  success: "bg-success-light/20 text-success",
  warning: "bg-warning-light text-warning",
  danger:  "bg-destructive-light text-destructive",
  error:   "bg-destructive-light text-destructive",
  info:    "bg-primary-light/30 text-primary",
  gray:    "bg-surface-container text-foreground-muted",
  plan:    "bg-primary/10 text-primary",
  score:   "",
};

export function Badge({ children, variant = "gray", score, className = "" }: BadgeProps) {
  const colorClass =
    variant === "score" && score !== undefined
      ? getScoreBadgeVariant(score)
      : badgeVariants[variant];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
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
