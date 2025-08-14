"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal, ExternalLink, Eye, Info } from "lucide-react"
import NumberFlow from '@number-flow/react'

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

// Helper function for FCP color coding
const getFCPColor = (fcp) => {
  if (!fcp) return 'hsl(var(--muted-foreground))'
  if (fcp <= 1800) return 'hsl(142, 76%, 36%)'  // green
  if (fcp <= 3000) return 'hsl(45, 93%, 47%)'   // amber
  return 'hsl(0, 84%, 60%)'                     // red
}

// Helper function for LCP color coding
const getLCPColor = (lcp) => {
  if (!lcp) return 'hsl(var(--muted-foreground))'
  if (lcp <= 2500) return 'hsl(142, 76%, 36%)'  // green
  if (lcp <= 4000) return 'hsl(45, 93%, 47%)'   // amber
  return 'hsl(0, 84%, 60%)'                     // red
}

// Helper function for Performance Score color coding
const getPerformanceColor = (score) => {
  if (!score) return 'hsl(var(--muted-foreground))'
  if (score >= 90) return 'hsl(142, 76%, 36%)'  // green
  if (score >= 50) return 'hsl(45, 93%, 47%)'   // amber
  return 'hsl(0, 84%, 60%)'                     // red
}

// Format time from ms to seconds
const formatTime = (time) => {
  if (!time) return 'N/A'
  return `${(time / 1000).toFixed(2)}s`
}

// Colored Badge Component
const ColoredBadge = ({ value, color, children, variant = "ghost" }) => (
  <Badge variant={variant} className={`flex items-center gap-1 text-base ${variant === "ghost" ? "border-0" : ""}`}>
    <div 
      className="w-2 h-2 rounded-full" 
      style={{ backgroundColor: color }}
    />
    {children || value}
  </Badge>
)

// Format date for display
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const columns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const analysis = row.original
      return (
        <Badge 
          variant={analysis.success ? "secondary" : "destructive"}
          className={analysis.success ? "bg-muted text-muted-foreground border-0" : ""}
        >
          {analysis.success ? "Success" : "Failed"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div className="text-sm">
        {formatDate(row.getValue("created_at"))}
      </div>
    ),
  },
  {
    accessorKey: "fcp_time",
    header: ({ column }) => {
      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            FCP
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                <Info className="h-3 w-3 text-muted-foreground" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">First Contentful Paint (FCP)</h4>
                <p className="text-sm text-muted-foreground">
                  FCP measures the time from when the page starts loading to when any part of the page's content is rendered on the screen.
                </p>
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Good: ≤ 1.8s</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Needs Improvement: 1.8s - 3.0s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Poor: > 3.0s</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      )
    },
    cell: ({ row }) => {
      const fcp = row.getValue("fcp_time")
      return (
        <ColoredBadge color={getFCPColor(fcp)}>
          {formatTime(fcp)}
        </ColoredBadge>
      )
    },
  },
  {
    accessorKey: "lcp_time",
    header: ({ column }) => {
      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            LCP
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1">
                <Info className="h-3 w-3 text-muted-foreground" />
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Largest Contentful Paint (LCP)</h4>
                <p className="text-sm text-muted-foreground">
                  LCP measures the time from when the page starts loading to when the largest text block or image element is rendered on the screen.
                </p>
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Good: ≤ 2.5s</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Needs Improvement: 2.5s - 4.0s</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Poor: > 4.0s</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      )
    },
    cell: ({ row }) => {
      const lcp = row.getValue("lcp_time")
      return (
        <ColoredBadge color={getLCPColor(lcp)}>
          {formatTime(lcp)}
        </ColoredBadge>
      )
    },
  },
  {
    accessorKey: "speed_index",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Speed Index
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const speedIndex = row.getValue("speed_index")
      return (
        <div className="text-sm font-medium">
          {speedIndex ? `${speedIndex}ms` : 'N/A'}
        </div>
      )
    },
  },
  {
    accessorKey: "total_blocking_time", 
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          TBT
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const tbt = row.getValue("total_blocking_time")
      return (
        <div className="text-sm font-medium">
          {tbt ? `${tbt}ms` : 'N/A'}
        </div>
      )
    },
  },
  {
    accessorKey: "cumulative_layout_shift",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          CLS
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const cls = row.getValue("cumulative_layout_shift")
      return (
        <div className="text-sm font-medium">
          {cls !== null && cls !== undefined ? cls.toFixed(3) : 'N/A'}
        </div>
      )
    },
  },
  {
    accessorKey: "performance_score",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Performance
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const score = row.getValue("performance_score")
      return (
        <ColoredBadge color={getPerformanceColor(score)}>
          {score ? (
            <NumberFlow 
              value={score} 
              format={{ maximumFractionDigits: 0 }}
              suffix="/100"
              willChange
            />
          ) : 'N/A'}
        </ColoredBadge>
      )
    },
  },

  {
    accessorKey: "load_time",
    header: "Load Time",
    cell: ({ row }) => {
      const loadTime = row.getValue("load_time")
      return (
        <div className="text-sm">
          {loadTime ? `${loadTime}ms` : 'N/A'}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const analysis = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(analysis.id)}
            >
              Copy analysis ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            {analysis.url && (
              <DropdownMenuItem
                onClick={() => window.open(analysis.url, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit page
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

export function AnalysisDataTable({ data }) {
  const [sorting, setSorting] = React.useState([
    { id: "created_at", desc: true } // Default sort by date descending
  ])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by status..."
          value={(table.getColumn("status")?.getFilterValue()) ?? ""}
          onChange={(event) =>
            table.getColumn("status")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No analyses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}