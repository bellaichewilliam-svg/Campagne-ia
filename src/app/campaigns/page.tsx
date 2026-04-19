'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Megaphone, Play, Pause, Eye, Mic2,
  Loader2, Rocket, Trash2, X, AlertCircle
} from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import type { Campaign } from '@/lib/supabase'
import type { VapiVoice } from '@/lib/vapi'

const statusColors = {
  active:    'bg-emerald-100 text-emerald-700',
  paused:    'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  draft:     'bg-blue-100 text-blue-700',
}
const statusLabels = { active: 'Actif', paused: 'En pause', completed: 'Terminé', draft: 'Brouillon' }
const typeLabels   = { outbound: 'Sortant', inbound: 'Entrant', retargeting: 'Retargeting' }

function ProgressBar({ value, max, color = 'bg-brand-500' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={clsx('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-gray-400 w-8 text-right">{pct}%</span>
    </div>
  )
}

function NewCampaignModal({ voices, onClose, onCreated }: { voices: VapiVoice[]; onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', type: 'outbound', voice_id: '', voice_name: '', voice_provider: '',
    objective: '', script: '', segments: '', scheduled_at: '', daily_limit: '200',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const selectVoice = (v: VapiVoice) => set('voice_id', v.id) ||
    setForm(f => ({ ...f, voice_id: v.id, voice_name: v.name, voice_provider: v.provider }))

  const selectedVoice = voices.find(v => v.id === form.voice_id)

  const submit = async () => {
    if (!form.name.trim()) { setError('Le nom est requis'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          voice_id: form.voice_id,
          voice_name: form.voice_name,
          voice_provider: form.voice_provider,
          objective: form.objective,
          script: form.script,
          segments: form.segments ? form.segments.split(',').map(s => s.trim()) : [],
          daily_limit: parseInt(form.daily_limit) || 200,
          scheduled_at: form.scheduled_at || null,
          status: 'draft',
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nouvelle campagne</h2>
            <p className="text-xs text-gray-500 mt-0.5">Étape {step} sur 3</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
        </div>

        <div className="flex px-6 pt-4 gap-2 flex-shrink-0">
          {[1, 2, 3].map(s => (
            <div key={s} className={clsx('h-1 flex-1 rounded-full transition-colors', s <= step ? 'bg-brand-500' : 'bg-gray-100')} />
          ))}
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm">
              <AlertCircle size={15} />{error}
            </div>
          )}

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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Objectif</label>
                  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.objective} onChange={e => set('objective', e.target.value)}>
                    <option value="">Sélectionner...</option>
                    <option value="lead">Génération de leads</option>
                    <option value="sale">Vente directe</option>
                    <option value="survey">Enquête / Sondage</option>
                    <option value="reminder">Rappel / Relance</option>
                  </select>
                </div>
              </div>

              {/* Sélection voix */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Voix IA *</label>
                {voices.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 size={14} className="animate-spin" /> Chargement des voix...</div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                      {voices.map(v => (
                        <button
                          key={v.id}
                          onClick={() => selectVoice(v)}
                          className={clsx(
                            'flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all',
                            form.voice_id === v.id ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0', form.voice_id === v.id ? 'bg-brand-600' : 'bg-gray-300')}>
                            {v.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{v.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{v.gender} · {v.provider}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    {selectedVoice && (
                      <p className="text-xs text-brand-600 mt-2 flex items-center gap-1">
                        <Mic2 size={11} /> Voix sélectionnée : <strong>{selectedVoice.name}</strong> ({selectedVoice.provider})
                      </p>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Script de l'appel IA *</label>
                <textarea
                  rows={8}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  placeholder="Bonjour {{prénom}}, je m'appelle Emma. Je vous contacte aujourd'hui pour vous présenter notre offre..."
                  value={form.script}
                  onChange={e => set('script', e.target.value)}
                />
                <p className="text-[11px] text-gray-400 mt-1">Variables : {'{{prénom}}'} {'{{nom}}'} {'{{entreprise}}'}</p>
              </div>
              <div className="bg-brand-50 rounded-lg p-3 text-xs text-brand-700">
                <strong>Conseil :</strong> Soyez naturel et concis. La voix IA consultera automatiquement votre base de connaissances pour répondre aux questions.
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Segments / Listes (séparés par virgule)</label>
                <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="Premium, Inactifs, Leads Q1" value={form.segments} onChange={e => set('segments', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Date de lancement</label>
                  <input type="datetime-local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Limite quotidienne</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.daily_limit} onChange={e => set('daily_limit', e.target.value)} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-700">Récapitulatif</p>
                {[['Nom', form.name || '—'], ['Type', typeLabels[form.type as keyof typeof typeLabels] || '—'], ['Voix IA', selectedVoice ? `${selectedVoice.name} (${selectedVoice.provider})` : '—'], ['Segments', form.segments || 'Tous']].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs"><span className="text-gray-500">{k}</span><span className="font-medium text-gray-800">{v}</span></div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between px-6 py-4 border-t flex-shrink-0">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Retour</button>
          ) : <div />}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">Suivant</button>
          ) : (
            <button onClick={submit} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60">
              {loading && <Loader2 size={14} className="animate-spin" />}
              Créer la campagne
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [voices, setVoices] = useState<VapiVoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [launching, setLaunching] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [campsRes, voicesRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/vapi/voices'),
      ])
      setCampaigns(await campsRes.json())
      setVoices(await voicesRes.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/campaigns/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    load()
  }

  const launch = async (id: string) => {
    setLaunching(id)
    try {
      const res = await fetch('/api/vapi/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      alert(`✅ ${data.launched} appel(s) lancé(s) avec succès !`)
      load()
    } catch (err) {
      alert(`❌ ${err instanceof Error ? err.message : 'Erreur lors du lancement'}`)
    } finally {
      setLaunching(null)
    }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Supprimer cette campagne ?')) return
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    load()
  }

  const filtered = campaigns.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const openRate = (c: Campaign) => c.called_count > 0
    ? ((c.answered_count / c.called_count) * 100).toFixed(1)
    : '0.0'
  const convRate = (c: Campaign) => c.answered_count > 0
    ? ((c.converted_count / c.answered_count) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {showModal && <NewCampaignModal voices={voices} onClose={() => setShowModal(false)} onCreated={load} />}

      <PageHeader
        title="Campagnes"
        subtitle="Gérez et lancez vos campagnes voix IA"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
            <Plus size={16} /> Nouvelle campagne
          </button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'active', 'paused', 'completed', 'draft'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)} className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', filter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {s === 'all' ? 'Toutes' : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-brand-500" size={28} />
        </div>
      ) : (
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
                  {c.voice_name && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      <Mic2 size={11} />
                      <span>{c.voice_name} ({c.voice_provider})</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Contacts</p>
                      <p className="text-sm font-semibold text-gray-800">{c.contacts_count.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Appelés</p>
                      <p className="text-sm font-semibold text-gray-800">{c.called_count.toLocaleString()}</p>
                      <ProgressBar value={c.called_count} max={c.contacts_count} color="bg-brand-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Taux d'ouverture</p>
                      <p className="text-sm font-semibold text-gray-800">{openRate(c)}%</p>
                      <ProgressBar value={c.answered_count} max={c.called_count} color="bg-blue-400" />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Conversion</p>
                      <p className="text-sm font-semibold text-emerald-600">{convRate(c)}%</p>
                      <ProgressBar value={c.converted_count} max={c.answered_count} color="bg-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {(c.status === 'draft' || c.status === 'paused') && (
                    <button
                      onClick={() => launch(c.id)}
                      disabled={launching === c.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                    >
                      {launching === c.id ? <Loader2 size={12} className="animate-spin" /> : <Rocket size={12} />}
                      Lancer
                    </button>
                  )}
                  {c.status === 'active' && (
                    <button onClick={() => updateStatus(c.id, 'paused')} className="w-8 h-8 rounded-lg bg-yellow-50 hover:bg-yellow-100 flex items-center justify-center" title="Pause">
                      <Pause size={14} className="text-yellow-600" />
                    </button>
                  )}
                  {c.status === 'paused' && (
                    <button onClick={() => updateStatus(c.id, 'active')} className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center" title="Reprendre">
                      <Play size={14} className="text-emerald-600" />
                    </button>
                  )}
                  <button onClick={() => deleteCampaign(c.id)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && !loading && (
            <div className="card p-12 text-center">
              <Megaphone size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucune campagne — créez-en une !</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
