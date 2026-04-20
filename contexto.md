# IAnalista — Contexto do Projeto

## Identidade
- **Produto**: SaaS B2B de análise de eventos veiculares com IA para APVs (proteções veiculares)
- **Cliente exclusivo atual**: Loma Proteção Veicular
- **Repo**: `https://github.com/Victor-Hugo-Soares/analisa-ai`
- **Deploy**: Vercel (Hobby) — domínio `ianalista.com`
- **Supabase project ID**: `qqqjdvkasrtekgguyhat`
- **Diretório local**: `C:/Users/Victor Hugo/OneDrive/Documentos/Victor/analisa-ai`

---

## Nomenclatura (CRÍTICO)
- **Sinistros → Eventos** na UI (não alterar identificadores TypeScript/rotas/funções)
- **Segurados → Associados** na UI
- Logo, favicon e nome "IAnalista" mantidos — não usar branding Loma no sistema
- Identidade visual: navy `#1a2744`, teal `#0f766e`, amber `#f59e0b`, fonte Poppins

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.3 (App Router, Turbopack), React 19, TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (New York, Zinc, radix-ui v1) |
| IA | OpenAI SDK v6 — gpt-4.1-mini (200K TPM), Whisper-1 |
| Banco | Supabase (Postgres + Auth + Storage + RLS) |
| Cache local | localStorage (fallback offline) |
| Upload | react-dropzone → Supabase Storage (signed URL direto browser→Storage) |
| Outros | framer-motion, react-markdown, lucide-react, clsx, tailwind-merge, xlsx, pdf-parse |

---

## Design System
- Primary: `#1a2744` (navy)
- Secondary: `#0f766e` (teal)
- Accent: `#f59e0b` (amber)
- Background: `#f8fafc`
- Muted: `#64748b`
- Master/Admin UI: fundo `#0f172a`, badge dourado amber

---

## Arquitetura de Arquivos Chave

