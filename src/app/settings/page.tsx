'use client'

import { useState, useEffect, useCallback } from 'react'
import { signIn, signOut, useSession } from 'next-auth/react'
import {
  Mic2, Key, Bell, Sliders, Save, Play, Volume2, Sheet,
  CheckCircle2, XCircle, Loader2, Phone, LogIn, LogOut,
  BookOpen, ExternalLink, RefreshCw
} from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import type { VapiVoice } from '@/lib/vapi'

const TABS = ['Voix IA', 'Téléphonie', 'Google', 'Notion', 'Intégrations API', 'Notifications', 'Général']

export default function SettingsPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState('Voix IA')
  const [voices, setVoices] = useState<VapiVoice[]>([])
  const [loadingVoices, setLoadingVoices] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState<VapiVoice | null>(null)
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(0)
  const [filterProvider, setFilterProvider] = useState('all')

  // Google OAuth status
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; email?: string; spreadsheetId?: string } | null>(null)
  const [userSheets, setUserSheets] = useState<{ id: string; name: string }[]>([])
  const [sheetsLoading, setSheetsLoading] = useState(false)
  const [sheetTestStatus, setSheetTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [sheetTestMsg, setSheetTestMsg] = useState('')

  // Notion
  const [notionToken, setNotionToken] = useState('')
  const [notionDbId, setNotionDbId] = useState('')
  const [notionStatus, setNotionStatus] = useState<{ connected: boolean } | null>(null)
  const [notionTestStatus, setNotionTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [notionTestMsg, setNotionTestMsg] = useState('')

  const loadGoogleStatus = useCallback(async () => {
    const res = await fetch('/api/google/status')
    setGoogleStatus(await res.json())
  }, [])

  const loadNotionStatus = useCallback(async () => {
    const res = await fetch('/api/notion/config')
    const data = await res.json()
    setNotionStatus(data)
    setNotionDbId(data.databaseId ?? '')
  }, [])

  useEffect(() => {
    fetch('/api/vapi/voices')
      .then(r => r.json())
      .then((v: VapiVoice[]) => { setVoices(v); setSelectedVoice(v[0] ?? null) })
      .finally(() => setLoadingVoices(false))
    loadGoogleStatus()
    loadNotionStatus()
  }, [loadGoogleStatus, loadNotionStatus])

  // Si l'utilisateur vient de se connecter avec Google → stocker le statut
  useEffect(() => {
    if (session?.accessToken) loadGoogleStatus()
  }, [session, loadGoogleStatus])

  const providers = ['all', ...Array.from(new Set(voices.map(v => v.provider)))]
  const filteredVoices = filterProvider === 'all' ? voices : voices.filter(v => v.provider === filterProvider)

  const loadUserSheets = async () => {
    setSheetsLoading(true)
    try {
      const res = await fetch('/api/google/sheets')
      const data = await res.json()
      setUserSheets(data.sheets ?? [])
    } finally {
      setSheetsLoading(false)
    }
  }

  const selectSheet = async (id: string) => {
    setSheetTestStatus('loading')
    try {
      const res = await fetch('/api/google/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId: id }),
      })
      const data = await res.json()
      setSheetTestStatus(data.ok ? 'ok' : 'error')
      setSheetTestMsg(data.ok ? `Connecté : "${data.sheetTitle}"` : (data.error ?? 'Échec'))
      loadGoogleStatus()
    } catch {
      setSheetTestStatus('error')
      setSheetTestMsg('Erreur réseau')
    }
  }

  const disconnectGoogle = async () => {
    await fetch('/api/google/status', { method: 'DELETE' })
    await signOut({ redirect: false })
    loadGoogleStatus()
  }

  const saveNotion = async () => {
    setNotionTestStatus('loading')
    try {
      await fetch('/api/notion/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: notionToken, databaseId: notionDbId }),
      })
      const res = await fetch('/api/notion/test')
      const data = await res.json()
      setNotionTestStatus(data.ok ? 'ok' : 'error')
      setNotionTestMsg(data.ok ? `Connecté : "${data.dbName}"` : (data.error ?? 'Échec'))
      loadNotionStatus()
    } catch {
      setNotionTestStatus('error')
      setNotionTestMsg('Erreur réseau')
    }
  }

  const disconnectNotion = async () => {
    await fetch('/api/notion/config', { method: 'DELETE' })
    setNotionToken('')
    setNotionDbId('')
    loadNotionStatus()
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
          {/* Kavkom */}
          <div className="card p-6 border-2 border-brand-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
                <Phone size={18} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Kavkom — Opérateur VoIP français</h3>
                <a href="https://kavkom.com" target="_blank" rel="noopener" className="text-xs text-brand-600 flex items-center gap-1">kavkom.com <ExternalLink size={10} /></a>
              </div>
              <span className="ml-auto badge bg-brand-50 text-brand-700">Recommandé</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">Kavkom est votre opérateur télécom. Configurez-le pour les appels sortants via son API REST.</p>

            <div className="bg-brand-50 rounded-xl p-4 mb-4 text-xs text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-800">Configuration Kavkom :</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Se connecter sur <strong>kavkom.com</strong> → Espace client → API</li>
                <li>Générer une <strong>clé API</strong> + noter votre <strong>Account ID</strong></li>
                <li>Récupérer votre <strong>numéro DID</strong> sortant (ex: +33 1 xx xx xx xx)</li>
                <li>Configurer le webhook dans Kavkom → URL de callback</li>
              </ol>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Clé API Kavkom', env: 'KAVKOM_API_KEY', placeholder: 'xxxxxxxxxxxxxx' },
                { label: 'Account ID', env: 'KAVKOM_ACCOUNT_ID', placeholder: 'ACC_xxxxxxxx' },
                { label: 'Numéro DID sortant', env: 'KAVKOM_DID_NUMBER', placeholder: '+33123456789' },
              ].map(f => (
                <div key={f.env}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
                  <input type="password" placeholder={f.placeholder} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500" />
                  <p className="text-[11px] text-gray-400 mt-0.5">Variable : <code className="bg-gray-100 px-1 rounded">{f.env}</code></p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-medium text-gray-700 mb-1">Webhook Kavkom → CampagneIA</p>
              <div className="bg-gray-900 rounded-lg px-3 py-2 font-mono text-xs text-emerald-400">
                https://campagne-ia.vercel.app/api/kavkom/webhook
              </div>
              <p className="text-[11px] text-gray-400 mt-1">À configurer dans Kavkom → API → Callback URL</p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <Phone size={16} className="text-brand-600" /> Vapi.ai — Voix IA sur Kavkom
            </h3>
            <p className="text-xs text-gray-500 mb-5">Vapi.ai ajoute la couche voix IA par-dessus Kavkom. Vous pouvez aussi utiliser Vapi seul (il inclut sa propre téléphonie via Twilio).</p>

            <div className="bg-brand-50 rounded-xl p-4 mb-5 space-y-2 text-xs text-gray-700">
              <p className="font-semibold text-gray-800">Configuration Vapi.ai :</p>
              <ol className="list-decimal list-inside space-y-2 text-gray-600">
                <li>Créer un compte sur <strong>vapi.ai</strong> → obtenir votre clé API</li>
                <li>Dans Vapi Dashboard → <strong>Phone Numbers</strong> → importer votre numéro Kavkom <em>ou</em> acheter un numéro Vapi</li>
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

      {/* ── GOOGLE ── */}
      {tab === 'Google' && (
        <div className="space-y-4">
          {/* Connexion Google OAuth */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Compte Google
            </h3>
            <p className="text-xs text-gray-500 mb-4">Connectez votre compte Google pour autoriser l'accès à Google Sheets sans configuration technique.</p>

            {googleStatus?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">Compte Google connecté</p>
                    <p className="text-xs text-gray-500">{googleStatus.email}</p>
                  </div>
                  <button onClick={disconnectGoogle} className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                    <LogOut size={12} /> Déconnecter
                  </button>
                </div>

                {/* Sélecteur de Google Sheet */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-700">Google Sheet cible pour les leads</label>
                    <button onClick={loadUserSheets} disabled={sheetsLoading} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                      {sheetsLoading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                      Rafraîchir
                    </button>
                  </div>

                  {googleStatus.spreadsheetId && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-50 rounded-lg">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span className="text-xs text-emerald-700 font-medium">Sheet actuel : {googleStatus.spreadsheetId}</span>
                    </div>
                  )}

                  {userSheets.length > 0 ? (
                    <div className="space-y-2">
                      {userSheets.map(s => (
                        <button
                          key={s.id}
                          onClick={() => selectSheet(s.id)}
                          className={clsx(
                            'w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all text-sm',
                            googleStatus.spreadsheetId === s.id
                              ? 'border-emerald-400 bg-emerald-50'
                              : 'border-gray-200 hover:border-gray-300'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Sheet size={15} className="text-emerald-600" />
                            <span className="font-medium text-gray-800">{s.name}</span>
                          </div>
                          {googleStatus.spreadsheetId === s.id && <CheckCircle2 size={15} className="text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <button onClick={loadUserSheets} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-gray-300">
                      {sheetsLoading ? 'Chargement...' : 'Cliquer pour charger vos Google Sheets'}
                    </button>
                  )}

                  {sheetTestMsg && (
                    <p className={clsx('text-xs mt-2 flex items-center gap-1', sheetTestStatus === 'ok' ? 'text-emerald-600' : 'text-red-500')}>
                      {sheetTestStatus === 'ok' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                      {sheetTestMsg}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Sheet size={24} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-600 mb-4">Connectez votre compte Google pour exporter automatiquement les leads dans vos Sheets.</p>
                <button
                  onClick={() => signIn('google', { callbackUrl: '/settings' })}
                  className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all mx-auto text-sm font-medium text-gray-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Se connecter avec Google
                </button>
                <p className="text-[11px] text-gray-400 mt-3">Requiert : GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET dans Vercel</p>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Variables Vercel nécessaires</h3>
            <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs text-green-400 space-y-1">
              <p><span className="text-gray-500"># Google OAuth (console.cloud.google.com)</span></p>
              <p>GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com</p>
              <p>GOOGLE_CLIENT_SECRET=GOCSPX-xxx</p>
              <p>NEXTAUTH_SECRET=une-chaine-aleatoire-securisee</p>
              <p>NEXTAUTH_URL=https://campagne-ia.vercel.app</p>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Dans Google Cloud Console → APIs → Credentials → OAuth 2.0 → Authorized redirect URIs → ajouter :<br />
              <code className="bg-gray-100 px-1 rounded">https://campagne-ia.vercel.app/api/auth/callback/google</code>
            </p>
          </div>
        </div>
      )}

      {/* ── NOTION ── */}
      {tab === 'Notion' && (
        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <BookOpen size={16} className="text-gray-800" /> Connexion Notion
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Les leads convertis sont automatiquement envoyés dans une base de données Notion. Chaque appel converti crée une nouvelle entrée.
            </p>

            {notionStatus?.connected && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span className="text-sm text-emerald-700 font-medium">Notion connecté</span>
                <button onClick={disconnectNotion} className="ml-auto flex items-center gap-1 text-xs text-red-600 hover:underline">
                  <LogOut size={11} /> Déconnecter
                </button>
              </div>
            )}

            <div className="bg-brand-50 rounded-xl p-4 mb-5 text-xs text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-800">Configuration en 4 étapes :</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Aller sur <a href="https://notion.so/my-integrations" target="_blank" rel="noopener" className="text-brand-600 underline">notion.so/my-integrations</a> → Nouvelle intégration</li>
                <li>Copier le <strong>Token d'intégration</strong> (commence par <code>secret_</code>)</li>
                <li>Dans Notion, ouvrir votre base de données → ⋯ → Connexions → Ajouter l'intégration</li>
                <li>Copier l'<strong>ID de la base</strong> depuis l'URL : notion.so/xxx/<strong>CECI-EST-L-ID</strong>?v=...</li>
              </ol>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Token d'intégration Notion</label>
                <input
                  type="password"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={notionToken}
                  onChange={e => setNotionToken(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">ID de la base de données</label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={notionDbId}
                  onChange={e => setNotionDbId(e.target.value)}
                />
              </div>

              <button
                onClick={saveNotion}
                disabled={notionTestStatus === 'loading' || !notionToken || !notionDbId}
                className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50"
              >
                {notionTestStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                Connecter Notion
              </button>

              {notionTestMsg && (
                <p className={clsx('text-xs flex items-center gap-1', notionTestStatus === 'ok' ? 'text-emerald-600' : 'text-red-500')}>
                  {notionTestStatus === 'ok' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {notionTestMsg}
                </p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Colonnes auto-créées dans Notion</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Nom','Titre'], ['Téléphone','Téléphone'], ['Email','Email'],
                ['Entreprise','Texte'], ['Segment','Sélection'], ['Campagne','Sélection'],
                ['Statut','Sélection'], ['Sentiment','Sélection'], ['Durée (s)','Nombre'],
                ['Notes','Texte'], ['Date','Date'],
              ].map(([col, type]) => (
                <div key={col} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{col}</span>
                  <span className="text-gray-400">{type}</span>
                </div>
              ))}
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
