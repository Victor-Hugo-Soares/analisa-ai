import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { DadosSinistro } from "@/lib/types"

interface DadosStepProps {
  dados: DadosSinistro
  onChange: (dados: DadosSinistro) => void
}

export default function DadosStep({ dados, onChange }: DadosStepProps) {
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    onChange({ ...dados, [e.target.name]: e.target.value })
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0f172a] mb-1">
        Dados do Evento
      </h2>
      <p className="text-[#64748b] text-sm mb-6">
        Preencha as informações do associado e do evento
      </p>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#0f172a] font-medium">
              Nome do Associado <span className="text-red-500">*</span>
            </Label>
            <Input
              name="nomeSegurado"
              placeholder="Nome completo"
              value={dados.nomeSegurado}
              onChange={handleChange}
              className="border-[#e2e8f0] focus:border-[#1a2744]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#0f172a] font-medium">
              CPF <span className="text-red-500">*</span>
            </Label>
            <Input
              name="cpf"
              placeholder="000.000.000-00"
              value={dados.cpf}
              onChange={handleChange}
              className="border-[#e2e8f0] focus:border-[#1a2744]"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#0f172a] font-medium">
              Placa do Veículo <span className="text-red-500">*</span>
            </Label>
            <Input
              name="placa"
              placeholder="ABC-1234"
              value={dados.placa}
              onChange={handleChange}
              className="border-[#e2e8f0] focus:border-[#1a2744]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[#0f172a] font-medium">
              Data e Hora do Evento <span className="text-red-500">*</span>
            </Label>
            <Input
              name="dataHora"
              type="datetime-local"
              value={dados.dataHora}
              onChange={handleChange}
              className="border-[#e2e8f0] focus:border-[#1a2744]"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[#0f172a] font-medium">
            Local do Evento <span className="text-red-500">*</span>
          </Label>
          <Input
            name="local"
            placeholder="Cidade, Estado (ex: São Paulo, SP)"
            value={dados.local}
            onChange={handleChange}
            className="border-[#e2e8f0] focus:border-[#1a2744]"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#0f172a] font-medium">
            Relato do Associado <span className="text-red-500">*</span>
          </Label>
          <Textarea
            name="relato"
            placeholder="Descreva em detalhes como ocorreu o evento, circunstâncias, pessoas envolvidas, danos causados..."
            value={dados.relato}
            onChange={handleChange}
            className="border-[#e2e8f0] focus:border-[#1a2744] min-h-[140px] resize-none"
            required
          />
          <p className="text-xs text-[#94a3b8]">
            Quanto mais detalhado o relato, mais precisa será a análise da IA.
          </p>
        </div>
      </div>
    </div>
  )
}
