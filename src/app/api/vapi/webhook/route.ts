import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { appendLead } from '@/lib/googleSheets'

/**
 * Webhook Vapi.ai — reçoit tous les événements d'appel en temps réel.
 * Configurer dans Vapi Dashboard → Settings → Webhook URL :
 *   https://campagne-ia.vercel.app/api/vapi/webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const msg = body.message ?? body
    const type: string = msg.type ?? ''
    const call = msg.call ?? {}

    const vapiCallId: string = call.id ?? msg.id ?? ''
    const metadata: Record<string, string> = call.metadata ?? {}
    const campaignId: string = metadata.campaignId ?? ''
    const contactId: string = metadata.contactId ?? ''

    switch (type) {
      case 'call-started': {
        await supabaseAdmin
          .from('call_logs')
          .update({ status: 'answered' })
          .eq('vapi_call_id', vapiCallId)
        break
      }

      case 'call-ended': {
        const endedReason: string = call.endedReason ?? ''
        const duration: number = Math.round(call.duration ?? 0)
        const transcript: string = call.transcript ?? ''
        const recordingUrl: string = call.recordingUrl ?? ''
        const analysis = call.analysis ?? {}

        // Déduire le statut
        let status = 'no_answer'
        if (endedReason === 'customer-did-not-answer') status = 'no_answer'
        else if (endedReason === 'voicemail') status = 'voicemail'
        else if (endedReason === 'customer-busy') status = 'busy'
        else if (duration > 5) status = 'answered'

        const sentiment: string = analysis?.structuredData?.sentiment ?? 'neutral'
        const interested: boolean = analysis?.structuredData?.interested ?? false
        if (interested && duration > 30) status = 'converted'

        // Mettre à jour l'appel
        await supabaseAdmin
          .from('call_logs')
          .update({ status, duration, transcript, recording_url: recordingUrl, sentiment })
          .eq('vapi_call_id', vapiCallId)

        // Mettre à jour les stats de la campagne
        if (campaignId) {
          const { data: camp } = await supabaseAdmin
            .from('campaigns')
            .select('answered_count, converted_count')
            .eq('id', campaignId)
            .single()

          if (camp) {
            const updates: Record<string, number> = {
              answered_count: (camp.answered_count ?? 0) + (duration > 5 ? 1 : 0),
              converted_count: (camp.converted_count ?? 0) + (status === 'converted' ? 1 : 0),
            }
            await supabaseAdmin.from('campaigns').update(updates).eq('id', campaignId)
          }
        }

        // Mettre à jour le score du contact
        if (contactId) {
          let scoreBoost = 0
          if (status === 'answered') scoreBoost = 5
          if (status === 'converted') scoreBoost = 20
          if (sentiment === 'positive') scoreBoost += 10

          if (scoreBoost > 0) {
            const { data: contact } = await supabaseAdmin
              .from('contacts')
              .select('score, status')
              .eq('id', contactId)
              .single()

            if (contact) {
              const newScore = Math.min(100, (contact.score ?? 50) + scoreBoost)
              const newStatus = status === 'converted' ? 'client' : contact.status
              await supabaseAdmin.from('contacts').update({
                score: newScore,
                status: newStatus,
                last_contact: new Date().toISOString(),
              }).eq('id', contactId)
            }
          }
        }

        // Push Google Sheets si converti
        if (status === 'converted' && campaignId) {
          try {
            const { data: callRow } = await supabaseAdmin
              .from('call_logs')
              .select('*, contacts(*)')
              .eq('vapi_call_id', vapiCallId)
              .single()

            const contact = callRow?.contacts as Record<string, string> | null
            if (contact) {
              const { data: camp } = await supabaseAdmin
                .from('campaigns').select('name').eq('id', campaignId).single()

              await appendLead({
                date: new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }),
                firstName: contact.first_name ?? '',
                lastName: contact.last_name ?? '',
                phone: contact.phone ?? '',
                email: contact.email ?? '',
                company: contact.company ?? '',
                segment: contact.segment ?? '',
                campaign: camp?.name ?? '',
                callStatus: status,
                duration,
                sentiment,
                notes: analysis?.summary ?? '',
              }, camp?.name ?? 'Inconnu')
            }
          } catch (sheetsErr) {
            console.error('[webhook] Google Sheets push failed:', sheetsErr)
          }
        }
        break
      }

      case 'transcript': {
        // Mise à jour transcript en temps réel (optionnel)
        const partial: string = msg.transcript ?? ''
        if (partial && vapiCallId) {
          await supabaseAdmin
            .from('call_logs')
            .update({ transcript: partial })
            .eq('vapi_call_id', vapiCallId)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('[/api/vapi/webhook]', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
