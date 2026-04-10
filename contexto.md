# IAnalista — Contexto do Projeto

## Identidade
- **Produto**: SaaS B2B de análise de sinistros veiculares com IA
- **Público-alvo**: Seguradoras e proteções veiculares
- **Repo**: `https://github.com/VictorHugo-7/analisa-ai`
- **Deploy**: `https://ianalista.com`
- **Diretório**: `C:/Users/Victor Hugo/OneDrive/Documentos/Victor/analisa-ai`

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.2.3 (App Router), React 19, TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (New York, Zinc, radix-ui v1) |
| IA | OpenAI SDK v6 — GPT-4o, Whisper, Vision |
| Banco | Supabase (Postgres + Auth + Storage + RLS) |
| Cache local | localStorage (demo/fallback) |
| Upload | react-dropzone → Supabase Storage (signed URL) |
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
│   ├── admin/page.tsx                    ← Painel master (role=master)
│   ├── api/
│   │   ├── analyze/route.ts              ← Pipeline IA (maxDuration=300)
│   │   ├── auth/signin/route.ts          ← Login Supabase → retorna role
│   │   ├── auth/signup/route.ts          ← Cadastro empresa + usuário
│   │   ├── admin/empresas/route.ts       ← GET todas empresas (master only)
│   │   ├── admin/empresas/[id]/route.ts  ← PATCH configurações empresa
│   │   ├── sinistros/route.ts            ← GET lista (Bearer token)
│   │   ├── sinistros/[id]/route.ts       ← GET single + PATCH status
│   │   ├── sinistros/save/route.ts       ← POST persiste após análise
│   │   └── sinistros/upload-url/route.ts ← POST gera signed upload URL
├── components/sinistro/
│   └── ResultadoAnalise.tsx
├── lib/
│   ├── types.ts      ← Todos os tipos TypeScript
│   ├── openai.ts     ← SYSTEM_PROMPT + AUDIO_TONE_PROMPT
│   ├── supabase.ts   ← createClient() browser + createServerClient() service_role
│   ├── db.ts         ← CRUD server-side Supabase
│   └── storage.ts    ← localStorage CRUD + helpers auth + isMaster()
└── .env.local
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

---

## Banco de Dados (Supabase)

### Tabelas
- `empresas` — id, nome, cnpj, email, plano, ativo, **limite_usuarios**, **nivel_acesso**, criado_em
- `usuarios` — id, empresa_id, nome, email, **role**, criado_em
- `sinistros` — id, empresa_id, usuario_id, tipo_evento, status, nome_segurado, cpf, placa, data_hora_sinistro, local, relato, analise (jsonb), criado_em, atualizado_em
- `arquivos` — id, sinistro_id, nome, tipo, tamanho, storage_path, criado_em

### Storage
- Bucket: `sinistros-arquivos` (privado)
- Políticas RLS: INSERT/SELECT/DELETE para `auth.uid() IS NOT NULL`
- Upload via **signed URL** (browser → Supabase direto, não passa pela Vercel)

### RLS
- `get_empresa_id()` → empresa_id do user autenticado
- Políticas por empresa_id

---

## Pipeline IA (`/api/analyze`)

- `export const maxDuration = 300` — evita timeout na Vercel
- **Fluxo de arquivos**: signed URL → upload direto browser→Storage → server baixa via signed download URL
- **Transcrição**: Whisper `verbose_json` com timestamps de segmento
- **Tom de voz**: GPT-4o (`AUDIO_TONE_PROMPT`, max 2500 tokens)
- **Imagens**: GPT-4o Vision (forense, consistência com relato)
- **Análise final**: GPT-4o `json_object`, temperature 0.15, max_tokens 5000

### Bug crítico já corrigido — File.name read-only
```typescript
// ERRADO: Object.assign(file, { name: 'audio.mp3' })
// CORRETO:
new File([buffer], fileName, { type: mimeType })
```

---

## Observações Críticas

### Tailwind v4
- **Sem** `tailwind.config.ts` — cores em CSS variables no `globals.css` via `@theme inline {}`
- Classes dinâmicas com interpolação (`bg-${color}`) **não funcionam** — usar classes estáticas

### shadcn/ui com Next.js 16 + React 19
- Usa `radix-ui` (pacote unificado), **não** `@radix-ui/react-*` individuais
- Import: `import { Slot } from "radix-ui"`

### Next.js App Router — Breaking Changes
- Params de route handlers **devem ser awaited**: `const { id } = await params`
- Antes de qualquer código de rota, ler `node_modules/next/dist/docs/`

### Vercel — Limites
- Body limit: **4.5MB** — nunca enviar base64 de arquivos grandes via JSON
- Função serverless padrão: timeout baixo → sempre declarar `export const maxDuration`
- Solução: upload direto browser→Supabase Storage via signed URL

### Supabase — `createServerClient()` vs `createClient()`
- `createServerClient()` usa `service_role` — bypassa RLS, usar apenas em server
- `createClient()` usa `anon key` — RLS ativo, para browser

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

## Sessões Concluídas

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
- [x] Usuário master criado no Supabase (`vsoareslins452@gmail.com`)
- [x] Painel `/admin` — gerenciar empresas, limite_usuarios, nivel_acesso, ativo
- [x] API routes `/api/admin/empresas` protegidas por role=master
- [x] Sidebar mostra "Painel Master" apenas para role=master
- [x] Corrigido timeout Vercel: `export const maxDuration = 300`
- [x] Corrigido erro silencioso de análise: erro visível + botão retry
- [x] Página `/sinistros/[id]` busca Supabase como fallback ao localStorage
- [x] Corrigido 413 Request Entity Too Large: upload via signed URL
- [x] Arquivos nunca mais trafegam como base64 pelo servidor Vercel

---

## Próximas Features (backlog)
- [ ] Dashboard com métricas (sinistros por tipo, score médio, taxa suspeito)
- [ ] Exportação de relatório PDF por sinistro
- [ ] Integração webhook para notificação de status
- [ ] Onboarding multi-step para nova empresa
- [ ] Planos (Free/Pro) com controle de uso via Supabase
- [ ] Paginação na lista de sinistros
- [ ] Extração real de texto de PDFs
- [ ] Gráficos na página de relatórios
- [ ] Dark mode
- [ ] Notificações em tempo real
