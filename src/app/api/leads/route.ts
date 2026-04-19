import { NextRequest, NextResponse } from 'next/server'
import { appendLead, type LeadRow } from '@/lib/googleSheets'
import { pushLeadToNotion } from '@/lib/notion'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { campaignName, contact, call } = body as {
      campaignName: string
      contact: {
        firstName: string; lastName: string; phone: string
        email?: string; company?: string; segment?: string
      }
      call: { status: string; duration: number; sentiment: string; notes?: string }
    }

    if (!campaignName || !contact?.phone) {
      return NextResponse.json({ error: 'campaignName et contact.phone requis' }, { status: 400 })
    }

    const lead: LeadRow = {
      date:       new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
      firstName:  contact.firstName  ?? '',
      lastName:   contact.lastName   ?? '',
      phone:      contact.phone,
      email:      contact.email      ?? '',
      company:    contact.company    ?? '',
      segment:    contact.segment    ?? '',
      campaign:   campaignName,
      callStatus: call.status,
      duration:   call.duration,
      sentiment:  call.sentiment,
      notes:      call.notes ?? '',
    }

    // Push Google Sheets + Notion en parallèle
    // Les deux sont facultatifs — une erreur de l'un ne bloque pas l'autre
    const [sheetsResult, notionResult] = await Promise.allSettled([
      appendLead(lead, campaignName),
      pushLeadToNotion(lead),
    ])

    return NextResponse.json({
      ok: true,
      googleSheets: sheetsResult.status === 'fulfilled' ? 'ok' : sheetsResult.reason?.message,
      notion:       notionResult.status  === 'fulfilled' ? 'ok' : notionResult.reason?.message,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur serveur' }, { status: 500 })
  }
}
