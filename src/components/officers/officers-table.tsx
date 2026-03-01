import { useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react'
import type { Officer } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

interface OfficersTableProps {
  officers: Officer[]
  isAdmin: boolean
  onView: (officer: Officer) => void
  onEdit: (officer: Officer) => void
  onDelete: (officer: Officer) => void
}

function statusBadgeClass(status: Officer['status']) {
  if (status === 'active') {
    return 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
  }

  if (status === 'deceased') {
    return 'border-rose-200/80 bg-rose-50 text-rose-700'
  }

  return 'border-amber-200/80 bg-amber-50 text-amber-700'
}

export function OfficersTable({ officers, isAdmin, onView, onEdit, onDelete }: OfficersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Officer>[]>(
    () => [
      {
        accessorKey: 'pa_no',
        header: 'PA No',
        cell: ({ row }) => (
          <span className="font-mono text-xs tracking-wide text-muted-foreground">{row.original.pa_no}</span>
        ),
      },
      {
        accessorKey: 'rank',
        header: 'Rank',
        cell: ({ row }) => (
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/70">{row.original.rank}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <img
              src={row.original.profile_pic_url ?? 'https://placehold.co/32x32?text=DP'}
              alt={row.original.name}
              className="h-8 w-8 rounded-full border border-border/60 object-cover ring-1 ring-border/20"
            />
            <span className="font-medium text-foreground">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'arm_service',
        header: 'Arm/Svc',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.arm_service ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'unit',
        header: 'Unit',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.unit ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.phone ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'city',
        header: 'City',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.city ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'batch',
        header: 'Batch',
        cell: ({ row }) => (
          <Badge variant="outline" className="whitespace-nowrap border-olive/20 bg-olive-muted text-olive-light text-xs">
            {row.original.batch === '14_ots' ? '14th OTS' : '15th OTS'}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant="outline" className={`text-xs capitalize ${statusBadgeClass(row.original.status)}`}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onView(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
            {isAdmin ? (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => onEdit(row.original)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(row.original)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            ) : null}
          </div>
        ),
      },
    ],
    [isAdmin, onDelete, onEdit, onView],
  )

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 12 })

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
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted()

                  return (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <span className="inline-flex cursor-pointer select-none items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() ? (
                            <ArrowUpDown
                              className={`h-3 w-3 ${sorted ? 'text-foreground' : 'text-muted-foreground/40'}`}
                            />
                          ) : null}
                        </span>
                      )}
                    </TableHead>
                  )
                })}
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
                <TableRow
                  key={row.id}
                  className={`border-b border-border/40 transition-colors ${row.original.status === 'deceased' ? 'bg-muted/20' : 'hover:bg-muted/20'}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
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
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
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
