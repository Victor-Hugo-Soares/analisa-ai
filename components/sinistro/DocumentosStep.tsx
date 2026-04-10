"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Mic, FileText, Image, X, Upload } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ArquivoAnexo } from "@/lib/types"

interface DocumentosStepProps {
  arquivos: ArquivoAnexo[]
  onChange: (arquivos: ArquivoAnexo[]) => void
  onRawFile: (nome: string, file: File) => void
  onRemoveRawFile: (nome: string) => void
}

interface DropzoneZoneProps {
  tipo: "audio" | "documento" | "imagem"
  accept: Record<string, string[]>
  maxSize: number
  label: string
  description: string
  icon: React.ElementType
  iconColor: string
  arquivos: ArquivoAnexo[]
  onDrop: (files: File[], tipo: "audio" | "documento" | "imagem") => void
  onRemove: (nome: string) => void
}

function DropzoneZone({
  tipo,
  accept,
  maxSize,
  label,
  description,
  icon: Icon,
  iconColor,
  arquivos,
  onDrop,
  onRemove,
}: DropzoneZoneProps) {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      onDrop(acceptedFiles, tipo)
    },
    [tipo, onDrop]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
  })

  const tipoArquivos = arquivos.filter((a) => a.tipo === tipo)

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

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
          <div className={cn("p-3 rounded-xl mb-3", `bg-${iconColor}/10`)}>
            <Icon className={cn("w-7 h-7", `text-${iconColor}`)} />
          </div>
          <p className="font-semibold text-[#0f172a] text-sm mb-1">{label}</p>
          <p className="text-xs text-[#64748b] mb-2">{description}</p>
          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <Upload className="w-3 h-3" />
            <span>
              {isDragActive
                ? "Solte os arquivos aqui"
                : "Arraste ou clique para selecionar"}
            </span>
          </div>
        </div>
      </div>

      {tipoArquivos.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {tipoArquivos.map((arquivo) => (
            <div
              key={arquivo.nome}
              className="flex items-center gap-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-3 py-2"
            >
              <Icon className="w-4 h-4 text-[#64748b] flex-shrink-0" />
              <span className="text-sm text-[#0f172a] flex-1 truncate">
                {arquivo.nome}
              </span>
              <span className="text-xs text-[#94a3b8] flex-shrink-0">
                {formatSize(arquivo.tamanho)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(arquivo.nome)}
                className="text-[#94a3b8] hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
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
  function handleDrop(files: File[], tipo: "audio" | "documento" | "imagem") {
    const novosArquivos: ArquivoAnexo[] = files.map((file) => ({
      nome: file.name,
      tipo,
      tamanho: file.size,
      // Sem base64 — arquivos serão enviados via Supabase Storage
    }))

    for (const file of files) {
      onRawFile(file.name, file)
    }

    onChange([...arquivos, ...novosArquivos])
  }

  function handleRemove(nome: string) {
    onRemoveRawFile(nome)
    onChange(arquivos.filter((a) => a.nome !== nome))
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0f172a] mb-1">
        Documentos e Evidências
      </h2>
      <p className="text-[#64748b] text-sm mb-6">
        Anexe os arquivos disponíveis. Quanto mais evidências, mais precisa será
        a análise.
      </p>

      <div className="space-y-4">
        <DropzoneZone
          tipo="audio"
          label="Ligação do Segurado"
          description="MP3, WAV, M4A — até 25MB"
          icon={Mic}
          iconColor="blue-600"
          accept={{
            "audio/mpeg": [".mp3"],
            "audio/wav": [".wav"],
            "audio/mp4": [".m4a"],
            "audio/x-m4a": [".m4a"],
          }}
          maxSize={25 * 1024 * 1024}
          arquivos={arquivos}
          onDrop={handleDrop}
          onRemove={handleRemove}
        />

        <DropzoneZone
          tipo="documento"
          label="Documentos"
          description="PDF (Boletim de Ocorrência, laudos, etc.) — até 10MB"
          icon={FileText}
          iconColor="teal-600"
          accept={{
            "application/pdf": [".pdf"],
          }}
          maxSize={10 * 1024 * 1024}
          arquivos={arquivos}
          onDrop={handleDrop}
          onRemove={handleRemove}
        />

        <DropzoneZone
          tipo="imagem"
          label="Fotos e Vídeos"
          description="JPG, PNG, WEBP — até 20MB cada"
          icon={Image}
          iconColor="purple-600"
          accept={{
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
          }}
          maxSize={20 * 1024 * 1024}
          arquivos={arquivos}
          onDrop={handleDrop}
          onRemove={handleRemove}
        />
      </div>

      {arquivos.length === 0 && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 font-medium">
            Nenhum arquivo anexado
          </p>
          <p className="text-xs text-amber-700 mt-0.5">
            A análise será feita apenas com base no relato textual. Para uma
            análise mais precisa, adicione áudio, documentos ou imagens.
          </p>
        </div>
      )}
    </div>
  )
}
