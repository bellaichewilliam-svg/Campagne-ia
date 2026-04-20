import { supabaseAdmin } from './supabase'

const EL_BASE = 'https://api.elevenlabs.io/v1'

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  preview_url: string
  category: string
  labels: Record<string, string>
}

async function getApiKey(): Promise<string | null> {
  try {
    const { data } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'elevenlabs_api_key')
      .single()
    return data?.value ?? process.env.ELEVENLABS_API_KEY ?? null
  } catch {
    return process.env.ELEVENLABS_API_KEY ?? null
  }
}

export async function listElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
  const key = await getApiKey()
  if (!key) return []   // pas de clé → liste vide, fallback statique géré en dehors
  const res = await fetch(`${EL_BASE}/voices`, { headers: { 'xi-api-key': key } })
  if (!res.ok) throw new Error(`ElevenLabs API: ${res.status}`)
  const data = await res.json()
  return data.voices as ElevenLabsVoice[]
}

export async function isElevenLabsConfigured(): Promise<boolean> {
  const key = await getApiKey()
  return !!key
}

export async function testElevenLabsConnection(): Promise<{ ok: boolean; voiceCount?: number; error?: string }> {
  try {
    const key = await getApiKey()
    if (!key) return { ok: false, error: 'Clé API manquante' }
    const voices = await listElevenLabsVoices()
    return { ok: true, voiceCount: voices.length }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}

export async function saveElevenLabsKey(apiKey: string): Promise<void> {
  await supabaseAdmin.from('settings').upsert(
    [{ key: 'elevenlabs_api_key', value: apiKey }],
    { onConflict: 'key' }
  )
}

export async function deleteElevenLabsKey(): Promise<void> {
  await supabaseAdmin.from('settings').delete().eq('key', 'elevenlabs_api_key')
}
