import { MapPin, Phone, Mail, Building2, Upload, Pencil } from 'lucide-react'
import type { Officer, SubscriptionWithOfficer } from '../../types'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'

interface OfficerDetailProps {
  officer: Officer
  subscriptions: SubscriptionWithOfficer[]
  isAdmin: boolean
  isUploading: boolean
  onEdit: () => void
  onUpload: (file: File) => Promise<void>
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

function subscriptionBadgeClass(status: SubscriptionWithOfficer['status']) {
  if (status === 'paid') {
    return 'border-emerald-200/80 bg-emerald-50 text-emerald-700'
  }

  if (status === 'unpaid') {
    return 'border-rose-200/80 bg-rose-50 text-rose-700'
  }

  return 'border-border bg-muted text-muted-foreground'
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted/60">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground">{value ?? '-'}</p>
      </div>
    </div>
  )
}

export function OfficerDetailCard({
  officer,
  subscriptions,
  isAdmin,
  isUploading,
  onEdit,
  onUpload,
}: OfficerDetailProps) {
  return (
    <div className="space-y-5">
      {/* Profile header */}
      <Card className="card-elevated overflow-hidden">
        {/* Decorative top bar */}
        <div className="h-1.5 bg-gradient-to-r from-olive via-olive-light to-brass" />

        <div className="flex flex-col gap-5 p-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-5">
            <label className="group relative block h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-border/60 bg-muted shadow-sm">
              <img
                src={officer.profile_pic_url ?? 'https://placehold.co/96x96?text=DP'}
                alt={officer.name}
                className="h-full w-full object-cover"
              />
              {isAdmin ? (
                <>
                  <span className="absolute inset-0 hidden items-center justify-center rounded-xl bg-foreground/50 text-white backdrop-blur-sm group-hover:flex">
                    <Upload className="h-5 w-5" />
                  </span>
                  <input
                    className="hidden"
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) {
                        void onUpload(file)
                      }
                    }}
                  />
                </>
              ) : null}
            </label>

            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                {officer.name}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {officer.rank} &middot; {officer.pa_no}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={`capitalize ${statusBadgeClass(officer.status)}`}>
                  {officer.status}
                </Badge>
                <Badge variant="outline" className="border-olive/20 bg-olive-muted text-olive-light">
                  {officer.batch === '14_ots' ? '14th OTS' : '15th OTS Passout'}
                </Badge>
              </div>
            </div>
          </div>

          {isAdmin ? (
            <Button onClick={onEdit} variant="outline" className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit Officer
            </Button>
          ) : null}
        </div>
      </Card>

      {/* Details grid */}
      <Card className="card-elevated">
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-lg">Personal Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailRow icon={Building2} label="Arm/Service" value={officer.arm_service} />
            <DetailRow icon={Building2} label="Unit" value={officer.unit} />
            <DetailRow icon={Phone} label="Phone" value={officer.phone} />
            <DetailRow icon={Mail} label="Email" value={officer.email} />
            <DetailRow icon={MapPin} label="City" value={officer.city} />
            <div className="sm:col-span-2">
              <DetailRow icon={MapPin} label="Address" value={officer.address} />
            </div>
            <div className="sm:col-span-2">
              <DetailRow icon={Phone} label="Next of Kin" value={officer.nok_contact} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription history */}
      <Card className="card-elevated overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="font-serif text-lg">Subscription History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/60 bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Year</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Amount</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                    No subscription history available.
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription.id} className="border-b border-border/40">
                    <TableCell className="font-medium">{subscription.year}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${subscriptionBadgeClass(subscription.status)}`}>
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{subscription.amount ?? '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{subscription.remarks ?? '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
