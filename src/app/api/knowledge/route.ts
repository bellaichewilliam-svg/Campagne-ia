import { NextRequest, NextResponse } from 'next/server'
import { searchKnowledge, defaultKnowledge } from '@/lib/voiceKnowledge'

/**
 * GET /api/knowledge?query=xxx&campaignId=yyy&limit=3
 * Appelé par le webhook Vapi.ai avant chaque appel pour injecter le contexte IA.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('query') ?? ''
  const campaignId = searchParams.get('campaignId') ?? undefined
  const limit = parseInt(searchParams.get('limit') ?? '3', 10)

  const results = searchKnowledge(defaultKnowledge, query, campaignId, limit)

  const context = results
    .map(e => `[${e.category.toUpperCase()}] ${e.title}\n${e.content}`)
    .join('\n\n---\n\n')

  return NextResponse.json({
    query,
    campaignId,
    count: results.length,
    context,
    entries: results,
  })
}

/**
 * POST /api/knowledge
 * Vapi webhook — reçoit l'intent de l'appelant et retourne le contexte approprié.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, call } = body

    const query: string = message?.content ?? message?.transcript ?? ''
    const campaignId: string | undefined = call?.metadata?.campaignId

    const results = searchKnowledge(defaultKnowledge, query, campaignId, 3)
    const context = results.map(e => `${e.title}: ${e.content}`).join('\n\n')

    return NextResponse.json({
      context,
      entries: results.map(e => ({ id: e.id, title: e.title, category: e.category })),
    })
  } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
}
