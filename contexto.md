# IAnalista — Contexto do Projeto

## Identidade
- **Produto**: SaaS B2B de análise de sinistros veiculares com IA
- **Público-alvo**: Seguradoras e proteções veiculares (APVs)
- **Repo**: `https://github.com/Victor-Hugo-Soares/analisa-ai`
- **Deploy**: Vercel (Hobby) — `analisa-ai-git-main-victor-hugo-soares-projects.vercel.app`
- **Diretório**: `C:/Users/Victor Hugo/Documents/victor/analisa-ai`

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.3 (App Router, Turbopack), React 19, TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (New York, Zinc, radix-ui v1) |
| IA | OpenAI SDK v6 — gpt-4.1-mini (200K TPM), gpt-4.1 (30K TPM), Whisper-1 |
| Banco | Supabase (Postgres + Auth + Storage + RLS) |
| Cache local | localStorage (fallback offline) |
| Upload | react-dropzone → Supabase Storage (signed URL direto browser→Storage) |
| Outros | framer-motion, react-markdown, lucide-react, clsx, tailwind-merge |

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
│   │   └── aprendizados/page.tsx             ← Gerenciar aprendizados da IA
│   ├── api/
│   │   ├── analyze/route.ts                  ← Pipeline IA (maxDuration=300)
│   │   ├── auth/signin/route.ts              ← Login Supabase → retorna role
│   │   ├── auth/signup/route.ts              ← Cadastro empresa + usuário
│   │   ├── admin/empresas/route.ts           ← GET todas empresas (master only)
│   │   ├── admin/empresas/[id]/route.ts      ← PATCH configurações empresa
│   │   ├── admin/aprendizados/route.ts       ← GET lista aprendizados (master)
│   │   ├── admin/aprendizados/[id]/route.ts  ← PATCH status aprendizado
│   │   ├── admin/aprendizados/[id]/registrar ← POST registra aprendizado na IA
│   │   ├── admin/backfill-storage-paths      ← POST recupera storage_path existentes
│   │   ├── aprendizados/route.ts             ← POST cria aprendizado pendente
│   │   ├── sinistros/route.ts                ← GET lista (Bearer token)
│   │   ├── sinistros/[id]/route.ts           ← GET single + PATCH status (auth)
│   │   ├── sinistros/[id]/download-url       ← GET signed download URL (5 min)
│   │   ├── sinistros/generate-id/route.ts    ← GET próximo EVT-XXX atômico
│   │   ├── sinistros/save/route.ts           ← POST persiste após análise
│   │   └── sinistros/upload-url/route.ts     ← POST gera signed upload URL
├── components/sinistro/
│   ├── ResultadoAnalise.tsx                  ← UI resultado + modal de decisão
│   ├── AnaliseStep.tsx                       ← Step 4 — oculta nomes de vendors
│   └── ChatSinistro.tsx                      ← Badge "IA online" (não "GPT-4o")
├── lib/
│   ├── types.ts        ← Todos os tipos TypeScript
│   ├── openai.ts       ← buildSystemPrompt + AUDIO_TONE_PROMPT + fetchAprendizados
│   ├── knowledge.ts    ← Base de conhecimento separada por tipo de evento
│   ├── supabase.ts     ← createClient() browser + createServerClient() service_role
│   ├── db.ts           ← CRUD server-side Supabase + generateSinistroId
│   └── storage.ts      ← localStorage CRUD + helpers auth + isMaster()
└── supabase/migrations/
    └── 20260417_sinistro_counters.sql        ← Tabela + função RPC contador atômico
