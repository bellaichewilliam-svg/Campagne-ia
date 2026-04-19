'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Upload, Users, Star, Trash2, X, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import type { Contact } from '@/lib/supabase'

const statusColors = { client: 'bg-emerald-100 text-emerald-700', lead: 'bg-blue-100 text-blue-700', prospect: 'bg-yellow-100 text-yellow-700', inactif: 'bg-gray-100 text-gray-500' }
const statusLabels = { client: 'Client', lead: 'Lead', prospect: 'Prospect', inactif: 'Inactif' }

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500'
  return (
    <div className="flex items-center gap-1">
      <Star size={12} className={color} fill="currentColor" />
      <span className={clsx('text-xs font-semibold', color)}>{score}</span>
    </div>
  )
}

function ContactModal({ contact, onClose, onSaved }: { contact?: Contact; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    first_name: contact?.first_name ?? '',
    last_name: contact?.last_name ?? '',
    phone: contact?.phone ?? '',
    email: contact?.email ?? '',
    company: contact?.company ?? '',
    segment: contact?.segment ?? 'Standard',
    status: contact?.status ?? 'prospect',
    score: contact?.score ?? 50,
    notes: contact?.notes ?? '',
  })
  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.phone.trim()) { setError('Le téléphone est requis'); return }
    setLoading(true)
    setError('')
    try {
      const url = contact ? `/api/contacts/${contact.id}` : '/api/contacts'
      const method = contact ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-base font-bold text-gray-900">{contact ? 'Modifier le contact' : 'Ajouter un contact'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"><X size={16} /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {error && <div className="col-span-2 flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs"><AlertCircle size={13} />{error}</div>}
          {[
            { label: 'Prénom', key: 'first_name', placeholder: 'Marie' },
            { label: 'Nom', key: 'last_name', placeholder: 'Dupont' },
            { label: 'Téléphone *', key: 'phone', placeholder: '+33 6 12 34 56 78' },
            { label: 'Email', key: 'email', placeholder: 'marie@example.com' },
            { label: 'Entreprise', key: 'company', placeholder: 'TechCorp' },
            { label: 'Segment', key: 'segment', placeholder: 'Premium' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder={f.placeholder}
                value={(form as Record<string, string | number>)[f.key] as string}
                onChange={e => set(f.key, e.target.value)}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="prospect">Prospect</option>
              <option value="lead">Lead</option>
              <option value="client">Client</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Score lead ({form.score}/100)</label>
            <input type="range" min={0} max={100} value={form.score} onChange={e => set('score', parseInt(e.target.value))} className="w-full accent-brand-600" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={save} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60">
            {loading && <Loader2 size={13} className="animate-spin" />}
            {contact ? 'Sauvegarder' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editContact, setEditContact] = useState<Contact | undefined>()
  const [selected, setSelected] = useState<string[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStatus !== 'all') params.set('status', filterStatus)
      if (search) params.set('search', search)
      const res = await fetch(`/api/contacts?${params}`)
      setContacts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [filterStatus, search])

  useEffect(() => {
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [load])

  const deleteContact = async (id: string) => {
    if (!confirm('Supprimer ce contact ?')) return
    await fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    load()
  }

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const counts = {
    total: contacts.length,
    clients: contacts.filter(c => c.status === 'client').length,
    leads: contacts.filter(c => c.status === 'lead').length,
    prospects: contacts.filter(c => c.status === 'prospect').length,
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {(showModal || editContact) && (
        <ContactModal
          contact={editContact}
          onClose={() => { setShowModal(false); setEditContact(undefined) }}
          onSaved={load}
        />
      )}

      <PageHeader
        title="Contacts / CRM"
        subtitle="Gérez votre base de contacts"
        action={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
              <Upload size={15} /> Importer CSV
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">
              <Plus size={15} /> Ajouter
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: counts.total, color: 'bg-gray-50 border-gray-200' },
          { label: 'Clients', value: counts.clients, color: 'bg-emerald-50 border-emerald-100' },
          { label: 'Leads', value: counts.leads, color: 'bg-blue-50 border-blue-100' },
          { label: 'Prospects', value: counts.prospects, color: 'bg-yellow-50 border-yellow-100' },
        ].map(s => (
          <div key={s.label} className={clsx('rounded-xl border p-4', s.color)}>
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-64" placeholder="Nom, email, entreprise..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'client', 'lead', 'prospect', 'inactif'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {s === 'all' ? 'Tous' : statusLabels[s]}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-gray-500">{selected.length} sélectionné(s)</span>
            <button className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-xs font-medium hover:bg-brand-100">Ajouter à campagne</button>
          </div>
        )}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-brand-500" size={24} /></div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? contacts.map(c => c.id) : [])} />
                </th>
                {['Contact', 'Entreprise', 'Segment', 'Statut', 'Score', 'Dernier contact', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contacts.map(c => (
                <tr key={c.id} className={clsx('hover:bg-gray-50 transition-colors', selected.includes(c.id) && 'bg-brand-50')}>
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(c.first_name || c.last_name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-gray-400">{c.email || c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.company || '—'}</td>
                  <td className="px-4 py-3"><span className="badge bg-purple-50 text-purple-700">{c.segment}</span></td>
                  <td className="px-4 py-3"><span className={clsx('badge', statusColors[c.status])}>{statusLabels[c.status]}</span></td>
                  <td className="px-4 py-3"><ScoreBadge score={c.score} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{c.last_contact ? new Date(c.last_contact).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditContact(c)} className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-xs text-gray-500">✏️</button>
                      <button onClick={() => deleteContact(c.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && contacts.length === 0 && (
          <div className="p-12 text-center">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun contact — ajoutez-en un !</p>
          </div>
        )}
      </div>
    </div>
  )
}
