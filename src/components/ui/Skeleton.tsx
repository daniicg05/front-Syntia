"use client";
import { motion, useReducedMotion } from "framer-motion";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return (
      <div
        className={`bg-surface-container rounded-lg ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <motion.div
      className={`rounded-lg ${className}`}
      aria-hidden="true"
      style={{
        background: "linear-gradient(90deg, var(--surface-container) 25%, var(--border) 50%, var(--surface-container) 75%)",
        backgroundSize: "200% 100%",
      }}
      animate={{ backgroundPosition: ["200% 0", "-200% 0"] }}
      transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface-lowest border border-border rounded-2xl p-6 space-y-3">
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-3/5" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonKPIGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-surface-lowest border border-border rounded-2xl p-6 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-surface-lowest border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-4 w-1/4" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
