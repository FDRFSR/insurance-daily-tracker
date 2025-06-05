import * as React from "react"
import { createForwardRefWithClassName } from "@/lib/create-forward-ref"

const Card = createForwardRefWithClassName(
  "Card",
  "div",
  "rounded-lg border bg-card text-card-foreground shadow-sm"
)

const CardHeader = createForwardRefWithClassName(
  "CardHeader",
  "div",
  "flex flex-col space-y-1.5 p-6"
)

const CardTitle = createForwardRefWithClassName(
  "CardTitle",
  "div",
  "text-2xl font-semibold leading-none tracking-tight"
)

const CardDescription = createForwardRefWithClassName(
  "CardDescription",
  "div",
  "text-sm text-muted-foreground"
)

const CardContent = createForwardRefWithClassName(
  "CardContent",
  "div",
  "p-6 pt-0"
)

const CardFooter = createForwardRefWithClassName(
  "CardFooter",
  "div",
  "flex items-center p-6 pt-0"
)

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
