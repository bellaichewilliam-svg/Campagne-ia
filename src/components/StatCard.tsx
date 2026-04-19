import clsx from 'clsx'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  delta?: number
  deltaLabel?: string
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
}

export default function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon: Icon,
  iconColor = 'text-brand-600',
  iconBg = 'bg-brand-50',
}: StatCardProps) {
  const positive = delta !== undefined && delta >= 0

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-gray-900">{value}</p>
          {delta !== undefined && (
            <p className={clsx('mt-1 flex items-center gap-1 text-xs font-medium', positive ? 'text-emerald-600' : 'text-red-500')}>
              {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {positive ? '+' : ''}{delta}% {deltaLabel ?? 'vs mois dernier'}
            </p>
          )}
        </div>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={clsx('w-5 h-5', iconColor)} size={20} />
        </div>
      </div>
    </div>
  )
}
