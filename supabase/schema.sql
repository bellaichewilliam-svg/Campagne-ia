-- ============================================================
-- CampagneIA — Schéma Supabase (PostgreSQL)
-- Coller dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- CAMPAIGNS
-- ─────────────────────────────────────────
create table if not exists campaigns (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  status           text not null default 'draft'
                     check (status in ('draft','active','paused','completed')),
  type             text not null default 'outbound'
                     check (type in ('outbound','inbound','retargeting')),
  voice_id         text,
  voice_name       text,
  voice_provider   text,
  script           text,
  objective        text,
  segments         text[] default '{}',
  daily_limit      integer default 200,
  scheduled_at     timestamptz,
  contacts_count   integer default 0,
  called_count     integer default 0,
  answered_count   integer default 0,
  converted_count  integer default 0,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- CONTACTS
-- ─────────────────────────────────────────
create table if not exists contacts (
  id               uuid primary key default gen_random_uuid(),
  first_name       text not null default '',
  last_name        text not null default '',
  phone            text not null,
  email            text default '',
  company          text default '',
  segment          text default 'Standard',
  status           text not null default 'prospect'
                     check (status in ('prospect','lead','client','inactif')),
  score            integer default 50 check (score >= 0 and score <= 100),
  last_contact     timestamptz,
  campaigns_count  integer default 0,
  notes            text default '',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- CAMPAIGN_CONTACTS (liaison M2M)
-- ─────────────────────────────────────────
create table if not exists campaign_contacts (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references campaigns(id) on delete cascade,
  contact_id   uuid not null references contacts(id) on delete cascade,
  added_at     timestamptz default now(),
  unique(campaign_id, contact_id)
);

-- ─────────────────────────────────────────
-- CALL LOGS
-- ─────────────────────────────────────────
create table if not exists call_logs (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid references contacts(id) on delete set null,
  campaign_id     uuid references campaigns(id) on delete set null,
  vapi_call_id    text unique,
  phone           text not null,
  contact_name    text default '',
  campaign_name   text default '',
  status          text not null default 'no_answer'
                    check (status in ('answered','voicemail','no_answer','busy','converted','failed')),
  duration        integer default 0,
  sentiment       text default 'neutral'
                    check (sentiment in ('positive','neutral','negative')),
  transcript      text,
  recording_url   text,
  notes           text default '',
  called_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- RETARGETING RULES
-- ─────────────────────────────────────────
create table if not exists retargeting_rules (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  trigger_event    text not null,
  delay_hours      integer default 24,
  campaign_id      uuid references campaigns(id) on delete set null,
  voice_id         text,
  voice_name       text,
  script           text,
  max_attempts     integer default 2,
  contacts_count   integer default 0,
  sent_count       integer default 0,
  status           text not null default 'active'
                     check (status in ('active','paused')),
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- KNOWLEDGE BASE
-- ─────────────────────────────────────────
create table if not exists knowledge_base (
  id          uuid primary key default gen_random_uuid(),
  category    text not null
                check (category in ('faq','product','objection','company','script')),
  title       text not null,
  content     text not null,
  campaigns   text[] default '{}',
  active      boolean default true,
  priority    integer default 2 check (priority in (1,2,3)),
  tags        text[] default '{}',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────────
create table if not exists settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz default now()
);

-- ─────────────────────────────────────────
-- Triggers updated_at
-- ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_campaigns_updated_at before update on campaigns
  for each row execute function update_updated_at();
create trigger trg_contacts_updated_at before update on contacts
  for each row execute function update_updated_at();
create trigger trg_knowledge_updated_at before update on knowledge_base
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- Données de démo initiales (knowledge base)
-- ─────────────────────────────────────────
insert into knowledge_base (category, title, content, active, priority, tags) values
  ('company',   'Présentation entreprise', 'Nous sommes CampagneIA, solution SaaS de marketing voix IA. Notre mission : automatiser vos campagnes d''appels tout en conservant une expérience humaine. Plus de 500 entreprises nous font confiance.', true, 1, array['présentation','entreprise']),
  ('faq',       'Comment fonctionne la voix IA ?', 'Notre voix IA utilise la synthèse vocale neuronale de dernière génération. Elle comprend les questions, gère les objections et adapte son discours en temps réel. Les appels respectent 100% le RGPD.', true, 1, array['voix','ia','technologie']),
  ('objection', 'Je n''ai pas le temps', 'Je comprends parfaitement — c''est justement pour ça que je vous appelle ! Notre solution vous fait gagner 15h/semaine. Je peux vous montrer en 5 minutes comment ça fonctionne, quand seriez-vous disponible ?', true, 1, array['objection','temps']),
  ('objection', 'C''est trop cher', 'Je comprends votre préoccupation. Nos clients constatent un ROI moyen de 4x en 3 mois. Moins de 0,10€ par appel. Puis-je vous préparer une simulation personnalisée ?', true, 1, array['objection','prix','budget']),
  ('faq',       'Conformité RGPD', 'Notre solution est 100% conforme au RGPD : consentement, droit d''opposition, suppression sur demande, données hébergées en UE. DPA disponible sur demande.', true, 2, array['rgpd','légal','conformité']),
  ('script',    'Introduction standard', 'Bonjour {{prénom}}, je suis Emma de {{entreprise}}. Je vous contacte car vous avez manifesté de l''intérêt pour nos services. Avez-vous quelques minutes ?', true, 1, array['introduction','script']),
  ('script',    'Clôture appel', 'Parfait {{prénom}}, je suis ravie de vous avoir parlé. Je vous envoie un récapitulatif par email avec les prochaines étapes. Passez une excellente journée !', true, 1, array['clôture','fin','script'])
on conflict do nothing;
