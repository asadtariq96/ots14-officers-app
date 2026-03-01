import { SummaryCards } from '../components/dashboard/summary-cards'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Skeleton } from '../components/ui/skeleton'
import { useOfficers } from '../hooks/use-officers'

export function DashboardPage() {
  const { officers, isLoading, error } = useOfficers()

  if (isLoading) {
    return (
      <section className="space-y-5">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
          <Skeleton className="h-28 rounded-lg" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <section className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current officer and batch statistics at a glance.
        </p>
      </div>

      <SummaryCards officers={officers} />
    </section>
  )
}
