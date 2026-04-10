"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  Shield, CheckCircle, Clock, AlertTriangle, TrendingDown,
  FileSearch, Brain, ChevronRight, Star, ArrowRight,
  Upload, X, Loader2, MessageCircle, BarChart3,
  Users, Zap, Target, Eye, PhoneCall, ChevronDown,
  FileText, Car, Flame, Wind, GlassWater
} from "lucide-react"

// ─── tipos ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4
type TipoEvento = "colisao" | "roubo" | "furto" | "natureza" | "vidros"

interface FormData {
  nomeSegurado: string
  cpf: string
  placa: string
  tipoEvento: TipoEvento | ""
  dataHora: string
  local: string
  relato: string
}

interface UploadedFile {
  file: File
  preview?: string
  tipo: "imagem" | "documento"
}

// ─── constantes ───────────────────────────────────────────────────────────────
const WA_NUMBER = "5511926712965"
const WA_MSG = encodeURIComponent(
  "Olá! Acabei de testar o IAnalista e quero saber mais sobre os planos para minha proteção veicular."
)
const WA_URL = `https://wa.me/${WA_NUMBER}?text=${WA_MSG}`

const TIPO_EVENTO_OPTIONS: { value: TipoEvento; label: string; icon: React.ReactNode }[] = [
  { value: "colisao", label: "Colisão", icon: <Car className="w-4 h-4" /> },
  { value: "roubo", label: "Roubo/Furto", icon: <AlertTriangle className="w-4 h-4" /> },
  { value: "furto", label: "Furto", icon: <AlertTriangle className="w-4 h-4" /> },
  { value: "natureza", label: "Eventos da Natureza", icon: <Wind className="w-4 h-4" /> },
  { value: "vidros", label: "Vidros", icon: <GlassWater className="w-4 h-4" /> },
]

const STEP_LABELS = ["Dados do Associado", "Relato do Sinistro", "Documentos", "Resultado"]

// ─── Componente principal ─────────────────────────────────────────────────────
interface AnaliseResult {
  recomendacao: string
  score_confiabilidade: number
  resumo?: string
  pontos_atencao?: string[]
  pontos_verdadeiros?: string[]
  contradicoes?: string[]
  indicadores_fraude?: string[]
  linha_do_tempo?: string | string[]
  proximos_passos?: string
  analise_imagens?: { descricao?: string; consistencia_relato?: string }
}

