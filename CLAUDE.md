# CampagneIA — CRM Marketing Voix IA

> Fichier de référence pour Claude Code. À lire en priorité à chaque session.
> **Mis à jour automatiquement à chaque modification significative.**

---

## Vue d'ensemble

CRM full-stack de campagnes marketing **voix IA** permettant de :
- Lancer des campagnes d'appels automatisés via voix IA (Vapi.ai)
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
| Base de données | Supabase (PostgreSQL) |
| Voix IA + Téléphonie | Vapi.ai (voix, appels, webhook) |
| Google Sheets | googleapis (google-auth-library) |
| Hébergement | Vercel |

---

## Architecture des dossiers

```
src/
├── app/
│   ├── page.tsx                      # Tableau de bord (KPIs, graphiques)
│   ├── campaigns/page.tsx            # Campagnes CRUD + launch Vapi
│   ├── contacts/page.tsx             # CRM contacts CRUD
│   ├── calls/page.tsx                # Journal appels temps réel
│   ├── retargeting/page.tsx          # Règles retargeting
│   ├── reports/page.tsx              # Rapports analytics
│   ├── knowledge/page.tsx            # Base de connaissances voix IA
│   ├── settings/page.tsx             # Config voix, téléphonie, Sheets, API
│   ├── globals.css
│   ├── layout.tsx
│   └── api/
│       ├── campaigns/route.ts         # GET/POST campagnes
│       ├── campaigns/[id]/route.ts    # GET/PATCH/DELETE campagne
│       ├── contacts/route.ts          # GET/POST contacts
│       ├── contacts/[id]/route.ts     # PATCH/DELETE contact
│       ├── calls/route.ts             # GET/POST appels
│       ├── retargeting/route.ts       # GET/POST/PATCH règles
│       ├── knowledge/route.ts         # GET/POST/PATCH/DELETE base de conn.
│       ├── leads/route.ts             # POST → push Google Sheets
│       ├── sheets-test/route.ts       # GET → test connexion Sheets
│       └── vapi/
│           ├── voices/route.ts        # GET liste des voix disponibles
│           ├── launch/route.ts        # POST → lance les appels Vapi
│           └── webhook/route.ts       # POST → reçoit events Vapi
├── components/
│   ├── Sidebar.tsx
│   ├── PageHeader.tsx
│   └── StatCard.tsx
└── lib/
    ├── supabase.ts        # Client Supabase + types TypeScript
    ├── vapi.ts            # Service Vapi.ai (voix, calls, webhook parser)
    ├── googleSheets.ts    # Service Google Sheets API v4
    └── voiceKnowledge.ts  # Fallback knowledge si Supabase indisponible
supabase/
└── schema.sql             # Schéma PostgreSQL complet à coller dans Supabase
```

---

## Flux complet d'un appel

```
1. Création campagne  →  POST /api/campaigns  →  Supabase
2. Ajout contacts     →  POST /api/contacts   →  Supabase
3. Lancement          →  POST /api/vapi/launch
       → createVapiAssistant (script + knowledge base injectée)
       → launchCall pour chaque contact (Vapi API)
       → call_logs enregistré en Supabase (status: no_answer)
4. Appel en cours     →  Webhook POST /api/vapi/webhook
       → type=call-started  → status: answered
       → type=call-ended    → duration, transcript, sentiment, recording_url
                            → mise à jour score contact
                            → si converti → POST /api/leads → Google Sheets
5. Consultation       →  Pages calls, reports avec données Supabase réelles
```

---

## Intégration Vapi.ai

### Connexion téléphonique
- **Pas besoin de compte SIP** — Vapi.ai fournit la téléphonie via Twilio/Vonage
- Achat d'un numéro français (+33) directement dans Vapi Dashboard → Phone Numbers
- `VAPI_PHONE_NUMBER_ID` = l'ID du numéro acheté

### Voix disponibles (src/lib/vapi.ts)
- **ElevenLabs** : Rachel, Domi, Bella, Antoni, Elli, Josh, Arnold, Adam, Sam
- **OpenAI TTS** : Alloy, Echo, Fable, Onyx, Nova, Shimmer
- **Azure Neural** : Denise, Henri, Yvette, Alain, Brigitte (fr-FR)

### Webhook
URL à configurer dans Vapi Dashboard → Settings → Server URL :
`https://campagne-ia.vercel.app/api/vapi/webhook`

Événements gérés : `call-started`, `call-ended`, `transcript`

---

## Intégration Google Sheets

### Flux
```
Appel converti (webhook call-ended + interested=true)
  → POST /api/leads { campaignName, contact, call }
  → src/lib/googleSheets.ts → appendLead()
  → Onglet "{NomCampagne}" créé auto avec en-têtes
  → Colonnes : Date | Prénom | Nom | Téléphone | Email | Entreprise | Segment | Campagne | Statut | Durée | Sentiment | Notes
```

### Variables requises
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@projet.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SPREADSHEET_ID=<id-du-sheet>
```

---

## Base de données Supabase

### Tables
| Table | Rôle |
|-------|------|
| `campaigns` | Campagnes avec stats agrégées |
| `contacts` | CRM contacts avec score |
| `campaign_contacts` | Liaison M2M campagne ↔ contact |
| `call_logs` | Journal appels (vapi_call_id, transcript, recording_url) |
| `retargeting_rules` | Règles de relance automatique |
| `knowledge_base` | Base de connaissances voix IA |
| `settings` | Paramètres de l'application |

### Setup
1. Créer un projet sur supabase.com
2. Éditeur SQL → coller `supabase/schema.sql` → Exécuter
3. Settings → API → copier URL + anon key + service_role key
4. Ajouter dans Vercel Environment Variables

---

## Variables d'environnement complètes

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Vapi.ai
VAPI_API_KEY=vapi_xxx
VAPI_PHONE_NUMBER_ID=uuid
VAPI_ASSISTANT_ID=uuid (optionnel)

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@projet.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SPREADSHEET_ID=xxx

# App
NEXT_PUBLIC_APP_URL=https://campagne-ia.vercel.app
```

---

## Commandes utiles

```bash
npm run dev       # Développement (http://localhost:3000)
npm run build     # Build production
npm run lint      # ESLint
```

---

## URLs de production

- **App** : https://campagne-ia.vercel.app
- **Webhook Vapi** : https://campagne-ia.vercel.app/api/vapi/webhook
- **Knowledge API** : https://campagne-ia.vercel.app/api/knowledge
- **Leads API** : https://campagne-ia.vercel.app/api/leads

---

## Historique des modifications

| Date | Description |
|------|-------------|
| 2026-04-19 | Création initiale : dashboard, campagnes, contacts, appels, retargeting, rapports, paramètres |
| 2026-04-19 | CLAUDE.md, Google Sheets service, base de connaissances voix IA, page /knowledge |
| 2026-04-19 | Déploiement Vercel : https://campagne-ia.vercel.app |
| 2026-04-19 | Refonte complète : Supabase (DB réelle), Vapi.ai (voix + téléphonie + webhook), CRUD complet, données temps réel |
