import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * GET /api/settings?keys=k1,k2  → { k1: value, k2: value }
 * GET /api/settings              → toutes les clés
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const keysParam = searchParams.get('keys')

  let q = supabaseAdmin.from('settings').select('key,value')
  if (keysParam) {
    const keys = keysParam.split(',').map(k => k.trim()).filter(Boolean)
    q = q.in('key', keys)
  }

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const out: Record<string, string> = {}
  for (const row of data ?? []) out[row.key as string] = (row.value as string) ?? ''
  return NextResponse.json(out)
}

/**
 * POST /api/settings  body: { key1: value1, key2: value2 }
 * Upsert chaque paire.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const rows = Object.entries(body).map(([key, value]) => ({
    key,
    value: value == null ? '' : typeof value === 'string' ? value : JSON.stringify(value),
  }))
  if (rows.length === 0) return NextResponse.json({ ok: true })

  const { error } = await supabaseAdmin.from('settings').upsert(rows, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
