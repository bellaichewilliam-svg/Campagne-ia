'use client'

import { useState } from 'react'
import { Plus, RefreshCw, Play, Pause, Trash2, X, ChevronRight, Users, Clock, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import { retargetingRules, type RetargetingRule } from '@/lib/mockData'

const triggerOptions = [
  'Pas de réponse après 24h',
  'Pas de réponse après 48h',
  'Messagerie vocale laissée',
  'Appel répondu sans conversion',
  'Aucun contact depuis 30 jours',
  'Aucun contact depuis 60 jours',
  'Aucun contact depuis 90 jours',
  'Panier abandonné',
  'Formulaire non complété',
]

const delayOptions = [
  'Immédiat', '1 heure', '3 heures', '6 heures',
  '1 jour', '2 jours', '3 jours', '5 jours', '7 jours', '14 jours', '30 jours',
]

const funnelStats = [
  { label: 'Règles actives', value: '3', icon: RefreshCw, color: 'text-brand-600', bg: 'bg-brand-50' },
  { label: 'Contacts ciblés', value: '1 678', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Envois ce mois', value: '664', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Taux de succès', value: '28.4%', icon: CheckCircle2, color: 'text-orange-600', bg: 'bg-orange-50' },
]

function NewRuleModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">Nouvelle règle de retargeting</h2>
            <p className="text-xs text-gray-500 mt-0.5">Automatisez vos relances intelligentes</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la règle *</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="ex: Relance non-réponse J+2" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Déclencheur *</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Sélectionner un déclencheur...</option>
              {triggerOptions.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Délai</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                {delayOptions.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Voix IA</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                <option>Emma (FR)</option>
                <option>Lucas (FR)</option>
                <option>Sophie (FR)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Campagne cible</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="">Toutes les campagnes</option>
              <option>Relance Clients Inactifs Q2</option>
              <option>Promo Printemps 2026</option>
              <option>Upsell Premium</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Script de relance</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" placeholder="Bonjour {{prénom}}, je vous rappelle suite à notre dernier contact..." />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Limite de relances par contact</label>
            <input type="number" defaultValue={2} min={1} max={5} className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={onClose} className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">Créer la règle</button>
        </div>
      </div>
    </div>
  )
}

export default function RetargetingPage() {
  const [rules, setRules] = useState<RetargetingRule[]>(retargetingRules)
  const [showModal, setShowModal] = useState(false)

  const toggle = (id: string) =>
    setRules(rs => rs.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'paused' : 'active' } : r))

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {showModal && <NewRuleModal onClose={() => setShowModal(false)} />}

      <PageHeader
        title="Retargeting automatique"
        subtitle="Relancez automatiquement les contacts selon des règles intelligentes"
        action={
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
            <Plus size={16} />
            Nouvelle règle
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {funnelStats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center gap-3">
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={clsx('w-5 h-5', color)} size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div className="card p-5 mb-6 bg-gradient-to-r from-brand-50 to-purple-50 border-brand-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Comment fonctionne le retargeting voix IA ?</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { icon: PhoneCallIcon, label: 'Appel initial' },
            { icon: ArrowIcon, label: '' },
            { icon: TriggerIcon, label: 'Déclencheur détecté' },
            { icon: ArrowIcon, label: '' },
            { icon: ClockIcon, label: 'Délai configuré' },
            { icon: ArrowIcon, label: '' },
            { icon: RefreshCw, label: 'Relance automatique' },
            { icon: ArrowIcon, label: '' },
            { icon: CheckCircle2, label: 'Conversion' },
          ].map(({ icon: Icon, label }, i) =>
            label ? (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-white border border-brand-200 flex items-center justify-center">
                  <Icon size={16} className="text-brand-600" />
                </div>
                <span className="text-[10px] text-gray-500 text-center w-16">{label}</span>
              </div>
            ) : (
              <ChevronRight key={i} size={16} className="text-brand-300 mb-4" />
            )
          )}
        </div>
      </div>

      {/* Rules list */}
      <div className="space-y-3">
        {rules.map(rule => (
          <div key={rule.id} className="card p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                rule.status === 'active' ? 'bg-emerald-50' : 'bg-gray-100'
              )}>
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
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    {rule.trigger}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock size={11} className="text-gray-400" />
                    {rule.delay}
                  </div>
                </div>

                <div className="flex items-center gap-6 mt-3">
                  <div>
                    <p className="text-[11px] text-gray-400">Contacts ciblés</p>
                    <p className="text-sm font-semibold text-gray-800">{rule.contacts.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Envois effectués</p>
                    <p className="text-sm font-semibold text-gray-800">{rule.sent.toLocaleString()}</p>
                  </div>
                  {rule.sent > 0 && (
                    <div>
                      <p className="text-[11px] text-gray-400">Progression</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.round(rule.sent / rule.contacts * 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{Math.round(rule.sent / rule.contacts * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => toggle(rule.id)}
                  className={clsx(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                    rule.status === 'active'
                      ? 'bg-yellow-50 hover:bg-yellow-100'
                      : 'bg-emerald-50 hover:bg-emerald-100'
                  )}
                >
                  {rule.status === 'active'
                    ? <Pause size={14} className="text-yellow-600" />
                    : <Play size={14} className="text-emerald-600" />}
                </button>
                <button className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Mini inline icon helpers to avoid import clutter
function PhoneCallIcon({ size, className }: { size: number; className?: string }) {
  return <RefreshCw size={size} className={className} />
}
function ArrowIcon({ size, className }: { size: number; className?: string }) {
  return <ChevronRight size={size} className={className} />
}
function TriggerIcon({ size, className }: { size: number; className?: string }) {
  return <Clock size={size} className={className} />
}
function ClockIcon({ size, className }: { size: number; className?: string }) {
  return <Clock size={size} className={className} />
}
