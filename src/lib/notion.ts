import { Client } from '@notionhq/client'
import { supabaseAdmin } from './supabase'

async function getNotionSettings(): Promise<{ token: string; dbId: string }> {
  const { data: rows } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['notion_token', 'notion_database_id'])

  const s = Object.fromEntries((rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))

  const token = s.notion_token ?? process.env.NOTION_TOKEN
  const dbId  = s.notion_database_id ?? process.env.NOTION_DATABASE_ID

  if (!token) throw new Error('Token Notion non configuré — allez dans Paramètres → Notion')
  if (!dbId)  throw new Error('Database ID Notion non configuré')

  return { token, dbId }
}

export interface NotionLead {
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
  date: string
}

// ─── Pousser un lead converti dans Notion ────────────────────────────────

export async function pushLeadToNotion(lead: NotionLead): Promise<void> {
  const { token, dbId } = await getNotionSettings()
  const notion = new Client({ auth: token })

  const sentimentEmoji: Record<string, string> = {
    positive: '🟢',
    neutral:  '🟡',
    negative: '🔴',
  }

  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      'Nom':        { title:  [{ text: { content: `${lead.firstName} ${lead.lastName}`.trim() || lead.phone } }] },
      'Téléphone':  { phone_number: lead.phone },
      'Email':      { email: lead.email || null },
      'Entreprise': { rich_text: [{ text: { content: lead.company || '' } }] },
      'Segment':    { select:    { name: lead.segment || 'Standard' } },
      'Campagne':   { select:    { name: lead.campaign || 'Inconnue' } },
      'Statut':     { select:    { name: lead.callStatus } },
      'Sentiment':  { select:    { name: `${sentimentEmoji[lead.sentiment] ?? ''} ${lead.sentiment}`.trim() } },
      'Durée (s)':  { number:    lead.duration },
      'Notes':      { rich_text: [{ text: { content: lead.notes || '' } }] },
      'Date':       { date:      { start: new Date().toISOString() } },
    },
  })
}

// ─── Synchroniser un contact vers Notion ─────────────────────────────────

export async function syncContactToNotion(contact: {
  first_name: string; last_name: string; phone: string; email: string
  company: string; segment: string; status: string; score: number
}): Promise<void> {
  const { token, dbId } = await getNotionSettings()
  const notion = new Client({ auth: token })

  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      'Nom':      { title:  [{ text: { content: `${contact.first_name} ${contact.last_name}`.trim() } }] },
      'Téléphone':{ phone_number: contact.phone },
      'Email':    { email: contact.email || null },
      'Entreprise':{ rich_text: [{ text: { content: contact.company || '' } }] },
      'Segment':  { select: { name: contact.segment || 'Standard' } },
      'Statut':   { select: { name: contact.status } },
      'Score':    { number: contact.score },
    },
  })
}

// ─── Tester la connexion ─────────────────────────────────────────────────

export async function testNotionConnection(): Promise<{ ok: boolean; dbName?: string; error?: string }> {
  try {
    const { token, dbId } = await getNotionSettings()
    const notion = new Client({ auth: token })
    const db = await notion.databases.retrieve({ database_id: dbId })
    const title = 'title' in db
      ? (db.title as { plain_text: string }[])[0]?.plain_text ?? 'Base Notion'
      : 'Base Notion'
    return { ok: true, dbName: title }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}