```
analisa-ai/
├── app/
│   ├── admin/
│   │   ├── page.tsx                          ← Painel master (role=master)
│   │   ├── usuarios/page.tsx                 ← Gestão de usuários (master)
│   │   └── aprendizados/page.tsx             ← Gerenciar aprendizados da IA
│   ├── api/
│   │   ├── analyze/route.ts                  ← Pipeline IA (maxDuration=300)
│   │   ├── auth/signin/route.ts              ← Login Supabase → retorna role
│   │   ├── auth/signup/route.ts              ← Cadastro empresa + usuário
│   │   ├── auth/refresh/route.ts             ← Refresh de token
│   │   ├── admin/empresas/route.ts           ← GET todas empresas (master only)
│   │   ├── admin/empresas/[id]/route.ts      ← PATCH configurações empresa
│   │   ├── admin/aprendizados/route.ts       ← GET lista aprendizados (master)
│   │   ├── admin/aprendizados/[id]/route.ts  ← PATCH status aprendizado
│   │   ├── admin/aprendizados/[id]/registrar ← POST registra aprendizado na IA
│   │   ├── admin/usuarios/route.ts           ← GET/POST usuários (master)
│   │   ├── admin/usuarios/[id]/route.ts      ← PATCH/DELETE usuários (master)
│   │   ├── admin/backfill-storage-paths      ← POST recupera storage_path existentes
│   │   ├── aprendizados/route.ts             ← POST cria aprendizado pendente
│   │   ├── notificacoes/route.ts             ← GET/PATCH notificações
│   │   ├── sinistros/route.ts                ← GET lista (Bearer token)
│   │   ├── sinistros/[id]/route.ts           ← GET single + PATCH status + DELETE
│   │   ├── sinistros/[id]/download-url       ← GET signed download URL (5 min)
│   │   ├── sinistros/generate-id/route.ts    ← GET próximo EVT-XXX atômico
│   │   ├── sinistros/save/route.ts           ← POST persiste após análise
│   │   ├── sinistros/upload-url/route.ts     ← POST gera signed upload URL
│   │   ├── usuarios/route.ts                 ← GET/POST usuários da empresa
│   │   └── usuarios/[id]/route.ts            ← PATCH/DELETE usuário da empresa
│   ├── configuracoes/page.tsx                ← Dados da empresa (read-only)
│   ├── dashboard/page.tsx                    ← Cards stats + lista recente
│   ├── relatorios/page.tsx                   ← Stats + exportação XLSX
│   ├── sinistros/
│   │   ├── page.tsx                          ← Lista com busca e filtros
│   │   ├── [id]/page.tsx                     ← Detalhe + resultado análise
│   │   └── novo/page.tsx                     ← Wizard 4 steps
│   └── usuarios/page.tsx                     ← Gestão de usuários da empresa
├── components/
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   └── SinistrosList.tsx
│   ├── layout/
│   │   ├── Header.tsx                        ← Notificações (poll 30s), tema, logout
│   │   └── Sidebar.tsx
│   └── sinistro/
│       ├── AnaliseStep.tsx                   ← Step 4 — oculta nomes de vendors
│       ├── ChatSinistro.tsx                  ← Chat IA por sinistro
│       ├── DadosStep.tsx
│       ├── DocumentosStep.tsx                ← Upload PDF/imagem/áudio/vídeo
│       ├── ResultadoAnalise.tsx              ← UI resultado + modal de decisão
│       └── TipoEventoStep.tsx
├── lib/
│   ├── db.ts           ← CRUD server-side Supabase + generateSinistroId
│   ├── knowledge.ts    ← Base de conhecimento Loma (regulamento + fraude + cinemática)
│   ├── openai.ts       ← buildSystemPrompt + AUDIO_TONE_PROMPT + fetchAprendizados
│   ├── storage.ts      ← localStorage CRUD + helpers auth + isMaster() + canManageUsers()
│   ├── supabase.ts     ← createClient() browser + createServerClient() service_role
│   ├── types.ts        ← Todos os tipos TypeScript
│   └── useTheme.ts     ← Hook dark mode
└── supabase/migrations/
    └── 20260417_sinistro_counters.sql        ← Tabela + RPC contador atômico (JÁ APLICADO)
```

---

## Autenticação e Roles

### Roles
- `master` — acesso total, painel `/admin`, gerencia todas as empresas
- `gestor` — gerencia usuários e eventos da própria empresa, pode excluir eventos
- `admin` — reservado (sem distinção prática atual)
- `usuario` — acesso padrão

### Usuário Master
- **Email**: `vsoareslins452@gmail.com`
- **Senha**: `@Victaosk8`
- Login redireciona para `/admin`

### Fluxo de Auth
1. `POST /api/auth/signin` → `{ session, usuario: { role, empresa_id, ... } }`
2. Tokens salvos em `localStorage("ianalista_auth")`
3. Sessão em `localStorage("ianalista_session")` — inclui `role`, `usuario_id`, `empresa_id`
4. Rotas autenticadas: `Authorization: Bearer <access_token>`

### Helpers (`lib/storage.ts`)
- `getSession()` / `setSession()`
- `getRole()`, `isMaster()`, `canManageUsers()` (master ou gestor)
- `getAccessToken()` / `setAuthTokens()`
- `getEmpresaIdFromSession()`
- `fetchWithAuth(url, options, router)` — fetch + auto-logout em 401

---

## Banco de Dados (Supabase)

### Tabelas
- `empresas` — id, nome, cnpj, email, plano, ativo, limite_usuarios, nivel_acesso, criado_em
- `usuarios` — id, empresa_id, nome, email, role, criado_em
- `sinistros` — id, empresa_id, usuario_id, tipo_evento, status, nome_segurado, cpf, placa, data_hora_sinistro, local, relato, analise (jsonb), criado_em, atualizado_em
- `arquivos` — id, sinistro_id, nome, tipo, tamanho, storage_path, criado_em
- `aprendizados` — id, empresa_id, usuario_id, sinistro_id, conteudo, status, conteudo_editado, criado_em, revisado_em, revisado_por
- `notificacoes` — id, empresa_id, titulo, mensagem, lida, criado_em
- `sinistro_counters` — empresa_id (PK), contador

