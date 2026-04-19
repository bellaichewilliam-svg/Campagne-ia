# CampagneIA — CRM Marketing Voix IA

> Fichier de référence pour Claude Code. À lire en priorité à chaque session.
> **Mis à jour automatiquement à chaque modification significative.**

---

## Vue d'ensemble

CRM full-stack de campagnes marketing **voix IA** permettant de :
- Lancer des campagnes d'appels automatisés via voix IA
- Gérer les contacts et leur cycle de vie (prospect → client)
- Suivre en temps réel les taux d'ouverture, de réponse et de conversion
- Retargeter automatiquement selon des règles déclencheur/délai
- Envoyer les leads convertis vers **Google Sheets** par campagne
- Alimenter la voix IA d'une **base de connaissances** pour répondre aux questions

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| Langage | TypeScript strict |
| Style | Tailwind CSS v3 |
| Graphiques | Recharts |
| Icônes | Lucide React |
| Google Sheets | googleapis (google-auth-library) |
| Voix IA | Vapi.ai (webhook + knowledge base) |
| Date | date-fns |

---

## Architecture des dossiers

```
src/
├── app/
│   ├── page.tsx                  # Tableau de bord (KPIs, graphiques)
│   ├── campaigns/page.tsx        # Gestion campagnes + wizard création
│   ├── contacts/page.tsx         # CRM contacts, table, sélection, import
│   ├── calls/page.tsx            # Journal appels, transcriptions, sentiment
│   ├── retargeting/page.tsx      # Règles retargeting automatique
│   ├── reports/page.tsx          # Rapports détaillés + export PDF
│   ├── knowledge/page.tsx        # Base de connaissances voix IA
│   ├── settings/page.tsx         # Config voix, Google Sheets, API, notifs
│   ├── globals.css               # Styles globaux + classes utilitaires
│   ├── layout.tsx                # Layout racine (Sidebar + main)
│   └── api/
│       ├── leads/route.ts        # POST /api/leads → push Google Sheets
│       └── knowledge/route.ts    # GET/POST base de connaissances
├── components/
│   ├── Sidebar.tsx               # Navigation latérale
│   ├── PageHeader.tsx            # En-tête de page standard
│   └── StatCard.tsx              # Carte KPI avec delta
└── lib/
    ├── mockData.ts               # Données de démonstration (campagnes, contacts, appels)
    ├── googleSheets.ts           # Service Google Sheets API v4
    └── voiceKnowledge.ts         # Gestion base de connaissances voix IA
```

---

## Pages et fonctionnalités

### `/` — Tableau de bord
- KPIs : appels aujourd'hui, taux de réponse, conversions, contacts actifs
- Graphique barres : appels/réponses/conversions par jour de semaine
- Graphique donut : sentiment des appels (positif/neutre/négatif)
- Liste campagnes actives avec taux de conversion
- Flux des derniers appels en temps réel

### `/campaigns` — Campagnes
- Liste filtrée par statut (actif/pause/terminé/brouillon)
- Barres de progression : contacts appelés, taux d'ouverture, conversion
- Actions : pause/reprendre/voir détails
- **Wizard création 3 étapes** : Config (nom, type, voix) → Script (avec variables `{{prénom}}`) → Ciblage (segments, date, limite quotidienne)

### `/contacts` — CRM
- Table avec : nom, email, entreprise, segment, statut, score lead (/100)
- Sélection multiple → ajouter à une campagne
- Filtres : tous / client / lead / prospect / inactif
- Ajout manuel + import CSV
- Score coloré : vert ≥80 / jaune ≥50 / rouge <50

### `/calls` — Journal des appels
- Filtres par statut : converti / répondu / messagerie / sans réponse / occupé
- Sentiment par appel (positif/neutre/négatif)
- Modal transcription IA
- Bouton écoute enregistrement

### `/retargeting` — Retargeting automatique
- Règles : déclencheur (ex: pas de réponse 24h) + délai + script dédié
- Toggle actif/pause par règle
- Progression des envois par règle

### `/reports` — Rapports
- Taux d'ouverture par campagne (graphique horizontal)
- Entonnoir de conversion : Contacts → Appelés → Réponses → Intéressés → Convertis
- Évolution mensuelle (aire chart)
- Meilleures heures d'appel (heatmap barres)
- Performance par voix IA (appels, conversion, satisfaction)
- Export PDF

