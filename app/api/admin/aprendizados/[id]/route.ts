import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (usuarioError || !usuario || usuario.role !== "master") {
      return NextResponse.json({ error: "Acesso restrito a masters" }, { status: 403 })
    }

    const body = await req.json() as { status?: string; conteudo_editado?: string }
    const { status, conteudo_editado } = body

    if (!status || !["aprovado", "reprovado"].includes(status)) {
      return NextResponse.json(
        { error: "status deve ser 'aprovado' ou 'reprovado'" },
        { status: 400 }
      )
    }

    const update: Record<string, unknown> = {
      status,
      revisado_em: new Date().toISOString(),
      revisado_por: user.id,
    }

    if (conteudo_editado !== undefined) {
      update.conteudo_editado = conteudo_editado
    }

    const { error: updateError } = await supabase
      .from("aprendizados")
      .update(update)
      .eq("id", id)

    if (updateError) {
      console.error("[Admin/Aprendizados/PATCH] Erro ao atualizar:", updateError)
      return NextResponse.json({ error: "Erro ao atualizar aprendizado" }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[Admin/Aprendizados/PATCH] Erro geral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
