import { NextResponse } from 'next/server'
import { testKavkomConnection } from '@/lib/kavkom'

export async function GET() {
  const result = await testKavkomConnection()
  return NextResponse.json(result, { status: result.ok ? 200 : 400 })
}