### Constraints
- `usuarios_role_check`: `master | admin | gestor | usuario`

### Storage
- Bucket: `sinistros-arquivos` (privado)
- Upload via signed URL (browser → Supabase direto, não passa pela Vercel)
- Download via `/api/sinistros/[id]/download-url` (signed URL de 5 min)

### RLS
- `get_empresa_id()` → empresa_id do user autenticado
- Políticas por empresa_id em todas as tabelas
- `sinistro_counters`: service_role acesso total

### RPC Functions
- `increment_sinistro_counter(p_empresa_id UUID) → INTEGER` — atômico, sem race condition

---

## Pipeline IA (`/api/analyze`)

- `export const maxDuration = 300` — limite Hobby da Vercel
- **Modelos**:
  - `gpt-4.1-mini` (200K TPM) — análise principal + OCR de documentos (vision)
  - `whisper-1` — transcrição de áudio com timestamps
- **Com áudio**: fluxo 2 chamadas
  - Call 1: Whisper transcrição → diarização ([ATENDENTE]/[ASSOCIADO]) → tom vocal
  - Call 2: documentos + imagens sem áudio → integração com áudio → JSON final
- **Sem áudio**: 1 chamada (prompt documental reduzido para furto/roubo)
- `max_tokens`:  6000 nas calls principais, 12000 na diarização

### IDs de Evento
- Formato: `EVT-001`, `EVT-002`, ... (por empresa, atômico via PostgreSQL)
- Fallback: `EVT-${Date.now().toString(36).toUpperCase().slice(-5)}`

### JSON de Saída (`AnaliseIA`)
```typescript
{
  resumo, linha_do_tempo, pontos_verdadeiros, pontos_atencao,
  contradicoes, indicadores_fraude,
  analise_audio?: { transcricao_completa, tom_voz, perfil_emocional,
                    momentos_alterados, padroes_suspeitos, contradicoes_com_relato },
  analise_imagens?: { descricao, consistencia_relato, observacoes, indicadores_autenticidade },
  analise_bo?: { numero_bo, data_registro, data_evento_declarado, intervalo_registro,
                 narrativa_bo, consistencia_relato, alertas },
  nivel_risco: "BAIXO" | "MEDIO" | "ALTO" | "CRITICO",
  score_confiabilidade: number,  // 0-100
  recomendacao: "APROVACAO_RECOMENDADA" | "APROVACAO_COM_RESSALVAS" |
                "INVESTIGACAO_NECESSARIA" | "AGUARDAR_DOCUMENTOS" | "RECUSA_RECOMENDADA",
  justificativa_recomendacao, proximos_passos
}
```

### Tipos de Documento no Upload
`TipoDocumento`: `bo | crlv | crv | cnh | laudo_pericial | orcamento | nota_fiscal | rastreamento | declaracao_segurado | laudo_medico | procuracao | croqui | fotos_pdf | fipe | sindicancia | mapa_local | outro`

- `sindicancia`: OCR extrai empresa sindicante, danos, conclusão, nexo causal
- `mapa_local`: print Google Maps — OCR extrai tipo de via, faixas, sinalização, contexto; ETAPA 1 da cinemática usa como fonte primária

### Tipos de Arquivo Aceitos
- `audio`: mp3, wav, m4a, webm, ogg, flac
- `imagem`: jpg, png, webp
- `video`: mp4 (até 100MB — IA apenas informa, analista revisa manualmente)
- `documento`: PDF ou foto de documento (OCR via vision)

### Sistema de Aprendizado
- Ao decidir (Aprovar/Recusar/Solicitar Informações), modal obriga motivo escrito
- Motivo → aprendizado `pendente` → master aprova → `registrado`
- Aprendizados registrados injetados no system prompt de análises futuras

---

