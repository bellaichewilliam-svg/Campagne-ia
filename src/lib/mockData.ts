export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft'

export interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  type: 'outbound' | 'inbound' | 'retargeting'
  voice: string
  contacts: number
  called: number
  answered: number
  converted: number
  openRate: number
  conversionRate: number
  createdAt: string
  scheduledAt?: string
}

export interface Contact {
  id: string
  name: string
  phone: string
  email: string
  company?: string
  segment: string
  status: 'prospect' | 'lead' | 'client' | 'inactif'
  lastContact?: string
  campaigns: number
  score: number
}

export interface CallLog {
  id: string
  contactName: string
  phone: string
  campaign: string
  duration: number
  status: 'answered' | 'voicemail' | 'no_answer' | 'busy' | 'converted'
  date: string
  sentiment: 'positive' | 'neutral' | 'negative'
  transcript?: string
}

export interface RetargetingRule {
  id: string
  name: string
  trigger: string
  delay: string
  contacts: number
  sent: number
  status: 'active' | 'paused'
}

export const campaigns: Campaign[] = [
  { id: '1', name: 'Relance Clients Inactifs Q2', status: 'active', type: 'outbound', voice: 'Emma (FR)', contacts: 1250, called: 870, answered: 412, converted: 98, openRate: 47.4, conversionRate: 23.8, createdAt: '2026-03-15', scheduledAt: '2026-04-01' },
  { id: '2', name: 'Promo Printemps 2026', status: 'active', type: 'outbound', voice: 'Lucas (FR)', contacts: 3400, called: 2100, answered: 1050, converted: 315, openRate: 50.0, conversionRate: 30.0, createdAt: '2026-03-20', scheduledAt: '2026-04-05' },
  { id: '3', name: 'Upsell Premium', status: 'paused', type: 'outbound', voice: 'Sophie (FR)', contacts: 620, called: 310, answered: 201, converted: 67, openRate: 64.8, conversionRate: 33.3, createdAt: '2026-02-10' },
  { id: '4', name: 'Retargeting Abandons Panier', status: 'active', type: 'retargeting', voice: 'Emma (FR)', contacts: 890, called: 760, answered: 380, converted: 152, openRate: 50.0, conversionRate: 40.0, createdAt: '2026-04-01' },
  { id: '5', name: 'Bienvenue Nouveaux Inscrits', status: 'completed', type: 'inbound', voice: 'Lucas (FR)', contacts: 540, called: 540, answered: 432, converted: 216, openRate: 80.0, conversionRate: 50.0, createdAt: '2026-01-15' },
  { id: '6', name: 'Enquête Satisfaction', status: 'draft', type: 'outbound', voice: 'Marie (FR)', contacts: 2000, called: 0, answered: 0, converted: 0, openRate: 0, conversionRate: 0, createdAt: '2026-04-17' },
]

export const contacts: Contact[] = [
  { id: '1', name: 'Marie Dupont', phone: '+33 6 12 34 56 78', email: 'marie@example.com', company: 'TechCorp', segment: 'Premium', status: 'client', lastContact: '2026-04-15', campaigns: 4, score: 92 },
  { id: '2', name: 'Jean Martin', phone: '+33 6 23 45 67 89', email: 'jean@example.com', company: 'StartupXYZ', segment: 'Standard', status: 'lead', lastContact: '2026-04-10', campaigns: 2, score: 67 },
  { id: '3', name: 'Sophie Bernard', phone: '+33 6 34 56 78 90', email: 'sophie@example.com', segment: 'Premium', status: 'prospect', lastContact: '2026-04-08', campaigns: 1, score: 45 },
  { id: '4', name: 'Pierre Moreau', phone: '+33 6 45 67 89 01', email: 'pierre@example.com', company: 'DigitalAgency', segment: 'Enterprise', status: 'client', lastContact: '2026-04-16', campaigns: 6, score: 98 },
  { id: '5', name: 'Claire Petit', phone: '+33 6 56 78 90 12', email: 'claire@example.com', segment: 'Standard', status: 'inactif', lastContact: '2026-02-20', campaigns: 1, score: 12 },
  { id: '6', name: 'Thomas Leroy', phone: '+33 6 67 89 01 23', email: 'thomas@example.com', company: 'RetailPlus', segment: 'Premium', status: 'client', lastContact: '2026-04-14', campaigns: 3, score: 85 },
  { id: '7', name: 'Isabelle Roux', phone: '+33 6 78 90 12 34', email: 'isabelle@example.com', segment: 'Standard', status: 'lead', lastContact: '2026-04-12', campaigns: 2, score: 58 },
  { id: '8', name: 'Nicolas Girard', phone: '+33 6 89 01 23 45', email: 'nicolas@example.com', company: 'ConsultGroup', segment: 'Enterprise', status: 'prospect', lastContact: '2026-04-07', campaigns: 1, score: 34 },
]

