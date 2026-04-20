import { NextResponse } from 'next/server'
import { VAPI_VOICES, type VapiVoice } from '@/lib/vapi'
import { listElevenLabsVoices } from '@/lib/elevenlabs'

export async function GET() {
  try {
    // Tenter de récupérer les vraies voix ElevenLabs
    const elVoices = await listElevenLabsVoices()
    const mapped: VapiVoice[] = elVoices.map(v => ({
      id: v.voice_id,
      name: v.name,
      provider: '11labs',
      language: v.labels?.language ?? 'fr-FR',
      gender: v.labels?.gender === 'male' ? 'Masculin' : v.labels?.gender === 'female' ? 'Féminin' : 'Neutre',
      preview_url: v.preview_url,
    }))

    // Ajouter les voix OpenAI + Azure statiques
    const others = VAPI_VOICES.filter(v => v.provider !== '11labs')
    return NextResponse.json([...mapped, ...others])
  } catch {
    // Pas de clé ElevenLabs → retourner la liste statique
    return NextResponse.json(VAPI_VOICES)
  }
}
