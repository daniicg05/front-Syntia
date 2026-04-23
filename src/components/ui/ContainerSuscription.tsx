import { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function ContainerSuscription({ children, className = "" }: ContainerProps) {
  return <div className={`max-w-6xl mx-auto px-4 py-8 ${className}`}>{children}</div>;
}

export default ContainerSuscription;
