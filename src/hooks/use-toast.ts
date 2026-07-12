import { toast as sonnerToast } from 'sonner'
import type { ReactNode } from 'react'

// Legacy shadcn-style call shape still used across the app: toast({ title, description, variant }).
// The adapter below translates these calls to sonner's API so they render correctly.
export interface LegacyToastProps {
  title?: ReactNode
  description?: ReactNode
  variant?: 'default' | 'destructive'
  duration?: number
}

type ToastFn = typeof sonnerToast & ((props: LegacyToastProps) => string | number)

function isLegacyProps(arg: unknown): arg is LegacyToastProps {
  return (
    typeof arg === 'object' &&
    arg !== null &&
    !Array.isArray(arg) &&
    ('title' in arg || 'description' in arg || 'variant' in arg)
  )
}

const toast = ((first: any, second?: any) => {
  if (isLegacyProps(first)) {
    const { title, description, variant, duration } = first
    const message = title ?? description
    const options = { description: title ? description : undefined, duration }
    return variant === 'destructive'
      ? sonnerToast.error(message, options)
      : sonnerToast(message, options)
  }
  return sonnerToast(first, second)
}) as ToastFn

// Carry over sonner's method surface (toast.success, .error, .loading, .dismiss, ...)
Object.assign(toast, sonnerToast)

export function useToast() {
  return { toast }
}
