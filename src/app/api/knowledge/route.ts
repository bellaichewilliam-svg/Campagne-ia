import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/knowledge?query=xxx&campaignId=yyy&limit=3
 * Webhook Vapi.ai — retourne le contexte IA selon la question de l'appelant.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = (searchParams.get('query') ?? '').toLowerCase()
  const campaignId = searchParams.get('campaignId') ?? undefined
  const limit = parseInt(searchParams.get('limit') ?? '3', 10)

  const { data: entries, error } = await supabaseAdmin
    .from('knowledge_base')
    .select('*')
    .eq('active', true)
    .order('priority', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filtrer par campagne
  const relevant = (entries ?? []).filter((e: { campaigns: string[] }) =>
    !e.campaigns?.length || (campaignId && e.campaigns.includes(campaignId))
  )

  // Scorer par pertinence
  const scored = relevant
    .map((e: { title: string; content: string; tags: string[]; priority: number }) => {
      let score = 0
      if (query) {
        if (e.title.toLowerCase().includes(query)) score += 10
        if (e.content.toLowerCase().includes(query)) score += 5
        if (e.tags?.some((t: string) => t.includes(query))) score += 8
      }
      score += (4 - (e.priority ?? 2)) * 2
      return { entry: e, score }
    })
    .filter((s: { score: number }) => !query || s.score > 0)
    .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
    .slice(0, limit)
    .map((s: { entry: unknown }) => s.entry)

  const context = scored
    .map((e: { category: string; title: string; content: string }) => `[${e.category?.toUpperCase()}] ${e.title}\n${e.content}`)
    .join('\n\n---\n\n')

  return NextResponse.json({ query, campaignId, count: scored.length, context, entries: scored })
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Webhook Vapi — reçoit l'intent et retourne le contexte
  if (body.message !== undefined) {
    const query = (body.message?.content ?? body.message?.transcript ?? '').toLowerCase()
    const campaignId = body.call?.metadata?.campaignId

    const { data: entries } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: true })
      .limit(10)

    const relevant = (entries ?? [])
      .filter((e: { campaigns: string[] }) => !e.campaigns?.length || (campaignId && e.campaigns.includes(campaignId)))
      .slice(0, 3)

    const context = relevant
      .map((e: { title: string; content: string }) => `${e.title}: ${e.content}`)
      .join('\n\n')

    return NextResponse.json({ context, entries: relevant.map((e: { id: string; title: string; category: string }) => ({ id: e.id, title: e.title, category: e.category })) })
  }

  // CRUD — créer une entrée
  const { data, error } = await supabaseAdmin
    .from('knowledge_base')
    .insert({ ...body, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, ...body } = await req.json()
  const { data, error } = await supabaseAdmin
    .from('knowledge_base')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requis' }, { status: 400 })
  const { error } = await supabaseAdmin.from('knowledge_base').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
