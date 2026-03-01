import { useEffect, useState, type FormEvent } from 'react'
import type { PaymentStatus } from '../../types'
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

interface SubscriptionFormValues {
  officerId: string
  year: number
  amount: number | null
  status: PaymentStatus
  remarks: string | null
  officerName: string
}

interface SubscriptionFormProps {
  open: boolean
  values: SubscriptionFormValues | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: Omit<SubscriptionFormValues, 'officerName'>) => Promise<void>
}

export function SubscriptionForm({ open, values, isSubmitting, onClose, onSubmit }: SubscriptionFormProps) {
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<PaymentStatus>('pending')
  const [remarks, setRemarks] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && values) {
      setAmount(values.amount?.toString() ?? '')
      setStatus(values.status)
      setRemarks(values.remarks ?? '')
      setError(null)
    }
  }, [open, values])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!values) {
      return
    }

    setError(null)

    try {
      await onSubmit({
        officerId: values.officerId,
        year: values.year,
        amount: amount ? Number(amount) : null,
        status,
        remarks: remarks.trim() ? remarks.trim() : null,
      })
      onClose()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to save subscription')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Subscription</DialogTitle>
          <DialogDescription>{values ? `${values.officerName} - ${values.year}` : ''}</DialogDescription>
        </DialogHeader>

        <form id="subscription-form" onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as PaymentStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" min={0} step="1" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea rows={3} value={remarks} onChange={(event) => setRemarks(event.target.value)} />
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
          <Button type="submit" form="subscription-form" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