export default function LandingPage() {
  const trialRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>({
    nomeSegurado: "", cpf: "", placa: "", tipoEvento: "",
    dataHora: "", local: "", relato: "",
  })
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnaliseResult | null>(null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  function scrollToTrial() {
    trialRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const mapped: UploadedFile[] = selected.map(file => ({
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      tipo: file.type.startsWith("image/") ? "imagem" : "documento",
    }))
    setFiles(f => [...f, ...mapped].slice(0, 5))
    e.target.value = ""
  }

  function removeFile(idx: number) {
    setFiles(f => f.filter((_, i) => i !== idx))
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setError("")

    try {
      // Converter arquivos para base64
      const arquivos = await Promise.all(
        files.map(async (uf) => {
          const base64 = await fileToBase64(uf.file)
          return {
            nome: uf.file.name,
            tipo: uf.tipo as "imagem" | "documento",
            tamanho: uf.file.size,
            base64,
          }
        })
      )

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoEvento: form.tipoEvento,
          dados: {
            nomeSegurado: form.nomeSegurado,
            cpf: form.cpf,
            placa: form.placa,
            dataHora: form.dataHora,
            local: form.local,
            relato: form.relato,
          },
          arquivos,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? "Erro ao processar análise")
      }

      const data = await res.json()
      setResult(data.analise)
      setStep(4)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado. Tente novamente.")
    } finally {
      setAnalyzing(false)
    }
  }

  const step1Valid =
    form.nomeSegurado.trim().length >= 2 &&
    form.tipoEvento !== ""

  const step2Valid = form.relato.trim().length > 20

  function handleStep1Next() {
    if (!step1Valid) {
      alert("Preencha o nome do associado e selecione o tipo de evento.")
      return
    }
    setStep(2)
  }

  function handleStep2Next() {
    if (!step2Valid) {
      alert("Descreva o sinistro com pelo menos 20 caracteres.")
      return
    }
    setStep(3)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a2744]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="bg-amber-500 p-1.5 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">IAnalista</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={scrollToTrial}
              className="hidden sm:block text-slate-400 hover:text-white text-sm transition-colors"
            >
              Teste grátis
            </button>
            <Link
              href="/login"
              className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center bg-[#1a2744] overflow-hidden pt-16">
        {/* Glow de fundo */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-teal-500/8 rounded-full blur-3xl" />
        </div>

        {/* Grid sutil */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            A IA que protege quem protege
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-[1.05] mb-6">
            Otimize os eventos<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
              da sua proteção
            </span>{" "}
            <span className="text-white">veicular</span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Análise de sinistros com IA em segundos. Detecte fraudes, elimine filas e tome decisões
            com relatórios completos e inteligentes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <button
              onClick={scrollToTrial}
              className="group flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40"
            >
              Analisar grátis agora
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-7 py-3.5 rounded-xl text-base font-medium transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Falar com comercial
            </a>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { value: "98%", label: "Precisão" },
              { value: "<60s", label: "Por análise" },
              { value: "3x", label: "Mais produtivo" },
            ].map(m => (
              <div key={m.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-black text-amber-400">{m.value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-slate-600">
          <ChevronDown className="w-5 h-5" />
        </div>
      </section>

      {/* ── SEÀ‡ÀƒO DORES ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-amber-600 font-semibold text-sm uppercase tracking-widest mb-3">Você ainda sofre com isso?</p>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a2744] leading-tight">
              Os maiores problemas das<br />proteções veiculares hoje
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Clock className="w-6 h-6 text-red-500" />,
                bg: "bg-red-50",
                title: "Análise lenta e manual",
                desc: "Cada sinistro exige horas de trabalho. Perito analisa documentos um a um, criando fila e estresse operacional.",
              },
              {
                icon: <TrendingDown className="w-6 h-6 text-orange-500" />,
                bg: "bg-orange-50",
                title: "Sinistros acumulados",
                desc: "Processos represados, associados insatisfeitos e equipe sobrecarregada sem visibilidade do que está pendente.",
              },
              {
                icon: <Eye className="w-6 h-6 text-purple-500" />,
                bg: "bg-purple-50",
                title: "Fraudes passando pelo crivo",
                desc: "Sem análise vocal e forense de imagens, inconsistências passam despercebidas e o prejuízo só cresce.",
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
                bg: "bg-blue-50",
                title: "Falta de controle e métricas",
                desc: "Sem dados sobre tipos de evento, taxas de suspeição e tendências, decisões estratégicas ficam no escuro.",
              },
              {
                icon: <Target className="w-6 h-6 text-teal-500" />,
                bg: "bg-teal-50",
                title: "Baixa assertividade",
                desc: "Decisões baseadas em experiência subjetiva, sem padronização. Cada perito decide de um jeito diferente.",
              },
              {
                icon: <Users className="w-6 h-6 text-indigo-500" />,
                bg: "bg-indigo-50",
                title: "Associados insatisfeitos",
                desc: "Demora na resposta gera reclamações, churn e dano À  reputação da sua associação.",
              },
            ].map(item => (
              <div key={item.title} className="border border-[#e2e8f0] rounded-2xl p-6 hover:shadow-md transition-shadow">
                <div className={`${item.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-[#1a2744] text-base mb-2">{item.title}</h3>
                <p className="text-[#64748b] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÀ‡ÀƒO SOLUÀ‡ÀƒO ── */}
      <section className="py-24 bg-[#1a2744] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-16">
            <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-3">A solução</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              IAnalista faz em segundos o que<br />
              <span className="text-amber-400">levaria horas para um perito</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <Brain className="w-6 h-6 text-amber-400" />,
                title: "IA Forense",
                desc: "GPT-4o Vision analisa fotos comparando os danos com o relato. Detecta oxidação, ângulos suspeitos e inconsistências.",
              },
              {
                icon: <FileSearch className="w-6 h-6 text-teal-400" />,
                title: "Análise Completa",
                desc: "Cruzamento automático entre relato, documentos e imagens. Score de confiabilidade de 0 a 100.",
              },
              {
                icon: <Zap className="w-6 h-6 text-violet-400" />,
                title: "Resultado em <60s",
                desc: "Análise completa com linha do tempo, pontos de atenção, indicadores de fraude e próximos passos.",
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-emerald-400" />,
                title: "Decisão clara",
                desc: "Recomendação de aprovação, investigação ou recusa com justificativa técnica detalhada para o time.",
              },
            ].map(item => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
                <div className="mb-4">{item.icon}</div>
                <h3 className="font-bold text-white text-base mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Testimonial fake */}
          <div className="mt-16 bg-gradient-to-r from-amber-500/10 to-teal-500/10 border border-amber-500/20 rounded-2xl p-8 max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <p className="text-white text-lg font-medium italic leading-relaxed mb-4">
              "Reduzimos o tempo médio de análise de 3 horas para menos de 2 minutos.
              A detecção de fraudes melhorou completamente e o time ficou muito mais focado."
            </p>
            <p className="text-slate-400 text-sm">â€” Diretor de Operações, Proteção Veicular SP</p>
          </div>
        </div>
      </section>

      {/* ── SEÀ‡ÀƒO PRO FEATURES ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              Versão Pro â€” tudo que o trial não mostra
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a2744] leading-tight mb-4">
              Uma plataforma completa.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1a2744] to-[#0f766e]">
                Do primeiro relato ao relatório final.
              </span>
            </h2>
            <p className="text-[#64748b] max-w-xl mx-auto">
              O teste gratuito mostra apenas uma prévia. Na versão Pro você tem acesso a todo o arsenal de análise â€” incluindo áudio, relatórios completos e gestão centralizada.
            </p>
          </div>

          {/* Feature principal â€” Análise de Àudio */}
          <div className="bg-[#1a2744] rounded-3xl overflow-hidden mb-6">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="p-8 sm:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 w-fit">
                  <Zap className="w-3.5 h-3.5" />
                  Exclusivo Pro
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                  Análise de áudio com Whisper + GPT-4o
                </h3>
                <p className="text-slate-400 leading-relaxed mb-6">
                  Transcreva automaticamente ligações do segurado com <strong className="text-white">timestamps precisos</strong>. A IA detecta hesitações, autocorreções, calma atípica e padrões linguísticos suspeitos â€” o que nenhum perito consegue captar ouvindo manualmente.
                </p>
                <ul className="space-y-3">
                  {[
                    "Transcrição completa com timestamps [MM:SS â†’ MM:SS]",
                    "Arco emocional mapeado do início ao fim da ligação",
                    "Detecção de hesitação, autocorreção e calma atípica",
                    "Comparação automática com o relato escrito",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-[#243459] p-8 sm:p-10 flex items-center justify-center">
                <div className="w-full max-w-sm space-y-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">Prévia de análise vocal</p>
                  {[
                    { time: "[00:45 â†’ 00:52]", text: "\"Foi... foi por volta das... dez e meia\"", tag: "Hesitação", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
                    { time: "[01:30 â†’ 01:38]", text: "\"Dois caras... é... foram dois\"", tag: "Autocorreção", color: "text-red-400 border-red-500/30 bg-red-500/10" },
                    { time: "[02:10 â†’ 02:25]", text: "Tom consistentemente calmo após relato traumático", tag: "Calma atípica", color: "text-violet-400 border-violet-500/30 bg-violet-500/10" },
                  ].map(item => (
                    <div key={item.time} className="bg-[#1a2744] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-500 font-mono">{item.time}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.color}`}>{item.tag}</span>
                      </div>
                      <p className="text-sm text-slate-300 italic">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid de features secundárias */}
          <div className="grid md:grid-cols-3 gap-5 mb-6">
            {/* Relatórios completos */}
            <div className="bg-gradient-to-br from-[#1a2744] to-[#1a2744] rounded-2xl p-6 text-white">
              <div className="bg-teal-500/20 w-11 h-11 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">Relatórios Completos</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Linha do tempo reconstruída, pontos verdadeiros, contradições cruzadas e próximos passos concretos â€” tudo em um relatório exportável por sinistro.
              </p>
              <ul className="space-y-1.5">
                {["Linha do tempo detalhada", "Score de 0 a 100", "Próximos passos", "Exportação PDF (em breve)"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Gestão de sinistros */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6">
              <div className="bg-amber-500/15 w-11 h-11 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg text-[#1a2744] mb-2">Gestão de Sinistros</h3>
              <p className="text-[#64748b] text-sm leading-relaxed mb-4">
                Painel centralizado com todos os sinistros da sua empresa. Filtre por status, tipo de evento, score e período. Nunca mais perca um caso no meio da fila.
              </p>
              <ul className="space-y-1.5">
                {["Painel de controle completo", "Filtros por status e tipo", "Histórico por associado", "Multi-usuários por empresa"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[#64748b]">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Análise forense de imagens */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-6">
              <div className="bg-violet-500/15 w-11 h-11 rounded-xl flex items-center justify-center mb-4">
                <Eye className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-bold text-lg text-[#1a2744] mb-2">Análise Forense de Imagens</h3>
              <p className="text-[#64748b] text-sm leading-relaxed mb-4">
                GPT-4o Vision examina cada foto do sinistro detectando oxidação, ângulos suspeitos e inconsistências entre os danos visíveis e o relato do segurado.
              </p>
              <ul className="space-y-1.5">
                {["Detecção de danos antigos (ferrugem)", "Verificação de autenticidade", "Consistência com relato", "Múltiplas imagens por sinistro"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[#64748b]">
                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Linha de features adicionais */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <Users className="w-5 h-5 text-blue-500" />, bg: "bg-blue-50", title: "Multi-usuários", desc: "Vários analistas na mesma conta com controle de acesso por nível.", badge: "" },
              { icon: <Brain className="w-5 h-5 text-pink-500" />, bg: "bg-pink-50", title: "IA Atualizada", desc: "GPT-4o sempre atualizado com os padrões mais recentes de fraude no Brasil.", badge: "" },
              { icon: <Target className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50", title: "Score Padronizado", desc: "Critério único para toda a equipe. Score de 0-100 com justificativa técnica.", badge: "" },
              { icon: <PhoneCall className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50", title: "Suporte dedicado", desc: "Time de suporte exclusivo para clientes Pro com SLA garantido.", badge: "" },
            ].map(item => (
              <div key={item.title} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5">
                <div className={`${item.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                  {item.icon}
                </div>
                <h4 className="font-semibold text-[#1a2744] text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-[#64748b] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Card API em breve */}
          <div className="mt-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="bg-violet-500/15 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-[#1a2744] text-base">API para conexão com sistemas de gestão</h4>
                <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full border border-violet-200">Em breve</span>
              </div>
              <p className="text-[#64748b] text-sm">
                Integre o IAnalista diretamente ao seu sistema de gestão via API REST. Dispare análises automaticamente ao receber um novo sinistro, sem intervenção manual â€” pré-cadastre interesse e seja o primeiro a testar.
              </p>
            </div>
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Quero acesso antecipado
            </a>
          </div>

          {/* CTA da seção */}
          <div className="mt-12 text-center">
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1a2744] hover:bg-[#243459] text-white font-bold px-8 py-3.5 rounded-xl transition-all shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              Quero contratar o Pro
            </a>
            <p className="text-[#94a3b8] text-sm mt-3">Fale no WhatsApp Â· Resposta imediata Â· Sem burocracia</p>
          </div>
        </div>
      </section>

      {/* ── SEÀ‡ÀƒO TRIAL ── */}
      <section ref={trialRef} className="py-24 bg-[#f8fafc]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <Zap className="w-3.5 h-3.5" />
              Análise completa e gratuita â€” sem cadastro
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1a2744] leading-tight mb-3">
              Veja o IAnalista funcionando
            </h2>
            <p className="text-[#64748b]">
              Preencha os dados de um sinistro real. Você receberá a análise <strong>100% completa</strong> â€” score, pontos de atenção, indicadores de fraude e próximos passos. Grátis, sem cadastro.
            </p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center mb-10">
            {STEP_LABELS.map((label, i) => {
              const n = (i + 1) as Step
              const done = step > n
              const active = step === n
              return (
                <div key={label} className="flex items-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      done ? "bg-emerald-500 text-white" :
                      active ? "bg-[#1a2744] text-white" :
                      "bg-[#e2e8f0] text-[#94a3b8]"
                    }`}>
                      {done ? <CheckCircle className="w-4 h-4" /> : n}
                    </div>
                    <span className={`hidden sm:block text-xs font-medium ${active ? "text-[#1a2744]" : "text-[#94a3b8]"}`}>
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <div className={`w-12 sm:w-20 h-0.5 mx-2 transition-all ${step > n ? "bg-emerald-500" : "bg-[#e2e8f0]"}`} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Card do trial */}
          <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">

            {/* ── STEP 1: Dados do Associado ── */}
            {step === 1 && (
              <div className="p-6 sm:p-8">
                <h3 className="font-bold text-[#1a2744] text-lg mb-6">Dados do Associado</h3>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Nome completo" name="nomeSegurado" value={form.nomeSegurado} onChange={handleFormChange} placeholder="João da Silva" />
                    <Field label="CPF" name="cpf" value={form.cpf} onChange={handleFormChange} placeholder="000.000.000-00" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Placa do veículo" name="placa" value={form.placa} onChange={handleFormChange} placeholder="ABC-1234" />
                    <div>
                      <label className="block text-sm font-medium text-[#1a2744] mb-1.5">Tipo de evento</label>
                      <select
                        name="tipoEvento"
                        value={form.tipoEvento}
                        onChange={handleFormChange}
                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#1a2744] focus:outline-none focus:border-[#1a2744] focus:ring-1 focus:ring-[#1a2744]"
                      >
                        <option value="">Selecione</option>
                        {TIPO_EVENTO_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#1a2744] mb-1.5">Data e hora do evento</label>
                      <input
                        type="datetime-local"
                        name="dataHora"
                        value={form.dataHora}
                        onChange={handleFormChange}
                        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#1a2744] focus:outline-none focus:border-[#1a2744]"
                      />
                    </div>
                    <Field label="Local do evento" name="local" value={form.local} onChange={handleFormChange} placeholder="Av. Paulista, São Paulo" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleStep1Next}
                    className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243459] text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
                  >
                    Próximo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Relato ── */}
            {step === 2 && (
              <div className="p-6 sm:p-8">
                <h3 className="font-bold text-[#1a2744] text-lg mb-2">Relato do Sinistro</h3>
                <p className="text-[#64748b] text-sm mb-6">Descreva o que aconteceu com o máximo de detalhes possível.</p>
                <textarea
                  name="relato"
                  value={form.relato}
                  onChange={handleFormChange}
                  rows={8}
                  placeholder="Ex: Estava na Av. Paulista quando outro veículo avançou o sinal vermelho e me atingiu na lateral dianteira. O impacto foi forte..."
                  className="w-full border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#1a2744] focus:outline-none focus:border-[#1a2744] focus:ring-1 focus:ring-[#1a2744] resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#94a3b8]">{form.relato.length} caracteres</span>
                  {form.relato.length > 0 && form.relato.length < 20 && (
                    <span className="text-xs text-red-500">Mínimo 20 caracteres</span>
                  )}
                </div>
                <div className="mt-6 flex justify-between">
                  <button onClick={() => setStep(1)} className="text-[#64748b] hover:text-[#1a2744] text-sm font-medium transition-colors">
                    â† Voltar
                  </button>
                  <button
                    onClick={handleStep2Next}
                    className="flex items-center gap-2 bg-[#1a2744] hover:bg-[#243459] text-white font-semibold px-6 py-2.5 rounded-xl transition-all"
                  >
                    Próximo <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Documentos ── */}
            {step === 3 && (
              <div className="p-6 sm:p-8">
                <h3 className="font-bold text-[#1a2744] text-lg mb-2">Documentos e Fotos</h3>
                <p className="text-[#64748b] text-sm mb-1">
                  Adicione fotos do veículo e documentos (BO, laudos). Opcional â€” mas melhora muito a análise.
                </p>
                <p className="text-xs text-[#94a3b8] mb-6">Formatos: JPG, PNG, PDF â€” máx. 5 arquivos</p>

                {/* Drop area */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#e2e8f0] hover:border-[#1a2744] rounded-xl p-8 text-center transition-colors group"
                >
                  <Upload className="w-8 h-8 text-[#94a3b8] group-hover:text-[#1a2744] mx-auto mb-3 transition-colors" />
                  <p className="text-sm font-medium text-[#64748b] group-hover:text-[#1a2744] transition-colors">
                    Clique para adicionar arquivos
                  </p>
                  <p className="text-xs text-[#94a3b8] mt-1">JPG, PNG, PDF até 4MB cada</p>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileAdd}
                  className="hidden"
                />

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((uf, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3">
                        {uf.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={uf.preview} alt="" className="w-10 h-10 object-cover rounded-md flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-[#1a2744]/10 rounded-md flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[#1a2744]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#1a2744] truncate">{uf.file.name}</p>
                          <p className="text-xs text-[#94a3b8]">{(uf.file.size / 1024).toFixed(0)} KB Â· {uf.tipo}</p>
                        </div>
                        <button onClick={() => removeFile(idx)} className="text-[#94a3b8] hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex justify-between items-center">
                  <button onClick={() => setStep(2)} className="text-[#64748b] hover:text-[#1a2744] text-sm font-medium transition-colors">
                    â† Voltar
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-7 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/20"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analisando com IA...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        Analisar agora
                      </>
                    )}
                  </button>
                </div>

                {analyzing && (
                  <div className="mt-6 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
                    <p className="text-xs text-[#64748b] text-center animate-pulse">
                      ðŸ” Processando documentos e imagens com GPT-4o Vision...
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4: Resultado ── */}
            {step === 4 && result && (
              <div className="p-6 sm:p-8">
                {/* Header resultado */}
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#e2e8f0]">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    result.recomendacao === "APROVACAO_RECOMENDADA" ? "bg-emerald-100" :
                    result.recomendacao === "INVESTIGACAO_NECESSARIA" ? "bg-amber-100" :
                    "bg-red-100"
                  }`}>
                    {result.recomendacao === "APROVACAO_RECOMENDADA" ? (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    ) : result.recomendacao === "INVESTIGACAO_NECESSARIA" ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    ) : (
                      <X className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Recomendação</p>
                    <p className={`font-bold text-lg ${
                      result.recomendacao === "APROVACAO_RECOMENDADA" ? "text-emerald-700" :
                      result.recomendacao === "INVESTIGACAO_NECESSARIA" ? "text-amber-700" :
                      "text-red-700"
                    }`}>
                      {result.recomendacao === "APROVACAO_RECOMENDADA" ? "Aprovação Recomendada" :
                       result.recomendacao === "INVESTIGACAO_NECESSARIA" ? "Investigação Necessária" :
                       "Recusa Recomendada"}
                    </p>
                  </div>
                  <div className="ml-auto text-center">
                    <div className={`text-3xl font-black ${
                      Number(result.score_confiabilidade) >= 70 ? "text-emerald-600" :
                      Number(result.score_confiabilidade) >= 40 ? "text-amber-600" : "text-red-600"
                    }`}>
                      {result.score_confiabilidade as number}
                    </div>
                    <p className="text-xs text-[#94a3b8]">Score</p>
                  </div>
                </div>

                {/* Resumo */}
                {result.resumo && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Resumo executivo</p>
                    <p className="text-sm text-[#1a2744] leading-relaxed">{result.resumo ?? ""}</p>
                  </div>
                )}

                {/* Pontos de atenção */}
                {Array.isArray(result.pontos_atencao) && (result.pontos_atencao as string[]).length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Pontos de atenção</p>
                    <ul className="space-y-1.5">
                      {(result.pontos_atencao as string[]).map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#1a2744]">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(result.indicadores_fraude) && (result.indicadores_fraude as string[]).length > 0 && (
                  <div className="mb-5 bg-red-50 border border-red-100 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Indicadores de Fraude</p>
                    <ul className="space-y-1.5">
                      {(result.indicadores_fraude as string[]).map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                          <Flame className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Linha do tempo / próximos passos */}
                {result.linha_do_tempo && (
                  <div className="mb-5">
                    <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Linha do tempo reconstruída</p>
                    <p className="text-sm text-[#1a2744] leading-relaxed">{(Array.isArray(result.linha_do_tempo) ? result.linha_do_tempo.join(", ") : result.linha_do_tempo ?? "")}</p>
                  </div>
                )}

                {result.proximos_passos && (
                  <div className="mb-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">Próximos passos</p>
                    <p className="text-sm text-[#1a2744] leading-relaxed">{result.proximos_passos ?? ""}</p>
                  </div>
                )}

                {/* CTA pós análise â€” versão completa */}
                <div className="mt-6 bg-gradient-to-r from-[#1a2744] to-[#1a2744] rounded-2xl p-5 text-center">
                  <p className="text-white font-bold text-base mb-1">Gostou da análise? ðŸŽ¯</p>
                  <p className="text-slate-400 text-sm mb-4">
                    Na versão Pro você também analisa <strong className="text-amber-400">gravações de áudio</strong>, 
                    exporta relatórios e tem painel completo de gestão. Faça uma cotação agora.
                  </p>
                  <a
                    href={WA_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold px-6 py-3 rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Quero o Plano Pro â€” WhatsApp
                  </a>
                  <p className="text-slate-600 text-xs mt-2">Resposta imediata Â· Sem compromisso</p>
                </div>

                <div className="mt-4 pt-4 border-t border-[#e2e8f0] text-center">
                  <button
                    onClick={() => { setStep(1); setResult(null); setFiles([]); setForm({ nomeSegurado: "", cpf: "", placa: "", tipoEvento: "", dataHora: "", local: "", relato: "" }) }}
                    className="text-sm text-[#64748b] hover:text-[#1a2744] transition-colors"
                  >
                    â†© Fazer outra análise
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Nota de rodapé do trial */}
          <p className="text-center text-xs text-[#94a3b8] mt-4">
            ðŸ”’ Análise completa e gratuita. Seus dados são usados apenas para gerar o resultado e não são armazenados.
          </p>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-20 bg-[#1a2744]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Pronto para otimizar<br />sua operação?
          </h2>
          <p className="text-slate-400 mb-8">
            Fale com nosso time e saiba como o IAnalista se encaixa na sua proteção veicular.
          </p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-lg px-8 py-4 rounded-2xl transition-all shadow-lg shadow-green-500/20"
          >
            <MessageCircle className="w-6 h-6" />
            Falar no WhatsApp
          </a>
          <p className="text-slate-600 text-sm mt-4">(11) 92671-2965 Â· Resposta imediata</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#020617] border-t border-[#243459] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500 p-1 rounded-md">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-400 text-sm font-medium">IAnalista Â· ianalista.com</span>
          </div>
          <p className="text-slate-600 text-xs">
            Â© {new Date().getFullYear()} IAnalista. Análise inteligente de sinistros veiculares.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
              Àrea do cliente
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ─── Campo genérico ────────────────────────────────────────────────────────────
function Field({
  label, name, value, onChange, placeholder,
}: {
  label: string
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-[#1a2744] mb-1.5">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm text-[#1a2744] focus:outline-none focus:border-[#1a2744] focus:ring-1 focus:ring-[#1a2744] placeholder:text-[#94a3b8]"
      />
    </div>
  )
}

// ─── Utilitário ───────────────────────────────────────────────────────────────
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

