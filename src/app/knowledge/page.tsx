'use client'

import { useState } from 'react'
import {
  Plus, Search, BookOpen, Lightbulb, ShieldCheck, Building2,
  FileText, Mic2, Pencil, Trash2, X, Check, AlertCircle, ChevronDown
} from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import { defaultKnowledge, type KnowledgeEntry, type KnowledgeCategory } from '@/lib/voiceKnowledge'

const categoryConfig: Record<KnowledgeCategory, { label: string; icon: typeof BookOpen; color: string; bg: string }> = {
  faq:       { label: 'FAQ',        icon: BookOpen,    color: 'text-blue-600',    bg: 'bg-blue-50' },
  product:   { label: 'Produit',    icon: Lightbulb,   color: 'text-yellow-600',  bg: 'bg-yellow-50' },
  objection: { label: 'Objection',  icon: ShieldCheck, color: 'text-red-500',     bg: 'bg-red-50' },
  company:   { label: 'Entreprise', icon: Building2,   color: 'text-purple-600',  bg: 'bg-purple-50' },
  script:    { label: 'Script',     icon: FileText,    color: 'text-emerald-600', bg: 'bg-emerald-50' },
}

const priorityLabel: Record<number, { label: string; color: string }> = {
  1: { label: 'Haute', color: 'text-red-500' },
  2: { label: 'Moyenne', color: 'text-orange-500' },
  3: { label: 'Basse', color: 'text-gray-400' },
}

type FormState = Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>

const emptyForm: FormState = {
  category: 'faq',
  title: '',
  content: '',
  campaigns: [],
  active: true,
  priority: 1,
  tags: [],
}

