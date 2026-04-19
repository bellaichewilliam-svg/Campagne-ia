'use client'

import { useState, useEffect } from 'react'
import { Mic2, Key, Bell, Sliders, Save, Play, Volume2, Sheet, CheckCircle2, XCircle, Loader2, Phone } from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import type { VapiVoice } from '@/lib/vapi'

const TABS = ['Voix IA', 'Téléphonie', 'Google Sheets', 'Intégrations API', 'Notifications', 'Général']

export default function SettingsPage() {
  const [tab, setTab] = useState('Voix IA')
  const [voices, setVoices] = useState<VapiVoice[]>([])
  const [loadingVoices, setLoadingVoices] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState<VapiVoice | null>(null)
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(0)
  const [filterProvider, setFilterProvider] = useState('all')

  // Google Sheets
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [sheetTestStatus, setSheetTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [sheetTestMsg, setSheetTestMsg] = useState('')

  useEffect(() => {
    fetch('/api/vapi/voices')
      .then(r => r.json())
      .then((v: VapiVoice[]) => { setVoices(v); setSelectedVoice(v[0] ?? null) })
      .finally(() => setLoadingVoices(false))
  }, [])

  const providers = ['all', ...Array.from(new Set(voices.map(v => v.provider)))]
  const filteredVoices = filterProvider === 'all' ? voices : voices.filter(v => v.provider === filterProvider)

  const testSheets = async () => {
    setSheetTestStatus('loading')
    try {
      const res = await fetch('/api/sheets-test')
      const data = await res.json()
      setSheetTestStatus(data.ok ? 'ok' : 'error')
      setSheetTestMsg(data.ok ? `Connecté : "${data.sheetTitle}"` : (data.error ?? 'Échec'))
    } catch {
      setSheetTestStatus('error')
      setSheetTestMsg('Erreur réseau')
    }
  }

  return (
    <div className="p-6 max-w-[1000px] mx-auto">
      <PageHeader title="Paramètres" subtitle="Configuration complète de votre CRM voix IA" />

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={clsx('px-3 py-2 text-sm font-medium rounded-lg transition-colors', tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            {t}
          </button>
        ))}
      </div>

      {/* ── VOIX IA ── */}
      {tab === 'Voix IA' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Mic2 size={16} className="text-brand-600" /> Voix disponibles
            </h3>

            {loadingVoices ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                <Loader2 size={16} className="animate-spin" /> Chargement des voix Vapi.ai...
              </div>
            ) : (
              <>
                {/* Filtre par provider */}
                <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
                  {providers.map(p => (
                    <button key={p} onClick={() => setFilterProvider(p)} className={clsx('px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors', filterProvider === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500')}>
                      {p === 'all' ? 'Toutes' : p === '11labs' ? 'ElevenLabs' : p === 'openai' ? 'OpenAI' : p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                  {filteredVoices.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v)}
                      className={clsx('flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all', selectedVoice?.id === v.id ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}
                    >
                      <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', selectedVoice?.id === v.id ? 'bg-brand-600' : 'bg-gray-300')}>
                        {v.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{v.name}</p>
                        <p className="text-[11px] text-gray-400">{v.gender} · {v.provider === '11labs' ? 'ElevenLabs' : v.provider}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {selectedVoice && (
                  <div className="mt-4 p-3 bg-brand-50 rounded-xl flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-semibold text-brand-800">{selectedVoice.name}</span>
                      <span className="text-brand-600 ml-2">· {selectedVoice.gender} · {selectedVoice.provider === '11labs' ? 'ElevenLabs' : selectedVoice.provider}</span>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700">
                      <Play size={11} /> Aperçu
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Volume2 size={16} className="text-brand-600" /> Réglages
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Vitesse de parole</label>
                  <span className="text-xs text-brand-600 font-semibold">{speed.toFixed(1)}x</span>
                </div>
                <input type="range" min={0.5} max={2.0} step={0.1} value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} className="w-full accent-brand-600" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>Lent (0.5x)</span><span>Normal (1.0x)</span><span>Rapide (2.0x)</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">Tonalité</label>
                  <span className="text-xs text-brand-600 font-semibold">{pitch >= 0 ? '+' : ''}{pitch}</span>
                </div>
                <input type="range" min={-5} max={5} step={1} value={pitch} onChange={e => setPitch(parseInt(e.target.value))} className="w-full accent-brand-600" />
              </div>
            </div>
            <button className="mt-5 flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
              <Save size={15} /> Sauvegarder
            </button>
          </div>
        </div>
      )}

      {/* ── TÉLÉPHONIE ── */}
      {tab === 'Téléphonie' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <Phone size={16} className="text-brand-600" /> Opérateur téléphonique
            </h3>
            <p className="text-xs text-gray-500 mb-5">Vapi.ai gère la téléphonie via Twilio ou Vonage. Vous n'avez <strong>pas besoin de compte SIP séparé</strong> — Vapi fournit les numéros de téléphone directement.</p>

            <div className="bg-brand-50 rounded-xl p-4 mb-5 space-y-2 text-xs text-gray-700">
              <p className="font-semibold text-gray-800">Configuration en 3 étapes :</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Créer un compte sur <strong>vapi.ai</strong> → obtenir votre clé API</li>
                <li>Dans Vapi Dashboard → <strong>Phone Numbers</strong> → acheter ou importer un numéro français (+33)</li>
                <li>Copier le <strong>Phone Number ID</strong> dans les variables ci-dessous</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Clé API Vapi</label>
                <input type="password" defaultValue="" placeholder="vapi_xxxxxxxxxxxxxxxxxxxxxxxx" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <p className="text-[11px] text-gray-400 mt-1">Variable d'env : <code className="bg-gray-100 px-1 rounded">VAPI_API_KEY</code></p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID du numéro de téléphone</label>
                <input type="text" defaultValue="" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <p className="text-[11px] text-gray-400 mt-1">Variable d'env : <code className="bg-gray-100 px-1 rounded">VAPI_PHONE_NUMBER_ID</code></p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID de l'assistant par défaut (optionnel)</label>
                <input type="text" defaultValue="" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
                <p className="text-[11px] text-gray-400 mt-1">Variable d'env : <code className="bg-gray-100 px-1 rounded">VAPI_ASSISTANT_ID</code></p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Webhook Vapi → CampagneIA</h3>
            <p className="text-xs text-gray-500 mb-3">Configurez ce webhook dans Vapi Dashboard → Settings → Server URL pour recevoir les résultats d'appels en temps réel :</p>
            <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm text-emerald-400">
              https://campagne-ia.vercel.app/api/vapi/webhook
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Ce webhook met à jour automatiquement : statut appel, transcription, sentiment, score contact, Google Sheets.</p>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Variables d'environnement (Vercel)</h3>
            <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
              <p><span className="text-gray-500"># Vapi.ai</span></p>
              <p>VAPI_API_KEY=vapi_xxxxxxx</p>
              <p>VAPI_PHONE_NUMBER_ID=uuid-du-numero</p>
              <p>VAPI_ASSISTANT_ID=uuid-assistant (optionnel)</p>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Ajoutez ces variables dans Vercel → votre projet → Settings → Environment Variables.</p>
          </div>
        </div>
      )}

      {/* ── GOOGLE SHEETS ── */}
      {tab === 'Google Sheets' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <Sheet size={16} className="text-emerald-600" /> Connexion Google Sheets
            </h3>
            <p className="text-xs text-gray-500 mb-5">Les leads convertis arrivent automatiquement dans votre Google Sheet, un onglet par campagne.</p>

            <div className="bg-brand-50 rounded-xl p-4 mb-5 space-y-1 text-xs text-gray-600">
              <p className="font-semibold text-gray-800 mb-2">Configuration :</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Aller sur <strong>console.cloud.google.com</strong> → Nouveau projet</li>
                <li>Activer l'API <strong>Google Sheets</strong></li>
                <li>IAM → Compte de service → Créer → Télécharger le JSON</li>
                <li>Partager votre Google Sheet avec l'email du compte de service</li>
                <li>Renseigner les variables d'env ci-dessous dans Vercel</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID du Spreadsheet</label>
                <div className="flex gap-2">
                  <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" value={spreadsheetId} onChange={e => setSpreadsheetId(e.target.value)} />
                  <button onClick={testSheets} disabled={sheetTestStatus === 'loading'} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    {sheetTestStatus === 'loading' && <Loader2 size={14} className="animate-spin" />}
                    {sheetTestStatus === 'ok' && <CheckCircle2 size={14} className="text-emerald-600" />}
                    {sheetTestStatus === 'error' && <XCircle size={14} className="text-red-500" />}
                    {sheetTestStatus === 'idle' && <Sheet size={14} />}
                    Tester
                  </button>
                </div>
                {sheetTestMsg && (
                  <p className={clsx('text-xs mt-1.5 flex items-center gap-1', sheetTestStatus === 'ok' ? 'text-emerald-600' : 'text-red-500')}>
                    {sheetTestStatus === 'ok' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {sheetTestMsg}
                  </p>
                )}
              </div>

              <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
                <p><span className="text-gray-500"># Google Sheets</span></p>
                <p>GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@projet.iam.gserviceaccount.com</p>
                <p>GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."</p>
                <p>GOOGLE_SPREADSHEET_ID={spreadsheetId || '<votre-id>'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INTÉGRATIONS API ── */}
      {tab === 'Intégrations API' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Key size={16} className="text-brand-600" /> Clés API
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Clé API CampagneIA', value: 'cia_live_••••••••abc123', type: 'password' },
                { label: 'Webhook URL entrant', value: 'https://campagne-ia.vercel.app/api/vapi/webhook', type: 'text' },
              ].map(f => (
                <div key={f.label}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <div className="flex gap-2">
                    <input type={f.type} defaultValue={f.value} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
                    <button className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">Copier</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Intégrations CRM</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[['HubSpot','connected'],['Salesforce','disconnected'],['Pipedrive','disconnected'],['Zapier','connected'],['Make','disconnected'],['Slack','connected']].map(([name, status]) => (
                <div key={name} className="flex items-center justify-between p-3 rounded-xl border border-gray-200">
                  <span className="text-sm font-medium text-gray-800">{name}</span>
                  <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                    {status === 'connected' ? 'Connecté' : 'Off'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'Notifications' && (
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Bell size={16} className="text-brand-600" /> Alertes
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Campagne terminée', sub: 'Notification quand 100% des contacts sont appelés', checked: true },
              { label: 'Taux de conversion anormal', sub: 'Alerte si conversion < 10%', checked: true },
              { label: 'Erreur d\'appel critique', sub: '> 20% d\'appels en erreur', checked: false },
              { label: 'Rapport hebdomadaire', sub: 'Résumé chaque lundi par email', checked: true },
              { label: 'Nouveau lead converti', sub: 'Notification en temps réel', checked: false },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
                <input type="checkbox" defaultChecked={item.checked} className="mt-0.5 accent-brand-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"><Save size={15} /> Sauvegarder</button>
        </div>
      )}

      {/* ── GÉNÉRAL ── */}
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
          <button className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700"><Save size={15} /> Sauvegarder</button>
        </div>
      )}
    </div>
  )
}
