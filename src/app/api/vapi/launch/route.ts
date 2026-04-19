import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { launchCall, createVapiAssistant } from '@/lib/vapi'
import { searchKnowledge } from '@/lib/voiceKnowledge'
import { defaultKnowledge } from '@/lib/voiceKnowledge'

export async function POST(req: NextRequest) {
  try {
    const { campaignId } = await req.json()
    if (!campaignId) return NextResponse.json({ error: 'campaignId requis' }, { status: 400 })

    // 1. Récupérer la campagne
    const { data: campaign, error: campErr } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()
    if (campErr || !campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    // 2. Récupérer les contacts de la campagne
    const { data: campaignContacts } = await supabaseAdmin
      .from('campaign_contacts')
      .select('contact_id, contacts(*)')
      .eq('campaign_id', campaignId)
      .limit(campaign.daily_limit ?? 200)

    if (!campaignContacts?.length) {
      return NextResponse.json({ error: 'Aucun contact dans cette campagne' }, { status: 400 })
    }

    // 3. Récupérer la base de connaissances depuis Supabase
    const { data: knowledgeRows } = await supabaseAdmin
      .from('knowledge_base')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: true })

    const knowledgeContext = (knowledgeRows ?? defaultKnowledge)
      .map((e: { category: string; title: string; content: string }) => `[${e.category.toUpperCase()}] ${e.title}\n${e.content}`)
      .join('\n\n---\n\n')

    // 4. Créer un assistant Vapi avec la base de connaissances
    const assistant = await createVapiAssistant({
      name: campaign.name,
      script: campaign.script ?? `Bonjour, je vous appelle de la part de ${campaign.name}.`,
      voiceId: campaign.voice_id ?? 'nova',
      voiceProvider: campaign.voice_provider ?? 'openai',
      systemContext: knowledgeContext,
      language: 'fr',
    })

    // 5. Lancer les appels pour chaque contact
    const results = []
    let launched = 0

    for (const cc of campaignContacts) {
      const contact = cc.contacts as { id: string; first_name: string; last_name: string; phone: string; company: string } | null
      if (!contact?.phone) continue

      try {
        const callResult = await launchCall({
          phoneNumber: contact.phone,
          assistantId: assistant.id,
          assistantOverrides: {
            firstMessage: (campaign.script ?? '')
              .replace('{{prénom}}', contact.first_name)
              .replace('{{nom}}', contact.last_name)
              .replace('{{entreprise}}', contact.company ?? ''),
            variableValues: {
              prénom: contact.first_name,
              nom: contact.last_name,
              entreprise: contact.company ?? '',
            },
          },
          customerName: `${contact.first_name} ${contact.last_name}`,
          metadata: {
            campaignId,
            campaignName: campaign.name,
            contactId: contact.id,
          },
        })

        // Enregistrer l'appel en base
        await supabaseAdmin.from('call_logs').insert({
          contact_id: contact.id,
          campaign_id: campaignId,
          vapi_call_id: callResult.id,
          phone: contact.phone,
          contact_name: `${contact.first_name} ${contact.last_name}`,
          campaign_name: campaign.name,
          status: 'no_answer',
          called_at: new Date().toISOString(),
        })

        results.push({ contactId: contact.id, callId: callResult.id, status: 'launched' })
        launched++
      } catch (err) {
        results.push({ contactId: contact.id, error: err instanceof Error ? err.message : 'Erreur' })
      }
    }

    // 6. Mettre à jour le statut de la campagne
    await supabaseAdmin
      .from('campaigns')
      .update({ status: 'active', called_count: launched, updated_at: new Date().toISOString() })
      .eq('id', campaignId)

    return NextResponse.json({
      ok: true,
      launched,
      assistantId: assistant.id,
      results,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur serveur'
    console.error('[/api/vapi/launch]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