### `/knowledge` — Base de connaissances voix IA
- Gestion des entrées FAQ, produits, objections, infos entreprise
- Catégories : FAQ / Produit / Objections / Entreprise / Script
- Recherche full-text dans la base
- Statut actif/inactif par entrée
- Assignation à une ou plusieurs campagnes

### `/settings` — Paramètres
- **Voix IA** : sélection, vitesse, tonalité, test audio
- **Google Sheets** : ID du spreadsheet, onglet cible par campagne, colonnes, test connexion
- **Intégrations API** : clé API, webhook URL, HubSpot/Salesforce/Zapier/Make/Slack
- **Notifications** : campagne terminée, taux anormal, rapport hebdomadaire
- **Général** : organisation, email, fuseau horaire, plages horaires d'appel

---

## Intégration Google Sheets

### Configuration (Settings → Google Sheets)
1. Créer un projet Google Cloud Console
2. Activer l'API Google Sheets
3. Créer un compte de service → télécharger le JSON
4. Partager le Google Sheet avec l'email du compte de service
5. Coller le `spreadsheet_id` dans les paramètres

### Flux de données
```
Appel converti
  → POST /api/leads { campaignId, contactData, callData }
  → src/lib/googleSheets.ts → appendLead()
  → Google Sheets API v4 → spreadsheets.values.append
  → Onglet "{nom_campagne}" du spreadsheet configuré
```

### Colonnes auto-générées par onglet
`Date | Prénom | Nom | Téléphone | Email | Entreprise | Segment | Campagne | Statut appel | Durée | Sentiment | Notes`

### Variables d'environnement requises
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@projet.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

---

## Base de connaissances Voix IA

### Principe
La voix IA (Vapi.ai) consulte la base de connaissances lors de chaque appel pour :
- Répondre aux questions sur les produits/services
- Gérer les objections avec les scripts appropriés
- Utiliser les informations de l'entreprise
- Adapter le discours par campagne

### Structure d'une entrée
```typescript
{
  id: string
  category: 'faq' | 'product' | 'objection' | 'company' | 'script'
  title: string        // Question ou titre court
  content: string      // Réponse complète que la voix doit donner
  campaigns: string[]  // Campagnes où cette entrée est active ([] = toutes)
  active: boolean
  priority: number     // 1 (haute) à 3 (basse)
  createdAt: string
  updatedAt: string
}
```

### Intégration Vapi.ai
- Webhook `POST /api/knowledge?query=xxx&campaignId=yyy`
- Retourne les 3 meilleures entrées correspondantes (recherche par mot-clé)
- Vapi les injecte dans le contexte système de l'IA avant chaque appel

---

## Données de démonstration (mockData.ts)

| Entité | Quantité | Détails |
|--------|----------|---------|
| Campaigns | 6 | mix actif/pause/terminé/brouillon |
| Contacts | 8 | mix client/lead/prospect/inactif avec scores |
| CallLogs | 8 | mix statuts + transcriptions |
| RetargetingRules | 4 | règles types réelles |
| WeeklyCallData | 7 jours | appels/réponses/conversions |
| MonthlyData | 4 mois | Jan–Avr 2026 |
| SentimentData | 3 catégories | positif 48% / neutre 35% / négatif 17% |

---

## Commandes utiles

```bash
npm run dev       # Lancer en développement (http://localhost:3000)
npm run build     # Build production
npm run lint      # Vérification ESLint
```

---

## Variables d'environnement (.env.local)

```env
# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SPREADSHEET_ID=

# Vapi.ai Voice AI
VAPI_API_KEY=
VAPI_ASSISTANT_ID=

# App
NEXT_PUBLIC_APP_URL=https://campagne-ia.vercel.app
```

---

## Historique des modifications

| Date | Description |
|------|-------------|
| 2026-04-19 | Création initiale du projet : dashboard, campagnes, contacts, appels, retargeting, rapports, paramètres |
| 2026-04-19 | Ajout CLAUDE.md, intégration Google Sheets (service + API route), base de connaissances voix IA, page /knowledge |
| 2026-04-19 | Déploiement Vercel production : https://campagne-ia.vercel.app |

---

## Prochaines évolutions possibles
- Auth (NextAuth.js) avec rôles admin/manager/viewer
- Base de données réelle (PostgreSQL via Prisma)
- Enregistrement audio des appels + lecture dans le CRM
- Export Excel/CSV des rapports
- Multi-tenant (plusieurs organisations)
- Tableau de bord temps réel via WebSockets