## Modelo de Negócio — Furto e Roubo (CRÍTICO)

### Contexto estratégico
A diretoria da Loma definiu que o uso principal da IA é em eventos de **furto e roubo**.
Esses eventos **já chegam ao IAnalista após uma análise interna da Loma**, conduzida por sindicante.

### O que isso significa
- A IA **não é triagem primária** para furto/roubo — é **segunda opinião e validação**
- Os eventos entram no sistema já com o pacote documental completo:
  - Relatório de sindicância (sindicante Loma)
  - Perícia técnica
  - Dinâmica de velocidade e/ou reconstituição
  - BO, CRLV, CNH, declaração do associado, rastreamento, etc.
- A IA deve **cruzar e validar** a análise do sindicante, não substituí-la
- O prompt de furto/roubo deve reconhecer e interpretar relatórios de sindicância profissionais

### Implicações no sistema
- Novos tipos de documento obrigatórios: `sindicancia`, `pericia_tecnica`, `dinamica_evento`
- `knowledge.ts` deve ter seção específica para interpretar laudos de sindicância
- O `SYSTEM_PROMPT` de furto/roubo deve mencionar que a análise interna Loma já foi feita
- A recomendação final deve referenciar se a IA concorda ou diverge do sindicante
- Futuro: campo no formulário para informar o resultado da análise interna Loma

---

## Pré-Orçamento (Plano 15 dias)

### Contexto
- Loma **não é fornecedora** de peças — compra de fornecedores
- A IA deve **estimar** com base em orçamentos reais aprovados pela Loma como referência
- ~40 PDFs de orçamentos aprovados reais serão alimentados como material de treinamento

### Arquitetura planejada: `material_referencia` no Supabase
- Nova tabela: `material_referencia` — id, categoria, titulo, conteudo_texto, criado_em
- Categorias: `orcamento_aprovado | sindicancia_referencia | pericia_referencia | dinamica_referencia | outro`
- Admin master faz upload de PDF → `pdf-parse` extrai texto → salvo na tabela
- Na análise de colisão: os `orcamentos_aprovados` são injetados no prompt como contexto de preços reais
- Rota admin: `POST /api/admin/material-referencia` (upload + extração)
- Página admin: `/admin/material-referencia` — lista, upload, delete

### Por que não RAG (vetor)
- Volume de 40 PDFs é manejável via injeção seletiva por categoria
- Não há infra de embedding/pgvector ainda
- Injeção direta é mais simples e auditável para o MVP
- Se o volume crescer muito no futuro, migrar para pgvector

---

## Regras Críticas de Arquitetura

- Params de route handlers devem ser awaited (`const { id } = await params`) — Next.js 16
- `export const maxDuration = 300` obrigatório em `/api/analyze` (plano Hobby)
- **Nunca** base64 em JSON via Vercel (limite 4.5MB → 413). Fallback base64 apenas < 2MB
- Upload: browser → `/api/sinistros/upload-url` → signed URL → Supabase Storage direto
- `createServerClient()` = service_role (bypassa RLS) — só em server
- `createClient()` = anon key (RLS ativo) — para browser
- Ícones do Lucide: **nunca importar `Image`** — conflita com `next/image`. Usar `ImageIcon`
- **Sem IIFE dentro de JSX** — Turbopack rejeita `{(() => { return <div /> })()}`
- Siblings no `return` devem ser envoltos em Fragment `<>...</>`
- Tailwind v4: **sem** `tailwind.config.ts` — cores em CSS variables no `globals.css` via `@theme inline {}`
- Classes dinâmicas com interpolação (`bg-${color}`) **não funcionam** — usar classes estáticas
- shadcn/ui: usa `radix-ui` (pacote unificado), **não** `@radix-ui/react-*` individuais
- `storage_path` sempre salvo no DB e lido de volta — nunca confiar no localStorage para isso
- Sanitizar filename antes de upload: NFD normalize → remove acentos → especiais → hífen
- GPT-4o **não** suporta PDF inline — usar `pdf-parse` server-side
- `IANALISTA_LINGUISTICA` (~1.200 tokens) omitido quando não há áudio (`temAudio: false`)

