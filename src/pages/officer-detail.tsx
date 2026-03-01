import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { OfficerDetailCard } from '../components/officers/officer-detail'
import { OfficerForm } from '../components/officers/officer-form'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { useAuth } from '../hooks/use-auth'
import { useOfficers } from '../hooks/use-officers'
import { useSubscriptions } from '../hooks/use-subscriptions'
import type { OfficerInsert } from '../types'

export function OfficerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { role } = useAuth()

  const { officers, isLoading, isMutating, error, updateOfficer, uploadOfficerAvatar } = useOfficers()
  const { forOfficer, isLoading: isSubscriptionLoading } = useSubscriptions()

  const [isFormOpen, setIsFormOpen] = useState(false)

  const officer = useMemo(() => officers.find((item) => item.id === id), [officers, id])
  const officerSubscriptions = useMemo(() => (id ? forOfficer(id) : []), [forOfficer, id])

  if (isLoading || isSubscriptionLoading) {
    return (
      <section className="space-y-5">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
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

  if (!officer) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>Officer not found.</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to="/officers">
            <ArrowLeft className="h-4 w-4" />
            Back to Officers
          </Link>
        </Button>
      </div>
    )
  }

  const handleUpdate = async (values: OfficerInsert) => {
    await updateOfficer(officer.id, values)
  }

  return (
    <section className="animate-fade-in space-y-5">
      <Button asChild variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
        <Link to="/officers">
          <ArrowLeft className="h-4 w-4" />
          Back to Officers
        </Link>
      </Button>

      <OfficerDetailCard
        officer={officer}
        subscriptions={officerSubscriptions}
        isAdmin={role === 'admin'}
        isUploading={isMutating}
        onEdit={() => setIsFormOpen(true)}
        onUpload={async (file) => {
          await uploadOfficerAvatar(officer.id, file)
        }}
      />

      <OfficerForm
        open={isFormOpen}
        mode="edit"
        officer={officer}
        isSubmitting={isMutating}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdate}
      />
    </section>
  )
}
