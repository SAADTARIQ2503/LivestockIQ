import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 * 
 * @param {...any} inputs - Class names to merge
 * @returns {string} Merged class names
 * 
 * @example
 * cn("px-4 py-2", condition && "bg-blue-500", "text-white")
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
