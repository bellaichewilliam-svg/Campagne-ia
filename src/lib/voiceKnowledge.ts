export type KnowledgeCategory = 'faq' | 'product' | 'objection' | 'company' | 'script'

export interface KnowledgeEntry {
  id: string
  category: KnowledgeCategory
  title: string
  content: string
  campaigns: string[]   // [] = toutes les campagnes
  active: boolean
  priority: 1 | 2 | 3  // 1 haute, 3 basse
  tags: string[]
  createdAt: string
  updatedAt: string
}

export const defaultKnowledge: KnowledgeEntry[] = [
  {
    id: 'k1',
    category: 'company',
    title: 'Présentation de l\'entreprise',
    content: 'Nous sommes CampagneIA, une solution SaaS de marketing voix IA fondée en 2024. Notre mission est d\'aider les entreprises à automatiser leurs campagnes d\'appels tout en conservant une expérience humaine et personnalisée. Nous servons plus de 500 entreprises en France.',
    campaigns: [],
    active: true,
    priority: 1,
    tags: ['présentation', 'entreprise', 'mission'],
    createdAt: '2026-04-19',
    updatedAt: '2026-04-19',
  },
  {
    id: 'k2',
    category: 'product',
    title: 'Offre Premium — fonctionnalités',
    content: 'L\'offre Premium inclut : campagnes illimitées, jusqu\'à 10 000 appels/mois, 5 voix IA au choix, retargeting automatique, rapports avancés, intégration Google Sheets, support prioritaire 7j/7. Tarif : 299€/mois HT.',
    campaigns: ['Upsell Premium'],
    active: true,
    priority: 1,
    tags: ['premium', 'prix', 'fonctionnalités'],
    createdAt: '2026-04-19',
    updatedAt: '2026-04-19',
  },
  {
    id: 'k3',
    category: 'faq',
    title: 'Comment fonctionne la voix IA ?',
    content: 'Notre voix IA utilise les dernières technologies de synthèse vocale neuronale. Elle peut converser naturellement, comprendre les questions, gérer les objections et adapter son discours en temps réel. Les appels sont indiscernables d\'un appel humain tout en respectant la réglementation RGPD.',
    campaigns: [],
    active: true,
    priority: 1,
    tags: ['voix', 'ia', 'technologie', 'fonctionnement'],
    createdAt: '2026-04-19',
    updatedAt: '2026-04-19',
  },
  {
    id: 'k4',
    category: 'objection',
    title: 'Je n\'ai pas le temps',
    content: 'Je comprends parfaitement, c\'est justement pour ça que je vous appelle ! Notre solution vous fait gagner en moyenne 15 heures par semaine en automatisant vos appels commerciaux. Je peux vous montrer en 5 minutes comment ça fonctionne, quand seriez-vous disponible ?',
    campaigns: [],
    active: true,
    priority: 1,
    tags: ['objection', 'temps', 'disponibilité'],
    createdAt: '2026-04-19',
    updatedAt: '2026-04-19',
  },
  {
    id: 'k5',
    category: 'objection',
    title: 'C\'est trop cher',
    content: 'Je comprends votre préoccupation sur le budget. Pour vous donner un ordre d\'idée, nos clients constatent en moyenne un ROI de 4x en 3 mois. Si vous faites actuellement 200 appels par semaine avec 2 commerciaux, notre solution vous revient à moins de 0,10€ par appel. Puis-je vous préparer une simulation personnalisée ?',
    campaigns: [],
    active: true,
    priority: 1,
    tags: ['objection', 'prix', 'budget', 'roi'],
    createdAt: '2026-04-19',
    updatedAt: '2026-04-19',
  },
  {
    id: 'k6',
    category: 'faq',
    title: 'Est-ce conforme au RGPD ?',
    content: 'Absolument. Notre solution est 100% conforme au RGPD. Nous gérons la collecte du consentement, le droit d\'opposition, la suppression des données sur demande, et nous ne stockons aucune donnée personnelle sur des serveurs hors UE. Nous pouvons vous fournir notre DPA (Data Processing Agreement) sur demande.',
    campaigns: [],
    active: true,
    priority: 2,
    tags: ['rgpd', 'conformité', 'légal', 'données'],
    createdAt: '2026-04-19',
    updatedAt: '2026-04-19',
  },
  {
    id: 'k7',
    category: 'script',
    title: 'Introduction standard',
    content: 'Bonjour {{prénom}}, je suis Emma, assistante commerciale chez {{entreprise}}. Je vous contacte aujourd\'hui car vous avez manifesté de l\'intérêt pour nos services. Avez-vous quelques minutes pour qu\'on en discute ?',
    campaigns: [],
    active: true,
    priority: 1,
    tags: ['introduction', 'ouverture', 'script'],
    createdAt: '2026-04-19',
    updatedAt: '2026-04-19',
  },
  {
    id: 'k8',
    category: 'script',
    title: 'Clôture de l\'appel',
    content: 'Parfait {{prénom}}, je suis ravie de vous avoir parlé. Pour récapituler, je vous envoie par email un récapitulatif de notre échange avec les prochaines étapes. N\'hésitez pas à nous contacter au {{telephone_support}} si vous avez des questions. Passez une excellente journée !',
    campaigns: [],
    active: true,
    priority: 1,
    tags: ['clôture', 'fin', 'récapitulatif', 'script'],
    createdAt: '2026-04-19',
    updatedAt: '2026-04-19',
  },
]

export function searchKnowledge(
  entries: KnowledgeEntry[],
  query: string,
  campaignId?: string,
  limit = 3
): KnowledgeEntry[] {
  const q = query.toLowerCase()
  const active = entries.filter(e => e.active)

  const relevant = active.filter(e =>
    e.campaigns.length === 0 || (campaignId && e.campaigns.includes(campaignId))
  )

  const scored = relevant
    .map(e => {
      let score = 0
      if (e.title.toLowerCase().includes(q)) score += 10
      if (e.content.toLowerCase().includes(q)) score += 5
      if (e.tags.some(t => t.includes(q))) score += 8
      score += (4 - e.priority) * 2
      return { entry: e, score }
    })
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry)

  return scored.length > 0 ? scored : active.filter(e => e.priority === 1).slice(0, limit)
}
