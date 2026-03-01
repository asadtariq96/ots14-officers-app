import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasSupabaseCredentials, supabase } from '../lib/supabase'
import type { BatchType, Officer, OfficerInsert, OfficerStatus } from '../types'

export interface OfficerFilters {
  search: string
  rank: string
  arm_service: string
  city: string
  status: OfficerStatus | 'all'
  batch: BatchType | 'all'
}

const defaultFilters: OfficerFilters = {
  search: '',
  rank: 'all',
  arm_service: 'all',
  city: 'all',
  status: 'all',
  batch: 'all',
}

function normalizeText(value: string) {
  return value.trim().toLowerCase()
}

export function useOfficers(initialFilters?: Partial<OfficerFilters>) {
  const [officers, setOfficers] = useState<Officer[]>([])
  const [filters, setFilters] = useState<OfficerFilters>({ ...defaultFilters, ...initialFilters })
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOfficers = useCallback(async () => {
    if (!hasSupabaseCredentials) {
      setError('Supabase credentials are missing. Configure .env first.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    let query = supabase.from('officers').select('*').order('name', { ascending: true })

    const search = normalizeText(filters.search)

    if (search) {
      query = query.or(`name.ilike.%${search}%,pa_no.ilike.%${search}%`)
    }

    if (filters.rank !== 'all') {
      query = query.eq('rank', filters.rank)
    }

    if (filters.arm_service !== 'all') {
      query = query.eq('arm_service', filters.arm_service)
    }

    if (filters.city !== 'all') {
      query = query.eq('city', filters.city)
    }

    if (filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters.batch !== 'all') {
      query = query.eq('batch', filters.batch)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setOfficers([])
    } else {
      setError(null)
      setOfficers((data ?? []) as Officer[])
    }

    setIsLoading(false)
  }, [filters])

  useEffect(() => {
    void fetchOfficers()
  }, [fetchOfficers])

  const createOfficer = useCallback(async (payload: OfficerInsert) => {
    setIsMutating(true)
    const { error: createError } = await supabase.from('officers').insert(payload)
    setIsMutating(false)

    if (createError) {
      throw new Error(createError.message)
    }

    await fetchOfficers()
  }, [fetchOfficers])

  const updateOfficer = useCallback(
    async (officerId: string, payload: Partial<OfficerInsert>) => {
      setIsMutating(true)
      const { error: updateError } = await supabase
        .from('officers')
        .update(payload)
        .eq('id', officerId)

      setIsMutating(false)

      if (updateError) {
        throw new Error(updateError.message)
      }

      await fetchOfficers()
    },
    [fetchOfficers],
  )

  const deleteOfficer = useCallback(
    async (officerId: string) => {
      setIsMutating(true)
      const { error: deleteError } = await supabase.from('officers').delete().eq('id', officerId)
      setIsMutating(false)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      await fetchOfficers()
    },
    [fetchOfficers],
  )

  const uploadOfficerAvatar = useCallback(
    async (officerId: string, file: File) => {
      setIsMutating(true)

      const extension = file.name.split('.').pop() ?? 'jpg'
      const objectPath = `${officerId}/${Date.now()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('profile-pics')
        .upload(objectPath, file, { upsert: true })

      if (uploadError) {
        setIsMutating(false)
        throw new Error(uploadError.message)
      }

      const { data } = supabase.storage.from('profile-pics').getPublicUrl(objectPath)
      const publicUrl = data.publicUrl

      const { error: updateError } = await supabase
        .from('officers')
        .update({ profile_pic_url: publicUrl })
        .eq('id', officerId)

      setIsMutating(false)

      if (updateError) {
        throw new Error(updateError.message)
      }

      await fetchOfficers()
      return publicUrl
    },
    [fetchOfficers],
  )

  const options = useMemo(() => {
    const ranks = Array.from(new Set(officers.map((item) => item.rank).filter(Boolean))).sort()
    const armServices = Array.from(
      new Set(officers.map((item) => item.arm_service).filter((value): value is string => Boolean(value))),
    ).sort()
    const cities = Array.from(
      new Set(officers.map((item) => item.city).filter((value): value is string => Boolean(value))),
    ).sort()

    return { ranks, armServices, cities }
  }, [officers])

  return {
    officers,
    filters,
    setFilters,
    options,
    isLoading,
    isMutating,
    error,
    refresh: fetchOfficers,
    createOfficer,
    updateOfficer,
    deleteOfficer,
    uploadOfficerAvatar,
  }
}
