'use client'

import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { Download, TrendingUp, TrendingDown, PhoneCall, CheckCircle2, Clock } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import clsx from 'clsx'
import type { Campaign, CallLog } from '@/lib/supabase'

const PERIODS = ['7 jours', '30 jours', '3 mois', '12 mois']

function periodDays(p: string) {
  if (p === '7 jours') return 7
  if (p === '30 jours') return 30
  if (p === '3 mois') return 90
  return 365
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('30 jours')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [calls, setCalls] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/campaigns').then(r => r.json()).catch(() => []),
      fetch('/api/calls?limit=2000').then(r => r.json()).catch(() => []),
    ]).then(([c, l]) => {
      setCampaigns(Array.isArray(c) ? c : [])
      setCalls(Array.isArray(l) ? l : [])
    }).finally(() => setLoading(false))
  }, [])

  const days = periodDays(period)
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString()
  const filtered = calls.filter(c => (c.called_at ?? '') >= cutoff)

  // KPIs
  const total      = filtered.length
  const answered   = filtered.filter(c => c.status === 'answered' || c.status === 'converted').length
  const converted  = filtered.filter(c => c.status === 'converted').length
  const avgDur     = total > 0 ? Math.round(filtered.reduce((s, c) => s + (c.duration ?? 0), 0) / total) : 0
  const answerRate = total > 0 ? ((answered / total) * 100).toFixed(1) : '0'
  const convRate   = total > 0 ? ((converted / total) * 100).toFixed(1) : '0'
  const durStr     = avgDur >= 60 ? `${Math.floor(avgDur / 60)}m ${avgDur % 60}s` : `${avgDur}s`

  // Sentiment
  const pos = filtered.filter(c => c.sentiment === 'positive').length
  const neu = filtered.filter(c => c.sentiment === 'neutral').length
  const neg = filtered.filter(c => c.sentiment === 'negative').length
  const sentTotal = pos + neu + neg || 1
  const sentimentData = [
    { name: 'Positif', value: Math.round((pos / sentTotal) * 100), color: '#10b981' },
    { name: 'Neutre',  value: Math.round((neu / sentTotal) * 100), color: '#f59e0b' },
    { name: 'Négatif', value: Math.round((neg / sentTotal) * 100), color: '#ef4444' },
  ]

  // Open rate by campaign
  const byCampaign: Record<string, { ans: number; tot: number }> = {}
  filtered.forEach(c => {
    const n = c.campaign_name || 'Sans campagne'
    if (!byCampaign[n]) byCampaign[n] = { ans: 0, tot: 0 }
    byCampaign[n].tot++
    if (c.status === 'answered' || c.status === 'converted') byCampaign[n].ans++
  })
  const openRateData = Object.entries(byCampaign)
    .map(([campaign, { ans, tot }]) => ({ campaign, taux: Math.round((ans / tot) * 100) }))
    .sort((a, b) => b.taux - a.taux)
    .slice(0, 7)

  // Conversion funnel from campaigns
  const totalContacts  = campaigns.reduce((s, c) => s + c.contacts_count, 0)
  const totalCalled    = campaigns.reduce((s, c) => s + c.called_count, 0)
  const totalConverted = campaigns.reduce((s, c) => s + c.converted_count, 0)
  const funnelBase = totalContacts || 1
  const conversionFunnelData = [
    { stage: 'Contacts',  value: totalContacts },
    { stage: 'Appelés',   value: totalCalled },
    { stage: 'Réponses',  value: answered },
    { stage: 'Convertis', value: totalConverted },
  ]

  // Monthly evolution (last 12 months regardless of period selector)
  const monthlyMap: Record<string, { appels: number; conversions: number }> = {}
  calls.forEach(c => {
    const m = (c.called_at ?? '').slice(0, 7)
    if (!m) return
    if (!monthlyMap[m]) monthlyMap[m] = { appels: 0, conversions: 0 }
    monthlyMap[m].appels++
    if (c.status === 'converted') monthlyMap[m].conversions++
  })
  const monthLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([key, v]) => ({
      month: monthLabels[parseInt(key.slice(5, 7)) - 1],
      appels: v.appels,
      conversions: v.conversions,
    }))

  // Hourly distribution
  const hourCounts: number[] = Array(24).fill(0)
  filtered.forEach(c => {
    if (c.called_at) {
      const h = new Date(c.called_at).getHours()
      hourCounts[h]++
    }
  })
  const hourlyData = Array.from({ length: 13 }, (_, i) => i + 8).map(h => ({
    heure: `${h}h`,
    appels: hourCounts[h] ?? 0,
  }))
  const peakHour = hourlyData.reduce((best, d) => d.appels > best.appels ? d : best, hourlyData[0])

  const funnelColors = ['bg-brand-500', 'bg-brand-400', 'bg-blue-400', 'bg-emerald-500']

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Rapports & Analyses"
        subtitle="Performance détaillée de vos campagnes voix IA"
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={clsx('px-3 py-1.5 text-xs font-medium rounded-md transition-colors', period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
              <Download size={15} />
              Exporter PDF
            </button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total appels', value: loading ? '…' : total.toLocaleString('fr'), icon: PhoneCall, bg: 'bg-brand-50', ic: 'text-brand-600' },
          { label: "Taux d'ouverture", value: loading ? '…' : `${answerRate}%`, icon: CheckCircle2, bg: 'bg-emerald-50', ic: 'text-emerald-600' },
          { label: 'Taux de conversion', value: loading ? '…' : `${convRate}%`, icon: TrendingUp, bg: 'bg-purple-50', ic: 'text-purple-600' },
          { label: "Durée moy. d'appel", value: loading ? '…' : durStr, icon: Clock, bg: 'bg-orange-50', ic: 'text-orange-600' },
        ].map(({ label, value, icon: Icon, bg, ic }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
              </div>
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={clsx('w-5 h-5', ic)} size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Open rate by campaign */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Taux d&apos;ouverture par campagne</h2>
          {openRateData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">Aucun appel pour l&apos;instant</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={openRateData} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="campaign" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip formatter={(v: number) => [`${v}%`, "Taux d'ouverture"]} />
                <Bar dataKey="taux" fill="#4f6ef7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Conversion funnel */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Entonnoir de conversion</h2>
          {totalContacts === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">Aucune campagne pour l&apos;instant</div>
          ) : (
            <div className="space-y-3 mt-2">
              {conversionFunnelData.map((stage, i) => {
                const pct = Math.round((stage.value / funnelBase) * 100)
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{stage.stage}</span>
                      <span className="text-gray-800 font-semibold">{stage.value.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={clsx('h-full rounded-full transition-all', funnelColors[i])} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Monthly evolution */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Évolution mensuelle</h2>
          {monthlyData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">Aucun appel pour l&apos;instant</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gradAppels" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f6ef7" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4f6ef7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="appels" stroke="#4f6ef7" fill="url(#gradAppels)" strokeWidth={2} name="Appels" />
                <Area type="monotone" dataKey="conversions" stroke="#7c3aed" fill="url(#gradConv)" strokeWidth={2} name="Conversions" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sentiment */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Analyse de sentiment</h2>
          {sentTotal <= 1 ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">Aucun appel pour l&apos;instant</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={sentimentData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                    {sentimentData.map(e => <Cell key={e.name} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {sentimentData.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} /><span className="text-gray-600">{s.name}</span></div>
                    <span className="font-semibold text-gray-800">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Best call hours */}
      <div className="card p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Meilleures heures d&apos;appel</h2>
        {total === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-gray-400">Aucun appel pour l&apos;instant</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={hourlyData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="heure" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="appels" radius={[4, 4, 0, 0]} name="Appels">
                  {hourlyData.map((entry, i) => {
                    const max = Math.max(...hourlyData.map(d => d.appels))
                    return <Cell key={i} fill={entry.appels === max && max > 0 ? '#4f6ef7' : entry.appels > max * 0.5 ? '#93c5fd' : '#dbeafe'} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {peakHour.appels > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center">Pic d&apos;activité : {peakHour.heure}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
