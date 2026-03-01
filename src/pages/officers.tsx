import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { OfficerFiltersPanel } from '../components/officers/officer-filters'
import { OfficerForm } from '../components/officers/officer-form'
import { OfficersTable } from '../components/officers/officers-table'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { useAuth } from '../hooks/use-auth'
import { useOfficers } from '../hooks/use-officers'
import type { Officer, OfficerInsert } from '../types'

export function OfficersPage() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const {
    officers,
    filters,
    setFilters,
    options,
    isLoading,
    isMutating,
    error,
    createOfficer,
    updateOfficer,
    deleteOfficer,
  } = useOfficers()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null)

  const title = useMemo(() => {
    return filters.batch === '14_ots'
      ? '14th OTS Officers'
      : filters.batch === '15_ots_passout'
        ? '15th OTS Passout Officers'
        : 'All Officers'
  }, [filters.batch])

  const openCreate = () => {
    setFormMode('create')
    setSelectedOfficer(null)
    setIsFormOpen(true)
  }

  const openEdit = (officer: Officer) => {
    setFormMode('edit')
    setSelectedOfficer(officer)
    setIsFormOpen(true)
  }

  const handleSubmit = async (values: OfficerInsert) => {
    if (formMode === 'create') {
      await createOfficer(values)
      return
    }

    if (!selectedOfficer) {
      return
    }

    await updateOfficer(selectedOfficer.id, values)
  }

  const handleDelete = async (officer: Officer) => {
    const confirmed = window.confirm(`Delete ${officer.rank} ${officer.name}? This cannot be undone.`)
    if (!confirmed) {
      return
    }

    await deleteOfficer(officer.id)
  }

  return (
    <section className="animate-fade-in space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
            Officers Directory
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{title}</p>
        </div>
        {isAdmin ? (
          <Button onClick={openCreate} className="bg-olive hover:bg-olive-light">
            <Plus className="h-4 w-4" />
            Add Officer
          </Button>
        ) : null}
      </div>

      <OfficerFiltersPanel
        filters={filters}
        ranks={options.ranks}
        armServices={options.armServices}
        cities={options.cities}
        onChange={setFilters}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        <OfficersTable
          officers={officers}
          isAdmin={isAdmin}
          onView={(officer) => navigate(`/officers/${officer.id}`)}
          onEdit={openEdit}
          onDelete={(officer) => void handleDelete(officer)}
        />
      )}

      <OfficerForm
        open={isFormOpen}
        mode={formMode}
        officer={selectedOfficer}
        isSubmitting={isMutating}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </section>
  )
}
