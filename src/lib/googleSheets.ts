import { google } from 'googleapis'

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

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!email || !key) {
    throw new Error('Google credentials manquantes dans les variables d\'environnement')
  }

  return new google.auth.JWT(email, undefined, key, SCOPES)
}

function sanitizeSheetName(name: string) {
  return name.replace(/[\\/*?[\]:]/g, '_').slice(0, 31)
}

async function ensureSheet(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string, sheetName: string) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId })
  const exists = meta.data.sheets?.some(s => s.properties?.title === sheetName)

  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    })
    const headers = [
      'Date', 'Prénom', 'Nom', 'Téléphone', 'Email',
      'Entreprise', 'Segment', 'Campagne', 'Statut appel',
      'Durée (s)', 'Sentiment', 'Notes',
    ]
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] },
    })
  }
}

export async function appendLead(lead: LeadRow, campaignName: string): Promise<void> {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
  if (!spreadsheetId) throw new Error('GOOGLE_SPREADSHEET_ID manquant')

  const auth = getAuth()
  const sheets = google.sheets({ version: 'v4', auth })
  const sheetName = sanitizeSheetName(campaignName)

  await ensureSheet(sheets, spreadsheetId, sheetName)

  const row = [
    lead.date,
    lead.firstName,
    lead.lastName,
    lead.phone,
    lead.email,
    lead.company,
    lead.segment,
    lead.campaign,
    lead.callStatus,
    lead.duration,
    lead.sentiment,
    lead.notes,
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:L`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}

export async function testConnection(): Promise<{ ok: boolean; sheetTitle?: string; error?: string }> {
  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    if (!spreadsheetId) return { ok: false, error: 'GOOGLE_SPREADSHEET_ID manquant' }

    const auth = getAuth()
    const sheets = google.sheets({ version: 'v4', auth })
    const res = await sheets.spreadsheets.get({ spreadsheetId, fields: 'properties.title' })
    return { ok: true, sheetTitle: res.data.properties?.title ?? '' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}
