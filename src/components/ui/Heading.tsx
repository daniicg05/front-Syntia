import { ReactNode } from "react";

interface HeadingProps {
  children: ReactNode;
  size?: "h1" | "h2" | "h3";
  className?: string;
}

export function Heading({ children, size = "h1", className = "" }: HeadingProps) {
  const base = "font-h2 font-bold text-primary-container";
  const sizeMap: Record<string, string> = {
    h1: "text-4xl",
    h2: "text-2xl",
    h3: "text-xl",
  };
  return <h2 className={`${base} ${sizeMap[size]} ${className}`}>{children}</h2>;
}

export default Heading;
