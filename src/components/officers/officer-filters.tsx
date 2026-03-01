import { Filter, Search } from 'lucide-react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import type { OfficerFilters } from '../../hooks/use-officers'

interface OfficerFiltersProps {
  filters: OfficerFilters
  ranks: string[]
  armServices: string[]
  cities: string[]
  onChange: (nextFilters: OfficerFilters) => void
}

export function OfficerFiltersPanel({
  filters,
  ranks,
  armServices,
  cities,
  onChange,
}: OfficerFiltersProps) {
  return (
    <Card className="card-elevated gap-0">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <CardTitle className="text-sm font-semibold tracking-wide">Filters</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1.5">
            <Label htmlFor="officer-search" className="text-xs font-medium text-muted-foreground">
              Search
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
              <Input
                id="officer-search"
                value={filters.search}
                placeholder="Name or PA No"
                className="pl-9"
                onChange={(event) => onChange({ ...filters, search: event.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Rank</Label>
            <Select value={filters.rank} onValueChange={(value) => onChange({ ...filters, rank: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Ranks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ranks</SelectItem>
                {ranks.map((rank) => (
                  <SelectItem key={rank} value={rank}>
                    {rank}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Arm/Service</Label>
            <Select value={filters.arm_service} onValueChange={(value) => onChange({ ...filters, arm_service: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Arm/Svc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Arm/Svc</SelectItem>
                {armServices.map((armService) => (
                  <SelectItem key={armService} value={armService}>
                    {armService}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">City</Label>
            <Select value={filters.city} onValueChange={(value) => onChange({ ...filters, city: value })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => onChange({ ...filters, status: value as OfficerFilters['status'] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="deceased">Deceased</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Batch</Label>
            <Select
              value={filters.batch}
              onValueChange={(value) => onChange({ ...filters, batch: value as OfficerFilters['batch'] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Batches</SelectItem>
                <SelectItem value="14_ots">14th OTS</SelectItem>
                <SelectItem value="15_ots_passout">15th OTS Passout</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
