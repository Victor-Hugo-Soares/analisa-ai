import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { refresh_token } = await req.json()
  if (!refresh_token) {
    return NextResponse.json({ error: 'Token ausente' }, { status: 400 })
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.auth.refreshSession({ refresh_token })

  if (error || !data.session) {
    return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
  }

  return NextResponse.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
}
