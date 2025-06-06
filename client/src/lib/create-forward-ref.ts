import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * 🔧 UTILITY: Create a forwardRef component with base className
 * 
 * Simplifies the common pattern of creating forwardRef components
 * that merge className with a base className using cn()
 */
export function createForwardRefWithClassName<
  T extends React.ElementType
>(
  displayName: string,
  element: T,
  baseClassName?: string,
  additionalProps?: Record<string, any>
) {
  const Component = React.forwardRef<
    any,
    React.ComponentPropsWithoutRef<T>
  >(({ className, ...props }, ref) => {
    return React.createElement(element, {
      ref,
      className: cn(baseClassName, className),
      ...additionalProps,
      ...props
    })
  })
  
  Component.displayName = displayName
  return Component
}
