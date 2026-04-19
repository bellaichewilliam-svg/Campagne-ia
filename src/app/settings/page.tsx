'use client'

import { useState } from 'react'
import { Mic2, Key, Bell, Globe, Sliders, Save, Play, Volume2 } from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'

const VOICES = [
  { id: 'emma', name: 'Emma', lang: 'Français (FR)', gender: 'Féminin', preview: true },
  { id: 'lucas', name: 'Lucas', lang: 'Français (FR)', gender: 'Masculin', preview: true },
  { id: 'sophie', name: 'Sophie', lang: 'Français (FR)', gender: 'Féminin', preview: true },
  { id: 'marie', name: 'Marie', lang: 'Français (FR)', gender: 'Féminin', preview: true },
  { id: 'pierre', name: 'Pierre', lang: 'Français (FR)', gender: 'Masculin', preview: true },
]

const TABS = ['Voix IA', 'Intégrations API', 'Notifications', 'Général']

export default function SettingsPage() {
  const [tab, setTab] = useState('Voix IA')
  const [selectedVoice, setSelectedVoice] = useState('emma')
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(0)

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <PageHeader title="Paramètres" subtitle="Configuration de votre CRM voix IA" />

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Voix IA' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mic2 size={16} className="text-brand-600" /> Sélection de la voix
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {VOICES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={clsx(
                    'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                    selectedVoice === v.id
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <div className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                    selectedVoice === v.id ? 'bg-brand-600' : 'bg-gray-300'
                  )}>
                    {v.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{v.name}</p>
                    <p className="text-xs text-gray-500">{v.gender} · {v.lang}</p>
                  </div>
                  {selectedVoice === v.id && (
                    <button className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0" onClick={e => { e.stopPropagation() }}>
                      <Play size={12} className="text-brand-700" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Volume2 size={16} className="text-brand-600" /> Réglages de la voix
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Vitesse de parole</label>
                  <span className="text-xs text-brand-600 font-semibold">{speed.toFixed(1)}x</span>
                </div>
                <input
                  type="range" min={0.5} max={2.0} step={0.1}
                  value={speed}
                  onChange={e => setSpeed(parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Lent (0.5x)</span><span>Normal (1.0x)</span><span>Rapide (2.0x)</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Tonalité</label>
                  <span className="text-xs text-brand-600 font-semibold">{pitch >= 0 ? '+' : ''}{pitch}</span>
                </div>
                <input
                  type="range" min={-5} max={5} step={1}
                  value={pitch}
                  onChange={e => setPitch(parseInt(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>
            </div>
            <button className="mt-5 flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
              <Save size={15} /> Sauvegarder
            </button>
          </div>
        </div>
      )}

      {tab === 'Intégrations API' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Key size={16} className="text-brand-600" /> Clés API
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Clé API CampagneIA', value: 'cia_live_••••••••••••••••abc123', type: 'password' },
                { label: 'Webhook URL', value: 'https://votre-serveur.com/webhook', type: 'text' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <div className="flex gap-2">
                    <input
                      type={f.type}
                      defaultValue={f.value}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Copier</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Intégrations CRM</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: 'HubSpot', status: 'connected' },
                { name: 'Salesforce', status: 'disconnected' },
                { name: 'Pipedrive', status: 'disconnected' },
                { name: 'Zapier', status: 'connected' },
                { name: 'Make', status: 'disconnected' },
                { name: 'Slack', status: 'connected' },
              ].map(({ name, status }) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                  <span className="text-sm font-medium text-gray-800">{name}</span>
                  <span className={clsx(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full',
                    status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    {status === 'connected' ? 'Connecté' : 'Déconnecté'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'Notifications' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={16} className="text-brand-600" /> Alertes & notifications
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Campagne terminée', sublabel: 'Notification quand une campagne atteint 100%', checked: true },
              { label: 'Taux de conversion anormal', sublabel: 'Alerte si la conversion chute sous 10%', checked: true },
              { label: 'Erreur d\'appel critique', sublabel: 'Plus de 20% d\'appels en erreur', checked: false },
              { label: 'Rapport hebdomadaire', sublabel: 'Résumé chaque lundi matin par email', checked: true },
              { label: 'Nouveau lead converti', sublabel: 'Notification en temps réel', checked: false },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
                <input type="checkbox" defaultChecked={item.checked} className="mt-0.5 accent-brand-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
            <Save size={15} /> Sauvegarder
          </button>
        </div>
      )}

      {tab === 'Général' && (
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Sliders size={16} className="text-brand-600" /> Paramètres généraux
          </h3>
          {[
            { label: 'Nom de l\'organisation', value: 'Mon Entreprise SAS' },
            { label: 'Email de contact', value: 'contact@entreprise.fr' },
            { label: 'Fuseau horaire', value: 'Europe/Paris' },
            { label: 'Plages horaires d\'appel', value: '09:00 – 19:00' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
              <input defaultValue={f.value} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          ))}
          <button className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
            <Save size={15} /> Sauvegarder
          </button>
        </div>
      )}
    </div>
  )
}
