/**
 * Kavkom — opérateur VoIP français (kavkom.com)
 * Documentation API : https://kavkom.com/api
 * Kavkom utilise le protocole SIP + une API REST pour les appels sortants.
 */

const KAVKOM_API = 'https://api.kavkom.com/v1'

function headers() {
  const key = process.env.KAVKOM_API_KEY
  if (!key) throw new Error('KAVKOM_API_KEY manquant')
  return {
    'Authorization': `Bearer ${key}`,
    'Content-Type':  'application/json',
    'X-Account-ID':  process.env.KAVKOM_ACCOUNT_ID ?? '',
  }
}

export interface KavkomCallResult {
  id: string
  status: string
  from: string
  to: string
}

// ─── Lancer un appel sortant via Kavkom ──────────────────────────────────

export async function kavkomLaunchCall(params: {
  to: string           // numéro destinataire E.164 (+33...)
  from?: string        // numéro sortant (votre DID Kavkom)
  callbackUrl?: string // URL webhook résultats
  data?: Record<string, string>
}): Promise<KavkomCallResult> {
  const res = await fetch(`${KAVKOM_API}/calls/outbound`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      to:           params.to,
      from:         params.from ?? process.env.KAVKOM_DID_NUMBER,
      callback_url: params.callbackUrl ?? `${process.env.NEXT_PUBLIC_APP_URL}/api/kavkom/webhook`,
      custom_data:  params.data ?? {},
    }),
  })
  if (!res.ok) throw new Error(`Kavkom launchCall: ${await res.text()}`)
  return res.json()
}

// ─── Récupérer les détails d'un appel ────────────────────────────────────

export async function kavkomGetCall(callId: string) {
  const res = await fetch(`${KAVKOM_API}/calls/${callId}`, { headers: headers() })
  if (!res.ok) throw new Error(`Kavkom getCall: ${await res.text()}`)
  return res.json()
}

// ─── Lister les numéros SIP de votre compte ──────────────────────────────

export async function kavkomListNumbers() {
  const res = await fetch(`${KAVKOM_API}/phone-numbers`, { headers: headers() })
  if (!res.ok) throw new Error(`Kavkom listNumbers: ${await res.text()}`)
  return res.json()
}

// ─── Tester la connexion API Kavkom ──────────────────────────────────────

export async function testKavkomConnection(): Promise<{ ok: boolean; accountName?: string; error?: string }> {
  try {
    const res = await fetch(`${KAVKOM_API}/account`, { headers: headers() })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    const data = await res.json()
    return { ok: true, accountName: data.name ?? data.company ?? 'Compte Kavkom' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur réseau' }
  }
}

// ─── Parser le webhook Kavkom ─────────────────────────────────────────────

export function parseKavkomWebhook(body: Record<string, unknown>) {
  return {
    callId:       body.call_id as string,
    status:       body.status  as string,   // 'answered' | 'no_answer' | 'busy' | 'failed'
    duration:     body.duration as number ?? 0,
    recordingUrl: body.recording_url as string | undefined,
    from:         body.from as string,
    to:           body.to   as string,
    startedAt:    body.started_at as string,
    endedAt:      body.ended_at   as string,
    customData:   body.custom_data as Record<string, string> ?? {},
  }
}
