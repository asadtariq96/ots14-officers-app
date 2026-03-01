import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Officer, PaymentStatus, SubscriptionWithOfficer } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

interface SubscriptionTableProps {
  officers: Officer[]
  subscriptions: SubscriptionWithOfficer[]
  years: number[]
  isAdmin: boolean
  selectedStatus: PaymentStatus | 'all'
  onCellClick: (officer: Officer, year: number, current: SubscriptionWithOfficer | null) => void
}

function badgeClassForStatus(status: PaymentStatus) {
  if (status === 'paid') return 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
  if (status === 'unpaid') return 'border-rose-200/80 bg-rose-50 text-rose-700'
  return 'border-border bg-muted text-muted-foreground'
}

export function SubscriptionTable({
  officers,
  subscriptions,
  years,
  isAdmin,
  selectedStatus,
  onCellClick,
}: SubscriptionTableProps) {
  const navigate = useNavigate()
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 })

  const byOfficerYear = useMemo(() => {
    const map = new Map<string, SubscriptionWithOfficer>()
    subscriptions.forEach((item) => {
      map.set(`${item.officer_id}-${item.year}`, item)
    })
    return map
  }, [subscriptions])

  const columns = useMemo<ColumnDef<Officer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => {
          const sorted = column.getIsSorted()
          return (
            <span
              className="inline-flex cursor-pointer select-none items-center gap-1"
              onClick={column.getToggleSortingHandler()}
            >
              Officer
              <ArrowUpDown className={`h-3 w-3 ${sorted ? 'text-foreground' : 'text-muted-foreground/40'}`} />
            </span>
          )
        },
        cell: ({ row }) => (
          <button
            className="text-left hover:underline"
            onClick={() => navigate(`/officers/${row.original.id}`)}
          >
            <p className="font-medium text-foreground">{row.original.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.rank} &middot; {row.original.pa_no}
            </p>
          </button>
        ),
      },
      ...years.map((year): ColumnDef<Officer> => ({
        id: String(year),
        accessorFn: (officer) => {
          const status = byOfficerYear.get(`${officer.id}-${year}`)?.status ?? 'pending'
          return status === 'paid' ? 0 : status === 'pending' ? 1 : 2
        },
        header: ({ column }) => {
          const sorted = column.getIsSorted()
          return (
            <span
              className="inline-flex cursor-pointer select-none items-center gap-1"
              onClick={column.getToggleSortingHandler()}
            >
              {year}
              <ArrowUpDown className={`h-3 w-3 ${sorted ? 'text-foreground' : 'text-muted-foreground/40'}`} />
            </span>
          )
        },
        cell: ({ row }) => {
          const value = byOfficerYear.get(`${row.original.id}-${year}`) ?? null

          if (selectedStatus !== 'all' && value && value.status !== selectedStatus) {
            return <span className="text-muted-foreground/40">-</span>
          }

          const badge = (
            <Badge variant="outline" className={`capitalize ${badgeClassForStatus(value?.status ?? 'pending')}`}>
              {value?.status ?? 'pending'}
            </Badge>
          )

          if (isAdmin) {
            return (
              <Button variant="ghost" size="sm" className="h-auto px-1 py-0" onClick={() => onCellClick(row.original, year, value)}>
                {badge}
              </Button>
            )
          }

          return badge
        },
      })),
    ],
    [years, byOfficerYear, selectedStatus, isAdmin, onCellClick],
  )

  const table = useReactTable({
    data: officers,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Card className="card-elevated gap-0 overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${
                      header.id === 'name' ? 'sticky left-0 z-20 bg-muted/30' : 'text-center'
                    }`}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  No officers found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-b border-border/40">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`py-3 ${cell.column.id === 'name' ? 'sticky left-0 z-10 bg-card' : 'text-center'}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      <CardFooter className="justify-between border-t border-border/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Page <span className="font-medium text-foreground">{table.getState().pagination.pageIndex + 1}</span> of{' '}
            <span className="font-medium text-foreground">{table.getPageCount() || 1}</span>
          </p>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-7 w-[6.5rem] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 12, 25, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1.5">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
