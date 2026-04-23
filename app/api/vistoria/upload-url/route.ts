import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const supabase = createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: "Sessão inválida" }, { status: 401 })

  const { fileName, empresaId } = await req.json()

  const safeName = fileName
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")

  const path = `${empresaId}/vistorias/${Date.now()}-${safeName}`

  const { data, error } = await supabase.storage
    .from("sinistros-arquivos")
    .createSignedUploadUrl(path)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ signedUrl: data.signedUrl, token: data.token, path })
}
