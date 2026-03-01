export type OfficerStatus = 'active' | 'deceased'
export type BatchType = '14_ots' | '15_ots_passout'
export type PaymentStatus = 'paid' | 'unpaid' | 'pending'
export type AppRole = 'admin' | 'viewer'

export interface Officer {
  id: string
  pa_no: string
  rank: string
  name: string
  arm_service: string | null
  unit: string | null
  phone: string | null
  address: string | null
  email: string | null
  city: string | null
  nok_contact: string | null
  status: OfficerStatus
  batch: BatchType
  profile_pic_url: string | null
  created_at: string
  updated_at: string
}

export interface OfficerInsert {
  pa_no: string
  rank: string
  name: string
  arm_service: string | null
  unit: string | null
  phone: string | null
  address: string | null
  email: string | null
  city: string | null
  nok_contact: string | null
  status: OfficerStatus
  batch: BatchType
  profile_pic_url: string | null
}

export interface Subscription {
  id: string
  officer_id: string
  year: number
  amount: number | null
  status: PaymentStatus
  remarks: string | null
}

export interface SubscriptionWithOfficer extends Subscription {
  officer_name: string
}

export interface Profile {
  id: string
  role: AppRole
  created_at: string
  updated_at: string
}

export interface DashboardSummary {
  totalOfficers: number
  activeCount: number
  deceasedCount: number

  rankBreakdown: Array<{ label: string; count: number }>
  armServiceBreakdown: Array<{ label: string; count: number }>
}
