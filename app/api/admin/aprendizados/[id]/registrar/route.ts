import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function POST(
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

    const { data: aprendizado, error: fetchError } = await supabase
      .from("aprendizados")
      .select("id, status")
      .eq("id", id)
      .single()

    if (fetchError || !aprendizado) {
      return NextResponse.json({ error: "Aprendizado não encontrado" }, { status: 404 })
    }

    if (aprendizado.status !== "aprovado") {
      return NextResponse.json(
        { error: "Apenas aprendizados com status 'aprovado' podem ser registrados" },
        { status: 422 }
      )
    }

    const { error: updateError } = await supabase
      .from("aprendizados")
      .update({ status: "registrado" })
      .eq("id", id)

    if (updateError) {
      console.error("[Admin/Aprendizados/Registrar] Erro ao registrar:", updateError)
      return NextResponse.json({ error: "Erro ao registrar aprendizado" }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[Admin/Aprendizados/Registrar] Erro geral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
