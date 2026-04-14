import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const supabase = createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("empresa_id, role")
      .eq("id", user.id)
      .single()

    if (usuarioError || !usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 403 })
    }

    const body = await req.json() as { sinistro_id?: string; conteudo?: string }
    const { sinistro_id, conteudo } = body

    if (!sinistro_id || !conteudo) {
      return NextResponse.json({ error: "sinistro_id e conteudo são obrigatórios" }, { status: 400 })
    }

    const { data: aprendizado, error: insertError } = await supabase
      .from("aprendizados")
      .insert({
        empresa_id: usuario.empresa_id,
        usuario_id: user.id,
        sinistro_id,
        conteudo,
        status: "pendente",
      })
      .select("id")
      .single()

    if (insertError || !aprendizado) {
      console.error("[Aprendizados] Erro ao inserir:", insertError)
      return NextResponse.json({ error: "Erro ao salvar aprendizado" }, { status: 500 })
    }

    return NextResponse.json({ success: true, aprendizado: { id: aprendizado.id } }, { status: 201 })
  } catch (error) {
    console.error("[Aprendizados] Erro geral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
