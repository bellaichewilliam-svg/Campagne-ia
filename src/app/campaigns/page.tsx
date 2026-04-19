'use client'

import { useState } from 'react'
import {
  Plus, Search, Filter, Megaphone, Play, Pause, Eye,
  Mic2, Users, PhoneCall, TrendingUp, X, ChevronDown
} from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import { campaigns, type Campaign, type CampaignStatus } from '@/lib/mockData'

const statusColors: Record<CampaignStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  draft: 'bg-blue-100 text-blue-700',
}

const statusLabels: Record<CampaignStatus, string> = {
  active: 'Actif',
  paused: 'En pause',
  completed: 'Terminé',
  draft: 'Brouillon',
}

const typeLabels = { outbound: 'Sortant', inbound: 'Entrant', retargeting: 'Retargeting' }

const VOICES = ['Emma (FR)', 'Lucas (FR)', 'Sophie (FR)', 'Marie (FR)', 'Pierre (FR)']

function ProgressBar({ value, max, color = 'bg-brand-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

function NewCampaignModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '', type: 'outbound', voice: 'Emma (FR)', objective: '', script: '',
    segments: '', scheduledAt: '', dailyLimit: '200',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nouvelle campagne</h2>
            <p className="text-xs text-gray-500 mt-0.5">Étape {step} sur 3</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex px-6 pt-4 gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={clsx('h-1 flex-1 rounded-full transition-colors', s <= step ? 'bg-brand-500' : 'bg-gray-100')} />
          ))}
        </div>

        <div className="p-6 space-y-4">
          {step === 1 && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la campagne *</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="ex: Relance Clients Avril 2026" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="outbound">Sortant</option>
                    <option value="inbound">Entrant</option>
                    <option value="retargeting">Retargeting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Voix IA</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.voice} onChange={e => set('voice', e.target.value)}>
                    {VOICES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Objectif</label>
                <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.objective} onChange={e => set('objective', e.target.value)}>
                  <option value="">Sélectionner...</option>
                  <option value="lead">Génération de leads</option>
                  <option value="sale">Vente directe</option>
                  <option value="survey">Enquête / Sondage</option>
                  <option value="reminder">Rappel / Relance</option>
                  <option value="support">Support client</option>
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Script de l'appel IA *</label>
                <textarea
                  rows={6}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Bonjour {{prénom}}, je m'appelle Emma de la société {{entreprise}}. Je vous contacte aujourd'hui pour..."
                  value={form.script}
                  onChange={e => set('script', e.target.value)}
                />
                <p className="text-[11px] text-gray-400 mt-1">Utilisez {'{{variable}}'} pour les champs dynamiques</p>
              </div>
              <div className="bg-brand-50 rounded-lg p-3 text-xs text-brand-700">
                <strong>Variables disponibles :</strong> {'{{prénom}}'} {'{{nom}}'} {'{{entreprise}}'} {'{{offre}}'} {'{{date}}'} {'{{agent}}'}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Segments / Listes</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="ex: Premium, Inactifs, Leads Q1" value={form.segments} onChange={e => set('segments', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date de lancement</label>
                  <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.scheduledAt} onChange={e => set('scheduledAt', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Limite quotidienne</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.dailyLimit} onChange={e => set('dailyLimit', e.target.value)} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Récapitulatif</p>
                {[
                  ['Nom', form.name || '—'],
                  ['Type', typeLabels[form.type as keyof typeof typeLabels] || '—'],
                  ['Voix IA', form.voice],
                  ['Segments', form.segments || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-gray-500">{k}</span>
                    <span className="font-medium text-gray-800">{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between px-6 py-4 border-t">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              Retour
            </button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
              Suivant
            </button>
          ) : (
            <button onClick={onClose} className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
              Lancer la campagne
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {showModal && <NewCampaignModal onClose={() => setShowModal(false)} />}

      <PageHeader
        title="Campagnes"
        subtitle="Gérez toutes vos campagnes voix IA"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
            <Plus size={16} />
            Nouvelle campagne
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
            placeholder="Rechercher une campagne..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'active', 'paused', 'completed', 'draft'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {s === 'all' ? 'Toutes' : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign cards */}
      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Megaphone size={18} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-gray-900">{c.name}</h3>
                  <span className={clsx('badge', statusColors[c.status])}>{statusLabels[c.status]}</span>
                  <span className="badge bg-gray-100 text-gray-600">{typeLabels[c.type]}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                  <Mic2 size={11} />
                  <span>{c.voice}</span>
                  <span className="mx-1">·</span>
                  <span>Créée le {c.createdAt}</span>
                  {c.scheduledAt && <><span className="mx-1">·</span><span>Lancée le {c.scheduledAt}</span></>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">Contacts</p>
                    <p className="text-sm font-semibold text-gray-800">{c.contacts.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">Appelés</p>
                    <p className="text-sm font-semibold text-gray-800">{c.called.toLocaleString()}</p>
                    <ProgressBar value={c.called} max={c.contacts} color="bg-brand-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">Taux d'ouverture</p>
                    <p className="text-sm font-semibold text-gray-800">{c.openRate}%</p>
                    <ProgressBar value={c.answered} max={c.called} color="bg-blue-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-1">Conversion</p>
                    <p className="text-sm font-semibold text-emerald-600">{c.conversionRate}%</p>
                    <ProgressBar value={c.converted} max={c.answered} color="bg-emerald-400" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {c.status === 'active' && (
                  <button className="w-8 h-8 rounded-lg bg-yellow-50 hover:bg-yellow-100 flex items-center justify-center transition-colors" title="Mettre en pause">
                    <Pause size={14} className="text-yellow-600" />
                  </button>
                )}
                {c.status === 'paused' && (
                  <button className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors" title="Reprendre">
                    <Play size={14} className="text-emerald-600" />
                  </button>
                )}
                <button className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors" title="Voir les détails">
                  <Eye size={14} className="text-gray-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card p-12 text-center">
            <Megaphone size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune campagne trouvée</p>
          </div>
        )}
      </div>
    </div>
  )
}
