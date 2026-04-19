'use client'

import { useState } from 'react'
import { Search, Phone, PhoneOff, PhoneMissed, Voicemail, ChevronDown, Play, MessageSquare, X } from 'lucide-react'
import clsx from 'clsx'
import PageHeader from '@/components/PageHeader'
import { callLogs, type CallLog } from '@/lib/mockData'

const statusConfig = {
  converted:  { label: 'Converti',       color: 'bg-emerald-100 text-emerald-700', icon: Phone },
  answered:   { label: 'Répondu',        color: 'bg-blue-100 text-blue-700',       icon: Phone },
  voicemail:  { label: 'Messagerie',     color: 'bg-purple-100 text-purple-700',   icon: Voicemail },
  no_answer:  { label: 'Sans réponse',   color: 'bg-gray-100 text-gray-500',       icon: PhoneMissed },
  busy:       { label: 'Occupé',         color: 'bg-orange-100 text-orange-700',   icon: PhoneOff },
}

const sentimentConfig = {
  positive: { label: 'Positif',  color: 'text-emerald-600', dot: 'bg-emerald-400' },
  neutral:  { label: 'Neutre',   color: 'text-gray-500',    dot: 'bg-gray-300' },
  negative: { label: 'Négatif',  color: 'text-red-500',     dot: 'bg-red-400' },
}

function formatDuration(s: number) {
  if (s === 0) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function TranscriptModal({ log, onClose }: { log: CallLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">Transcription — {log.contactName}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{log.date} · {log.campaign}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X size={16} />
          </button>
        </div>
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
            {log.transcript ?? 'Aucune transcription disponible pour cet appel.'}
          </div>
          <div className="flex items-center gap-3 mt-4 pt-4 border-t">
            <div className={clsx('badge', statusConfig[log.status].color)}>
              {statusConfig[log.status].label}
            </div>
            <span className="text-xs text-gray-400">Durée: {formatDuration(log.duration)}</span>
            <span className="text-xs text-gray-400">Sentiment: </span>
            <span className={clsx('text-xs font-medium', sentimentConfig[log.sentiment].color)}>
              {sentimentConfig[log.sentiment].label}
            </span>
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Fermer</button>
        </div>
      </div>
    </div>
  )
}

export default function CallsPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null)

  const filtered = callLogs.filter(log => {
    const matchSearch = log.contactName.toLowerCase().includes(search.toLowerCase()) ||
      log.campaign.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || log.status === filterStatus
    return matchSearch && matchStatus
  })

  const counts = Object.fromEntries(
    Object.keys(statusConfig).map(k => [k, callLogs.filter(l => l.status === k).length])
  ) as Record<string, number>

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {selectedLog && <TranscriptModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      <PageHeader
        title="Journal des appels"
        subtitle="Historique complet de tous les appels IA"
      />

      {/* Status summary */}
      <div className="flex flex-wrap gap-3 mb-5">
        {Object.entries(statusConfig).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium',
              filterStatus === key
                ? 'border-brand-300 bg-brand-50 text-brand-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            )}
          >
            <span className={clsx('badge text-xs', cfg.color)}>{counts[key]}</span>
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-72"
            placeholder="Contact, campagne..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Contact', 'Campagne', 'Statut', 'Durée', 'Sentiment', 'Date', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(log => {
              const cfg = statusConfig[log.status]
              const sent = sentimentConfig[log.sentiment]
              const StatusIcon = cfg.icon
              return (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {log.contactName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.contactName}</p>
                        <p className="text-xs text-gray-400">{log.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-[180px] truncate">{log.campaign}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', cfg.color)}>
                      <StatusIcon size={10} />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDuration(log.duration)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={clsx('w-2 h-2 rounded-full', sent.dot)} />
                      <span className={clsx('text-xs font-medium', sent.color)}>{sent.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{log.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {log.duration > 0 && (
                        <button className="w-7 h-7 rounded-lg bg-brand-50 hover:bg-brand-100 flex items-center justify-center transition-colors" title="Écouter">
                          <Play size={12} className="text-brand-600" />
                        </button>
                      )}
                      {log.transcript && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
                          title="Voir transcription"
                        >
                          <MessageSquare size={12} className="text-gray-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <Phone size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun appel trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}
