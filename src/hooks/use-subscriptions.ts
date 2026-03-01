import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasSupabaseCredentials, supabase } from '../lib/supabase'
import type { PaymentStatus, Subscription, SubscriptionWithOfficer } from '../types'

interface SubscriptionRow {
  id: string
  officer_id: string
  year: number
  amount: number | null
  status: PaymentStatus
  remarks: string | null
  officers:
    | {
        name: string
      }
    | Array<{
        name: string
      }>
    | null
}

export interface SubscriptionSummary {
  totalCollected: number
  paidCount: number
  unpaidCount: number
  pendingCount: number
  defaulters: string[]
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithOfficer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!hasSupabaseCredentials) {
      setError('Supabase credentials are missing. Configure .env first.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const { data, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id,officer_id,year,amount,status,remarks,officers(name)')
      .order('year', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setSubscriptions([])
      setIsLoading(false)
      return
    }

    const mapped = ((data ?? []) as SubscriptionRow[]).map((item) => {
      const officerName = Array.isArray(item.officers) ? item.officers[0]?.name : item.officers?.name

      return {
      id: item.id,
      officer_id: item.officer_id,
      year: item.year,
      amount: item.amount,
      status: item.status,
      remarks: item.remarks,
      officer_name: officerName ?? 'Unknown Officer',
      }
    })

    setSubscriptions(mapped)
    setError(null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const upsertSubscription = useCallback(
    async (payload: Omit<Subscription, 'id'>) => {
      setIsMutating(true)

      const { error: upsertError } = await supabase.from('subscriptions').upsert(payload, {
        onConflict: 'officer_id,year',
      })

      setIsMutating(false)

      if (upsertError) {
        throw new Error(upsertError.message)
      }

      await refresh()
    },
    [refresh],
  )

  const forOfficer = useCallback(
    (officerId: string) => subscriptions.filter((item) => item.officer_id === officerId),
    [subscriptions],
  )

  const summaryByYear = useMemo(() => {
    return subscriptions.reduce<Record<number, SubscriptionSummary>>((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = {
          totalCollected: 0,
          paidCount: 0,
          unpaidCount: 0,
          pendingCount: 0,
          defaulters: [],
        }
      }

      const current = acc[item.year]

      if (item.status === 'paid') {
        current.paidCount += 1
        current.totalCollected += Number(item.amount ?? 0)
      }

      if (item.status === 'unpaid') {
        current.unpaidCount += 1
        current.defaulters.push(item.officer_name)
      }

      if (item.status === 'pending') {
        current.pendingCount += 1
      }

      return acc
    }, {})
  }, [subscriptions])

  return {
    subscriptions,
    isLoading,
    isMutating,
    error,
    refresh,
    upsertSubscription,
    forOfficer,
    summaryByYear,
  }
}