---

## Funcionalidades Implementadas (estado atual — sessão 11)

| Área | Status | Detalhe |
|---|---|---|
| Auth | ✅ Completo | Login, signup, refresh, roles, auto-logout 401 |
| Dashboard | ✅ Completo | 4 cards stats + lista 8 recentes |
| Novo Evento | ✅ Completo | Wizard 4 steps, IDs EVT-XXX, upload signed URL |
| Pipeline IA | ✅ Completo | Áudio (Whisper+diarização), Imagens (vision), Docs (pdf-parse+OCR), recomendação |
| Resultado Análise | ✅ Completo | ResultadoAnalise.tsx com modal de decisão, Google Maps, download arquivos |
| Chat IA | ✅ Completo | ChatSinistro.tsx — chat contextual por evento |
| Lista de Eventos | ✅ Completo | Busca, filtros por status, delete com confirmação |
| Exportação | ✅ Completo | XLSX com SheetJS (não PDF) |
| Admin — Empresas | ✅ Completo | CRUD, stats por empresa, nível acesso, plano |
| Admin — Usuários | ✅ Completo | CRUD cross-empresa (master) |
| Gestão Usuários | ✅ Completo | CRUD por empresa (gestor/admin) |
| Aprendizados IA | ✅ Completo | Fluxo pendente→aprovado→registrado, injeção no prompt |
| Notificações | ⚠️ Parcial | Endpoint GET/PATCH existe, Header polls 30s, UI básica |
| Configurações | ⚠️ Parcial | Dados empresa read-only (sem edição, sem integrações) |
| Dark Mode | ⚠️ Preparado | `useTheme.ts` + toggle no Header, cobertura incompleta |
| Relatórios Gráficos | ❌ Ausente | Só stats e export Excel |
| Paginação | ❌ Ausente | Listas sem paginação |

---

## Missão 15 dias (até ~02/05/2026) — Prioridade máxima

### 1. Material de Referência (base para pré-orçamento)
- [ ] Tabela `material_referencia` no Supabase (migration)
- [ ] `POST /api/admin/material-referencia` — upload PDF → extração texto → salvar
- [ ] `GET /api/admin/material-referencia` — listar por categoria
- [ ] `DELETE /api/admin/material-referencia/[id]`
- [ ] Página `/admin/material-referencia` — UI de upload e gestão
- [ ] Injeção seletiva no prompt de colisão: orçamentos aprovados como contexto de preços

### 2. Pré-Orçamento real (colisão)
- [ ] Reativar `pre_orcamento` no JSON de saída da IA
- [ ] Prompt atualizado: usar material de referência real (não tabela hardcoded)
- [ ] UI em `ResultadoAnalise.tsx` com tabela de itens + totais
- [ ] Tipos em `lib/types.ts`: `PreOrcamentoItem`, `PreOrcamento`

### 4. Curadoria de prompts da analista sênior
- Analista sênior usava prompts manuais no ChatGPT para análise
- Victor enviará cada prompt nas sessões — Claude fará curadoria:
  - **Adiciona**: lógica não coberta pela knowledge.ts atual, critérios específicos Loma, padrões empíricos
  - **Descarta**: redundante com o que já existe, genérico demais, incompatível com fluxo estruturado
  - **Adapta**: prompts manuais bons que precisam virar regras no SYSTEM_PROMPT
- Objetivo: absorver o conhecimento tácito da analista para a IA antes do go-live

### 3. Furto/Roubo — segunda opinião
- [x] Tipos `sindicancia` e `mapa_local` adicionados (lib/types.ts + OCR route + knowledge.ts)
- [ ] Tipos adicionais: `pericia_tecnica`, `dinamica_evento`
- [ ] `knowledge.ts`: seção específica para interpretar laudos de sindicância profissionais
- [ ] `SYSTEM_PROMPT` furto/roubo: reconhecer análise interna Loma já feita
- [ ] Recomendação final: mencionar concordância/divergência com sindicante
- [ ] Campo no formulário (DadosStep): resultado da análise interna Loma (opcional)

