import { NextRequest, NextResponse } from 'next/server'
import { saveElevenLabsKey, deleteElevenLabsKey } from '@/lib/elevenlabs'
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
    if (!apiKey) return NextResponse.json({ ok: false, error: 'Clé API requise' }, { status: 400 })

    // Tester la clé directement (sans passer par Supabase)
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    })
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: `Clé invalide — ElevenLabs a répondu ${res.status}` })
    }
    const data = await res.json()
    const voiceCount: number = data.voices?.length ?? 0

    // Sauvegarder en base (best-effort — ne bloque pas si Supabase absent)
    try { await saveElevenLabsKey(apiKey) } catch { /* Supabase non configuré */ }

    return NextResponse.json({ ok: true, voiceCount })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : 'Erreur réseau' })
  }
}

export async function DELETE() {
  try { await deleteElevenLabsKey() } catch { /* ignore */ }
  return NextResponse.json({ ok: true })
}

