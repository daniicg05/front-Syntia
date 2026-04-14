"use client";
import { useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { reduceMotionVariants } from "@/lib/motion";

/**
 * Returns the provided variants, or duration-0 versions if
 * the user has enabled prefers-reduced-motion.
 */
export function useMotionVariants(variants: Variants): Variants {
  const shouldReduce = useReducedMotion();
  return shouldReduce ? reduceMotionVariants(variants) : variants;
}