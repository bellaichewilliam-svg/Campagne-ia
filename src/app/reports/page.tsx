'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area,
} from 'recharts'
import { Download, Calendar, TrendingUp, TrendingDown, PhoneCall, CheckCircle2, DollarSign, Clock } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { monthlyData, weeklyCallData, sentimentData, campaigns } from '@/lib/mockData'
import clsx from 'clsx'

const openRateData = [
  { campaign: 'Bienvenue', taux: 80 },
  { campaign: 'Upsell Premium', taux: 64.8 },
  { campaign: 'Promo Printemps', taux: 50 },
  { campaign: 'Abandons Panier', taux: 50 },
  { campaign: 'Relance Q2', taux: 47.4 },
  { campaign: 'Enquête', taux: 0 },
]

const conversionFunnelData = [
  { stage: 'Contacts', value: 8700 },
  { stage: 'Appelés', value: 4580 },
  { stage: 'Réponses', value: 2475 },
  { stage: 'Intéressés', value: 848 },
  { stage: 'Convertis', value: 648 },
]

const hourlyData = [
  { heure: '8h', appels: 45 }, { heure: '9h', appels: 120 }, { heure: '10h', appels: 210 },
  { heure: '11h', appels: 185 }, { heure: '12h', appels: 90 }, { heure: '13h', appels: 110 },
  { heure: '14h', appels: 230 }, { heure: '15h', appels: 250 }, { heure: '16h', appels: 200 },
  { heure: '17h', appels: 160 }, { heure: '18h', appels: 80 }, { heure: '19h', appels: 30 },
]

const voicePerf = [
  { voice: 'Emma (FR)', appels: 2800, convRate: 30.2, satisfaction: 4.6 },
  { voice: 'Lucas (FR)', appels: 3100, convRate: 28.7, satisfaction: 4.4 },
  { voice: 'Sophie (FR)', appels: 620, convRate: 33.3, satisfaction: 4.8 },
  { voice: 'Marie (FR)', appels: 0, convRate: 0, satisfaction: 0 },
]

const PERIODS = ['7 jours', '30 jours', '3 mois', '12 mois']

export default function ReportsPage() {
  const [period, setPeriod] = useState('30 jours')

  const totalAppels = conversionFunnelData[0].value
  const totalConvertis = conversionFunnelData[4].value
  const globalConvRate = ((totalConvertis / totalAppels) * 100).toFixed(1)
  const globalOpenRate = ((conversionFunnelData[2].value / conversionFunnelData[1].value) * 100).toFixed(1)

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
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-sm text-gray-700 rounded-lg hover:bg-gray-50">
              <Download size={15} />
              Exporter PDF
            </button>
          </div>
        }
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total appels', value: '4 580', delta: 11.2, icon: PhoneCall, bg: 'bg-brand-50', ic: 'text-brand-600' },
          { label: 'Taux d\'ouverture', value: `${globalOpenRate}%`, delta: 4.3, icon: CheckCircle2, bg: 'bg-emerald-50', ic: 'text-emerald-600' },
          { label: 'Taux de conversion', value: `${globalConvRate}%`, delta: -1.2, icon: TrendingUp, bg: 'bg-purple-50', ic: 'text-purple-600' },
          { label: 'Durée moy. appel', value: '1m 58s', delta: 6.5, icon: Clock, bg: 'bg-orange-50', ic: 'text-orange-600' },
        ].map(({ label, value, delta, icon: Icon, bg, ic }) => (
          <div key={label} className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
                <p className={clsx('mt-1 flex items-center gap-1 text-xs font-medium', delta >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {delta >= 0 ? '+' : ''}{delta}%
                </p>
              </div>
              <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={clsx('w-5 h-5', ic)} size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Open rates by campaign */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Taux d'ouverture par campagne</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={openRateData} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="campaign" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Taux d\'ouverture']} />
              <Bar dataKey="taux" fill="#4f6ef7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion funnel */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Entonnoir de conversion</h2>
          <div className="space-y-3 mt-2">
            {conversionFunnelData.map((stage, i) => {
              const pct = Math.round((stage.value / conversionFunnelData[0].value) * 100)
              const colors = ['bg-brand-500', 'bg-brand-400', 'bg-blue-400', 'bg-purple-400', 'bg-emerald-500']
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{stage.stage}</span>
                    <span className="text-gray-800 font-semibold">{stage.value.toLocaleString()} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={clsx('h-full rounded-full transition-all', colors[i])} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Monthly trends */}
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Évolution mensuelle</h2>
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
        </div>

        {/* Sentiment */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Analyse de sentiment</h2>
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Best call hours */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Meilleures heures d'appel</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyData} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="heure" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="appels" radius={[4, 4, 0, 0]} name="Appels">
                {hourlyData.map((entry, i) => (
                  <Cell key={i} fill={entry.appels >= 200 ? '#4f6ef7' : entry.appels >= 100 ? '#93c5fd' : '#dbeafe'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-center">Pic d'activité : 14h–16h</p>
        </div>

        {/* Voice performance */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Performance par voix IA</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wide pb-2 border-b">
              <span>Voix</span>
              <span className="text-right">Appels</span>
              <span className="text-right">Conversion</span>
              <span className="text-right">Note</span>
            </div>
            {voicePerf.filter(v => v.appels > 0).map(v => (
              <div key={v.voice} className="grid grid-cols-4 items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-purple-400 flex items-center justify-center text-white text-[10px] font-bold">
                    {v.voice.charAt(0)}
                  </div>
                  <span className="text-xs text-gray-700">{v.voice}</span>
                </div>
                <span className="text-right text-xs text-gray-600">{v.appels.toLocaleString()}</span>
                <span className="text-right text-xs font-semibold text-emerald-600">{v.convRate}%</span>
                <span className="text-right text-xs font-semibold text-yellow-600">★ {v.satisfaction}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
