import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * POST /api/campaigns/[id]/contacts  body: { contact_ids: string[] }
 * Associe une liste de contacts à la campagne (idempotent grâce à l'unique(campaign_id, contact_id)).
 */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await ctx.params
  const { contact_ids } = await req.json() as { contact_ids?: string[] }
  if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
    return NextResponse.json({ error: 'contact_ids requis' }, { status: 400 })
  }

  const rows = contact_ids.map(contact_id => ({ campaign_id: campaignId, contact_id }))
  const { data, error } = await supabaseAdmin
    .from('campaign_contacts')
    .upsert(rows, { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mettre à jour le compteur sur la campagne
  const { count } = await supabaseAdmin
    .from('campaign_contacts')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
  if (typeof count === 'number') {
    await supabaseAdmin.from('campaigns').update({ contacts_count: count }).eq('id', campaignId)
  }

  return NextResponse.json({ added: data?.length ?? 0, total_contacts: count ?? null })
}

/**
 * GET /api/campaigns/[id]/contacts → liste des contacts liés à la campagne.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await ctx.params
  const { data, error } = await supabaseAdmin
    .from('campaign_contacts')
    .select('contact_id, contacts(*)')
    .eq('campaign_id', campaignId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
