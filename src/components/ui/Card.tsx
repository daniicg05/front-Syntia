import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none" | false;
}

export function Card({ children, className = "", hover = false, padding = "md" }: CardProps) {
  const paddingClass =
    !padding || padding === "none"
      ? ""
      : { sm: "p-4", md: "p-6", lg: "p-8" }[padding] ?? "p-6";
  return (
    <div
      className={`bg-surface border border-border rounded-2xl shadow-sm ${paddingClass} ${
        hover ? "transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: "green" | "blue" | "amber";
}

const colorMap = {
  green: { bg: "bg-primary-light", text: "text-primary" },
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
};

export function StatCard({ label, value, icon, color = "green" }: StatCardProps) {
  const { bg, text } = colorMap[color];
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`${bg} ${text} p-3 rounded-xl`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-foreground-muted">{label}</p>
        </div>
      </div>
    </Card>
  );
}
