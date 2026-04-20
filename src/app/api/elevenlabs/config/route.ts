import { NextRequest, NextResponse } from 'next/server'
import { saveElevenLabsKey, deleteElevenLabsKey, testElevenLabsConnection } from '@/lib/elevenlabs'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'elevenlabs_api_key')
      .single()
    const hasKey = !!(data?.value ?? process.env.ELEVENLABS_API_KEY)
    return NextResponse.json({ connected: hasKey })
  } catch {
    return NextResponse.json({ connected: !!process.env.ELEVENLABS_API_KEY })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey } = await req.json()
    if (!apiKey) return NextResponse.json({ error: 'apiKey requis' }, { status: 400 })
    await saveElevenLabsKey(apiKey)
    const test = await testElevenLabsConnection()
    return NextResponse.json(test)
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Erreur' })
  }
}

export async function DELETE() {
  await deleteElevenLabsKey()
  return NextResponse.json({ ok: true })
}
