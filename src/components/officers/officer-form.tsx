import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Officer, OfficerInsert } from '../../types'
import { Alert, AlertDescription } from '../ui/alert'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'

interface OfficerFormProps {
  open: boolean
  mode: 'create' | 'edit'
  officer?: Officer | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: OfficerInsert) => Promise<void>
}

const emptyValues: OfficerInsert = {
  pa_no: '',
  rank: '',
  name: '',
  arm_service: null,
  unit: null,
  phone: null,
  address: null,
  email: null,
  city: null,
  nok_contact: null,
  status: 'active',
  batch: '14_ots',
  profile_pic_url: null,
}

function toNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function OfficerForm({ open, mode, officer, isSubmitting, onClose, onSubmit }: OfficerFormProps) {
  const initialValues = useMemo<OfficerInsert>(() => {
    if (!officer) {
      return emptyValues
    }

    return {
      pa_no: officer.pa_no,
      rank: officer.rank,
      name: officer.name,
      arm_service: officer.arm_service,
      unit: officer.unit,
      phone: officer.phone,
      address: officer.address,
      email: officer.email,
      city: officer.city,
      nok_contact: officer.nok_contact,
      status: officer.status,
      batch: officer.batch,
      profile_pic_url: officer.profile_pic_url,
    }
  }, [officer])

  const [values, setValues] = useState<OfficerInsert>(initialValues)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setValues(initialValues)
      setError(null)
    }
  }, [open, initialValues])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!values.name.trim() || !values.pa_no.trim() || !values.rank.trim()) {
      setError('Name, PA number, and rank are required.')
      return
    }

    try {
      await onSubmit({
        ...values,
        name: values.name.trim(),
        pa_no: values.pa_no.trim(),
        rank: values.rank.trim(),
        arm_service: toNullable(values.arm_service ?? ''),
        unit: toNullable(values.unit ?? ''),
        phone: toNullable(values.phone ?? ''),
        address: toNullable(values.address ?? ''),
        email: toNullable(values.email ?? ''),
        city: toNullable(values.city ?? ''),
        nok_contact: toNullable(values.nok_contact ?? ''),
      })
      onClose()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to save officer')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Add Officer' : 'Edit Officer'}</DialogTitle>
          <DialogDescription>Fill all known details. Required fields are marked.</DialogDescription>
        </DialogHeader>

        <form id="officer-form" onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>PA No *</Label>
            <Input
              required
              value={values.pa_no}
              onChange={(event) => setValues((current) => ({ ...current, pa_no: event.target.value }))}
              placeholder="PA-12345"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rank *</Label>
            <Input
              required
              value={values.rank}
              onChange={(event) => setValues((current) => ({ ...current, rank: event.target.value }))}
              placeholder="Col"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              required
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="Full name"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Arm/Service</Label>
            <Input
              value={values.arm_service ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, arm_service: event.target.value }))}
              placeholder="FF / Engr / Arty"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Input
              value={values.unit ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, unit: event.target.value }))}
              placeholder="24 FF"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={values.phone ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={values.email ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>City</Label>
            <Input
              value={values.city ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, city: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={values.status} onValueChange={(value) => setValues((current) => ({ ...current, status: value as OfficerInsert['status'] }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deceased">Deceased</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Batch</Label>
            <Select value={values.batch} onValueChange={(value) => setValues((current) => ({ ...current, batch: value as OfficerInsert['batch'] }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="14_ots">14th OTS</SelectItem>
                <SelectItem value="15_ots_passout">15th OTS Passout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Address</Label>
            <Textarea
              rows={2}
              value={values.address ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, address: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label>Next of Kin Contact</Label>
            <Textarea
              rows={2}
              value={values.nok_contact ?? ''}
              onChange={(event) => setValues((current) => ({ ...current, nok_contact: event.target.value }))}
            />
          </div>
        </form>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="officer-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Officer' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
