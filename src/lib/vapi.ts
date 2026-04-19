const VAPI_BASE = 'https://api.vapi.ai'

function headers() {
  const key = process.env.VAPI_API_KEY
  if (!key) throw new Error('VAPI_API_KEY manquant')
  return { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
}

// ─── Types Vapi ───────────────────────────────────────────

export interface VapiVoice {
  id: string
  name: string
  provider: string
  language: string
  gender: string
  preview_url?: string
}

export interface VapiCallResult {
  id: string
  status: string
  phoneNumber?: string
  customer?: { number: string }
}

// ─── Voix disponibles (FR + multilingues) ────────────────
// Vapi n'expose pas de route "list all voices" publique ;
// on expose une sélection de voix FR/EU de qualité.

export const VAPI_VOICES: VapiVoice[] = [
  // ElevenLabs — français natif
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel',   provider: '11labs', language: 'fr-FR', gender: 'Féminin' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi',     provider: '11labs', language: 'fr-FR', gender: 'Féminin' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella',    provider: '11labs', language: 'fr-FR', gender: 'Féminin' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni',   provider: '11labs', language: 'fr-FR', gender: 'Masculin' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli',     provider: '11labs', language: 'fr-FR', gender: 'Féminin' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Josh',     provider: '11labs', language: 'fr-FR', gender: 'Masculin' },
  { id: 'VR6AewLTigWG4xSOukaG', name: 'Arnold',   provider: '11labs', language: 'fr-FR', gender: 'Masculin' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam',     provider: '11labs', language: 'fr-FR', gender: 'Masculin' },
  { id: 'yoZ06aMxZJJ28mfd3POQ', name: 'Sam',      provider: '11labs', language: 'fr-FR', gender: 'Masculin' },
  // OpenAI TTS — multilingue
  { id: 'alloy',   name: 'Alloy',   provider: 'openai', language: 'fr-FR', gender: 'Neutre' },
  { id: 'echo',    name: 'Echo',    provider: 'openai', language: 'fr-FR', gender: 'Masculin' },
  { id: 'fable',   name: 'Fable',   provider: 'openai', language: 'fr-FR', gender: 'Neutre' },
  { id: 'onyx',    name: 'Onyx',    provider: 'openai', language: 'fr-FR', gender: 'Masculin' },
  { id: 'nova',    name: 'Nova',    provider: 'openai', language: 'fr-FR', gender: 'Féminin' },
  { id: 'shimmer', name: 'Shimmer', provider: 'openai', language: 'fr-FR', gender: 'Féminin' },
  // Azure — français
  { id: 'fr-FR-DeniseNeural',   name: 'Denise',   provider: 'azure', language: 'fr-FR', gender: 'Féminin' },
  { id: 'fr-FR-HenriNeural',    name: 'Henri',    provider: 'azure', language: 'fr-FR', gender: 'Masculin' },
  { id: 'fr-FR-YvetteNeural',   name: 'Yvette',   provider: 'azure', language: 'fr-FR', gender: 'Féminin' },
  { id: 'fr-FR-AlainNeural',    name: 'Alain',    provider: 'azure', language: 'fr-FR', gender: 'Masculin' },
  { id: 'fr-FR-BrigitteNeural', name: 'Brigitte', provider: 'azure', language: 'fr-FR', gender: 'Féminin' },
]

// ─── Créer un assistant Vapi à la volée ──────────────────

export async function createVapiAssistant(params: {
  name: string
  script: string
  voiceId: string
  voiceProvider: string
  systemContext: string
  language?: string
}) {
  const res = await fetch(`${VAPI_BASE}/assistant`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      name: params.name,
      firstMessage: params.script,
      transcriber: {
        provider: 'deepgram',
        language: params.language ?? 'fr',
      },
      model: {
        provider: 'openai',
        model: 'gpt-4o',
        systemPrompt: `Tu es un agent commercial professionnel et bienveillant. Tu parles uniquement en français. Tu dois être naturel, poli et persuasif.\n\nCONNAISSANCES DE BASE :\n${params.systemContext}\n\nRègle : Ne jamais mentir. Si tu ne sais pas, demande poliment de recontacter l'entreprise.`,
        temperature: 0.7,
      },
      voice: {
        provider: params.voiceProvider,
        voiceId: params.voiceId,
      },
      silenceTimeoutSeconds: 10,
      maxDurationSeconds: 600,
      backgroundSound: 'office',
      backchannelingEnabled: true,
      analysisPlan: {
        summaryPrompt: 'Résume cet appel en 2-3 phrases. Indique si le contact est intéressé et les prochaines étapes.',
        structuredDataSchema: {
          type: 'object',
          properties: {
            sentiment: { type: 'string', enum: ['positive', 'neutral', 'negative'] },
            interested: { type: 'boolean' },
            callbackRequested: { type: 'boolean' },
            summary: { type: 'string' },
          },
        },
      },
    }),
  })
  if (!res.ok) throw new Error(`Vapi createAssistant: ${await res.text()}`)
  return res.json()
}

// ─── Lancer un appel ─────────────────────────────────────

export async function launchCall(params: {
  phoneNumber: string
  assistantId?: string
  assistantOverrides?: Record<string, unknown>
  customerName?: string
  metadata?: Record<string, string>
}) {
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID
  if (!phoneNumberId) throw new Error('VAPI_PHONE_NUMBER_ID manquant')

  const body: Record<string, unknown> = {
    type: 'outboundPhoneCall',
    phoneNumberId,
    customer: {
      number: params.phoneNumber,
      name: params.customerName,
    },
    metadata: params.metadata ?? {},
  }

  if (params.assistantId) {
    body.assistantId = params.assistantId
    if (params.assistantOverrides) body.assistantOverrides = params.assistantOverrides
  }

  const res = await fetch(`${VAPI_BASE}/call`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Vapi launchCall: ${await res.text()}`)
  return res.json() as Promise<VapiCallResult>
}

// ─── Récupérer un appel ──────────────────────────────────

export async function getCall(callId: string) {
  const res = await fetch(`${VAPI_BASE}/call/${callId}`, { headers: headers() })
  if (!res.ok) throw new Error(`Vapi getCall: ${await res.text()}`)
  return res.json()
}

// ─── Lister les appels ───────────────────────────────────

export async function listCalls(limit = 50) {
  const res = await fetch(`${VAPI_BASE}/call?limit=${limit}`, { headers: headers() })
  if (!res.ok) throw new Error(`Vapi listCalls: ${await res.text()}`)
  return res.json()
}

// ─── Parser un événement webhook Vapi ────────────────────

export function parseVapiWebhook(body: Record<string, unknown>) {
  const type = body.message as Record<string, unknown>
  if (!type) return null

  const msgType = type.type as string
  const call = type.call as Record<string, unknown> | undefined

  return {
    type: msgType,
    callId: (call?.id ?? body.id) as string | undefined,
    status: call?.status as string | undefined,
    endedReason: call?.endedReason as string | undefined,
    duration: call?.duration as number | undefined,
    transcript: (type.transcript ?? call?.transcript) as string | undefined,
    recordingUrl: call?.recordingUrl as string | undefined,
    analysis: call?.analysis as Record<string, unknown> | undefined,
    customer: call?.customer as { number: string } | undefined,
    metadata: call?.metadata as Record<string, string> | undefined,
  }
}
