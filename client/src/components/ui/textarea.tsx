import * as React from "react"
import { createForwardRefWithClassName } from "@/lib/create-forward-ref"

const Textarea = createForwardRefWithClassName(
  "Textarea",
  "textarea",
  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
)

export { Textarea }
