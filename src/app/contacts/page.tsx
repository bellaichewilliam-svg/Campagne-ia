'use client'

import { useState } from 'react'
import { Search, Plus, Upload, Users, Mail, Phone, Building2, Star, Filter, X } from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import { contacts, type Contact } from '@/lib/mockData'

const statusColors = {
  client: 'bg-emerald-100 text-emerald-700',
  lead: 'bg-blue-100 text-blue-700',
  prospect: 'bg-yellow-100 text-yellow-700',
  inactif: 'bg-gray-100 text-gray-500',
}

const statusLabels = {
  client: 'Client',
  lead: 'Lead',
  prospect: 'Prospect',
  inactif: 'Inactif',
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-yellow-600' : 'text-red-500'
  return (
    <div className="flex items-center gap-1">
      <Star size={12} className={color} fill="currentColor" />
      <span className={clsx('text-xs font-semibold', color)}>{score}</span>
    </div>
  )
}

function AddContactModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-base font-bold text-gray-900">Ajouter un contact</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Prénom', placeholder: 'Marie' },
            { label: 'Nom', placeholder: 'Dupont' },
            { label: 'Téléphone', placeholder: '+33 6 12 34 56 78' },
            { label: 'Email', placeholder: 'marie@example.com' },
            { label: 'Entreprise', placeholder: 'TechCorp' },
            { label: 'Segment', placeholder: 'Premium' },
          ].map(f => (
            <div key={f.label}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" placeholder={f.placeholder} />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Statut</label>
            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              <option value="prospect">Prospect</option>
              <option value="lead">Lead</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={onClose} className="px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700">Ajouter</button>
        </div>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const filtered = contacts.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

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
      {showModal && <AddContactModal onClose={() => setShowModal(false)} />}

      <PageHeader
        title="Contacts / CRM"
        subtitle="Gérez votre base de contacts et leurs interactions"
        action={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Upload size={15} />
              Importer CSV
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors">
              <Plus size={15} />
              Ajouter
            </button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total contacts', value: counts.total, color: 'bg-gray-50 border-gray-200' },
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

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
            placeholder="Nom, email, entreprise..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'client', 'lead', 'prospect', 'inactif'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={clsx(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                filterStatus === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {s === 'all' ? 'Tous' : statusLabels[s]}
            </button>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="text-gray-500">{selected.length} sélectionné(s)</span>
            <button className="px-3 py-1.5 bg-brand-50 text-brand-700 rounded-lg text-xs font-medium hover:bg-brand-100">
              Ajouter à une campagne
            </button>
            <button className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100">
              Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="w-10 px-4 py-3">
                <input type="checkbox" className="rounded" onChange={e => setSelected(e.target.checked ? contacts.map(c => c.id) : [])} />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entreprise</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Segment</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Score</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Campagnes</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dernier contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => (
              <tr key={c.id} className={clsx('hover:bg-gray-50 transition-colors', selected.includes(c.id) && 'bg-brand-50')}>
                <td className="px-4 py-3">
                  <input type="checkbox" className="rounded" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.company ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="badge bg-purple-50 text-purple-700">{c.segment}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={clsx('badge', statusColors[c.status])}>{statusLabels[c.status]}</span>
                </td>
                <td className="px-4 py-3">
                  <ScoreBadge score={c.score} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.campaigns}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{c.lastContact ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Users size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun contact trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}
