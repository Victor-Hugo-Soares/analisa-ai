# Analisa Aí — Contexto do Projeto

## Identidade
- **Produto**: SaaS B2B de análise de sinistros veiculares com IA
- **Público-alvo**: Seguradoras e proteções veiculares
- **Diretório**: `C:/Users/Victor Hugo/OneDrive/Documentos/Victor/analisa-ai`

## Stack
- Next.js 16.2.3 (App Router), React 19, TypeScript
- Tailwind CSS v4 (usando `@import "tailwindcss"` — sem `tailwind.config.ts`)
- shadcn/ui (New York style, Zinc base, radix-ui v1 — não @radix-ui/react-*)
- OpenAI SDK v6 (GPT-4o + Whisper + Vision)
- react-dropzone, framer-motion, react-markdown, lucide-react, clsx, tailwind-merge, class-variance-authority

## Design System
- Primary: `#1a2744` (navy)
- Secondary: `#0f766e` (teal)
- Accent: `#f59e0b` (amber)
- Background: `#f8fafc`
- Muted: `#64748b`

## Arquitetura
- Auth: localStorage simulado (`lib/storage.ts`)
- Dados: localStorage com mock de 4 sinistros pré-carregados
- IA: API route `/api/analyze` → Whisper (áudio) + GPT-4o Vision (imagens) + GPT-4o (análise final)

## Sessões Concluídas

### Sessão 1 — Setup e Estrutura Completa (09/04/2026)
- [x] Projeto Next.js 16 criado do zero
- [x] Instaladas todas as dependências
- [x] shadcn/ui configurado manualmente (components.json)
- [x] Design system implementado no globals.css
- [x] lib/types.ts — tipos completos do domínio
- [x] lib/storage.ts — CRUD no localStorage + 4 sinistros mock
- [x] lib/openai.ts — cliente OpenAI + SYSTEM_PROMPT especializado
- [x] Autenticação simulada (login + cadastro)
- [x] Dashboard com stats cards e lista de sinistros
- [x] Formulário multi-step (TipoEvento → Dados → Documentos → Análise)
- [x] Upload com react-dropzone (áudio, documento, imagem)
- [x] API route /api/analyze — Whisper + Vision + GPT-4o
- [x] Página de resultado com seções coloridas por tipo de finding
- [x] Páginas: /sinistros, /relatorios, /configuracoes
- [x] Build 100% limpo, zero erros TypeScript

## Observações Críticas

### Tailwind v4
- NÃO existe `tailwind.config.ts` — as cores são definidas via CSS variables no `globals.css` dentro de `@theme inline {}`
- Classes dinâmicas com interpolação (ex: `bg-${color}`) NÃO funcionam com Tailwind v4 — usar classes estáticas

### shadcn/ui com Next.js 16 + React 19
- A versão instalada usa `radix-ui` (pacote unificado) e não `@radix-ui/react-*` individuais
- O import é `import { Slot } from "radix-ui"` (não `@radix-ui/react-slot`)

### OpenAI SDK v6
- `openai.audio.transcriptions.create` retorna string quando `response_format: "text"` mas o tipo TypeScript não reflete isso — usar cast `as unknown as string`
- Whisper aceita File object — necessário usar `Object.assign(file, { name: 'audio.mp3' })`

### Variáveis de ambiente
- `.env.local` com `OPENAI_API_KEY` — nunca commitar

## Próximas Features (backlog)
- [ ] Paginação na lista de sinistros
- [ ] Extração real de texto de PDFs (atualmente simulada)
- [ ] Gráficos na página de relatórios
- [ ] Gestão de usuários/analistas
- [ ] Integração via API (webhooks)
- [ ] Dark mode
- [ ] Notificações em tempo real
