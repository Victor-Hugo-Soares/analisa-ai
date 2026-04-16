import type { Sinistro, EmpresaSession, RoleUsuario } from "./types"

const SINISTROS_KEY = "ianalista_sinistros"
const SESSION_KEY = "ianalista_session"

export const mockSinistros: Sinistro[] = [
  {
    id: "SIN-001",
    tipoEvento: "colisao",
    dados: {
      nomeSegurado: "Ricardo Mendes",
      cpf: "123.456.789-00",
      placa: "ABC-1234",
      dataHora: "2026-04-05T14:30:00",
      local: "São Paulo, SP",
      relato:
        "Estava na Av. Paulista e outro veículo avançou o sinal vermelho me acertando na lateral.",
    },
    arquivos: [
      { nome: "boletim_ocorrencia.pdf", tipo: "documento", tamanho: 245000 },
      { nome: "foto_dano_lateral.jpg", tipo: "imagem", tamanho: 1200000 },
    ],
    status: "concluido",
    criadoEm: "2026-04-05T16:00:00",
    analise: {
      resumo:
        "Sinistro de colisão analisado com relato consistente, documentação adequada e imagens compatíveis com a dinâmica do evento. Ricardo Mendes relata colisão lateral na Av. Paulista às 14h30, com boletim de ocorrência registrado em tempo hábil. As fotos do veículo corroboram o relato. Não foram identificadas contradições relevantes, porém a ausência de testemunhas e a não verificação das câmeras do local merecem atenção.",
      linha_do_tempo: [
        "14:30 — Colisão lateral na Av. Paulista, conforme relatado pelo segurado",
        "14:35 (estimado) — Parada dos veículos e troca de informações entre motoristas",
        "15:10 (estimado) — Registro do Boletim de Ocorrência na delegacia mais próxima",
        "16:00 — Abertura do sinistro junto à seguradora",
      ],
      pontos_verdadeiros: [
        "Boletim de ocorrência registrado em tempo hábil (menos de 1 hora após o evento)",
        "Danos visíveis nas fotos são compatíveis com impacto lateral — deformação na porta traseira direita",
        "Local e horário do sinistro são plausíveis — Av. Paulista é via de alto fluxo às 14h30",
        "Relato escrito é coerente e descreve os fatos de forma natural, sem detalhes excessivos ou ensaiados",
      ],
      pontos_atencao: [
        "Nenhuma testemunha foi identificada no relato ou documentação",
        "Câmeras de monitoramento da Av. Paulista não foram verificadas ainda",
        "Veículo do terceiro envolvido não foi identificado ou localizado",
      ],
      contradicoes: [],
      indicadores_fraude: [],
      analise_imagens: {
        descricao:
          "As imagens apresentam dano expressivo na lateral direita do veículo (porta traseira direita), com amassamento e arranhões lineares consistentes com impacto lateral em movimento. A tinta está descascada nas bordas do amassado, sem oxidação visível, indicando dano recente.",
        consistencia_relato: "Alta consistência. O padrão de dano — concentrado na porta traseira direita — é compatível com colisão lateral por veículo que avançou o sinal, conforme descrito pelo segurado.",
        observacoes: [
          "Deformação linear na porta traseira direita — padrão típico de colisão lateral",
          "Ausência de ferrugem ou oxidação nas bordas do dano — indica dano recente",
          "Vidro da janela lateral permanece intacto — consistente com impacto não-central",
          "Sem evidências de danos pré-existentes na área afetada visíveis nas fotos",
          "Iluminação e ângulo das fotos permitem boa avaliação dos danos",
        ],
        indicadores_autenticidade: "As imagens aparentam ser autênticas e recentes. O ambiente fotografado é compatível com via pública urbana. Não há inconsistências de iluminação ou sinais de edição.",
      },
      nivel_risco: "BAIXO",
      score_confiabilidade: 82,
      recomendacao: "APROVACAO_RECOMENDADA",
      justificativa_recomendacao:
        "Relato coerente, documentação adequada e danos físicos consistentes com o evento descrito. Ausência de contradições ou indicadores de fraude. A recomendação é de aprovação, condicionada à verificação das câmeras da Av. Paulista para confirmação.",
      proximos_passos: [
        "Solicitar imagens das câmeras de monitoramento da Av. Paulista no horário do sinistro",
        "Verificar se há registro do veículo de terceiro no BO ou na delegacia",
        "Confirmar junto ao DETRAN se a placa ABC-1234 está ativa e sem restrições",
        "Solicitar ao segurado fotos adicionais do veículo todo para descartar danos pré-existentes",
      ],
    },
  },
  {
    id: "SIN-002",
    tipoEvento: "roubo",
    dados: {
      nomeSegurado: "Fernanda Costa",
      cpf: "987.654.321-00",
      placa: "XYZ-9876",
      dataHora: "2026-04-06T22:15:00",
      local: "Rio de Janeiro, RJ",
      relato:
        "Dois indivíduos armados abordaram meu veículo na saída do shopping e levaram o carro.",
    },
    arquivos: [
      { nome: "ligacao_segurada.mp3", tipo: "audio", tamanho: 3500000 },
      { nome: "bo_roubo.pdf", tipo: "documento", tamanho: 189000 },
    ],
    status: "suspeito",
    criadoEm: "2026-04-06T23:30:00",
    analise: {
      resumo:
        "Sinistro de roubo com múltiplas inconsistências críticas identificadas entre o relato verbal, a ligação telefônica e o boletim de ocorrência. Fernanda Costa relata roubo à mão armada na saída de um shopping, porém o horário declarado é incompatível com o funcionamento do estabelecimento, e o número de assaltantes diverge entre os canais. O tom de voz na ligação demonstrou ausência de reação emocional esperada em situação de trauma recente. O veículo possui 3 parcelas em atraso, o que constitui motivação financeira relevante.",
      linha_do_tempo: [
        "21:00 — Horário de fechamento do shopping (incompatível com relato)",
        "22:15 — Horário declarado pela segurada como o do roubo (shopping já estava fechado)",
        "23:25 — Segurada liga para a seguradora (mais de 1h após o evento)",
        "23:30 — Abertura do sinistro",
      ],
      pontos_verdadeiros: [
        "Boletim de ocorrência foi registrado, o que indica algum grau de comprometimento com o processo",
        "O local declarado (saída de shopping) é plausível para abordagem de roubo",
      ],
      pontos_atencao: [
        "Segurada demorou mais de 1 hora para contatar a seguradora após o suposto roubo",
        "Câmeras do shopping não foram apresentadas e não há menção a solicitação",
        "Veículo tem 3 parcelas em atraso no financiamento — forte motivação financeira",
        "Ausência de testemunhas identificadas no relato",
      ],
      contradicoes: [
        "CRÍTICO: Segurada afirma estar saindo do shopping às 22h, mas estabelecimentos da região fecham às 21h — impossibilidade factual",
        "Relato verbal menciona 'dois indivíduos armados', BO registra 'um indivíduo'",
        "Na ligação descreve saída pelo estacionamento L2, BO indica estacionamento G",
        "Descreve carro dos assaltantes como vermelho na ligação; BO não menciona cor do veículo",
      ],
      indicadores_fraude: [
        "Veículo com financiamento em atraso (3 parcelas) — caracteriza motivação financeira clara para simular sinistro",
        "Horário impossível: shopping fechado no horário declarado do roubo",
        "Tom de voz excessivamente calmo para situação de trauma recente — ausência de reação emocional esperada",
        "Divergência no número de assaltantes entre ligação e BO — inconsistência fundamental que fragiliza o relato",
        "Tempo de comunicação à seguradora superior a 1 hora — atípico para vítima de roubo",
      ],
      analise_audio: {
        transcricao_completa: "[00:00 → 00:12] Atendente: Seguradora, boa noite. Em que posso ajudar?\n[00:13 → 00:28] Fernanda: Oi, boa noite. Eu quero registrar um roubo do meu veículo.\n[00:45 → 01:05] Atendente: Pode me informar o horário exato que ocorreu? / Fernanda: Foi... foi por volta das dez e meia... vinte e dois horas quinze.\n[01:30 → 02:05] Fernanda: Dois caras, dois indivíduos, armados, me abordaram na saída do shopping e levaram o carro.\n[02:10 → 02:25] Atendente: Eram dois? / Fernanda: Sim, dois... é... foram dois.",
        transcricao_resumo:
          "Segurada relata abordagem por dois criminosos armados na saída do shopping às 22h15. Hesitou ao informar o horário. Descreve fuga dos assaltantes em carro vermelho pelo estacionamento L2.",
        tom_voz:
          "Tom consistentemente calmo e controlado durante toda a ligação. Ausência total de choro, voz embargada, tremor vocal ou agitação — elementos esperados em vítima de roubo à mão armada horas após o evento. O relato soa mecânico e sem carga emocional.",
        perfil_emocional:
          "Perfil emocional incompatível com o evento descrito. Vítimas de roubo à mão armada normalmente apresentam algum grau de estresse pós-traumático nas horas seguintes ao evento. A serenidade observada é atípica e pode indicar que o evento não ocorreu conforme relatado.",
        momentos_alterados: [
          "[00:45] — Pausa de 3 segundos ao ser questionada sobre o horário exato. Hesitação atípica para uma informação simples que deveria estar fresca na memória",
          "[02:10] — Leve alteração vocal ao confirmar o número de assaltantes ('Sim, dois... é... foram dois'). A autocorreção sugere insegurança sobre o detalhe",
        ],
        padroes_suspeitos: [
          "Ausência completa de carga emocional — relato soa ensaiado e mecânico",
          "Hesitação específica ao informar horário — dado que deveria ser lembrado com precisão",
          "Autocorreção ao mencionar número de assaltantes ('dois... é... foram dois') — sugere inconsistência interna",
          "Linguagem formal e estruturada para situação traumática recente — indica possível preparação prévia do relato",
        ],
        contradicoes_com_relato: [
          "Na ligação menciona 'dois indivíduos' com hesitação; relato escrito afirma categoricamente 'dois indivíduos armados'",
          "Na ligação descreve saída pelo 'estacionamento L2'; BO registra estacionamento diferente",
        ],
      },
      nivel_risco: "ALTO",
      score_confiabilidade: 18,
      recomendacao: "INVESTIGACAO_NECESSARIA",
      justificativa_recomendacao:
        "Múltiplas contradições críticas identificadas entre os canais de informação, somadas à impossibilidade factual do horário declarado e ao forte indicador de motivação financeira (veículo com financiamento em atraso). O perfil emocional da segurada é inconsistente com o trauma relatado. Investigação aprofundada é mandatória antes de qualquer decisão.",
      proximos_passos: [
        "Solicitar URGENTE as imagens das câmeras de segurança do shopping — confirmar presença da segurada no local e horário",
        "Verificar horário de funcionamento do shopping na data do sinistro junto ao estabelecimento",
        "Consultar histórico de sinistros da segurada nos últimos 5 anos (SUSEP/mercado)",
        "Verificar situação financeira do veículo: parcelas em atraso, alienação fiduciária, valor de mercado vs. indenização",
        "Solicitar localização do veículo via rastreador (se houver) ou câmeras de vias públicas",
        "Ouvir novamente a ligação com perito especializado em análise vocal",
        "Confrontar a segurada com as contradições identificadas em nova entrevista formal",
      ],
    },
  },
  {
    id: "SIN-003",
    tipoEvento: "natureza",
    dados: {
      nomeSegurado: "Carlos Oliveira",
      cpf: "456.789.123-00",
      placa: "DEF-5678",
      dataHora: "2026-04-07T18:45:00",
      local: "Curitiba, PR",
      relato:
        "Temporal com granizo destruiu o teto e capô do veículo. Estava estacionado na rua durante a tempestade.",
    },
    arquivos: [
      { nome: "fotos_granizo.jpg", tipo: "imagem", tamanho: 2100000 },
      { nome: "previsao_tempo.pdf", tipo: "documento", tamanho: 98000 },
    ],
    status: "em_analise",
    criadoEm: "2026-04-07T20:00:00",
  },
  {
    id: "SIN-004",
    tipoEvento: "vidros",
    dados: {
      nomeSegurado: "Ana Paula Rodrigues",
      cpf: "321.654.987-00",
      placa: "GHI-3456",
      dataHora: "2026-04-08T09:20:00",
      local: "Belo Horizonte, MG",
      relato:
        "Encontrei o parabrisa estilhaçado pela manhã. Veículo estava estacionado na garagem do condomínio.",
    },
    arquivos: [
      { nome: "foto_parabrisa.jpg", tipo: "imagem", tamanho: 890000 },
    ],
    status: "pendente",
    criadoEm: "2026-04-08T10:00:00",
  },
]

