'use client'

import {
  PhoneCall, Users, TrendingUp, Megaphone,
  CheckCircle2, Clock, Mic2
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import { campaigns, weeklyCallData, sentimentData, callLogs } from '@/lib/mockData'
import clsx from 'clsx'

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  draft: 'bg-blue-100 text-blue-700',
}

const statusLabels: Record<string, string> = {
  active: 'Actif',
  paused: 'En pause',
  completed: 'Terminé',
  draft: 'Brouillon',
}

const callStatusColors: Record<string, string> = {
  converted: 'bg-emerald-100 text-emerald-700',
  answered: 'bg-blue-100 text-blue-700',
  voicemail: 'bg-purple-100 text-purple-700',
  no_answer: 'bg-gray-100 text-gray-600',
  busy: 'bg-orange-100 text-orange-700',
}

const callStatusLabels: Record<string, string> = {
  converted: 'Converti',
  answered: 'Répondu',
  voicemail: 'Messagerie',
  no_answer: 'Sans réponse',
  busy: 'Occupé',
}

export default function DashboardPage() {
  const activeCampaigns = campaigns.filter(c => c.status === 'active')

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de vos campagnes voix IA"
        action={
          <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {activeCampaigns.length} campagnes actives
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Appels aujourd'hui" value="1 435" delta={12.4} icon={PhoneCall} iconColor="text-brand-600" iconBg="bg-brand-50" />
        <StatCard label="Taux de réponse" value="50.3%" delta={3.1} icon={CheckCircle2} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard label="Conversions" value="361" delta={8.7} icon={TrendingUp} iconColor="text-purple-600" iconBg="bg-purple-50" />
        <StatCard label="Contacts actifs" value="8 700" delta={-2.1} icon={Users} iconColor="text-orange-600" iconBg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Weekly calls chart */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Appels cette semaine</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyCallData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.08)' }} />
              <Bar dataKey="appels" fill="#dbe4ff" radius={[4, 4, 0, 0]} name="Appels" />
              <Bar dataKey="réponses" fill="#4f6ef7" radius={[4, 4, 0, 0]} name="Réponses" />
              <Bar dataKey="conversions" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-2 justify-end">
            {[['Appels', '#dbe4ff'], ['Réponses', '#4f6ef7'], ['Conversions', '#7c3aed']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Sentiment des appels</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {sentimentData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {sentimentData.map(s => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-gray-600">{s.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active campaigns */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Campagnes actives</h2>
            <a href="/campaigns" className="text-xs text-brand-600 hover:underline">Voir tout</a>
          </div>
          <div className="space-y-3">
            {activeCampaigns.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Megaphone size={14} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.called.toLocaleString()} / {c.contacts.toLocaleString()} contactés</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{c.conversionRate}%</p>
                  <p className="text-xs text-gray-400">conversion</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent calls */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Derniers appels</h2>
            <a href="/calls" className="text-xs text-brand-600 hover:underline">Voir tout</a>
          </div>
          <div className="space-y-2">
            {callLogs.slice(0, 6).map(log => (
              <div key={log.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
                  {log.contactName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{log.contactName}</p>
                  <p className="text-xs text-gray-400 truncate">{log.campaign}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={clsx('badge text-[10px]', callStatusColors[log.status])}>
                    {callStatusLabels[log.status]}
                  </span>
                  {log.duration > 0 && (
                    <span className="text-[10px] text-gray-400">{log.duration}s</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
