import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: rows } = await supabaseAdmin
    .from('settings')
    .select('key, value')
    .in('key', ['notion_token', 'notion_database_id', 'notion_connected'])

  const s = Object.fromEntries((rows ?? []).map((r: { key: string; value: string }) => [r.key, r.value]))
  return NextResponse.json({
    connected: s.notion_connected === 'true',
    databaseId: s.notion_database_id ?? '',
  })
}

export async function POST(req: NextRequest) {
  const { token, databaseId } = await req.json()
  if (!token || !databaseId) {
    return NextResponse.json({ error: 'token et databaseId requis' }, { status: 400 })
  }

  await supabaseAdmin.from('settings').upsert([
    { key: 'notion_token',       value: token },
    { key: 'notion_database_id', value: databaseId },
    { key: 'notion_connected',   value: 'true' },
  ], { onConflict: 'key' })

  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  await supabaseAdmin.from('settings').delete()
    .in('key', ['notion_token', 'notion_database_id', 'notion_connected'])
  return NextResponse.json({ ok: true })
}