export function getSinistros(): Sinistro[] {
  if (typeof window === "undefined") return mockSinistros
  const stored = localStorage.getItem(SINISTROS_KEY)
  if (!stored) {
    localStorage.setItem(SINISTROS_KEY, JSON.stringify(mockSinistros))
    return mockSinistros
  }
  return JSON.parse(stored) as Sinistro[]
}

export function getSinistro(id: string): Sinistro | undefined {
  return getSinistros().find((s) => s.id === id)
}

export function saveSinistro(sinistro: Sinistro): void {
  if (typeof window === "undefined") return
  const sinistros = getSinistros()
  const index = sinistros.findIndex((s) => s.id === sinistro.id)
  if (index >= 0) {
    sinistros[index] = sinistro
  } else {
    sinistros.unshift(sinistro)
  }
  localStorage.setItem(SINISTROS_KEY, JSON.stringify(sinistros))
}

export function generateId(): string {
  // Usa crypto.randomUUID() para evitar colisão entre usuários simultâneos
  // (contador localStorage não é compartilhado entre dispositivos)
  const uid = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
    : Date.now().toString(36).toUpperCase().slice(-8)
  return `SIN-${uid}`
}

export function getSession(): EmpresaSession | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(SESSION_KEY)
  if (!stored) return null
  return JSON.parse(stored) as EmpresaSession
}

