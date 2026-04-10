const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'app', 'page.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// 1. Inject AnaliseResult interface before "export default function LandingPage"
const interfaceCode = `interface AnaliseResult {
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

`

if (!content.includes('interface AnaliseResult')) {
  content = content.replace(
    'export default function LandingPage()',
    interfaceCode + 'export default function LandingPage()'
  )
  console.log('✅ Interface AnaliseResult added')
} else {
  console.log('ℹ️  Interface AnaliseResult already exists')
}

// 2. Replace the result state type
content = content.replace(
  'useState<Record<string, unknown> | null>(null)',
  'useState<AnaliseResult | null>(null)'
)
console.log('✅ State type updated')

// 3. Remove all "as string" casts on result fields
const casts = [
  ['(result.recomendacao as string)', 'result.recomendacao'],
  ['(result.score_confiabilidade as number)', 'result.score_confiabilidade'],
  ['result.resumo as string', 'result.resumo ?? ""'],
  ['result.proximos_passos as string', 'result.proximos_passos ?? ""'],
  ['result.linha_do_tempo as string', '(Array.isArray(result.linha_do_tempo) ? result.linha_do_tempo.join(", ") : result.linha_do_tempo ?? "")'],
  // arrays
  ['result.pontos_atencao as string[]', 'result.pontos_atencao as string[]'],
  ['result.indicadores_fraude as string[]', 'result.indicadores_fraude as string[]'],
]

for (const [from, to] of casts) {
  const count = (content.split(from).length - 1)
  if (count > 0) {
    content = content.split(from).join(to)
    console.log(`✅ Replaced ${count}x: "${from}"`)
  }
}

fs.writeFileSync(filePath, content, 'utf8')
console.log('\n✅ page.tsx updated successfully!')
