import { Heart, Scroll, Shield, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import type { DashboardSummary, Officer } from '../../types'

function buildSummary(officers: Officer[]): DashboardSummary {
  const rankMap = new Map<string, number>()
  const armMap = new Map<string, number>()

  let activeCount = 0
  let deceasedCount = 0

  officers.forEach((officer) => {
    if (officer.status === 'active') {
      activeCount += 1
    }

    if (officer.status === 'deceased') {
      deceasedCount += 1
    }

    rankMap.set(officer.rank, (rankMap.get(officer.rank) ?? 0) + 1)

    const arm = officer.arm_service ?? 'Unknown'
    armMap.set(arm, (armMap.get(arm) ?? 0) + 1)
  })

  const rankBreakdown = Array.from(rankMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)

  const armServiceBreakdown = Array.from(armMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 6)

  return {
    totalOfficers: officers.length,
    activeCount,
    deceasedCount,
    rankBreakdown,
    armServiceBreakdown,
  }
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export function SummaryCards({ officers }: { officers: Officer[] }) {
  const summary = buildSummary(officers)

  const statCards = [
    {
      label: 'Total Officers',
      value: summary.totalOfficers,
      icon: Users,
      color: 'text-olive',
      bgColor: 'bg-olive/8',
      borderColor: 'border-olive/15',
    },
    {
      label: 'Active',
      value: summary.activeCount,
      icon: Shield,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/60',
    },
    {
      label: 'Deceased',
      value: summary.deceasedCount,
      icon: Heart,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200/60',
    },
  ]

  const rankColors = [
    'oklch(0.45 0.10 150)',
    'oklch(0.50 0.09 150)',
    'oklch(0.55 0.08 150)',
    'oklch(0.60 0.07 150)',
    'oklch(0.65 0.06 150)',
    'oklch(0.70 0.05 150)',
  ]

  const armColors = [
    'oklch(0.65 0.12 85)',
    'oklch(0.68 0.10 85)',
    'oklch(0.71 0.09 85)',
    'oklch(0.74 0.08 85)',
    'oklch(0.77 0.07 85)',
    'oklch(0.80 0.06 85)',
  ]

  const maxRank = summary.rankBreakdown.length > 0 ? summary.rankBreakdown[0].count : 1
  const maxArm = summary.armServiceBreakdown.length > 0 ? summary.armServiceBreakdown[0].count : 1

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="stagger-children grid gap-4 sm:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className={`card-elevated border ${card.borderColor}`}>
            <CardContent className="flex items-center gap-4 pt-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <p className={`font-serif text-3xl font-semibold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Breakdown cards */}
      <div className="stagger-children grid gap-4 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Scroll className="h-4 w-4 text-olive-light" strokeWidth={1.5} />
              <CardTitle className="font-serif text-lg">Rank Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3.5">
              {summary.rankBreakdown.map((item, idx) => (
                <li key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="tabular-nums text-muted-foreground">{item.count}</span>
                  </div>
                  <ProgressBar value={item.count} max={maxRank} color={rankColors[idx] ?? rankColors[0]} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-brass-dark" strokeWidth={1.5} />
              <CardTitle className="font-serif text-lg">Arm/Service Breakdown</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3.5">
              {summary.armServiceBreakdown.map((item, idx) => (
                <li key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="tabular-nums text-muted-foreground">{item.count}</span>
                  </div>
                  <ProgressBar value={item.count} max={maxArm} color={armColors[idx] ?? armColors[0]} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
