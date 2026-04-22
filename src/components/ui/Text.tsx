import { ReactNode } from "react";

interface TextProps {
  children: ReactNode;
  className?: string;
}

export function Text({ children, className = "" }: TextProps) {
  return <p className={`text-sm text-foreground-muted ${className}`}>{children}</p>;
}

export default Text;
