import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
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

    if (usuarioError || !usuario || usuario.role !== "master") {
      return NextResponse.json({ error: "Acesso restrito a masters" }, { status: 403 })
    }

    const { data: aprendizados, error: fetchError } = await supabase
      .from("aprendizados")
      .select(`
        id,
        empresa_id,
        usuario_id,
        sinistro_id,
        conteudo,
        status,
        conteudo_editado,
        criado_em,
        revisado_em,
        revisado_por,
        usuarios (
          nome,
          email
        )
      `)
      .order("criado_em", { ascending: false })

    if (fetchError) {
      console.error("[Admin/Aprendizados] Erro ao buscar:", fetchError)
      return NextResponse.json({ error: "Erro ao buscar aprendizados" }, { status: 500 })
    }

    return NextResponse.json({ aprendizados: aprendizados ?? [] }, { status: 200 })
  } catch (error) {
    console.error("[Admin/Aprendizados] Erro geral:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