function EntryModal({ entry, onClose }: { entry?: KnowledgeEntry; onClose: () => void }) {
  const [form, setForm] = useState<FormState>(entry ? {
    category: entry.category, title: entry.title, content: entry.content,
    campaigns: entry.campaigns, active: entry.active, priority: entry.priority, tags: entry.tags,
  } : emptyForm)
  const [tagInput, setTagInput] = useState('')

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }))

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) {
      set('tags', [...form.tags, t])
      setTagInput('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            {entry ? 'Modifier l\'entrée' : 'Nouvelle entrée'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie *</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={form.category}
                onChange={e => set('category', e.target.value as KnowledgeCategory)}
              >
                {Object.entries(categoryConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priorité</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={form.priority}
                onChange={e => set('priority', parseInt(e.target.value) as 1 | 2 | 3)}
              >
                <option value={1}>1 — Haute</option>
                <option value={2}>2 — Moyenne</option>
                <option value={3}>3 — Basse</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Titre / Question *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="ex: Comment fonctionne la facturation ?"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Contenu — réponse complète que la voix IA doit donner *
            </label>
            <textarea
              rows={6}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              placeholder="Répondez de façon naturelle, comme une conversation. Utilisez {{variable}} pour les champs dynamiques."
              value={form.content}
              onChange={e => set('content', e.target.value)}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Variables : {'{{prénom}}'} {'{{entreprise}}'} {'{{offre}}'} {'{{telephone_support}}'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tags (pour la recherche IA)</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {form.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs">
                  {tag}
                  <button onClick={() => set('tags', form.tags.filter(t => t !== tag))}>
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Ajouter un tag..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button onClick={addTag} className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 hover:bg-gray-200">
                Ajouter
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => set('active', !form.active)}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
                form.active ? 'bg-brand-600' : 'bg-gray-300'
              )}
            >
              <span className={clsx(
                'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm',
                form.active ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
            <span className="text-sm text-gray-700">{form.active ? 'Entrée active' : 'Entrée désactivée'}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={onClose} className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
            {entry ? 'Sauvegarder' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function TestModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const test = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/knowledge?query=${encodeURIComponent(query)}&limit=3`)
      const data = await res.json()
      setResult(data.context)
    } catch {
      setResult('Erreur lors du test.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">Tester la base de connaissances</h2>
            <p className="text-xs text-gray-500 mt-0.5">Simulez une question posée par l'appelant</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Question de l'appelant</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="ex: c'est trop cher pour moi"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && test()}
              />
              <button
                onClick={test}
                disabled={loading}
                className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {loading ? '...' : 'Tester'}
              </button>
            </div>
          </div>
          {result && (
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Contexte injecté dans la voix IA :</p>
              <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto font-mono">
                {result}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Fermer</button>
        </div>
      </div>
    </div>
  )
}

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>(defaultKnowledge)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('all')
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | undefined>(undefined)
  const [showNew, setShowNew] = useState(false)
  const [showTest, setShowTest] = useState(false)

  const filtered = entries.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.content.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some(t => t.includes(search.toLowerCase()))
    const matchCat = filterCat === 'all' || e.category === filterCat
    return matchSearch && matchCat
  })

  const toggle = (id: string) =>
    setEntries(es => es.map(e => e.id === id ? { ...e, active: !e.active } : e))

  const remove = (id: string) =>
    setEntries(es => es.filter(e => e.id !== id))

  const counts = Object.fromEntries(
    Object.keys(categoryConfig).map(k => [k, entries.filter(e => e.category === k).length])
  )

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {showNew && <EntryModal onClose={() => setShowNew(false)} />}
      {editEntry && <EntryModal entry={editEntry} onClose={() => setEditEntry(undefined)} />}
      {showTest && <TestModal onClose={() => setShowTest(false)} />}

      <PageHeader
        title="Base de connaissances Voix IA"
        subtitle="Tout ce que la voix IA sait et peut répondre lors des appels"
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTest(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
              <Mic2 size={15} />
              Tester la voix IA
            </button>
            <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
              <Plus size={15} />
              Nouvelle entrée
            </button>
          </div>
        }
      />

      {/* How it works banner */}
      <div className="card p-5 mb-6 bg-gradient-to-r from-brand-50 to-purple-50 border-brand-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
            <Mic2 size={20} className="text-brand-700" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Comment la voix IA utilise cette base</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Avant chaque appel, la voix IA consulte automatiquement cette base via <code className="bg-white px-1 py-0.5 rounded text-brand-700 font-mono text-[11px]">GET /api/knowledge?query=...</code>.
              Elle reçoit les 3 meilleures correspondances selon la question de l'appelant et les injecte dans son contexte système.
              Les entrées sont classées par pertinence (titre + contenu + tags) puis par priorité.
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-[11px] bg-white border border-brand-200 text-brand-700 px-2 py-1 rounded-full">Webhook Vapi.ai connecté</span>
              <span className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Check size={10} /> {entries.filter(e => e.active).length} entrées actives
              </span>
              <span className="text-[11px] bg-white border border-gray-200 text-gray-500 px-2 py-1 rounded-full">
                Endpoint : /api/knowledge
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilterCat('all')}
          className={clsx('px-4 py-2 rounded-xl text-sm font-medium border transition-all', filterCat === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}
        >
          Toutes ({entries.length})
        </button>
        {Object.entries(categoryConfig).map(([k, v]) => {
          const Icon = v.icon
          return (
            <button
              key={k}
              onClick={() => setFilterCat(k)}
              className={clsx('flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all', filterCat === k ? `${v.bg} ${v.color} border-current` : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}
            >
              <Icon size={14} />
              {v.label} ({counts[k] ?? 0})
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-80"
          placeholder="Rechercher par titre, contenu, tag..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Entries grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(entry => {
          const cfg = categoryConfig[entry.category]
          const Icon = cfg.icon
          const prio = priorityLabel[entry.priority]

          return (
            <div key={entry.id} className={clsx('card p-5 transition-all', !entry.active && 'opacity-50')}>
              <div className="flex items-start gap-3">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                  <Icon size={16} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={clsx('badge text-[10px]', cfg.bg, cfg.color)}>{cfg.label}</span>
                    <span className={clsx('text-[10px] font-medium', prio.color)}>Priorité {prio.label}</span>
                    {!entry.active && <span className="badge bg-gray-100 text-gray-400 text-[10px]">Désactivé</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mt-1.5">{entry.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{entry.content}</p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                  {entry.campaigns.length > 0 && (
                    <p className="text-[10px] text-brand-500 mt-2">
                      Campagnes : {entry.campaigns.join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={() => toggle(entry.id)} className={clsx('w-7 h-7 rounded-lg flex items-center justify-center transition-colors', entry.active ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-gray-100 hover:bg-gray-200')}>
                    {entry.active ? <Check size={12} className="text-emerald-600" /> : <X size={12} className="text-gray-400" />}
                  </button>
                  <button onClick={() => setEditEntry(entry)} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <Pencil size={12} className="text-gray-500" />
                  </button>
                  <button onClick={() => remove(entry.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                    <Trash2 size={12} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 card p-12 text-center">
            <BookOpen size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucune entrée trouvée</p>
          </div>
        )}
      </div>
    </div>
  )
}
