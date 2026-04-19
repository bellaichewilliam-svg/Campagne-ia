import { createClient } from '@supabase/supabase-js'

// Valeurs par défaut pour que le build passe sans env vars (runtime échouera proprement)
const url       = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? 'https://placeholder.supabase.co'
const anonKey   = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY     ?? anonKey

// Client côté navigateur (lecture publique)
export const supabase = createClient(url, anonKey)

// Client côté serveur (routes API) — contourne RLS
export const supabaseAdmin = createClient(url, serviceKey)

// ─── Types ────────────────────────────────────────────────

export interface Campaign {
  id: string
  name: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  type: 'outbound' | 'inbound' | 'retargeting'
  voice_id?: string
  voice_name?: string
  voice_provider?: string
  script?: string
  objective?: string
  segments: string[]
  daily_limit: number
  scheduled_at?: string
  contacts_count: number
  called_count: number
  answered_count: number
  converted_count: number
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  company: string
  segment: string
  status: 'prospect' | 'lead' | 'client' | 'inactif'
  score: number
  last_contact?: string
  campaigns_count: number
  notes: string
  created_at: string
  updated_at: string
}

export interface CallLog {
  id: string
  contact_id?: string
  campaign_id?: string
  vapi_call_id?: string
  phone: string
  contact_name: string
  campaign_name: string
  status: 'answered' | 'voicemail' | 'no_answer' | 'busy' | 'converted' | 'failed'
  duration: number
  sentiment: 'positive' | 'neutral' | 'negative'
  transcript?: string
  recording_url?: string
  notes: string
  called_at: string
}

export interface RetargetingRule {
  id: string
  name: string
  trigger_event: string
  delay_hours: number
  campaign_id?: string
  voice_id?: string
  voice_name?: string
  script?: string
  max_attempts: number
  contacts_count: number
  sent_count: number
  status: 'active' | 'paused'
  created_at: string
}

export interface KnowledgeEntry {
  id: string
  category: 'faq' | 'product' | 'objection' | 'company' | 'script'
  title: string
  content: string
  campaigns: string[]
  active: boolean
  priority: 1 | 2 | 3
  tags: string[]
  created_at: string
  updated_at: string
}
