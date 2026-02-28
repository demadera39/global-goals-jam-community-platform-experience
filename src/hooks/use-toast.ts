import { toast as sonnerToast } from 'sonner'

// Lightweight wrapper to expose the full sonner toast API
// so callers can use toast.success(), toast.error(), toast.loading(), toast.dismiss(), etc.
export function useToast() {
  return { toast: sonnerToast }
}
