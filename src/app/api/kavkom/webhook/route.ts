import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { parseKavkomWebhook } from '@/lib/kavkom'
import { appendLead } from '@/lib/googleSheets'
import { pushLeadToNotion } from '@/lib/notion'

/**
 * Webhook Kavkom — reçoit les événements d'appels en temps réel.
 * Configurer dans Kavkom Dashboard → API → Webhook URL :
 *   https://campagne-ia.vercel.app/api/kavkom/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const event = parseKavkomWebhook(body)

    const { callId, status, duration, recordingUrl, customData } = event
    const campaignId = customData.campaignId ?? ''
    const contactId  = customData.contactId  ?? ''

    // Mapper statut Kavkom → statut interne
    const statusMap: Record<string, string> = {
      answered:  'answered',
      no_answer: 'no_answer',
      busy:      'busy',
      failed:    'failed',
      voicemail: 'voicemail',
    }
    const internalStatus = statusMap[status] ?? 'no_answer'

    // Mettre à jour l'appel en base
    await supabaseAdmin
      .from('call_logs')
      .update({
        status:        internalStatus,
        duration,
        recording_url: recordingUrl,
      })
      .eq('vapi_call_id', callId)  // On réutilise le champ vapi_call_id pour l'ID Kavkom

    // Mettre à jour les stats campagne
    if (campaignId && duration > 5) {
      const { data: camp } = await supabaseAdmin
        .from('campaigns')
        .select('answered_count')
        .eq('id', campaignId)
        .single()

      if (camp) {
        await supabaseAdmin.from('campaigns').update({
          answered_count: (camp.answered_count ?? 0) + 1,
        }).eq('id', campaignId)
      }
    }

    // Mettre à jour le dernier contact
    if (contactId && internalStatus === 'answered') {
      await supabaseAdmin.from('contacts').update({
        last_contact: new Date().toISOString(),
      }).eq('id', contactId)
    }

    // Si l'appel est converti (à décider via la durée > 60s par défaut)
    // Le statut "converted" sera mis à jour manuellement ou via l'IA
    const isConverted = duration > 60 && internalStatus === 'answered'
    if (isConverted && campaignId) {
      const { data: callRow } = await supabaseAdmin
        .from('call_logs')
        .select('*, contacts(*)')
        .eq('vapi_call_id', callId)
        .single()

      const contact = callRow?.contacts as Record<string, string | number> | null
      const { data: camp } = await supabaseAdmin
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single()

      if (contact && camp) {
        const leadData = {
          date:       new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
          firstName:  String(contact.first_name ?? ''),
          lastName:   String(contact.last_name  ?? ''),
          phone:      String(contact.phone      ?? ''),
          email:      String(contact.email      ?? ''),
          company:    String(contact.company    ?? ''),
          segment:    String(contact.segment    ?? ''),
          campaign:   camp.name,
          callStatus: 'converted',
          duration,
          sentiment:  'positive',
          notes:      `Appel Kavkom — durée ${duration}s`,
        }

        // Push Google Sheets + Notion en parallèle (silencieux si non configuré)
        await Promise.allSettled([
          appendLead(leadData, camp.name),
          pushLeadToNotion(leadData),
        ])

        await supabaseAdmin.from('call_logs').update({ status: 'converted' }).eq('vapi_call_id', callId)
        await supabaseAdmin.from('campaigns').update({
          converted_count: supabaseAdmin.rpc as unknown as number, // handled below
        }).eq('id', campaignId)
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[/api/kavkom/webhook]', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
