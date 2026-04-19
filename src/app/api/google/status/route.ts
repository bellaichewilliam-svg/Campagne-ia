import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: rows } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['google_connected', 'google_email', 'google_spreadsheet_id'])

  const s = Object.fromEntries((rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))

  return NextResponse.json({
    connected: s.google_connected === 'true',
    email: s.google_email ?? null,
    spreadsheetId: s.google_spreadsheet_id ?? null,
  })
}

export async function DELETE() {
  await supabaseAdmin.from('settings').delete().in('key', [
    'google_access_token', 'google_refresh_token',
    'google_token_expiry', 'google_connected', 'google_email',
  ])
  return NextResponse.json({ ok: true })
}
