"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Mic, FileText, ImageIcon, Video, X, Upload, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ArquivoAnexo, TipoDocumento } from "@/lib/types"
import { TIPO_DOCUMENTO_LABEL } from "@/lib/types"

interface DocumentosStepProps {
  arquivos: ArquivoAnexo[]
  onChange: (arquivos: ArquivoAnexo[]) => void
  onRawFile: (nome: string, file: File) => void
  onRemoveRawFile: (nome: string) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface AudioDropzoneProps {
  arquivos: ArquivoAnexo[]
  onDrop: (files: File[]) => void
  onRemove: (nome: string) => void
}

function AudioDropzone({ arquivos, onDrop, onRemove }: AudioDropzoneProps) {
  const handleDrop = useCallback((files: File[]) => onDrop(files), [onDrop])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/mp4": [".m4a", ".mp4"],
      "audio/x-m4a": [".m4a"],
      "audio/ogg": [".ogg", ".opus"],
      "audio/webm": [".webm"],
      "audio/flac": [".flac"],
      "audio/*": [],
    },
    maxSize: 25 * 1024 * 1024,
  })

  const lista = arquivos.filter((a) => a.tipo === "audio")

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all",
          isDragActive
            ? "border-[#1a2744] bg-[#1a2744]/5"
            : "border-[#e2e8f0] bg-white hover:border-[#94a3b8] hover:bg-[#f8fafc]"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-xl mb-3 bg-blue-600/10">
            <Mic className="w-7 h-7 text-blue-600" />
          </div>
          <p className="font-semibold text-[#0f172a] text-sm mb-1">Ligação do Associado</p>
          <p className="text-xs text-[#64748b] mb-2">MP3, WAV, M4A, OGG, WEBM — até 25MB</p>
          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <Upload className="w-3 h-3" />
            <span>{isDragActive ? "Solte os arquivos aqui" : "Arraste ou clique para selecionar"}</span>
          </div>
        </div>
      </div>
      {lista.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {lista.map((a) => (
            <div key={a.nome} className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2">
              <Mic className="w-4 h-4 text-[#64748b] flex-shrink-0" />
              <span className="text-sm text-[#0f172a] flex-1 truncate">{a.nome}</span>
              <span className="text-xs text-[#94a3b8] flex-shrink-0">{formatSize(a.tamanho)}</span>
              <button type="button" onClick={() => onRemove(a.nome)} className="text-[#94a3b8] hover:text-red-500 transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ImageDropzoneProps {
  arquivos: ArquivoAnexo[]
  onDrop: (files: File[]) => void
  onRemove: (nome: string) => void
}

function ImageDropzone({ arquivos, onDrop, onRemove }: ImageDropzoneProps) {
  const handleDrop = useCallback((files: File[]) => onDrop(files), [onDrop])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
      "video/mp4": [".mp4"],
    },
    maxSize: 100 * 1024 * 1024,
  })

  const lista = arquivos.filter((a) => a.tipo === "imagem" || a.tipo === "video")

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all",
          isDragActive
            ? "border-[#1a2744] bg-[#1a2744]/5"
            : "border-[#e2e8f0] bg-white hover:border-[#94a3b8] hover:bg-[#f8fafc]"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-xl mb-3 bg-purple-600/10">
            <ImageIcon className="w-7 h-7 text-purple-600" />
          </div>
          <p className="font-semibold text-[#0f172a] text-sm mb-1">Fotos e Vídeos</p>
          <p className="text-xs text-[#64748b] mb-2">JPG, PNG, WEBP — até 20MB | MP4 — até 100MB</p>
          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <Upload className="w-3 h-3" />
            <span>{isDragActive ? "Solte os arquivos aqui" : "Arraste ou clique para selecionar"}</span>
          </div>
        </div>
      </div>
      {lista.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {lista.map((a) => (
            <div key={a.nome} className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2">
              {a.tipo === "video" ? (
                <Video className="w-4 h-4 text-purple-600 flex-shrink-0" />
              ) : (
                <ImageIcon className="w-4 h-4 text-[#64748b] flex-shrink-0" />
              )}
              <span className="text-sm text-[#0f172a] flex-1 truncate">{a.nome}</span>
              <span className="text-xs text-[#94a3b8] flex-shrink-0">{formatSize(a.tamanho)}</span>
              <button type="button" onClick={() => onRemove(a.nome)} className="text-[#94a3b8] hover:text-red-500 transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface DocDropzoneProps {
  arquivos: ArquivoAnexo[]
  onDrop: (files: File[]) => void
  onRemove: (nome: string) => void
  onChangeTipoDoc: (nome: string, tipoDoc: TipoDocumento) => void
}

function DocDropzone({ arquivos, onDrop, onRemove, onChangeTipoDoc }: DocDropzoneProps) {
  const handleDrop = useCallback((files: File[]) => onDrop(files), [onDrop])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxSize: 20 * 1024 * 1024,
  })

  const lista = arquivos.filter((a) => a.tipo === "documento")
  const semTipo = lista.filter((a) => !a.tipoDoc)

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all",
          isDragActive
            ? "border-[#00bcb6] bg-[#00bcb6]/5"
            : "border-[#e2e8f0] bg-white hover:border-[#94a3b8] hover:bg-[#f8fafc]"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-xl mb-3 bg-[#00bcb6]/10">
            <FileText className="w-7 h-7 text-[#00bcb6]" />
          </div>
          <p className="font-semibold text-[#0f172a] text-sm mb-1">Documentos</p>
          <p className="text-xs text-[#64748b] mb-2">
            PDF ou foto — CRLV, CNH, BO, Laudos, FIPE, Orçamentos — até 20MB cada
          </p>
          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <Upload className="w-3 h-3" />
            <span>{isDragActive ? "Solte os arquivos aqui" : "Arraste ou clique para selecionar"}</span>
          </div>
        </div>
      </div>

      {lista.length > 0 && (
        <div className="mt-3 space-y-2">
          {lista.map((a) => (
            <div key={a.nome} className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3">
              {/* Linha superior: ícone + nome + tamanho + remover */}
              <div className="flex items-center gap-2 mb-2">
                {/\.(jpg|jpeg|png|webp)$/i.test(a.nome)
                  ? <ImageIcon className="w-4 h-4 text-purple-500 flex-shrink-0" />
                  : <FileText className="w-4 h-4 text-[#00bcb6] flex-shrink-0" />
                }
                <span className="text-sm text-[#0f172a] flex-1 truncate font-medium">{a.nome}</span>
                <span className="text-xs text-[#94a3b8] flex-shrink-0">{formatSize(a.tamanho)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(a.nome)}
                  className="text-[#94a3b8] hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Seletor de tipo */}
              <div className="relative">
                <select
                  value={a.tipoDoc ?? ""}
                  onChange={(e) => onChangeTipoDoc(a.nome, e.target.value as TipoDocumento)}
                  className={cn(
                    "w-full appearance-none text-xs rounded-lg border px-3 py-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-[#00bcb6]/30 focus:border-[#00bcb6] transition-colors",
                    !a.tipoDoc
                      ? "border-amber-300 text-amber-700 bg-amber-50"
                      : "border-[#e2e8f0] text-[#0f172a]"
                  )}
                >
                  <option value="" disabled>
                    ⚠ Selecione o tipo de documento…
                  </option>
                  {(Object.entries(TIPO_DOCUMENTO_LABEL) as [TipoDocumento, string][]).map(
                    ([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Aviso se algum doc ainda sem tipo */}
      {semTipo.length > 0 && (
        <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
          {semTipo.length === 1
            ? "Classifique o tipo de 1 documento para melhorar a análise."
            : `Classifique o tipo de ${semTipo.length} documentos para melhorar a análise.`}
        </p>
      )}
    </div>
  )
}

export default function DocumentosStep({
  arquivos,
  onChange,
  onRawFile,
  onRemoveRawFile,
}: DocumentosStepProps) {
  function handleDropAudio(files: File[]) {
    const novos: ArquivoAnexo[] = files.map((f) => ({ nome: f.name, tipo: "audio", tamanho: f.size }))
    for (const f of files) onRawFile(f.name, f)
    onChange([...arquivos, ...novos])
  }

  function handleDropDoc(files: File[]) {
    const novos: ArquivoAnexo[] = files.map((f) => ({ nome: f.name, tipo: "documento", tamanho: f.size }))
    for (const f of files) onRawFile(f.name, f)
    onChange([...arquivos, ...novos])
  }

  function handleDropImagem(files: File[]) {
    const novos: ArquivoAnexo[] = files.map((f) => ({
      nome: f.name,
      tipo: f.type === "video/mp4" ? "video" : "imagem",
      tamanho: f.size,
    }))
    for (const f of files) onRawFile(f.name, f)
    onChange([...arquivos, ...novos])
  }

  function handleRemove(nome: string) {
    onRemoveRawFile(nome)
    onChange(arquivos.filter((a) => a.nome !== nome))
  }

  function handleChangeTipoDoc(nome: string, tipoDoc: TipoDocumento) {
    onChange(arquivos.map((a) => (a.nome === nome ? { ...a, tipoDoc } : a)))
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0f172a] mb-1">Documentos e Evidências</h2>
      <p className="text-[#64748b] text-sm mb-6">
        Anexe os arquivos disponíveis. Quanto mais evidências, mais precisa será a análise.
      </p>

      <div className="space-y-4">
        <AudioDropzone
          arquivos={arquivos}
          onDrop={handleDropAudio}
          onRemove={handleRemove}
        />

        <DocDropzone
          arquivos={arquivos}
          onDrop={handleDropDoc}
          onRemove={handleRemove}
          onChangeTipoDoc={handleChangeTipoDoc}
        />

        <ImageDropzone
          arquivos={arquivos}
          onDrop={handleDropImagem}
          onRemove={handleRemove}
        />
      </div>

      {arquivos.length === 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">Nenhum arquivo anexado</p>
          <p className="text-xs text-amber-700 mt-0.5">
            A análise será feita apenas com base no relato textual. Para uma análise mais precisa,
            adicione áudio, documentos ou imagens.
          </p>
        </div>
      )}
    </div>
  )
}