export function setSession(session: EmpresaSession): void {
  if (typeof window === "undefined") return
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(SINISTROS_KEY)
  localStorage.removeItem("ianalista_auth")
}

// ─── Helpers para integração com Supabase ─────────────────────────────────

export function getEmpresaIdFromSession(): string | null {
  const s = getSession()
  return s?.id ?? null
}

export function getRole(): RoleUsuario | null {
  const s = getSession()
  return s?.role ?? null
}

export function isMaster(): boolean {
  return getRole() === "master"
}

export function isGestor(): boolean {
  return getRole() === "gestor"
}

export function canManageUsers(): boolean {
  const role = getRole()
  return role === "master" || role === "gestor"
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("ianalista_auth")
  if (!stored) return null
  try {
    return JSON.parse(stored).access_token ?? null
  } catch {
    return null
  }
}

export function setAuthTokens(tokens: {
  access_token: string
  refresh_token: string
}): void {
  if (typeof window === "undefined") return
  localStorage.setItem("ianalista_auth", JSON.stringify(tokens))
}

// Wrapper de fetch com renovação automática de token em caso de 401
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
  router?: { push: (path: string) => void }
): Promise<Response> {
  const token = getAccessToken()
  const headers = { ...(options.headers ?? {}), Authorization: `Bearer ${token}` }
  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    const newToken = await refreshAuthTokens()
    if (newToken) {
      const headers2 = { ...(options.headers ?? {}), Authorization: `Bearer ${newToken}` }
      return fetch(url, { ...options, headers: headers2 })
    }
    clearSession()
    router?.push("/login")
  }

  return res
}

export async function refreshAuthTokens(): Promise<string | null> {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("ianalista_auth")
  if (!stored) return null
  let parsed: { access_token: string; refresh_token: string }
  try { parsed = JSON.parse(stored) } catch { return null }
  if (!parsed.refresh_token) return null

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: parsed.refresh_token }),
    })
    if (!res.ok) return null
    const data = await res.json() as { access_token: string; refresh_token: string }
    setAuthTokens(data)
    return data.access_token
  } catch {
    return null
  }
}
