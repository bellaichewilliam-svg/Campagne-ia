import { NextRequest, NextResponse } from 'next/server'
import { appendLead, type LeadRow } from '@/lib/googleSheets'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { campaignName, contact, call } = body as {
      campaignName: string
      contact: {
        firstName: string
        lastName: string
        phone: string
        email: string
        company?: string
        segment?: string
      }
      call: {
        status: string
        duration: number
        sentiment: string
        notes?: string
      }
    }

    if (!campaignName || !contact?.phone) {
      return NextResponse.json({ error: 'campaignName et contact.phone sont requis' }, { status: 400 })
    }

    const lead: LeadRow = {
      date: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      firstName: contact.firstName ?? '',
      lastName: contact.lastName ?? '',
      phone: contact.phone,
      email: contact.email ?? '',
      company: contact.company ?? '',
      segment: contact.segment ?? '',
      campaign: campaignName,
      callStatus: call.status,
      duration: call.duration,
      sentiment: call.sentiment,
      notes: call.notes ?? '',
    }

    await appendLead(lead, campaignName)

    return NextResponse.json({ ok: true, message: 'Lead enregistré dans Google Sheets' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    console.error('[/api/leads]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