export const callLogs: CallLog[] = [
  { id: '1', contactName: 'Marie Dupont', phone: '+33 6 12 34 56 78', campaign: 'Promo Printemps 2026', duration: 142, status: 'converted', date: '2026-04-18 14:32', sentiment: 'positive', transcript: 'Contact intéressé par l\'offre premium, a demandé un devis.' },
  { id: '2', contactName: 'Jean Martin', phone: '+33 6 23 45 67 89', campaign: 'Relance Clients Inactifs Q2', duration: 0, status: 'no_answer', date: '2026-04-18 14:28', sentiment: 'neutral' },
  { id: '3', contactName: 'Sophie Bernard', phone: '+33 6 34 56 78 90', campaign: 'Promo Printemps 2026', duration: 89, status: 'answered', date: '2026-04-18 14:20', sentiment: 'neutral' },
  { id: '4', contactName: 'Pierre Moreau', phone: '+33 6 45 67 89 01', campaign: 'Upsell Premium', duration: 213, status: 'converted', date: '2026-04-18 13:55', sentiment: 'positive', transcript: 'Très réceptif, signature du contrat prévue demain.' },
  { id: '5', contactName: 'Claire Petit', phone: '+33 6 56 78 90 12', campaign: 'Relance Clients Inactifs Q2', duration: 23, status: 'voicemail', date: '2026-04-18 13:40', sentiment: 'neutral' },
  { id: '6', contactName: 'Thomas Leroy', phone: '+33 6 67 89 01 23', campaign: 'Retargeting Abandons Panier', duration: 178, status: 'converted', date: '2026-04-18 13:25', sentiment: 'positive' },
  { id: '7', contactName: 'Isabelle Roux', phone: '+33 6 78 90 12 34', campaign: 'Promo Printemps 2026', duration: 61, status: 'answered', date: '2026-04-18 13:10', sentiment: 'negative' },
  { id: '8', contactName: 'Nicolas Girard', phone: '+33 6 89 01 23 45', campaign: 'Bienvenue Nouveaux Inscrits', duration: 0, status: 'busy', date: '2026-04-18 12:58', sentiment: 'neutral' },
]

export const retargetingRules: RetargetingRule[] = [
  { id: '1', name: 'Relance non-réponse J+1', trigger: 'Pas de réponse après 24h', delay: '1 jour', contacts: 420, sent: 380, status: 'active' },
  { id: '2', name: 'Relance messagerie vocale J+3', trigger: 'Messagerie vocale laissée', delay: '3 jours', contacts: 210, sent: 195, status: 'active' },
  { id: '3', name: 'Nurturing intéressés J+7', trigger: 'Appel répondu sans conversion', delay: '7 jours', contacts: 156, sent: 89, status: 'active' },
  { id: '4', name: 'Réactivation inactifs 90j', trigger: 'Aucun contact depuis 90 jours', delay: 'Immédiat', contacts: 892, sent: 0, status: 'paused' },
]

export const weeklyCallData = [
  { day: 'Lun', appels: 320, réponses: 158, conversions: 42 },
  { day: 'Mar', appels: 450, réponses: 225, conversions: 67 },
  { day: 'Mer', appels: 380, réponses: 190, conversions: 55 },
  { day: 'Jeu', appels: 520, réponses: 286, conversions: 89 },
  { day: 'Ven', appels: 490, réponses: 245, conversions: 78 },
  { day: 'Sam', appels: 180, réponses: 90, conversions: 21 },
  { day: 'Dim', appels: 95, réponses: 38, conversions: 9 },
]

export const monthlyData = [
  { month: 'Jan', appels: 8200, conversions: 1230, revenus: 24600 },
  { month: 'Fév', appels: 9400, conversions: 1504, revenus: 30080 },
  { month: 'Mar', appels: 11200, conversions: 1904, revenus: 38080 },
  { month: 'Avr', appels: 10800, conversions: 1890, revenus: 37800 },
]

export const sentimentData = [
  { name: 'Positif', value: 48, color: '#10b981' },
  { name: 'Neutre', value: 35, color: '#6b7280' },
  { name: 'Négatif', value: 17, color: '#ef4444' },
]
