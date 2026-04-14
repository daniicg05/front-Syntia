"use client";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { slideUp } from "@/lib/motion";

interface ErrorStateProps {
  message?: string;
  retry?: () => void;
}

export function ErrorState({ message = "Ha ocurrido un error", retry }: ErrorStateProps) {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      <AlertCircle className="w-12 h-12 text-destructive" />
      <p className="text-foreground-muted text-sm max-w-xs">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 rounded-xl bg-surface-container text-foreground-muted text-sm hover:bg-surface-high transition-colors"
        >
          Reintentar
        </button>
      )}
    </motion.div>
  );
}
