import * as React from "react"
import { createForwardRefWithClassName } from "@/lib/create-forward-ref"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = createForwardRefWithClassName(
  "TableHeader",
  "thead",
  "[&_tr]:border-b"
)

const TableBody = createForwardRefWithClassName(
  "TableBody",
  "tbody",
  "[&_tr:last-child]:border-0"
)

const TableFooter = createForwardRefWithClassName(
  "TableFooter",
  "tfoot",
  "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0"
)

const TableRow = createForwardRefWithClassName(
  "TableRow",
  "tr",
  "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
)

const TableHead = createForwardRefWithClassName(
  "TableHead",
  "th",
  "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
)

const TableCell = createForwardRefWithClassName(
  "TableCell",
  "td",
  "p-4 align-middle [&:has([role=checkbox])]:pr-0"
)

const TableCaption = createForwardRefWithClassName(
  "TableCaption",
  "caption",
  "mt-4 text-sm text-muted-foreground"
)

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
