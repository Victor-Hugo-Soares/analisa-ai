"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { getAccessToken } from "@/lib/storage"

interface AprendizadoModalProps {
  open: boolean
  onClose: () => void
}

export default function AprendizadoModal({ open, onClose }: AprendizadoModalProps) {
  const [sinistroId, setSinistroId] = useState("")
  const [conteudo, setConteudo] = useState("")
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState("")

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setLoading(true)

    try {
      const token = getAccessToken()
      const res = await fetch("/api/aprendizados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sinistro_id: sinistroId, conteudo }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Erro ao enviar aprendizado")
      }

      setSucesso(true)
      setSinistroId("")
      setConteudo("")

      setTimeout(() => {
        setSucesso(false)
        onClose()
      }, 1500)
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado")
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    setSinistroId("")
    setConteudo("")
    setErro("")
    setSucesso(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h2 className="text-base font-semibold text-[#0f172a]">Relatar Aprendizado</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-[#94a3b8] hover:text-[#0f172a] transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* ID do Evento */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="sinistro-id" className="text-sm font-medium text-[#0f172a]">
              ID do Evento
            </label>
            <input
              id="sinistro-id"
              type="text"
              value={sinistroId}
              onChange={(e) => setSinistroId(e.target.value)}
              placeholder="ex: sin-001"
              required
              disabled={loading}
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#00bcb6] focus:border-transparent transition disabled:opacity-60"
            />
            <p className="text-xs text-[#94a3b8]">Informe o ID do evento relacionado</p>
          </div>

          {/* Aprendizado */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="conteudo" className="text-sm font-medium text-[#0f172a]">
              Aprendizado
            </label>
            <textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Descreva o aprendizado observado neste evento..."
              rows={4}
              required
              disabled={loading}
              className="border border-[#e2e8f0] rounded-lg px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#00bcb6] focus:border-transparent transition resize-none disabled:opacity-60"
            />
          </div>

          {/* Feedback */}
          {sucesso && (
            <p className="text-sm text-green-600 font-medium">
              Aprendizado enviado com sucesso!
            </p>
          )}
          {erro && (
            <p className="text-sm text-red-500 font-medium">{erro}</p>
          )}

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-[#0f172a] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-60 flex items-center gap-2"
              style={{ backgroundColor: "#00bcb6" }}
            >
              {loading && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
