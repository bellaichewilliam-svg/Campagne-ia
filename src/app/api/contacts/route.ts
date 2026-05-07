import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search')

  let query = supabaseAdmin.from('contacts').select('*').order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const now = new Date().toISOString()

  // Insertion en lot — body est un tableau (import CSV)
  if (Array.isArray(body)) {
    const rows = body.map(c => ({ ...c, created_at: now, updated_at: now }))
    const { data, error } = await supabaseAdmin.from('contacts').insert(rows).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ inserted: data?.length ?? 0, contacts: data }, { status: 201 })
  }

  const { data, error } = await supabaseAdmin
    .from('contacts')
    .insert({ ...body, created_at: now, updated_at: now })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