```

---

## Autenticação e Roles

### Roles
- `master` — acesso total, painel `/admin`, gerencia todas as empresas
- `admin` — (reservado para futura implementação)
- `usuario` — acesso padrão da empresa

### Usuário Master
- **Email**: `vsoareslins452@gmail.com`
- **Senha**: `@Victaosk8`
- Login redireciona automaticamente para `/admin`
- Único capaz de acessar `/admin` e `/api/admin/*`

### Fluxo de Auth
1. `POST /api/auth/signin` → retorna `{ session, usuario: { role, empresa_id, ... } }`
2. Tokens salvos em `localStorage("ianalista_auth")`
3. Sessão salva em `localStorage("ianalista_session")` — inclui `role` e `usuario_id`
4. Rotas autenticadas: `Authorization: Bearer <access_token>`

### Helpers (`lib/storage.ts`)
- `getSession()` / `setSession()` — sessão com `role`, `usuario_id`, `empresa_id`
- `getRole()` → `RoleUsuario | null`
- `isMaster()` → boolean
- `getAccessToken()` / `setAuthTokens()`
- `getEmpresaIdFromSession()` → `session.id`
- `fetchWithAuth(url, options, router)` — fetch com token + auto-logout em 401

---

## Banco de Dados (Supabase)

### Tabelas
- `empresas` — id, nome, cnpj, email, plano, ativo, limite_usuarios, nivel_acesso, criado_em
- `usuarios` — id, empresa_id, nome, email, role, criado_em
- `sinistros` — id, empresa_id, usuario_id, tipo_evento, status, nome_segurado, cpf, placa, data_hora_sinistro, local, relato, analise (jsonb), criado_em, atualizado_em
- `arquivos` — id, sinistro_id, nome, tipo, tamanho, **storage_path**, criado_em
- `aprendizados` — id, empresa_id, sinistro_id, conteudo, status (pendente/aprovado/registrado), criado_em
- `sinistro_counters` — empresa_id (PK), contador — **criada via migration 20260417**

### Storage
- Bucket: `sinistros-arquivos` (privado)
- Upload via **signed URL** (browser → Supabase direto, não passa pela Vercel)
- Download via `/api/sinistros/[id]/download-url` (signed URL de 5 min)

### RLS
- `get_empresa_id()` → empresa_id do user autenticado
- Políticas por empresa_id em todas as tabelas
- `sinistro_counters`: policy `service_role acesso total`

### RPC Functions
- `increment_sinistro_counter(p_empresa_id UUID) → INTEGER` — atômico, sem race condition
  - `INSERT ... ON CONFLICT DO UPDATE RETURNING contador`
  - Garante que 4 usuários simultâneos nunca recebem o mesmo EVT-XXX

---

## Pipeline IA (`/api/analyze`)

- `export const maxDuration = 300` — limite máximo do plano Hobby da Vercel
- **Modelos em uso**:
  - `gpt-4.1-mini` (200K TPM) — análise de colisão, natureza, vidros, transcrição cruzada furto/roubo
  - `gpt-4.1` (30K TPM) — **não usado** (mesmo limite que gpt-4o, evitar)
  - `whisper-1` — transcrição de áudio com timestamps
- **Fluxo padrão** (colisão, natureza, vidros): 1 chamada `gpt-4.1-mini`
- **Fluxo 2-call** (furto/roubo com áudio):
  - Call 1: Whisper transcrição + GPT tom de voz (paralelo)
  - Call 2: `gpt-4.1-mini` análise cruzada (texto + áudio + docs)
  - Omite seções da KB irrelevantes para economizar tokens
- **Furto/roubo sem áudio**: usa `buildSystemPromptDocumental` (sem análise linguística)
- Todos os logs de uso incluem `[TPM]` para monitoramento

### IDs de Evento
- Formato: `EVT-001`, `EVT-002`, ... (por empresa, sem colisão)
- Gerado em `/api/sinistros/generate-id` (GET autenticado)
- Atomicidade garantida pelo PostgreSQL via `sinistro_counters` + RPC
- Fallback local em caso de erro: `EVT-${Date.now().toString(36).toUpperCase().slice(-5)}`

### Sistema de Aprendizado
- Ao tomar decisão (Aprovar/Recusar/Solicitar Informações), modal obriga o analista a escrever o motivo
- Motivo salvo como `aprendizado` com status `pendente`
- Formato: `[DECISÃO: Aprovar Evento] motivo do analista`
- Master aprova no `/admin/aprendizados` → status `aprovado` → master registra → status `registrado`
- Aprendizados registrados são injetados no system prompt de todas as análises futuras (`fetchAprendizadosRegistrados`)

---

## Observações Críticas

### Turbopack / Next.js 16
- **Sem IIFE dentro de JSX** — Turbopack rejeita `{(() => { return <div /> })()}`
- Componentes JSX devem ter nome com **letra maiúscula** (`const ModalIcon = ...` antes do `return`)
- Siblings no `return` devem ser envoltos em Fragment `<>...</>`
- Params de route handlers **devem ser awaited**: `const { id } = await params`

### Tailwind v4
- **Sem** `tailwind.config.ts` — cores em CSS variables no `globals.css` via `@theme inline {}`
- Classes dinâmicas com interpolação (`bg-${color}`) **não funcionam** — usar classes estáticas

### shadcn/ui com Next.js 16 + React 19
- Usa `radix-ui` (pacote unificado), **não** `@radix-ui/react-*` individuais
- Import: `import { Slot } from "radix-ui"`

### Vercel — Limites
- Body limit: **4.5MB** — nunca enviar base64 de arquivos grandes via JSON
- `maxDuration` máximo no plano **Hobby: 300s** (plano Pro: sem limite prático)
- Solução de upload: browser → Supabase Storage via signed URL (não passa pela Vercel)

### Supabase
- `createServerClient()` usa `service_role` — bypassa RLS, usar apenas em server
- `createClient()` usa `anon key` — RLS ativo, para browser
- `storage_path` sempre salvo no DB e lido de volta — nunca confiar no localStorage para isso

---

## ⚠️ Checklist Pré-Lançamento (AÇÕES MANUAIS NECESSÁRIAS)

> Execute antes de colocar o primeiro cliente em produção.

- [ ] **Aplicar migration do contador**: no Supabase SQL Editor, executar o conteúdo de `supabase/migrations/20260417_sinistro_counters.sql` (cria tabela `sinistro_counters` e função RPC `increment_sinistro_counter`)
- [ ] **Verificar bucket de storage**: confirmar que o bucket `sinistros-arquivos` existe no Supabase Storage e está configurado como **privado**
- [ ] **Verificar tabela `aprendizados`**: confirmar que a tabela existe com colunas `id, empresa_id, sinistro_id, conteudo, status, criado_em`
- [ ] **Backfill de storage_path**: se já existem sinistros no banco sem `storage_path`, acessar `POST /api/admin/backfill-storage-paths` com token master para recuperá-los
- [ ] **Plano Vercel**: plano Hobby suporta até 6 execuções serverless simultâneas — com 4 analistas, está no limite. Considerar upgrade para Pro se houver lentidão
- [ ] **Variáveis de ambiente**: confirmar no painel da Vercel que todas estão definidas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`

---

## Regras de Resposta do Agente

> **Reduzir tokens nas respostas, nunca nos pensamentos.**

- Agir diretamente sem preamble — nunca explicar o que vai fazer antes de fazer
- Não resumir o que foi feito após concluir — o diff fala por si
- Não repetir código já existente — referenciar por arquivo:linha
- Preferir `Edit` (diff) a `Write` (reescrita total)
- Executar operações independentes em paralelo
- Leia só as seções necessárias de arquivos grandes (usar offset/limit)
- Sem docstrings, comentários ou type annotations em código não modificado
- Sem error handling para cenários impossíveis
- Sem abstrações prematuras — complexidade = o que a tarefa exige

---

## Histórico de Sessões

### Sessão 1 — Setup e Estrutura Completa (09/04/2026)
- [x] Projeto Next.js 16 criado do zero, dependências, shadcn/ui
- [x] Design system, lib/types.ts, lib/storage.ts, lib/openai.ts
- [x] Auth simulada (login + cadastro)
- [x] Dashboard, formulário multi-step, upload react-dropzone
- [x] Pipeline IA: Whisper + Vision + GPT-4o
- [x] Página de resultado, /sinistros, /relatorios, /configuracoes
- [x] Integração completa com Supabase (Auth + DB + RLS)

### Sessão 2 — Perfil Master e Correções de Produção (09-10/04/2026)
- [x] Sistema de roles: `master`, `admin`, `usuario`
- [x] Usuário master criado no Supabase
- [x] Painel `/admin` — gerenciar empresas, limite_usuarios, nivel_acesso, ativo
- [x] API routes `/api/admin/empresas` protegidas por role=master
- [x] Sidebar mostra "Painel Master" apenas para role=master
- [x] Corrigido timeout Vercel: `export const maxDuration = 300`
- [x] Corrigido erro silencioso de análise: erro visível + botão retry
- [x] Página `/sinistros/[id]` busca Supabase como fallback ao localStorage
- [x] Corrigido 413 Request Entity Too Large: upload via signed URL

### Sessão 3 — Rebranding, Conversão e Padronização (10/04/2026)
- [x] Remoção de cadastro público (`/cadastro` não acessível pela interface)
- [x] Login atualizado: mostra contato WhatsApp em vez de cadastro
- [x] Painel `/admin` — Modal "Nova Empresa" completo
- [x] Landing Page — conversão completa com botão WhatsApp
- [x] Refatoração de cores: navy `#1a2744` em Header/Sidebar/Dashboard
- [x] Correção de bugs de codificação UTF-8 no deploy

### Sessão 4 — Qualidade, Segurança e Sistema de Aprendizado (15-16/04/2026)
- [x] Arquivos do resultado clicáveis (download via signed URL de 5 min)
- [x] `storage_path` salvo corretamente no banco e lido de volta na tela
- [x] Endpoint `/api/sinistros/[id]/download-url` com validação de ownership
- [x] Segurança: `/api/sinistros/[id]` (GET + PATCH) agora requer autenticação + empresa_id
- [x] Vendor names ocultados: "Whisper" → "transcrevendo áudio", "GPT-4o" → "IA online"
- [x] Migração de modelos: gpt-4.1-mini (200K TPM) para análises — sem risco de estourar 30K TPM
- [x] Fluxo 2-call para furto/roubo com áudio (evita limite TPM)
- [x] Furto/roubo sem áudio usa `buildSystemPromptDocumental` (sem linguística)
- [x] Otimização da knowledge base: omite seções irrelevantes por tipo de chamada (~3.5K tokens economizados)
- [x] Logs `[TPM]` em todas as 6 chamadas OpenAI para monitoramento
- [x] Sistema de aprendizado: `aprendizados` table, fluxo pendente→aprovado→registrado
- [x] Modal de decisão obrigatório: analista escreve motivo ao Aprovar/Recusar/Investigar
- [x] Aprendizados registrados injetados no system prompt de análises futuras
- [x] Endpoint `/api/admin/backfill-storage-paths` para recuperar dados históricos

### Sessão 5 — IDs Sequenciais Atômicos e Fix de Build (16/04/2026)
- [x] IDs de evento: formato `EVT-001` sequencial por empresa (sem colisão entre usuários)
- [x] `sinistro_counters` table + função RPC `increment_sinistro_counter` (PostgreSQL atômico)
- [x] Migration `supabase/migrations/20260417_sinistro_counters.sql`
- [x] Endpoint `/api/sinistros/generate-id` (GET autenticado, retorna próximo EVT-XXX)
- [x] `lib/storage.ts`: `generateId()` usa `crypto.randomUUID()` (sem colisão local)
- [x] Fix build: modal de decisão envolto em React Fragment `<>...</>` (erro "Expected ',', got '{'")
- [x] Fix deploy: `maxDuration` reduzido de 600 → 300 (limite plano Hobby Vercel)

### Sessão 6 — Gestão de Usuários, Dark Mode e Fixes (16/04/2026)
*(trabalho realizado em outro dispositivo — detalhes no git log)*
- [x] Gestão de usuários por empresa: `app/usuarios/page.tsx` (Gestor cria/edita/exclui)
- [x] Gestão de usuários no admin master: `app/admin/usuarios/page.tsx`
- [x] APIs: `GET/POST /api/usuarios`, `PATCH/DELETE /api/usuarios/[id]`
- [x] APIs admin: `GET/POST /api/admin/usuarios`, `PATCH/DELETE /api/admin/usuarios/[id]`
- [x] `lib/useTheme.ts`: hook de dark mode com toggle Moon/Sun no Header
- [x] Fix: login page sempre em modo claro (preserva logo)
- [x] Fix: dark mode na página de análise de imagem

### Sessão 11 — Fix Build, Vercel Pro e Limites de Áudio (17/04/2026)
- [x] **Fix TypeScript build error**: `result.analise` era `unknown` — cast para `AnaliseIA | undefined` em `app/sinistros/novo/page.tsx`; import de `AnaliseIA` adicionado
- [x] **maxDuration 300 → 800s**: Vercel Pro contratado; `app/api/analyze/route.ts` atualizado para aproveitar o novo limite
- [x] **Conflito de merge resolvido**: label `aguardando_informacoes` em `SinistrosList.tsx` (mantido "Aguardando Informações" do remote)
- **Contexto de performance**:
  - Áudio de 9 min levava ~5 min de processamento — estava no limite do plano Hobby (300s)
  - Com Pro (800s): áudios de até ~20 min processam confortavelmente
  - Limite Whisper: 25MB por arquivo (MP3 64kbps resolve até ~45 min de áudio)
  - Compressão reduz tamanho mas **não** reduz tempo de processamento (Whisper processa por duração)

### Sessão 12 — Protocolo Manual, Fixes de Auth e Estabilidade (17/04/2026)
- [x] **Protocolo manual**: campo "Protocolo" obrigatório no step 2 substituiu ID auto-gerado (EVT-001)
  - Analista digita o número do protocolo existente no sistema da empresa (ex: `202612158`)
  - Removida geração automática via `/api/sinistros/generate-id`
  - `DadosStep.tsx`: novo campo "Protocolo" como primeiro campo do formulário
  - `canProceed()` exige protocolo preenchido para avançar do step 2
- [x] **Fix cascata de 401 → "Evento null"**: token expirado derrubava toda a criação
  - `generate-id` usava `fetch` direto — 401 retornava JSON `{error}`, `data.id` undefined, `sinistroId` ficava `null`
  - Risco eliminado: `sinistroId` agora é `string` (nunca `null`) e vem do campo Protocolo
  - `Header.tsx`: polling de notificações a cada 30s migrado para `fetchWithAuth`
  - `upload-url`: migrado para `fetchWithAuth` (fix anterior desta sessão)
- [x] **Fix status `aguardando_informacoes` não salvava no banco**
  - Causa: CHECK constraint da tabela `sinistros` não incluía o novo status
  - Fix: `ALTER TABLE sinistros` executado no Supabase SQL Editor
  - Migration criada: `supabase/migrations/20260417_sinistros_status_check.sql`
- [x] **Fix TypeScript build** (`result.analise: unknown → AnaliseIA | undefined`) — build que estava falhando na Vercel
- [x] **maxDuration 300 → 800s** — Vercel Pro contratado; análise de 9 min levava ~9:30 min, agora tem margem até ~13 min
- [x] **Texto estimativa de análise**: "até 2 minutos" → "até 10 minutos" em `AnaliseStep.tsx`
- **Tier 2 OpenAI**: exige $50 **gastos** (não recarregados) + 7 dias — ainda não atingido

### Sessão 9 — Fix Transcrição Incompleta e Tier 2 OpenAI (16/04/2026)
- [x] **Fix**: transcrição de áudio truncando (~10min em áudio de 13min)
  - Causa: `diarizeTranscription` usava `max_tokens: 4000` — cortava a saída para áudios longos
  - Fix: `max_tokens` aumentado de 4000 → **12000** na diarização
  - Adicionado fallback: se output diarizado < 40% do tamanho bruto, usa transcrição bruta (evita perda silenciosa)
- **Próximos passos**: verificar se conta OpenAI atingiu **Tier 2** ($50 pagos + 7 dias desde 09/04)
  - Tier 2 libera 2M TPM (vs 200K TPM atual) → viabiliza migrar análises para **gpt-4o** (ou gpt-4.1)
  - Verificar em: platform.openai.com → Settings → Limits
  - Após confirmação Tier 2: atualizar modelos em `lib/openai.ts` e `app/api/analyze/route.ts`

### Sessão 10 — Exclusão de Eventos, Excel, Fotos de Documentos e Fixes (17/04/2026)
- [x] **Exclusão de eventos**: gestores e master podem excluir eventos
  - `DELETE /api/sinistros/[id]` com validação de role (master exclui qualquer, gestor apenas da própria empresa)
  - Cascade: arquivos → aprendizados → sinistro
  - Botão "Excluir" (Trash2) na página de detalhe + ícone na lista, ambos com confirmação
  - Visível apenas para `canManageUsers()` (role `master` ou `gestor`)
- [x] **Exportação Excel (XLSX)**: substituído CSV por planilha via SheetJS
  - `app/relatorios/page.tsx`: `exportarXlsx()` com dynamic import de `xlsx`
  - Colunas: Nº Evento, Tipo, Associado, CPF, Placa, Local, Data/Hora, Status, Recomendação IA, Score Fraude, Criado em
- [x] **Fotos de documentos**: DocDropzone aceita JPG/PNG/WEBP além de PDF
  - `extractDocumentFromImage()` em `analyze/route.ts` — OCR via gpt-4.1-mini vision com instruções específicas por tipo (crlv, cnh, bo, fipe, etc.)
  - Ícone `ImageIcon` (roxo) para imagens, `FileText` para PDFs na lista de documentos
- [x] **Novo tipo de documento**: `fipe` — "Tabela FIPE do Veículo"
  - Adicionado em `lib/types.ts` (`TipoDocumento` + `TIPO_DOCUMENTO_LABEL`)
  - Instrução específica no `buildContexto` para avaliar perda total com base no valor FIPE
- [x] **Fix upload nome especial**: sanitização de filename antes de salvar no Storage
  - `upload-url/route.ts`: NFD normalize → remove acentos → substitui especiais por hífen
  - Fix para "LIGAÇÃO.mp3" e similares que o Supabase Storage rejeitava
- [x] **Terminologia**: "segurado" → "Associado", "sinistro(s)" → "evento(s)" na UI
  - Variáveis internas (`nomeSegurado`, rotas `/api/sinistros`) preservadas
- [x] **Fix erro JSON 413/timeout**: `response.text()` + try/catch antes de `JSON.parse`
  - `page.tsx (novo evento)`: trata resposta não-JSON do Vercel (413 Entity Too Large, 504 timeout)
  - Mensagem de erro amigável ao usuário em vez de `SyntaxError`
  - Limite fallback base64 reduzido de 4MB → 2MB (mais margem antes do limite 4.5MB do Vercel)

### Sessão 8 — Maps, Vídeo MP4 e Fix Crítico de Análise com Áudio (16/04/2026)
- [x] Google Maps no campo "Local do evento" em `ResultadoAnalise.tsx`
  - `isEnderecoConsistente()`: valida se tem indicador de logradouro, vírgula ou número (≥ 8 chars)
  - Endereço válido: link "Ver no Google Maps" clicável (abre `maps/search?query=...` em nova aba)
  - Endereço inválido/genérico: exibe "Endereço não localizado no Maps" em cinza
- [x] Suporte a vídeo MP4 no upload de evidências
  - `lib/types.ts`: `ArquivoAnexo.tipo` agora aceita `"video"`
  - `DocumentosStep.tsx`: dropzone aceita `video/mp4` (limite 100MB); `handleDropImagem` detecta `f.type === "video/mp4"` e atribui `tipo: "video"`; ícone `Video` (roxo) para MP4 na lista
  - `analyze/route.ts`: `arquivosVideo` separado; seção no prompt informa a IA dos vídeos anexados e orienta analista a revisá-los manualmente
  - `ResultadoAnalise.tsx`: `tipoIcone` inclui `video: Video`
- [x] **Fix crítico**: análise de colisão com áudio retornava "formato inválido"
  - Causa: `max_tokens: 4000` insuficiente — JSON de colisão (cinemática + pré-orçamento + áudio) facilmente ultrapassa 5000-6000 tokens; JSON truncava e falhava no parse
  - Fix 1: fluxo de 2 chamadas estendido para **todos os eventos com áudio** (antes era só furto/roubo)
    - Call 1: analisa documentos + imagens sem áudio (colisão usa `buildSystemPrompt`, furto/roubo usa `buildSystemPromptDocumental`)
    - Call 2: integra áudio com `PROMPT_INTEGRACAO_AUDIO` + emite JSON final
  - Fix 2: `max_tokens` aumentado de 4000 → **6000** em todas as 3 calls principais
- [x] Otimização de tokens: `IANALISTA_LINGUISTICA` (~1.200 tokens) omitido quando não há áudio
  - `buildKnowledgeBase(tipoEvento, temAudio)` — parâmetro `temAudio` controla inclusão
  - `buildSystemPrompt(tipoEvento, temAudio)` — passa `temAudio` à KB e adiciona `NOTA_SEM_AUDIO` no suffix
  - `buildSystemPromptDocumental` sempre usa `temAudio=false` (Call 1 nunca tem áudio)
  - Fluxo único sem áudio e Call 1 do fluxo 2-call passam `temAudio: false`
- [x] Fix IA: validação de datas impossíveis por erro de OCR (regra 10 nas REGRAS ABSOLUTAS)
  - Datas com dia > 31, mês > 12 ou ano fora de 1900-2100 → reconhecidas como erro de OCR
  - IA registra "data ilegível" no `alertas_documentais`, não compara com outras fontes, solicita confirmação nos `proximos_passos`
- [x] Pré-orçamento removido da UI (`ResultadoAnalise.tsx`) e da knowledge base (`buildKnowledgeBase`, schema JSON, REGRAS FINAIS)

### Sessão 7 — IA Avançada, Correções e Pré-Orçamento (16/04/2026)
- [x] Novo status `aguardando_informacoes` dedicado ao botão "Solicitar Informações"
  - Badge amber, opção no filtro de eventos, incluído no contador de pendentes do relatório
  - `lib/types.ts`, `ResultadoAnalise.tsx`, `SinistrosList.tsx`, `sinistros/page.tsx`, `relatorios/page.tsx`
- [x] Fix deploy: `useEffect` faltando no import de `app/login/page.tsx`
- [x] Fix Supabase: constraint `usuarios_role_check` atualizado para incluir `gestor`
- [x] Fix UI: opção `admin` adicionada ao dropdown de perfil nos modais de usuário (`/usuarios` e `/admin/usuarios`)
- [x] Knowledge base — Cinemática de Colisão (`IANALISTA_CINEMATICA_COLISAO`):
  - Busca web do limite de velocidade da via quando endereço for informado
  - Fórmula de velocidade crítica de curva: V = √(R × g × μ) com coeficientes SAE 830612
  - Padrões de dano por dinâmica (tombamento, frontal, lateral, saída de pista)
  - CTB Art. 218 + Exclusão 3 Loma (excesso de velocidade)
  - Checklist de 9 pontos para colisão em curva + critérios para perícia externa com ART
- [x] Knowledge base — Pré-Orçamento (`IANALISTA_PREORCAMENTO_COLISAO`):
  - Tabela de preços por categoria de veículo (econômico/médio/intermediário), mercado paralelo 2025/2026
  - Peças: para-choque, capô, para-lama, farol, lanterna, para-brisa, vidros, porta, teto, airbag, roda, pneu
  - Mão de obra: funilaria, pintura por painel, reparo estrutural
  - Categorias: pequeno_reparo / reparo_medio / grande_reparo / possivel_perda_total
  - Regra de perda total: custo ≥ 75% do valor FIPE
- [x] Campo `pre_orcamento` no JSON de saída da IA (apenas colisão, null nos demais)
  - Tipos `PreOrcamentoItem` e `PreOrcamento` em `lib/types.ts`
  - Seção colapsável com tabela de peças + mão de obra + total em `ResultadoAnalise.tsx`

---

## Banco de Dados — Constraints atualizadas
- `usuarios_role_check`: `master | admin | gestor | usuario` (gestor adicionado na Sessão 7)

---

## Próximos Passos Prioritários

### Arquitetura — Processamento Assíncrono (próxima sprint)
> Problema: pipeline IA é síncrono — usuário espera até 5+ min na tela. Com KB crescendo e áudios longos, vai piorar.
- [ ] **Mover `/api/analyze` para Railway** (~$5-10/mês) — Node.js persistente, sem timeout
- [ ] **Fila assíncrona**: usuário envia → salva no Supabase → job processa em background
- [ ] **Supabase Realtime**: notifica browser quando análise concluir (sem polling)
- [ ] **Stack final**: Vercel (frontend, grátis) + Railway (IA, $5-10/mês) + Supabase (já tem)

### Orientação operacional para analistas
- [ ] Orientar uso de MP3 64kbps para ligações longas (resolve limite 25MB do Whisper para até ~45 min)

### OpenAI Tier 2
- [ ] Verificar se conta atingiu Tier 2 ($50 pagos + 7 dias desde 09/04) em platform.openai.com → Settings → Limits
- [ ] Após Tier 2: migrar modelos para gpt-4.1 (2M TPM vs 200K TPM atual) em `lib/openai.ts` e `app/api/analyze/route.ts`

## Backlog

- [ ] Dashboard com métricas (sinistros por tipo, score médio, taxa suspeito)
- [ ] Exportação de relatório PDF por sinistro
- [ ] Integração webhook para notificação de status
- [ ] Onboarding multi-step para nova empresa
- [ ] Planos (Free/Pro) com controle de uso via Supabase
- [ ] Paginação na lista de sinistros
- [ ] Gráficos na página de relatórios
