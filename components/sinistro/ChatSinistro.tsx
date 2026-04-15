"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Loader2, MessageCircle } from "lucide-react"
import type { Sinistro } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGESTOES = [
  "Por que a recomendação foi essa?",
  "Quais documentos devo solicitar?",
  "Quais os maiores riscos neste caso?",
  "Como devo abordar o segurado?",
]

export default function ChatSinistro({ sinistro }: { sinistro: Sinistro }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: Message = { role: "user", content }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput("")
    setLoading(true)
    setStreamingText("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sinistro, messages: next }),
      })

      if (!res.ok || !res.body) throw new Error("Erro na resposta")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        full += chunk
        setStreamingText(full)
      }

      setMessages([...next, { role: "assistant", content: full }])
      setStreamingText("")
    } catch {
      setMessages([...next, {
        role: "assistant",
        content: "Ocorreu um erro ao processar sua pergunta. Tente novamente.",
      }])
      setStreamingText("")
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const showWelcome = messages.length === 0 && !loading

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0f172a]">Tire suas dúvidas sobre este sinistro</p>
          <p className="text-xs text-[#64748b]">O IAnalista tem acesso completo à análise e aos dados do caso</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-[#64748b]">IA online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {showWelcome && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-12 h-12 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#0f172a] mb-1">Análise concluída. Alguma dúvida?</p>
              <p className="text-xs text-[#64748b]">Pergunte sobre a análise, os documentos, a recomendação ou próximos passos.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-[#f1f5f9] hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 border border-[#e2e8f0] text-[#64748b] px-3 py-1.5 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
              msg.role === "user" ? "bg-[#1a2744]" : "bg-amber-500"
            )}>
              {msg.role === "user"
                ? <User className="w-3.5 h-3.5 text-white" />
                : <Bot className="w-3.5 h-3.5 text-white" />
              }
            </div>
            <div className={cn(
              "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              msg.role === "user"
                ? "bg-[#1a2744] text-white rounded-tr-sm"
                : "bg-[#f1f5f9] text-[#0f172a] rounded-tl-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming */}
        {streamingText && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="max-w-[80%] bg-[#f1f5f9] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-[#0f172a] leading-relaxed">
              {streamingText}
              <span className="inline-block w-0.5 h-3.5 bg-amber-500 ml-0.5 animate-pulse align-middle" />
            </div>
          </div>
        )}

        {loading && !streamingText && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-[#f1f5f9] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-[#e2e8f0]">
        <div className="flex items-end gap-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-2 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pergunte sobre a análise, os documentos, a recomendação..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-[#0f172a] placeholder:text-[#94a3b8] resize-none outline-none max-h-32 py-1"
            style={{ fieldSizing: "content" } as React.CSSProperties}
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-8 h-8 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          >
            {loading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />
            }
          </button>
        </div>
        <p className="text-[10px] text-[#94a3b8] mt-1.5 text-center">Enter para enviar · Shift+Enter para nova linha</p>
      </div>
    </div>
  )
}
