"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { fadeIn, springScale } from "@/lib/motion";
import { useEffect, useRef } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "sm" }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      const previousFocus = document.activeElement as HTMLElement;
      panelRef.current?.focus();
      return () => { previousFocus?.focus(); };
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const maxWClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" }[maxWidth];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={`relative bg-surface-lowest rounded-2xl shadow-xl w-full ${maxWClass} p-6 outline-none`}
            variants={springScale}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline font-semibold text-lg text-foreground">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-foreground-muted hover:bg-surface-container transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
