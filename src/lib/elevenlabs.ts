import { supabaseAdmin } from './supabase'

const EL_BASE = 'https://api.elevenlabs.io/v1'

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  preview_url: string
  category: string
  labels: Record<string, string>
}

async function getApiKey(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'elevenlabs_api_key')
    .single()
  const key = data?.value ?? process.env.ELEVENLABS_API_KEY
  if (!key) throw new Error('Clé API ElevenLabs non configurée — allez dans Paramètres → Voix IA')
  return key
}

export async function listElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
  const key = await getApiKey()
  const res = await fetch(`${EL_BASE}/voices`, {
    headers: { 'xi-api-key': key },
  })
  if (!res.ok) throw new Error(`ElevenLabs API: ${res.status}`)
  const data = await res.json()
  return data.voices as ElevenLabsVoice[]
}

export async function testElevenLabsConnection(): Promise<{ ok: boolean; voiceCount?: number; error?: string }> {
  try {
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
