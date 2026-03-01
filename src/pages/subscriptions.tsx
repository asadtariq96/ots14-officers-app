import { useMemo, useState } from 'react'
import { Banknote, CircleAlert, CircleCheck, Clock, Filter } from 'lucide-react'
import { SubscriptionForm } from '../components/subscriptions/subscription-form'
import { SubscriptionTable } from '../components/subscriptions/subscription-table'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { useAuth } from '../hooks/use-auth'
import { useOfficers } from '../hooks/use-officers'
import { useSubscriptions } from '../hooks/use-subscriptions'
import type { Officer, PaymentStatus, SubscriptionWithOfficer } from '../types'

interface EditingState {
  officer: Officer
  year: number
  current: SubscriptionWithOfficer | null
}

export function SubscriptionsPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const { officers, isLoading: officersLoading, error: officersError } = useOfficers()
  const { subscriptions, summaryByYear, isLoading, isMutating, error, upsertSubscription } = useSubscriptions()

  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus | 'all'>('all')
  const [editing, setEditing] = useState<EditingState | null>(null)

  const years = useMemo(() => {
    const base = Array.from(new Set(subscriptions.map((item) => item.year))).sort((left, right) => right - left)
    if (base.length === 0) {
      return [new Date().getFullYear()]
    }
    return base
  }, [subscriptions])

  const visibleYears = useMemo(
    () => (selectedYear === 'all' ? years : [selectedYear]),
    [selectedYear, years],
  )

  const visibleSubscriptions = useMemo(() => {
    if (selectedYear === 'all') {
      return subscriptions
    }

    return subscriptions.filter((item) => item.year === selectedYear)
  }, [selectedYear, subscriptions])

  const selectedYearSummary = selectedYear === 'all' ? null : summaryByYear[selectedYear]

  if (officersLoading || isLoading) {
    return (
      <section className="space-y-5">
        <div>
          <Skeleton className="mb-2 h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </section>
    )
  }

  if (officersError || error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{officersError ?? error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <section className="animate-fade-in space-y-5">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
          Subscription Tracker
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Year-wise payment status and collection summary.
        </p>
      </div>

      {/* Filters */}
      <Card className="card-elevated">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <CardTitle className="text-sm font-semibold tracking-wide">Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Year</Label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(value === 'all' ? 'all' : Number(value))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as PaymentStatus | 'all')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Year summary */}
      {selectedYearSummary ? (
        <Card className="card-elevated">
          <CardHeader className="pb-3">
            <CardTitle className="font-serif text-lg">
              Summary <span className="text-brass-dark">({selectedYear})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-4 py-3">
                <Banknote className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70">Collected</p>
                  <p className="font-mono text-lg font-semibold text-emerald-800">{selectedYearSummary.totalCollected}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200/60 bg-emerald-50/50 px-4 py-3">
                <CircleCheck className="h-4 w-4 text-emerald-600" strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600/70">Paid</p>
                  <p className="text-lg font-semibold text-emerald-800">{selectedYearSummary.paidCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-rose-200/60 bg-rose-50/50 px-4 py-3">
                <CircleAlert className="h-4 w-4 text-rose-600" strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-rose-600/70">Unpaid</p>
                  <p className="text-lg font-semibold text-rose-800">{selectedYearSummary.unpaidCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/50 px-4 py-3">
                <Clock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Pending</p>
                  <p className="text-lg font-semibold text-foreground">{selectedYearSummary.pendingCount}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Defaulters:</span>
              {selectedYearSummary.defaulters.length > 0 ? (
                selectedYearSummary.defaulters.map((name) => (
                  <Badge key={name} variant="outline" className="border-rose-200/80 bg-rose-50 text-rose-700">
                    {name}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="text-xs">None</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <SubscriptionTable
        officers={officers}
        subscriptions={visibleSubscriptions}
        years={visibleYears}
        isAdmin={isAdmin}
        selectedStatus={selectedStatus}
        onCellClick={(officer, year, current) => {
          if (!isAdmin) {
            return
          }
          setEditing({ officer, year, current })
        }}
      />

      <SubscriptionForm
        open={Boolean(editing)}
        values={
          editing
            ? {
                officerId: editing.officer.id,
                year: editing.year,
                amount: editing.current?.amount ?? null,
                status: editing.current?.status ?? 'pending',
                remarks: editing.current?.remarks ?? null,
                officerName: editing.officer.name,
              }
            : null
        }
        isSubmitting={isMutating}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          await upsertSubscription({
            officer_id: values.officerId,
            year: values.year,
            amount: values.amount,
            status: values.status,
            remarks: values.remarks,
          })
        }}
      />
    </section>
  )
}
