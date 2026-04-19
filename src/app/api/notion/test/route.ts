import { NextResponse } from 'next/server'
import { testNotionConnection } from '@/lib/notion'

export async function GET() {
  const result = await testNotionConnection()
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
