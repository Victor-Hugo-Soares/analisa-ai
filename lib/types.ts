export type TipoEvento =
  | "colisao"
  | "roubo"
  | "furto"
  | "natureza"
  | "vidros"

export type StatusSinistro =
  | "pendente"
  | "em_analise"
  | "concluido"
  | "suspeito"

export type NivelRisco = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO"

export type Recomendacao =
  | "APROVACAO_RECOMENDADA"
  | "APROVACAO_COM_RESSALVAS"
  | "INVESTIGACAO_NECESSARIA"
  | "AGUARDAR_DOCUMENTOS"
  | "RECUSA_RECOMENDADA"

export type TipoDocumento =
  | "bo"
  | "crlv"
  | "crv"
  | "cnh"
  | "laudo_pericial"
  | "orcamento"
  | "nota_fiscal"
  | "rastreamento"
  | "declaracao_segurado"
  | "laudo_medico"
  | "procuracao"
  | "outro"

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  bo: "Boletim de Ocorrência (BO)",
  crlv: "CRLV — Licenciamento do Veículo",
  crv: "CRV — Documento do Veículo",
  cnh: "CNH do Condutor",
  laudo_pericial: "Laudo Pericial",
  orcamento: "Orçamento de Reparo",
  nota_fiscal: "Nota Fiscal",
  rastreamento: "Relatório de Rastreamento GPS",
  declaracao_segurado: "Declaração do Associado",
  laudo_medico: "Laudo Médico",
  procuracao: "Procuração",
  outro: "Outro Documento",
}

export interface ArquivoAnexo {
  nome: string
  tipo: "audio" | "documento" | "imagem"
  tipoDoc?: TipoDocumento  // classificação manual para documentos PDF
  tamanho: number
  base64?: string       // usado apenas para arquivos pequenos inline
  storagePath?: string  // path no Supabase Storage (preferido para arquivos grandes)
}

export interface DadosSinistro {
  nomeSegurado: string
  cpf: string
  placa: string
  dataHora: string
  local: string
  relato: string
}

export interface Sinistro {
  id: string
  tipoEvento: TipoEvento
  dados: DadosSinistro
  arquivos: ArquivoAnexo[]
  status: StatusSinistro
  criadoEm: string
  analise?: AnaliseIA
}

export interface AnaliseAudio {
  transcricao_completa: string
  transcricao_resumo: string
  tom_voz: string
  perfil_emocional: string
  momentos_alterados: string[]
  padroes_suspeitos: string[]
  contradicoes_com_relato: string[]
}

export interface AnaliseImagens {
  descricao: string
  consistencia_relato: string
  observacoes: string[]
  indicadores_autenticidade: string
}

export interface AnaliseIA {
  resumo: string
  linha_do_tempo: string[]
  pontos_verdadeiros: string[]
  pontos_atencao: string[]
  contradicoes: string[]
  indicadores_fraude: string[]
  analise_audio?: AnaliseAudio
  analise_imagens?: AnaliseImagens
  nivel_risco: NivelRisco
  score_confiabilidade: number
  recomendacao: Recomendacao
  justificativa_recomendacao: string
  proximos_passos: string[]
}

export type RoleUsuario = "master" | "admin" | "usuario"

export type NivelAcesso = "basico" | "avancado" | "premium"

export interface EmpresaSession {
  id: string        // empresa_id
  usuario_id: string
  nome: string
  email: string
  cnpj: string
  role: RoleUsuario
}

// Tipos do banco Supabase
export interface EmpresaDB {
  id: string
  nome: string
  cnpj: string
  email: string
  plano: string
  ativo: boolean
  limite_usuarios: number
  nivel_acesso: NivelAcesso
  criado_em: string
}

export interface UsuarioDB {
  id: string
  empresa_id: string
  nome: string
  email: string
  role: RoleUsuario
  criado_em: string
}

export interface SinistroDB {
  id: string
  empresa_id: string
  usuario_id: string | null
  tipo_evento: TipoEvento
  status: StatusSinistro
  nome_segurado: string
  cpf: string
  placa: string
  data_hora_sinistro: string
  local: string
  relato: string
  analise: AnaliseIA | null
  criado_em: string
  atualizado_em: string
}

export interface ArquivoDB {
  id: string
  sinistro_id: string
  nome: string
  tipo: 'audio' | 'documento' | 'imagem'
  tamanho: number
  storage_path: string | null
  criado_em: string
}

export type StatusAprendizado = 'pendente' | 'aprovado' | 'reprovado' | 'registrado'

export interface Aprendizado {
  id: string
  empresa_id: string
  usuario_id: string
  sinistro_id: string
  conteudo: string
  status: StatusAprendizado
  conteudo_editado?: string
  criado_em: string
  revisado_em?: string
  revisado_por?: string
}
