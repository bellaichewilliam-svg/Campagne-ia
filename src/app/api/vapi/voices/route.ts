import { NextResponse } from 'next/server'
import { VAPI_VOICES } from '@/lib/vapi'

export async function GET() {
  return NextResponse.json(VAPI_VOICES)
}
