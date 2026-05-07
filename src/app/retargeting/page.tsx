'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, RefreshCw, Play, Pause, Trash2, X, ChevronRight, Users, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import type { RetargetingRule } from '@/lib/supabase'

const triggerOptions = [
  'Pas de réponse après 24h', 'Pas de réponse après 48h',
  'Messagerie vocale laissée', 'Appel répondu sans conversion',
  'Aucun contact depuis 30 jours', 'Aucun contact depuis 60 jours',
  'Panier abandonné', 'Formulaire non complété',
]

function delayLabel(hours: number) {
  if (hours < 1)  return 'Immédiat'
  if (hours < 24) return `${hours}h`
  if (hours < 168) return `${Math.round(hours / 24)} jour${hours / 24 > 1 ? 's' : ''}`
  return `${Math.round(hours / 168)} semaine${hours / 168 > 1 ? 's' : ''}`
}

function NewRuleModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', trigger_event: '', delay_hours: '24', script: '', max_attempts: '2' })

  const submit = async () => {
    if (!form.name || !form.trigger_event) return
    setLoading(true)
    try {
      await fetch('/api/retargeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, delay_hours: parseInt(form.delay_hours), max_attempts: parseInt(form.max_attempts), status: 'active' }),
      })
      onCreated()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nouvelle règle de retargeting</h2>
            <p className="text-xs text-gray-500 mt-0.5">Automatisez vos relances intelligentes</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la règle *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="ex: Relance non-réponse J+2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Déclencheur *</label>
            <select value={form.trigger_event} onChange={e => setForm(f => ({ ...f, trigger_event: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Sélectionner un déclencheur...</option>
              {triggerOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Délai (heures)</label>
              <input type="number" value={form.delay_hours} onChange={e => setForm(f => ({ ...f, delay_hours: e.target.value }))} min={0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max relances / contact</label>
              <input type="number" value={form.max_attempts} onChange={e => setForm(f => ({ ...f, max_attempts: e.target.value }))} min={1} max={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Script de relance</label>
            <textarea rows={3} value={form.script} onChange={e => setForm(f => ({ ...f, script: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="Bonjour {{prénom}}, je vous rappelle suite à notre dernier contact..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={submit} disabled={loading || !form.name || !form.trigger_event} className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />} Créer la règle
          </button>
        </div>
      </div>
    </div>
  )
}

export default function RetargetingPage() {
  const [rules, setRules] = useState<RetargetingRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/retargeting').then(r => r.json())
      .then(d => setRules(Array.isArray(d) ? d : []))
      .catch(() => setRules([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (rule: RetargetingRule) => {
    const newStatus = rule.status === 'active' ? 'paused' : 'active'
    setRules(rs => rs.map(r => r.id === rule.id ? { ...r, status: newStatus } : r))
    await fetch('/api/retargeting', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: rule.id, status: newStatus }) })
  }

  const activeCount  = rules.filter(r => r.status === 'active').length
  const totalContacts = rules.reduce((s, r) => s + (r.contacts_count ?? 0), 0)
  const totalSent     = rules.reduce((s, r) => s + (r.sent_count ?? 0), 0)

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {showModal && <NewRuleModal onClose={() => setShowModal(false)} onCreated={load} />}

      <PageHeader
        title="Retargeting automatique"
        subtitle="Relancez automatiquement les contacts selon des règles intelligentes"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
            <Plus size={16} /> Nouvelle règle
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Règles actives', value: activeCount.toString(), icon: RefreshCw, color: 'text-brand-600', bg: 'bg-brand-50' },
          { label: 'Contacts ciblés', value: totalContacts.toLocaleString('fr'), icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Relances envoyées', value: totalSent.toLocaleString('fr'), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total règles', value: rules.length.toString(), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={clsx('w-5 h-5', color)} size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{loading ? '…' : value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-6 bg-gradient-to-r from-brand-50 to-purple-50 border-brand-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Comment fonctionne le retargeting voix IA ?</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {['Appel initial', '', 'Déclencheur détecté', '', 'Délai configuré', '', 'Relance automatique', '', 'Conversion'].map((label, i) =>
            label ? (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white border border-brand-200 flex items-center justify-center">
                  {i === 0 ? <RefreshCw size={16} className="text-brand-600" /> : i === 2 ? <Clock size={16} className="text-brand-600" /> : i === 4 ? <Clock size={16} className="text-brand-600" /> : i === 6 ? <RefreshCw size={16} className="text-brand-600" /> : <CheckCircle2 size={16} className="text-brand-600" />}
                </div>
                <span className="text-[10px] text-gray-500 text-center w-16">{label}</span>
              </div>
            ) : <ChevronRight key={i} size={16} className="text-brand-300 mb-4" />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 size={20} className="animate-spin" /> Chargement...
        </div>
      ) : rules.length === 0 ? (
        <div className="card p-12 text-center">
          <RefreshCw size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune règle de retargeting</p>
          <p className="text-sm text-gray-400 mt-1">Créez votre première règle pour relancer automatiquement les contacts</p>
          <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
            Créer une règle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule.id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', rule.status === 'active' ? 'bg-emerald-50' : 'bg-gray-100')}>
                  <RefreshCw size={18} className={rule.status === 'active' ? 'text-emerald-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900">{rule.name}</h3>
                    <span className={clsx('badge', rule.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                      {rule.status === 'active' ? 'Actif' : 'En pause'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />{rule.trigger_event}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Clock size={11} className="text-gray-400" />{delayLabel(rule.delay_hours)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <RefreshCw size={11} className="text-gray-400" />Max {rule.max_attempts} relances
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-3">
                    <div><p className="text-[11px] text-gray-400">Contacts</p><p className="text-sm font-semibold">{(rule.contacts_count ?? 0).toLocaleString()}</p></div>
                    <div><p className="text-[11px] text-gray-400">Envois</p><p className="text-sm font-semibold">{(rule.sent_count ?? 0).toLocaleString()}</p></div>
                    {(rule.contacts_count ?? 0) > 0 && (
                      <div>
                        <p className="text-[11px] text-gray-400">Progression</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, Math.round((rule.sent_count ?? 0) / (rule.contacts_count ?? 1) * 100))}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{Math.round((rule.sent_count ?? 0) / (rule.contacts_count ?? 1) * 100)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggle(rule)} className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', rule.status === 'active' ? 'bg-yellow-50 hover:bg-yellow-100' : 'bg-emerald-50 hover:bg-emerald-100')}>
                    {rule.status === 'active' ? <Pause size={14} className="text-yellow-600" /> : <Play size={14} className="text-emerald-600" />}
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
