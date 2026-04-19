import { google } from 'googleapis'
import { supabaseAdmin } from './supabase'

export interface LeadRow {
  date: string
  firstName: string
  lastName: string
  phone: string
  email: string
  company: string
  segment: string
  campaign: string
  callStatus: string
  duration: number
  sentiment: string
  notes: string
}

// ─── Obtenir un client OAuth2 depuis les tokens stockés en base ──────────

async function getOAuthClient() {
  const clientId     = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET manquants')
  }

  // Lire les tokens stockés lors de la connexion Google OAuth
  const { data: rows } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['google_access_token', 'google_refresh_token', 'google_token_expiry'])

  const settings = Object.fromEntries((rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))

  if (!settings.google_refresh_token) {
    throw new Error('Compte Google non connecté — allez dans Paramètres → Connecter Google')
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret)
  oauth2Client.setCredentials({
    access_token:  settings.google_access_token,
    refresh_token: settings.google_refresh_token,
    expiry_date:   parseInt(settings.google_token_expiry || '0') * 1000,
  })

  // Auto-refresh si expiré
  oauth2Client.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await supabaseAdmin.from('settings').upsert([
        { key: 'google_access_token', value: tokens.access_token },
        ...(tokens.expiry_date ? [{ key: 'google_token_expiry', value: String(Math.floor(tokens.expiry_date / 1000)) }] : []),
      ], { onConflict: 'key' })
    }
  })

  return oauth2Client
}

// ─── Récupérer le spreadsheet ID configuré ───────────────────────────────

async function getSpreadsheetId(): Promise<string> {
  const { data } = await supabaseAdmin
    .from('settings')
    .select('value')
    .eq('key', 'google_spreadsheet_id')
    .single()
  const id = data?.value ?? process.env.GOOGLE_SPREADSHEET_ID
  if (!id) throw new Error('Spreadsheet ID non configuré — allez dans Paramètres → Google Sheets')
  return id
}

// ─── Créer l'onglet s'il n'existe pas encore ─────────────────────────────

async function ensureSheet(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetName: string
) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = meta.data.sheets?.some(s => s.properties?.title === sheetName)
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] },
    })
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Date', 'Prénom', 'Nom', 'Téléphone', 'Email',
          'Entreprise', 'Segment', 'Campagne', 'Statut appel',
          'Durée (s)', 'Sentiment', 'Notes',
        ]],
      },
    })
  }
}

// ─── Ajouter un lead dans le Google Sheet ────────────────────────────────

export async function appendLead(lead: LeadRow, campaignName: string): Promise<void> {
  const auth          = await getOAuthClient()
  const spreadsheetId = await getSpreadsheetId()
  const sheets        = google.sheets({ version: 'v4', auth })
  const sheetName     = campaignName.replace(/[\\/*?[\]:]/g, '_').slice(0, 31)

  await ensureSheet(sheets, spreadsheetId, sheetName)

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:L`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        lead.date, lead.firstName, lead.lastName, lead.phone, lead.email,
        lead.company, lead.segment, lead.campaign, lead.callStatus,
        lead.duration, lead.sentiment, lead.notes,
      ]],
    },
  })
}

// ─── Tester la connexion ─────────────────────────────────────────────────

export async function testConnection(): Promise<{ ok: boolean; sheetTitle?: string; error?: string }> {
  try {
    const auth          = await getOAuthClient()
    const spreadsheetId = await getSpreadsheetId()
    const sheets        = google.sheets({ version: 'v4', auth })
    const res = await sheets.spreadsheets.get({ spreadsheetId, fields: 'properties.title' })
    return { ok: true, sheetTitle: res.data.properties?.title ?? '' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}

// ─── Lister les sheets disponibles (pour le sélecteur) ───────────────────

export async function listUserSheets(): Promise<{ id: string; name: string }[]> {
  try {
    const auth   = await getOAuthClient()
    const drive  = google.drive({ version: 'v3', auth })
    const res = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      fields: 'files(id,name)',
      orderBy: 'modifiedTime desc',
      pageSize: 20,
    })
    return (res.data.files ?? []).map(f => ({ id: f.id!, name: f.name! }))
  } catch {
    return []
  }
}