---

## Backlog Geral (após missão)

- [ ] Gráficos na página de relatórios (evolução temporal, distribuição por tipo)
- [ ] Paginação na lista de eventos
- [ ] Configurações — edição de dados da empresa
- [ ] Notificações — polish da UI
- [ ] Dark mode completo em todas as páginas
- [ ] Upgrade Vercel Pro (remove limite 300s e 6 execuções simultâneas)
- [ ] Upgrade OpenAI Tier 2 (2M TPM → migrar para gpt-4o ou gpt-4.1) — aguardando desbloqueio

---

## Checklist Pré-Lançamento

- [x] Migration `sinistro_counters` aplicada (sessão 11 via MCP Supabase)
- [ ] Confirmar bucket `sinistros-arquivos` privado no Supabase Storage
- [ ] Confirmar tabela `aprendizados` com todas as colunas
- [ ] Backfill storage_path: `POST /api/admin/backfill-storage-paths` (se houver sinistros antigos)
- [ ] Variáveis de ambiente na Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`
- [ ] Plano Vercel Hobby: máx 6 execuções simultâneas (com 4 analistas, já no limite)

---

## Regras de Resposta do Agente

> **Reduzir tokens nas respostas, nunca nos pensamentos.**

- Agir diretamente sem preamble
- Não resumir o que foi feito após concluir — o diff fala por si
- Não repetir código já existente — referenciar por arquivo:linha
- Preferir `Edit` (diff) a `Write` (reescrita total)
- Executar operações independentes em paralelo
- Ler só as seções necessárias de arquivos grandes (offset/limit)
- Sem docstrings, comentários ou type annotations em código não modificado
- Sem abstrações prematuras, sem error handling para cenários impossíveis

---

## Histórico de Sessões

### Sessão 1 — Setup e Estrutura Completa (09/04/2026)
- Projeto Next.js 16 do zero, dependências, shadcn/ui, design system
- lib/types.ts, lib/storage.ts, lib/openai.ts
- Auth simulada, dashboard, formulário multi-step, upload react-dropzone
- Pipeline IA: Whisper + Vision + GPT-4o
- Integração completa Supabase (Auth + DB + RLS)

### Sessão 2 — Perfil Master e Correções de Produção (09-10/04/2026)
- Roles: master, admin, usuario; painel /admin
- Corrigido timeout Vercel (maxDuration=300), erro silencioso de análise, 413 (signed URL)

### Sessão 3 — Rebranding e Base de Conhecimento (10/04/2026)
- Base de conhecimento Loma criada (lib/knowledge.ts) com regulamento + fraude
- PDFs lidos com pdf-parse; tipo de documento no upload (tipoDoc)
- Conflito Image vs ImageIcon corrigido; / → /login definitivo

### Sessão 4 — IA Avançada (13/04/2026)
- knowledge.ts v2.0: Forense de Imagens, Linguística Forense, Score de Risco, Telemetria/GPS, Fraude por IA generativa
- Pipeline de áudio refatorado: Whisper → diarização GPT → análise de tom (só [ASSOCIADO])

### Sessão 5 — Auditoria e 18 Correções (14/04/2026)
- Schema JSON documentado, dupla análise obrigatória, validação de entrada
- Retry com backoff, distinção ERRO SISTEMA vs PENDÊNCIA DOCUMENTAL
- Instruções por tipo de documento, comparação cruzada de fotos

### Sessão 6 — Gestão de Usuários, Dark Mode, Cinemática (16/04/2026)
- Gestão de usuários por empresa (/usuarios) e master (/admin/usuarios)
- lib/useTheme.ts (dark mode)
- Knowledge base: cinemática de colisão (V=√(R×g×μ), CTB Art.218)
- Status aguardando_informacoes; fix constraint gestor; fix login page

### Sessão 7 — IDs Sequenciais, Fix Build/Deploy (16/04/2026)
- EVT-001, EVT-002... por empresa via sinistro_counters + RPC atômico
- Migration 20260417_sinistro_counters.sql
- Fix build: Fragment <>...</>; fix deploy: maxDuration 600→300

### Sessão 8 — Maps, Vídeo MP4, Fix Crítico Áudio (16/04/2026)
- Google Maps no campo local (link se endereço válido)
- Suporte a vídeo MP4 (100MB, IA informa, analista revisa)
- Fix crítico: max_tokens 4000→6000 + fluxo 2-call estendido para todos os eventos com áudio
- Pré-orçamento removido da UI e da KB

### Sessão 9 — Fix Transcrição Incompleta (16/04/2026)
- max_tokens diarização 4000→12000
- Fallback: se output diarizado < 40% do bruto, usa transcrição bruta

### Sessão 10 — Exclusão, Excel, Fotos de Documentos (17/04/2026)
- DELETE /api/sinistros/[id] com cascade (arquivos → aprendizados → sinistro)
- Exportação XLSX com SheetJS (substituiu CSV)
- DocDropzone aceita JPG/PNG/WEBP; OCR via gpt-4.1-mini vision por tipo
- Novo tipo fipe; sanitização de filename (acentos/especiais → hífen)
- Fix JSON 413/timeout: response.text() + try/catch antes de JSON.parse

### Sessão 11 — Migration via MCP Supabase (17/04/2026)
- MCP Supabase conectado e funcional
- Migration sinistro_counters aplicada diretamente via MCP (tabela + RPC)
- Auditoria completa do codebase: backlog revisado, contexto.md reescrito

### Sessão 12 — Fix Build, Vercel Pro e Protocolo Manual (17/04/2026)
- Fix TypeScript build: `result.analise` unknown → `AnaliseIA | undefined`
- maxDuration 300 → 800s: Vercel Pro contratado (áudios até ~20 min processam confortavelmente)
- Protocolo manual substituiu ID auto-gerado (EVT-001): analista digita número do protocolo existente
- Fix cascata 401 → evento null: sinistroId agora vem do campo Protocolo (string, nunca null)
- Fix status `aguardando_informacoes` não salvava: migration `20260417_sinistros_status_check.sql`
- Polling notificações e upload-url migrados para `fetchWithAuth`

### Sessão 13 — Calibração Pré-Orçamento + Sindicância + Mapa Local (19/04/2026)
- **Calibração IANALISTA_PREORCAMENTO_COLISAO** com 7 orçamentos reais autorizados Cilia:
  - Taxa M.O.: R$75/h → R$65/h padrão, R$50/h econômico (dado real de 4/5 orçamentos)
  - Lanterna traseira econômico: corrigida faixa com base em Saveiro G5 (R$159,90 real)
  - Espelho retrovisor médio: R$150–400 → R$200–700 (Saveiro G5 com eletrônico = R$645)
  - Farol intermediário: mínimo R$450 → R$400 (EcoSport 2008 = R$428)
  - Adicionados: Painel traseiro, Lateral externa corte parcial, Quadro do radiador
  - Adicionados serviços: Vistoria de imagem R$90, Desmontagem interior, Reparo aro de roda
  - Nota: reguladora negocia genuína (ex: porta Onix R$3.350 → R$950 aprovado)
  - Alinhamento de geometria: R$120–250 → R$80–180
- **Tipos sindicancia + mapa_local** (`lib/types.ts`, `route.ts analyze`, `DocumentosStep.tsx`):
  - `sindicancia`: OCR extrai empresa sindicante, danos, nexo causal, conclusão
  - `mapa_local`: OCR extrai tipo de via, faixas, sinalização → alimenta ETAPA 1 cinemática
  - ETAPA 1 de IANALISTA_CINEMATICA_COLISAO atualizada: mapa_local = fonte primária; divergência com relato → RED FLAG
