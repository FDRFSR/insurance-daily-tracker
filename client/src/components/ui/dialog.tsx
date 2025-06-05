"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { createForwardRefWithClassName } from "@/lib/create-forward-ref"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[2147483646]",
      className
    )}
    style={{
      backgroundColor: '#000000',
      opacity: 0.8,
      willChange: 'opacity',
      backfaceVisibility: 'hidden',
      transform: 'translate3d(0, 0, 0)',
      // Force highest z-index for Windows Electron
      zIndex: 2147483646,
      isolation: 'isolate'
    }}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-[2147483647] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-8 shadow-2xl rounded-2xl transition-all duration-200",
        className
      )}
      style={{
        backgroundColor: '#ffffff',
        borderColor: 'var(--border)',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        isolation: 'isolate',
        zIndex: 2147483647,
        position: 'fixed',
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none bg-gray-100 p-2">
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = createForwardRefWithClassName(
  "DialogHeader",
  "div",
  "flex flex-col space-y-1.5 text-center sm:text-left"
)

const DialogFooter = createForwardRefWithClassName(
  "DialogFooter",
  "div",
  "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2"
)

const DialogTitle = createForwardRefWithClassName(
  "DialogTitle",
  DialogPrimitive.Title,
  "text-lg font-semibold leading-none tracking-tight text-gray-900"
)

const DialogDescription = createForwardRefWithClassName(
  "DialogDescription",
  DialogPrimitive.Description,
  "text-sm text-gray-600"
)

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}