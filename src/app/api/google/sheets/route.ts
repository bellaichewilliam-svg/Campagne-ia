import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { testConnection, listUserSheets } from '@/lib/googleSheets'

// GET /api/google/sheets — liste les Google Sheets de l'utilisateur
export async function GET() {
  try {
    const sheets = await listUserSheets()
    return NextResponse.json({ sheets })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 400 })
  }
}

// POST /api/google/sheets — sauvegarde le spreadsheet ID choisi
export async function POST(req: NextRequest) {
  const { spreadsheetId } = await req.json()
  if (!spreadsheetId) return NextResponse.json({ error: 'spreadsheetId requis' }, { status: 400 })

  await supabaseAdmin.from('settings').upsert(
    [{ key: 'google_spreadsheet_id', value: spreadsheetId }],
    { onConflict: 'key' }
  )

  const test = await testConnection()
  return NextResponse.json(test)
}
