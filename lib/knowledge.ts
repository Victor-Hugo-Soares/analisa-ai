/**
 * BASE DE CONHECIMENTO IANALISTA
 *
 * Este arquivo é o documento vivo de conhecimento do sistema.
 * Ele combina o regulamento oficial da Loma Proteção Veicular com as diretrizes
 * analíticas do IAnalista.
 *
 * APRENDIZADO CONTÍNUO:
 * Este conhecimento foi construído com base nos regulamentos e guias práticos
 * da Loma Proteção Veicular e será atualizado regularmente com novos ensinamentos,
 * casos reais analisados, padrões emergentes de fraude e atualizações regulatórias.
 * Toda análise realizada pelo sistema deve ser interpretada à luz deste documento,
 * que tem precedência sobre qualquer suposição genérica.
 *
 * Versão: 2.0 — Abril/2026
 * Próxima revisão: ao receber novos PDFs, casos ou orientações da gestão Loma.
 */

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 1 — SOBRE A LOMA PROTEÇÃO VEICULAR (CONTEXTO INSTITUCIONAL)
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_CONTEXTO = `
SOBRE A LOMA PROTEÇÃO VEICULAR:
A Loma Proteção Veicular opera como uma Associação de Proteção Patrimonial Mutualista (PPM),
uma entidade privada sem fins lucrativos que NÃO é seguradora e NÃO é regulada pela SUSEP.
Seu modelo é o MUTUALISMO: os associados compartilham proporcionalmente as despesas dos
eventos danosos entre si, via rateio mensal.

DIFERENÇA CRÍTICA PARA FINS DE ANÁLISE:
- Não é contrato de seguro. É um plano de socorro mútuo entre associados.
- A cobertura depende 100% da adimplência do associado no mês do evento.
- A associação tem o direito de negar cobertura com base em exclusões contratuais sem
  precisar de decisão judicial prévia.
- Não há banco de dados centralizado de histórico entre associações (diferente das seguradoras).
  Isso facilita fraudes de "migração": associado frauda, sai, entra em outra associação.

BOLETO E PAGAMENTO:
- Vence todo dia 10 do mês.
- Disponível via e-mail, SMS e aplicativo Loma.
- Suspensão dos benefícios após 5 dias de atraso (dia 15).
- Cancelamento definitivo após 15 dias da notificação de mora.
- Reativação exige: quitação dos débitos + nova vistoria do veículo (24h de carência após aprovação).
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 2 — EVENTOS COBERTOS
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_COBERTURAS = `
EVENTOS COBERTOS PELO PPM (conforme termo de adesão do associado):

1. ROUBO — subtração do veículo mediante violência ou grave ameaça ao condutor/proprietário.
2. FURTO — subtração do veículo sem violência, quando o associado não está presente.
3. COLISÃO — danos causados por impacto do veículo com outro veículo, objeto ou obstáculo.
4. INCÊNDIO — SOMENTE se decorrente de colisão. Incêndio criminoso ou por negligência na
   manutenção NÃO tem cobertura. Veículo com Kit Gás sem documentação do INMETRO/DETRAN
   atualizada também não tem cobertura de incêndio.
5. FENÔMENOS DA NATUREZA — enchentes, tempestades, granizo, vendavais, queda de árvore.
   ATENÇÃO: eventos classificados como calamidade pública (grandes enchentes, pandemias, guerras)
   são excluídos da cobertura.

COBERTURAS OPCIONAIS (dependem do plano contratado):
- Danos a terceiros: limites de R$30.000, R$50.000 ou R$100.000 por período anual.
- Proteção de Vidros (70%): para-brisa, vidros laterais, traseiro, lanternas, retrovisores.
  O associado paga 30% do valor da peça/serviço diretamente ao prestador.
  Limite: 1 acionamento por ciclo de 12 meses.
- Carro Reserva.
- Assistência 24 horas: guincho, chaveiro, socorro mecânico, pane seca, troca de pneu.

ACESSÓRIOS: cobertos somente se estavam presentes na vistoria inicial E constam na nota fiscal
de compra do veículo. Acessórios de som, DVD, rodas não originais, GNV e similares NÃO são
cobertos se danificados isoladamente.

PNEUS: até 6 meses de uso → 100% ressarcimento. Mais de 6 meses → 40%. Sem nota fiscal → 40%.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 3 — EXCLUSÕES DE COBERTURA (CRÍTICO PARA ANÁLISE DE FRAUDE)
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_EXCLUSOES = `
EVENTOS EXCLUÍDOS DA COBERTURA — O SISTEMA DEVE VERIFICAR ATIVAMENTE CADA UM:

──── EXCLUSÕES DE CONDUTA DO CONDUTOR ────

1. SEM CNH OU COM CNH VENCIDA/SUSPENSA/CASSADA: evento com condutor sem habilitação válida
   e adequada para a categoria do veículo → cobertura negada automaticamente.

2. EMBRIAGUEZ / SUBSTÂNCIAS PSICOATIVAS: qualquer teor alcoólico no sangue cancela a cobertura.
   A embriaguez é PRESUMIDA se o condutor se recusar ao bafômetro ou exame de sangue.
   Medicamentos incompatíveis com condução também excluem.

3. EXCESSO DE VELOCIDADE: qualquer percentual acima do limite da via → exclusão.

4. INFRAÇÕES DE TRÂNSITO GRAVES que demonstrem culpa do associado:
   - Contramão
   - Ultrapassagem proibida
   - Avanço de sinal vermelho
   - Uso de celular ao dirigir
   - Fuga do local do acidente sem prestar socorro (art. 176 CTB)
   - Participação em racha, fuga policial ou atividade ilegal

5. ATOS DOLOSOS (intencionais): qualquer ato intencional do associado, condutor ou representante
   para gerar ou inflar o sinistro → exclusão total. Inclui dolo eventual.

──── EXCLUSÕES DE USO DO VEÍCULO ────

6. USO COMERCIAL / REMUNERADO NÃO DECLARADO: veículo cadastrado como uso particular mas
   utilizado para Uber, 99, iFood, táxi, frete, entrega, locação ou qualquer atividade remunerada →
   cobertura NULA, mesmo que o sinistro não tenha relação direta com o uso comercial.
   RED FLAG: verificar presença de suporte de celular, mochila de entrega, histórico de apps de
   mobilidade no histórico de conversas, padrão de quilometragem.

7. FORA DO TERRITÓRIO NACIONAL: eventos ocorridos em outro país não têm cobertura.

8. COMPETIÇÕES E APOSTAS: corridas, rachas, provas de velocidade e treinos preparatórios.

9. CARGA INADEQUADA: transporte de passageiros ou carga além da capacidade ou em locais não
   destinados a isso.

──── EXCLUSÕES DE CONDIÇÃO DO VEÍCULO ────

10. RASTREADOR AUSENTE OU INATIVO (veículos acima de R$60.000):
    Para roubo e furto, a instalação do rastreador e seu funcionamento contínuo são CONDIÇÃO
    para cobertura. Se o rastreador estiver desligado, com bateria baixa ou sem sinal no momento
    do sinistro → cobertura negada para furto/roubo.
    ANÁLISE CRÍTICA: rastreador inativo exatamente no momento do furto é um dos indicadores
    mais fortes de fraude.

11. DOCUMENTAÇÃO IRREGULAR: veículo sem IPVA, licenciamento ou documentação em dia no
    momento do evento → sem cobertura.

12. MODIFICAÇÕES NÃO DECLARADAS: veículo rebaixado, turbinado, kit suspensão, blindagem,
    kit gás irregular ou qualquer alteração que comprometa segurança ou desempenho original →
    exclusão ou depreciação de 30%.

13. AVARIAS PREEXISTENTES: danos identificados na vistoria inicial são excluídos de danos
    reparáveis. Em perda total, são descontados do valor da indenização.

14. MÁS CONDIÇÕES DE CONSERVAÇÃO: pneus com sulcos abaixo de 1,7mm, freios comprometidos,
    suspensão com problemas que podem causar colisão → exclusão.

──── EXCLUSÕES DE SITUAÇÃO LEGAL ────

15. FRAUDES E APROPRIAÇÃO INDÉBITA: furto/roubo fraudado → negativa + possível exclusão do quadro.

16. VEÍCULO COM DÉBITOS JUDICIAIS / GRAVAME: para ressarcimento integral, o veículo deve estar
    livre de gravames. Se houver alienação fiduciária, o pagamento vai diretamente ao credor.

17. VEÍCULO DE LEILÃO: aceito, mas com depreciação de 30% sobre a tabela FIPE.

18. CHASSI REMARCADO: aceito, mas com depreciação de 30% sobre a tabela FIPE.

──── EXCLUSÕES DE RESPONSABILIDADE ────

19. DANOS A PARENTES: danos causados pelo associado/condutor a cônjuge, ascendentes, irmãos,
    quem mora na mesma casa ou depende economicamente → sem cobertura.

20. ACORDOS SEM ANUÊNCIA DA ASSOCIAÇÃO: associado que fizer acordo judicial ou extrajudicial
    ou assumir responsabilidades sem autorização da Loma perde os direitos do PPM.

21. REPAROS SEM AUTORIZAÇÃO: qualquer reparo realizado sem aprovação prévia da associação →
    sem ressarcimento. O associado deve aguardar anuência antes de qualquer conserto.

──── OUTRAS EXCLUSÕES ────

22. CALAMIDADE PÚBLICA: grandes enchentes reconhecidas pelo poder público, pandemias, guerras,
    convulsões sociais de larga escala → exclusão total.

23. DESGASTE NATURAL: corrosão, ferrugem, desgaste de peças, defeitos mecânicos sem evento
    coberto associado → sem cobertura.

24. LUCROS CESSANTES E DANOS MORAIS: paralisação do veículo, perda de renda, dano moral
    ou corporal → não cobertos (exceto se expressamente contratado).

25. VIDROS BLINDADOS: excluídos de qualquer cobertura, inclusive do programa de proteção de vidros.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 4 — PRAZOS CRÍTICOS PARA COMUNICAÇÃO DO EVENTO
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_PRAZOS = `
PRAZOS MÁXIMOS PARA COMUNICAR O EVENTO À ASSOCIAÇÃO:

| Tipo de Evento          | Prazo Máximo           | Observação                                    |
|-------------------------|------------------------|-----------------------------------------------|
| Roubo                   | 1 dia útil             | Para viabilizar busca/recuperação do veículo  |
| Furto                   | 1 dia útil             | Idem                                          |
| Incêndio                | 1 dia útil             | Para apuração das causas                      |
| Fenômenos da Natureza   | 1 dia útil             | Enchente, granizo, vendaval, queda de árvore  |
| Colisão                 | Até 30 dias corridos   | Salvo agravamento dos danos                   |
| Proteção de Vidros      | Até 30 dias corridos   | Salvo agravamento                             |
| Geral (regra padrão)    | 3 dias úteis           | Descumprimento = não atendimento do evento    |

ANÁLISE DE PRAZO:
- Comunicação fora do prazo = negativa automática (salvo justificativa aceita pela diretoria).
- Para roubo/furto: comunicação acima de 24h é RED FLAG independente do prazo contratual.
  Quanto mais rápida a comunicação de roubo/furto, menor o risco de fraude (veículo pode ser
  recuperado, rastreamento ativo confirma o relato).
- Para colisão: comunicação muitos dias depois pode indicar tentativa de esconder o evento
  até conseguir "montar" a documentação.

PRAZO PARA ANÁLISE DA ASSOCIAÇÃO:
- Colisão (danos reparáveis): até 7 dias úteis após entrega de toda documentação em PDF.
- Vidros: até 3 dias úteis após documentação completa.
- Ressarcimento integral: até 90 dias após apresentação de TODOS os documentos exigidos.
- Prazo suspenso durante sindicância ou inquérito policial.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 5 — DOCUMENTOS EXIGIDOS POR TIPO DE ACIONAMENTO
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_DOCUMENTOS = `
DOCUMENTOS OBRIGATÓRIOS PARA ACIONAMENTO:

──── DANOS REPARÁVEIS (colisão, fenômenos da natureza, incêndio parcial) ────
• Boletim de Ocorrência — ATENÇÃO: BO virtual (feito pela internet sem autoridade policial)
  NÃO é aceito para danos reparáveis.
• CNH do condutor no momento do evento (válida e compatível com a categoria do veículo).
• Demais documentos que a associação solicitar.

──── PERDA TOTAL — PESSOA FÍSICA ────
• CNH do associado
• CRV original (documento de transferência) preenchido a favor da Loma, com firma reconhecida
• CRLV original com prova de quitação do Seguro Obrigatório e IPVA dos 2 últimos anos
• Manual do veículo
• Todas as chaves do veículo (ausência de chaves é RED FLAG em furtos)
• Certidão negativa de furto e multa do veículo
• Procuração pública para transferência de titularidade à Loma

──── PERDA TOTAL — PESSOA JURÍDICA ────
• Todos os documentos de Pessoa Física +
• Cópia do Contrato ou Estatuto Social com alterações
• Nota fiscal de venda à associação (quando aplicável)

──── ROUBO OU FURTO (ressarcimento integral) ────
• Todos os documentos de perda total +
• Extrato do DETRAN constando queixa de roubo/furto
• Certidão negativa de multas do veículo

──── PROTEÇÃO DE VIDROS ────
• Cópia da CNH
• Cópia do CRLV

ALERTAS DOCUMENTAIS CRÍTICOS:
1. BO virtual não é aceito para danos reparáveis → qualquer tentativa de usar BO virtual
   indica que o associado quer evitar a autoridade policial (RED FLAG).
2. Ausência das chaves do veículo em caso de furto → excluído ou fortemente suspeito.
3. Chaves extras (mais chaves do que o veículo originalmente tinha) → suspeito.
4. CRLV desatualizado / IPVA em atraso → pode negar cobertura.
5. CRV em nome diferente do associado sem registro de transferência → investigar.
6. Documentação incompleta suspende o prazo de análise, mas NÃO inicia a cobertura retroativamente.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 6 — PARTICIPAÇÃO DO ASSOCIADO (FRANQUIA) E RESSARCIMENTO
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_RESSARCIMENTO = `
PARTICIPAÇÃO DO ASSOCIADO (equivalente à franquia):

A cota de participação é paga pelo associado ANTES do início dos reparos.
O valor varia conforme o tipo de veículo e o plano contratado (passeio, work, reduzido):

VEÍCULOS DE PASSEIO (uso particular):
- Categoria Leves: 10% do valor FIPE (mínimo R$2.000), ou 5% (mínimo R$1.500) no plano reduzido.
- Categoria Leves Especiais: 15% (mínimo R$5.000), ou 8% (mínimo R$3.500) no reduzido.

PICK-UPS / SUV:
- 10 a 15% do valor FIPE conforme categoria, variando de R$2.000 a R$5.000 mínimo.

MOTOCICLETAS:
- Participação a partir de 15-20% do valor FIPE.

REGRA DE MÚLTIPLOS ACIONAMENTOS NO ANO:
- 1º acionamento: cota normal.
- 2º acionamento: cota em dobro.
- 3º acionamento: cota triplicada.
- Associado sem acionamentos no ano anterior: bônus (desconto na cota, respeitando mínimo de 5%).
ATENÇÃO ANALÍTICA: múltiplos acionamentos em 12 meses é possível motivo de exclusão do PPM.

CÁLCULO DO RESSARCIMENTO INTEGRAL:
- Valor de referência: tabela FIPE do mês do evento.
- Perda total configurada quando: orçamento de reparo > 75% do valor FIPE.
- Limite máximo de ressarcimento: R$300.000 por veículo.
- Prazo para pagamento: até 90 dias após entrega de TODA a documentação.
- Veículo pode ser ressarcido de uma vez ou parcelado (decisão da diretoria).

DEPRECIAÇÕES APLICADAS:
- Veículo de leilão: -30% sobre a tabela FIPE.
- Chassi remarcado: -30% sobre a tabela FIPE.
- Veículo com impostos reduzidos (taxi, produtor rural, frotista): dedução dos impostos.

RESSARCIMENTO COM FINANCIAMENTO:
- Se o veículo estiver alienado e a dívida com a financeira for maior que o valor do ressarcimento,
  o pagamento vai direto à financeira (credor fiduciário).
- O associado deve continuar pagando as parcelas do financiamento até a quitação.
- Encargos de parcelas atrasadas, juros e multas do financiamento NÃO são cobertos.

SALVADO:
- Em perda total, o veículo ou suas peças pertence à Loma, que pode vendê-los para reduzir o rateio.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 7 — RASTREADOR E MONITORAMENTO
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_RASTREADOR = `
REGRAS DE RASTREAMENTO:

OBRIGATORIEDADE:
- Veículos com valor FIPE acima de R$60.000 DEVEM ter rastreador instalado como condição de adesão.
- O associado é integralmente responsável pela manutenção e funcionamento contínuo.

CONSEQUÊNCIAS:
- Rastreador não instalado (quando obrigatório): sem cobertura para furto e roubo.
- Rastreador inativo no momento do evento: sem cobertura para furto e roubo.
- Se o associado já tem rastreador próprio: deve informar à Loma, que aprova ou não a empresa.
  Deve disponibilizar login e senha de acesso ao sistema de rastreamento.
  Se o acesso for negado ou inativado → perda da cobertura.

ANÁLISE CRÍTICA — PADRÕES SUSPEITOS:
• Rastreador desconectado ou com bateria baixa EXATAMENTE no momento do furto/roubo é o
  indicador mais forte de fraude de veículo de alto valor. Probabilidade de coincidência é ínfima.
• "Meu rastreador quebrou semanas antes e eu não sabia" — verificar histórico de manutenção.
• Rastreador sem dados de telemetria no período do sinistro — solicitar relatório da empresa
  de rastreamento para confirmar status do equipamento.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 8 — SINDICÂNCIA E INVESTIGAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_SINDICANCIA = `
PROCESSO DE SINDICÂNCIA (investigação interna):

A Loma tem o direito de instaurar sindicância em qualquer evento para verificar irregularidades.

FLUXO:
1. Associado comunica o evento → sindicância aberta automaticamente.
2. Loma tem 3 dias para analisar a comunicação e especificar documentos pendentes.
3. Se necessário ouvir o associado: notificação por e-mail com prazo mínimo de 5 dias.
4. Associado tem direito ao contraditório: pode esclarecer informações, apresentar assistentes
   e oferecer quesitos para a perícia.
5. Prazo para decisão: 30 dias após a oitiva/perícia.
6. Prazo de ressarcimento fica SUSPENSO durante a sindicância.
7. Sindicância independente (empresa especializada) pode ser contratada.

COLABORAÇÃO OBRIGATÓRIA:
- Associado que omitir informações, prestar informações inverídicas ou contraditórias,
  ou não colaborar com a investigação → pagamento negado + possível exclusão do PPM.
- Esta regra é o fundamento legal para usar a análise do IAnalista: toda discordância entre
  relato oral, BO e documentos deve ser documentada com precisão.

O QUE A SINDICÂNCIA PODE INVESTIGAR:
• Veracidade da dinâmica do evento
• Uso do veículo (particular vs. comercial)
• Estado do rastreador
• Histórico de sinistros em outras associações
• Situação financeira do associado (dívidas, restrições, alienação fiduciária)
• Conduta do condutor (alcoolemia, habilitação, velocidade)
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 9 — PADRÕES DE FRAUDE ESPECÍFICOS DO CONTEXTO LOMA/APV
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_FRAUDES = `
PADRÕES DE FRAUDE RECORRENTES NO CONTEXTO DE PROTEÇÕES VEICULARES:

1. DESMANCHE DISFARÇADO DE FURTO/ROUBO
   - Veículo vai para desmanche parceiro; associação paga indenização; peças são vendidas.
   - Sinais: rastreador inativo, BO registrado tardiamente, descrição vaga dos criminosos,
     veículo com alto quilometragem e peças valiosas.

2. COLISÃO COMBINADA
   - Dois ou mais associados de diferentes proteções combinam acidente para que ambos recebam.
   - Sinais: acidente em local deserto sem câmeras, ambos sem seguro/proteção, terceiro
     difícil de localizar, relatos idênticos e muito detalhados, danos desproporcionais.

3. INFLAÇÃO DE DANOS
   - Acidente real, mas orçamento inflado pela oficina parceira para atingir perda total
     (acima de 75% da FIPE) e obter ressarcimento integral.
   - Sinais: orçamento muito próximo de 75% da FIPE, oficina não credenciada, itens
     listados no orçamento incompatíveis com os danos nas fotos.

4. VISTORIA FRAUDULENTA / DANOS PREEXISTENTES
   - Veículo com danos antigos é cadastrado e esses danos são declarados como novos.
   - Sinais: ferrugem/oxidação nas bordas do dano (indica dano antigo, não recente),
     fotos da vistoria inicial ausentes ou de baixa qualidade, sinistro logo após a adesão.

5. SUBSTITUIÇÃO DE CONDUTOR
   - Veículo sinistrado por condutor sem habilitação, embriagado ou menor. Terceiro assume.
   - Sinais: condutor declarado diferente do habitual, BO registrado por terceiro,
     relato vago sobre "quem estava dirigindo", inconsistência nos depoimentos.

6. SINISTRO DE RECUPERAÇÃO FINANCEIRA
   - Associado com dívidas usa o sinistro como saída: veículo "furtado" ou "destruído"
     para receber a indenização e quitar dívidas.
   - Sinais: alienação fiduciária em atraso, veículo com restrições judiciais, sinistro
     próximo ao vencimento do plano ou após aumento de cobertura recente, associado
     em dificuldades financeiras comprovadas.

7. FRAUDE POR MIGRAÇÃO
   - Associado frauda, é excluído de uma proteção veicular, entra em outra (como a Loma)
     e repete o esquema. Possível por ausência de banco de dados unificado.
   - Ação recomendada: solicitar declaração de sinistros em outras proteções/seguradoras
     nos últimos 3 anos como parte do processo de sindicância.

8. INCÊNDIO CRIMINOSO DISFARÇADO
   - Veículo é incendiado intencionalmente e declarado como incêndio pós-colisão.
   - Sinais: ponto de ignição não compatível com colisão, ausência de marcas de impacto
     antes do fogo, veículo em local isolado, rastreador desligado, laudo do Corpo de
     Bombeiros indicando origem suspeita.

9. USO COMERCIAL NÃO DECLARADO
   - Veículo cadastrado como uso particular mas utilizado para Uber/iFood/delivery.
     Qualquer sinistro nessa situação é excluído AUTOMATICAMENTE pela Loma.
   - Sinais: suporte de celular profissional, mochila/bag de entrega, alta quilometragem
     para o tempo de uso, horários de sinistro em pico de delivery (12h-14h, 19h-21h).
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 10 — ANÁLISE FORENSE AVANÇADA DE IMAGENS
// ─────────────────────────────────────────────────────────────────────────────

export const IANALISTA_FORENSE_IMAGENS = `
TÉCNICAS DE ANÁLISE FORENSE DE IMAGENS VEICULARES:

──── DATAÇÃO DO DANO (distinguir dano recente de pré-existente) ────

• OXIDAÇÃO/FERRUGEM NAS BORDAS: o principal marcador de dano antigo.
  - Ferrugem laranja/marrom nas bordas da amassado → dano com mais de 2 semanas.
  - Borda metálica exposta brilhante, sem oxidação → dano recente (< 72h).
  - Oxidação parcial com borda metálica → dano intermediário (3–14 dias).
  - ATENÇÃO: em regiões úmidas ou próximas ao litoral, oxidação pode surgir em 48h.

• TINTA NAS BORDAS DO DANO:
  - Bordas com tinta lascada em camadas (primer + tinta + verniz visíveis) → reparado antes.
  - Bordas com tinta única e lisa → amassado original sem reparo anterior.

• SUJEIRA E ACÚMULO:
  - Sujeira dentro do dano, ao redor de parafusos soltos ou sobre peças expostas → dano antigo.
  - Interior do dano limpo, mesma sujeira do restante do veículo → dano recente.

• ESPESSURA DE PINTURA (quando aferida por medidor):
  - Padrão de fábrica: 90–180 microns. Acima de 300 = reparo com massa. Abaixo de 60 = lixada.
  - Irregularidade de espessura entre painéis adjacentes = peça substituída ou reparada.

──── AUTENTICIDADE DA IMAGEM ────

• ILUMINAÇÃO E SOMBRAS:
  - Sombras incompatíveis entre o veículo e objetos ao redor → possível montagem.
  - Iluminação diferente em partes da mesma foto → edição digital.
  - Reflexos irreais no veículo que não existem na cena ao fundo → manipulação.

• CAPTURA SECUNDÁRIA (foto de foto):
  - Baixa nitidez com pixel quadrado visível → foto de tela de celular.
  - Moiré (padrão de interferência) → foto de foto impressa ou de tela.
  - Metadados ausentes ou inconsistentes (EXIF) → possível edição ou captura secundária.

• AUSÊNCIA DE FRAGMENTOS ESPERADOS:
  - Colisão frontal sem fragmentos de plástico, vidro ou tinta no solo → suspeito.
  - Para-choque traseiro amassado sem vestígios de tinta do veículo colisor → suspeito.
  - Vidro quebrado sem fragmentos no banco ou no chão → suspeito.

──── COMPATIBILIDADE FÍSICA: DANO vs. DINÂMICA DECLARADA ────

• Direção do impacto e deformação devem ser coerentes:
  - Impacto lateral esquerdo → amassado na lateral esquerda, não no capô.
  - Capotamento → danos distribuídos no teto e nos pilares, não apenas em uma lateral.
  - Colisão traseira → dano no para-choque traseiro e possivelmente no compartimento.

• Profundidade do dano vs. velocidade declarada:
  - Dano profundo com deformação estrutural + "bati devagar" → inconsistente.
  - Dano superficial (riscos, arranhões) + "colisão violenta" → inconsistente.

• ÂNGULO E ALTURA DO IMPACTO:
  - Marca de impacto de veículo alto (caminhão, SUV) em veículo baixo → dano em altura superior.
  - Impacto de veículo baixo em veículo alto → dano em altura inferior.
  - Compatibilidade entre os danos declarados de ambos os veículos deve ser verificada.

──── ANÁLISE DE CENA ────

• LOCAL VISÍVEL é compatível com o local declarado?
  - Tipo de pavimento, arborização, sinalização, comércio ao fundo.
  - Luz natural compatível com horário declarado (sol baixo = manhã/tarde, ausência = noite).
  - Condições climáticas visíveis compatíveis com o evento declarado (granizo sem marcas no solo?).

• POSICIONAMENTO DO VEÍCULO NA CENA:
  - Veículo em posição implausível para a dinâmica declarada.
  - Ausência de marcas de frenagem em colisão em alta velocidade.
  - Outros veículos ao fundo que contradizem o local declarado.

──── FOTO ADULTERADA — DANO INSERIDO DIGITALMENTE (INPAINTING) ────

Este é o vetor de fraude mais sofisticado em imagens: a foto é REAL, mas o dano foi
adicionado via Photoshop, Adobe Firefly, DALL-E inpaint, Stable Diffusion ou similar.
Diferente de imagem 100% sintética, aqui o veículo, a placa e o ambiente são autênticos —
apenas a área do dano foi gerada artificialmente.

INDICADORES PRIMÁRIOS (alta confiabilidade):

• AUSÊNCIA DE FRAGMENTOS NO CHÃO:
  - Colisão traseira/lateral → deve haver fragmentos de lanterna, plástico ou tinta no solo.
  - Se o chão ao redor do dano declarado está limpo e intacto → fortíssimo indicador de inpainting.
  - Vidro quebrado sem fragmentos visíveis no banco, chão ou soleira = red flag crítico.

• BORDA DO DANO ARTIFICIALMENTE SUAVE:
  - Amassados reais têm bordas irregulares com micro-fissuras, tinta lascada em camadas e
    estilhaços de primer visíveis.
  - Bordas de inpainting tendem a ser demasiado suaves ou com gradiente artificial.
  - Transição abrupta entre área danificada e metal íntegro sem marcas de estresse = suspeito.

• TEXTURA INCONSISTENTE NA ÁREA DO DANO:
  - Metal amassado real gera reflexos complexos e irregulares.
  - Inpainting frequentemente produz textura de metal "limpa demais" ou com reflexos
    uniformes que não batem com a fonte de luz visível na cena.

• SOMBRA DO DANO INCOMPATÍVEL COM A LUZ DA CENA:
  - Verificar a direção da sombra projetada pelo dano versus a sombra de outros elementos
    do veículo (pneu, espelho, soleira).
  - Se o dano projetar sombra em direção diferente dos demais elementos = manipulação.

• RUÍDO DIGITAL HETEROGÊNEO:
  - Câmeras reais geram ruído (grain) uniforme em toda a imagem.
  - Regiões editadas por IA tendem a ter padrão de ruído visivelmente diferente do entorno —
    área do dano "mais limpa" ou "mais granulada" que o restante.

• PLACA E CHASSIS ÍNTEGROS VERSUS DANO SEVERO:
  - Em colisões com deformação estrutural profunda, elementos adjacentes (para-choque, faixa
    reflexiva, pinos de montagem) também se deformam.
  - Dano severo em painel traseiro com para-choque íntegro e parafusos no lugar = inconsistente.

INDICADORES SECUNDÁRIOS (suporte ao diagnóstico):

• Deformação do painel sem deformação correlata em elementos internos visíveis (p. ex., porta-
  malas que deveria estar trancado, mas fundo interno aparece intacto mesmo com dano externo profundo).
• Ausência de marca de tinta do veículo colisor no ponto de impacto declarado.
• Sujeira e umidade distribuídas uniformemente no veículo, mas área do dano com aspecto seco
  e limpo sem justificativa (inpainting apaga sujeira ao redor do dano gerado).
• Reflexo do ambiente (céu, construções) visivelmente diferente na área do dano versus painéis adjacentes.

PROTOCOLO RECOMENDADO PARA CASOS SUSPEITOS:
1. Solicitar fotos adicionais do mesmo dano em ângulos diferentes (45°, lateral, rente ao chão).
2. Solicitar foto mostrando o interior do compartimento (porta-malas, motor) para verificar
   deformação interna compatível.
3. Solicitar vídeo breve circulando o veículo — inpainting consistente em vídeo é muito mais difícil.
4. Cruzar com foto da vistoria inicial: se o veículo entrou sem dano e agora tem dano
   "pronto" sem perito vê-lo fisicamente, exigir inspeção presencial obrigatória.
5. Em casos de alta suspeita, determinar vistoria presencial antes de qualquer aprovação.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 11 — ANÁLISE LINGUÍSTICA E VOCAL FORENSE
// ─────────────────────────────────────────────────────────────────────────────

export const IANALISTA_LINGUISTICA = `
ANÁLISE LINGUÍSTICA E VOCAL FORENSE APLICADA A SINISTROS:

──── PRINCÍPIOS FUNDAMENTAIS ────

A análise linguística forense parte do pressuposto de que a memória de eventos reais
gera narrativas com características diferentes de narrativas fabricadas:

• Narrativa VERDADEIRA: espontânea, não linear, contém detalhes periféricos irrelevantes,
  admite incerteza ("não sei exatamente que horas eram"), usa linguagem emocional natural,
  inclui pensamentos internos ("fiquei com medo de sair do carro").

• Narrativa FABRICADA: roteirizada, muito linear, excessivamente completa, evita incertezas,
  usa linguagem técnica de seguro, foca nos elementos que justificam a cobertura.

──── INDICADORES DE DECEPTION NA FALA ────

1. DISTANCIAMENTO PSICOLÓGICO:
   - "o carro" em vez de "meu carro" — o fraudador não se sente dono do bem.
   - "o veículo" em vez de "minha caminhonete".
   - "o evento" em vez de "o acidente" — linguagem clínica para algo que deveria ser traumático.

2. QUALIFICADORES DE VERACIDADE (estatisticamente associados à mentira):
   - "Juro por Deus", "te falo a verdade", "honestamente", "pode acreditar".
   - Pessoas que dizem a verdade raramente sentem necessidade de afirmá-la.

3. RESPOSTA QUE NÃO CORRESPONDE À PERGUNTA (evasão):
   - Pergunta: "Onde você estava quando o carro foi furtado?"
   - Resposta: "Eu paguei tudo em dia, nunca tive problema antes..."
   - A evasão é uma forma de evitar mentir diretamente.

4. DETALHES EXCESSIVOS EM PERGUNTAS SIMPLES (compensação cognitiva):
   - Pergunta: "Em que horário foi o acidente?"
   - Resposta: "Eram exatamente 22h14, eu tinha acabado de sair do trabalho, tinha parado
     num semáforo antes, o sinal abriu, eu estava ouvindo uma música..."
   - Quem fabrica uma história adiciona detalhes para parecer crível.

5. AUTOCORREÇÃO SUSPEITA:
   - "O cara me abordou com uma... com dois homens armados..."
   - Número de criminosos é informação que o fraudador tende a errar (detalhes que não foram vividos).

6. MUDANÇA DE TEMPO VERBAL:
   - Narrar no presente um evento que deveria estar no passado:
   - "Aí eu tô saindo do estacionamento, aí eles vêm com o carro e me fecham..."
   - Indica que o associado está "construindo" a cena mentalmente em tempo real.

7. AUSÊNCIA DE PERGUNTAS ESPONTÂNEAS E NATURAIS:
   - Vítimas reais perguntam: "E agora, o que faço?", "Em quanto tempo fica pronto?",
     "Vai cobrir tudo?", "Tenho que ir à delegacia de novo?"
   - Fraudadores focam em confirmar a narrativa e raramente perguntam sobre processos.

8. LINGUAGEM TÉCNICA INESPERADA:
   - Leigo que usa "aviso de sinistro", "perda total", "cobertura abrangente", "franquia" —
     indica que o associado pesquisou ou foi orientado sobre o processo antes de acionar.

──── ANÁLISE DE TOM DE VOZ — CONTEXTO TEMPORAL É CRÍTICO ────

Antes de avaliar o estado emocional, calcular o INTERVALO entre o evento e a ligação:

| Intervalo        | Estado emocional esperado do associado                              |
|------------------|---------------------------------------------------------------------|
| 0–6h             | Agitação, choque, confusão, voz trêmula. CALMA é atípica.         |
| 6–24h            | Estabilização parcial. Ainda se espera tensão residual.            |
| 24–48h           | Calma é COMPLETAMENTE NORMAL. Choque agudo já passou.              |
| Acima de 48h     | Tom neutro/resolutivo é ESPERADO. Agitação seria mais suspeita.    |

TIPOS DE SINISTRO e expectativa emocional:
- Roubo com violência (arma, ameaça): impacto emocional alto → calma imediata é suspeita.
- Furto simples (veículo sumiu da rua): impacto emocional moderado → calma é mais aceitável.
- Colisão sem vítimas: impacto emocional variável → avaliar conforme gravidade.
- Vidros/granizo: impacto emocional baixo → calma sempre esperada.

──── ANÁLISE DE RELATO ESCRITO (SCAN aplicado a sinistros) ────

Ao analisar o relato escrito do associado, verificar:

1. ESTRUTURA DA NARRATIVA:
   - O relato tem começo, meio e fim cronológico? (Narrativa fabricada tende a ser mais estruturada.)
   - Há saltos temporais sem justificativa? (Saltam partes que o fraudador prefere não descrever.)
   - O relato começa muito antes do evento ou vai direto ao ponto? (Direto ao ponto = possível ensaio.)

2. LINGUAGEM EMOCIONAL:
   - Há expressão de emoções? (Medo, surpresa, raiva, alívio?)
   - Ou é um relato puramente factual, como um relatório policial?
   - Excesso de detalhes técnicos sem emoção = suspeito.

3. QUANTIDADE DE INFORMAÇÃO POR SEÇÃO:
   - Associado descreve muito bem o antes e o depois, mas é vago no momento exato do evento?
   - A parte mais crítica (o crime em si) com menos detalhes que o resto = red flag.

4. PRONOMES E PROPRIEDADE:
   - Uso consistente de "meu carro", "minha moto"?
   - Troca súbita para "o veículo" em partes específicas do relato?
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 12 — VARIÁVEIS DE RISCO E SCORE ANTIFRAUDE
// ─────────────────────────────────────────────────────────────────────────────

export const IANALISTA_SCORE_RISCO = `
VARIÁVEIS PREDITIVAS DE RISCO — MODELO ANTIFRAUDE:

──── VARIÁVEIS DE ALTO PESO (aumentam risco significativamente) ────

• INTERVALO ADESÃO → PRIMEIRO SINISTRO:
  - < 30 dias: risco extremamente alto (sinistro pré-existente ou planejado).
  - 30–90 dias: risco alto.
  - 90–180 dias: risco moderado.
  - > 180 dias: risco baixo.
  BENCHMARK: fraudes planejadas ocorrem predominantemente nos primeiros 90 dias.

• HISTÓRICO DE SINISTROS:
  - 2+ sinistros em 12 meses na Loma: risco alto + cota em dobro/triplicado.
  - Sinistro anterior em outra proteção veicular: verificar tipo, data e desfecho.
  - Tipo de sinistro idêntico ao anterior: risco multiplicado.

• RASTREADOR INATIVO NO MOMENTO DO EVENTO:
  - Para veículos acima de R$60.000: exclusão automática de cobertura + red flag crítico.
  - Para demais veículos: indicador forte de fraude.

• PERFIL FINANCEIRO DO ASSOCIADO:
  - Alienação fiduciária em atraso (parcelas não pagas) → motivação financeira para fraude.
  - Restrições judiciais no CPF/CNPJ.
  - Sinistro logo após redução de renda (desemprego, falência).
  - Veículo com dívidas de IPVA, multas ou licenciamento em atraso.

• VALOR DO VEÍCULO vs. PERFIL DO ASSOCIADO:
  - Veículo de alto valor em nome de pessoa com renda incompatível.
  - Veículo muito depreciado com cobertura máxima contratada.

──── VARIÁVEIS DE MÉDIO PESO ────

• DIA E HORÁRIO DO SINISTRO:
  - Furtos/roubos entre 23h–5h em locais sem câmeras: risco elevado.
  - Colisões às 12h–14h e 19h–21h em veículos com suporte de celular: risco Uber/delivery.
  - Sinistros em feriados prolongados (menos testemunhas e câmeras monitoradas).

• LOCAL DO SINISTRO:
  - O principal preditor de risco em modelos de ML.
  - Regiões com alta incidência de furtos (mapa de calor da PM).
  - Local incompatível com o trajeto habitual do associado.
  - Local ermo, sem câmeras, sem testemunhas: risco elevado.

• COMUNICAÇÃO TARDIA:
  - Roubo/furto comunicado após 24h: red flag independente do prazo contratual.
  - Colisão comunicada após 15+ dias sem justificativa: suspeito.

• CONDUTA PÓS-SINISTRO:
  - Não acionou rastreador imediatamente (furto/roubo): suspeito.
  - Não buscou socorro médico após colisão com vitimas declaradas: suspeito.
  - Já tinha orçamento pronto no momento de acionar: suspeito (indica preparação).

──── VARIÁVEIS DE BAIXO PESO (contexto adicional) ────

• Estado civil, idade e sexo: uso apenas como contexto estatístico, nunca isoladamente.
• Tempo de associação: associados antigos têm menor risco médio.
• Quilometragem declarada vs. desgaste real do veículo.
• Região de emplacamento vs. local do sinistro.

──── INTERPRETAÇÃO DO SCORE ────

0–20: Fraude praticamente confirmada. Múltiplos indicadores convergentes.
21–40: Risco CRÍTICO. Investigação aprofundada obrigatória antes de qualquer decisão.
41–55: Risco ALTO. Sindicância recomendada, documentação completa obrigatória.
56–70: Risco MÉDIO. Aprovação com ressalvas. Verificar pontos específicos.
71–85: Risco BAIXO. Aprovação recomendada após conferência documental.
86–100: Risco MÍNIMO. Sinistro com múltiplos elementos de veracidade confirmados.

NOTA: A maioria dos casos reais e legítimos fica entre 55 e 75.
Scores acima de 80 e abaixo de 30 são incomuns e merecem atenção especial por si só.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 13 — ANÁLISE FORENSE DE TELEMETRIA E GPS
// ─────────────────────────────────────────────────────────────────────────────

export const IANALISTA_TELEMETRIA = `
ANÁLISE FORENSE DE DADOS DE RASTREAMENTO E TELEMETRIA:

──── O QUE O RELATÓRIO DE RASTREAMENTO DEVE CONTER ────

Um relatório completo de empresa de rastreamento deve incluir:
• Histórico de posições GPS (latitude/longitude com timestamp).
• Status da ignição (ligado/desligado) com horário exato.
• Velocidade registrada em cada posição.
• Eventos especiais: alertas de bateria baixa, desconexão do módulo, jammer detectado.
• Última posição conhecida antes da perda de sinal.
• Tempo entre a última posição e o momento da comunicação do sinistro.

──── RED FLAGS NA TELEMETRIA ────

1. DESCONEXÃO EXATAMENTE NO MOMENTO DO SINISTRO:
   - Probabilidade de coincidência genuína é ínfima em veículos de alto valor.
   - Padrão típico de fraude: associado desconecta o módulo (ou deixa a bateria descarregar
     intencionalmente) antes de "ceder" o veículo para o desmanche.

2. "BATERIA BAIXA" CRÔNICA ANTES DO EVENTO:
   - Alertas recorrentes de bateria baixa nas semanas anteriores ao sinistro sem manutenção.
   - Indica possível sabotagem gradual para criar histórico de falhas.

3. ÚLTIMA POSIÇÃO INCOMPATÍVEL COM O LOCAL DECLARADO:
   - Veículo registrado a >5km do local declarado do furto/roubo nas últimas horas.
   - Veículo em trajeto completamente diferente do declarado antes da perda de sinal.

4. IGNIÇÃO DESLIGADA EM LOCAL INUSITADO:
   - Veículo desliga a ignição em local que não é casa, trabalho ou ponto habitual do associado.
   - Especialmente suspeito se o local é próximo a desmanches conhecidos.

5. VELOCIDADE INCOMPATÍVEL COM A DINÂMICA:
   - Colisão declarada a "baixa velocidade" mas telemetria registra >80km/h no momento.
   - Aceleração brusca ou frenagem de emergência registrada em horário diferente do declarado.

6. JAMMER DETECTADO:
   - Dispositivo bloqueador de GPS detectado = fraude organizada ou roubo profissional.
   - Para seguros, qualquer detecção de jammer é red flag crítico independente do desfecho.

──── INTERPRETAÇÃO DO RELATÓRIO ────

• VEÍCULO NO LOCAL DECLARADO + IGNIÇÃO DESLIGADA NO HORÁRIO DECLARADO:
  Consistente com furto. Corrobora o relato.

• VEÍCULO PARADO EM LOCAL DIFERENTE DO DECLARADO + DESCONEXÃO APÓS:
  Inconsistente. O veículo estava em outro local antes do "furto".

• VEÍCULO EM MOVIMENTO APÓS O HORÁRIO DECLARADO DO FURTO:
  Fortemente inconsistente. Alguém dirigiu o veículo após o alegado furto.
  (Pode ser o próprio associado, ladrão ou desmanchador — todos são red flags.)

• DADOS AUSENTES (empresa não responde, login negado, sistema "fora do ar"):
  O associado tem obrigação de fornecer acesso ao sistema de rastreamento.
  Negativa ou impossibilidade → perda de cobertura por não colaboração.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 14 — NOVOS VETORES DE FRAUDE (ERA DA IA GENERATIVA)
// ─────────────────────────────────────────────────────────────────────────────

export const IANALISTA_FRAUDE_IA = `
NOVOS VETORES DE FRAUDE NA ERA DA INTELIGÊNCIA ARTIFICIAL GENERATIVA:

──── DEEPFAKES E IMAGENS SINTÉTICAS ────

Com o avanço das ferramentas de IA generativa (Midjourney, DALL-E, Stable Diffusion e outros),
fraudadores sofisticados podem gerar imagens de danos veiculares que nunca existiram.

COMO IDENTIFICAR:
• Imperfeições nas bordas de objetos (pneus, rodas, antenas, retrovisores).
• Mãos, dedos ou reflexos de pessoas nos vidros com anatomia incorreta.
• Texto ilegível em placas, cartazes ou documentos visíveis no fundo.
• Padrão de "pixel repetido" em texturas de asfalto, grama ou céu.
• Metadados EXIF ausentes ou com modelo de câmera genérico/inexistente.
• Iluminação perfeitamente uniforme em toda a cena (câmeras reais capturam imperfeições).
• Ausência de desfoque (bokeh) natural em objetos ao fundo.
• Sombras projetadas em ângulos impossíveis para a posição do sol no horário declarado.

PROTOCOLO RECOMENDADO:
- Solicitar fotos adicionais de ângulos diferentes (dificulta a geração sintética consistente).
- Cruzar com foto da vistoria inicial do veículo para verificar identidade visual (cor, acessórios).
- Em casos suspeitos, solicitar vídeo breve do veículo em vez de fotos estáticas.
- Verificar se o EXIF da foto contém coordenadas GPS compatíveis com o local declarado.

──── ÁUDIOS E VOZES SINTÉTICAS ────

Clonagem de voz por IA já é acessível. Fraudadores podem tentar enviar áudios sintéticos
simulando a voz do associado.

INDICADORES DE ÁUDIO SINTÉTICO:
• Ausência de ruídos de ambiente (respiração, veículos ao fundo, vento, ecos).
• Tom de voz excessivamente uniforme, sem variações de volume naturais.
• Pausas mecânicas entre palavras (não naturais).
• Pronúncia artificialmente correta de palavras que falantes nativos tipicamente reduzem.
• Ausência de vícios de linguagem, gírias e regionalismos esperados do perfil do associado.

MITIGAÇÃO: ligar de volta para o número cadastrado do associado para confirmação verbal ao vivo.

──── DOCUMENTOS DIGITAIS ADULTERADOS ────

Adulteração de BOs, CRLVs, CNHs e laudos por PDF editors e ferramentas de IA.

COMO IDENTIFICAR:
• Inconsistência tipográfica: fonte diferente em partes do documento.
• Espaçamento irregular entre caracteres em campos editados.
• Metadados do PDF com data de criação posterior à data no documento.
• Número do BO que não bate com o padrão da delegacia da região declarada.
• CRLV com dados que não batem com a consulta no DETRAN (número de chassi, renavam).
• Carimbo ou assinatura com resolução diferente do restante do documento.

PROTOCOLO:
- Sempre cruzar dados do CRLV com consulta direta no sistema DETRAN.
- Para BOs suspeitos, solicitar confirmação na delegacia emissora.
- Laudos periciais: verificar número de registro no conselho profissional do signatário.

──── FRAUDE POR "ENCOMENDA GUIADA POR IA" ────

Fraudadores passam a usar IAs para simular o comportamento correto no atendimento:
- Pesquisam exatamente o que dizer para não gerar red flags.
- Usam scripts gerados por IA para responder às perguntas do atendente.
- Narrativas extremamente bem construídas, sem os "erros naturais" de quem viveu o evento.

COMO IDENTIFICAR:
• Relato muito bem estruturado, sem hesitações, perfeito demais para alguém em situação de stress.
• Vocabulário técnico correto para um leigo.
• Ausência completa de elementos emocionais (tristeza, raiva, alívio).
• Respostas que cobrem exatamente os pontos que excluiriam a cobertura, sem ser perguntado.
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 15 — ANÁLISE ESPECIALIZADA: FURTO E ROUBO DE VEÍCULOS
// ─────────────────────────────────────────────────────────────────────────────

export const IANALISTA_FURTO_ROUBO = `
ANÁLISE ESPECIALIZADA: FURTO E ROUBO DE VEÍCULOS

Esta seção aprofunda o conhecimento sobre os dois tipos de sinistro com maior volume de
fraude no setor de proteção veicular. Use estas informações como base técnica para avaliar
a plausibilidade do relato, identificar inconsistências e orientar a investigação.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DIFERENÇA TÉCNICA ENTRE ROUBO E FURTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROUBO (art. 157 CP):
- Subtração com violência real ou grave ameaça (arma, empurrão, imobilização).
- O condutor/proprietário estava presente no momento da subtração.
- BO PRESENCIAL É OBRIGATÓRIO — roubo exige coleta de depoimento presencial,
  exame de corpo de delito e ato policial complexo. BO virtual não existe para roubo.
  RED FLAG CRÍTICO: BO virtual para roubo é física e juridicamente impossível —
  qualquer associado que apresente BO virtual para roubo está mentindo sobre o evento.

FURTO (art. 155 CP):
- Subtração sem violência, com o proprietário ausente.
- BO virtual aceito para furto sem suspeito identificado (Delegacia Eletrônica).
- BO presencial ainda é preferível — investigação mais detalhada.

IMPLICAÇÃO PARA A COBERTURA LOMA:
- Roubo sem BO presencial = pendência crítica obrigatória antes de qualquer aprovação.
- Furto com BO virtual é válido, mas merece verificação adicional do número do RO.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. MODUS OPERANDI CRIMINOSO REAL — ROUBO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conhecer como crimes reais ocorrem permite avaliar se o relato é plausível.

MODALIDADES COMUNS (das mais às menos frequentes no Brasil):

A) PUXADA NO SINALEIRO
   Como funciona: abordagem em cruzamento com semáforo fechado. Criminoso(s) a pé
   ou em moto dominam o condutor antes que o sinal abra. O veículo é retirado pelo
   assaltante enquanto a vítima é deixada no local.
   Perfil típico: noturno (19h–00h), zonas sul e leste de SP, ZN do RJ, vias de
   médio movimento. 1 a 3 criminosos.
   Relato legítimo tipicamente contém: descrição de parada no sinal, aproximação
   repentina, objeto cortante ou arma de fogo, tempo muito curto (30–90 segundos).

B) COMBOIO / FECHAMENTO
   Como funciona: dois ou mais veículos criminosos cercam o alvo em movimento.
   Um fecha pela frente, outro bloqueia por trás. Comum em vias expressas e
   acessos de bairros. Abordagem rápida e coordenada.
   Relato legítimo: condução em via movimentada, fechamento repentino, múltiplos
   criminosos, comunicação clara de rendição imediata.

C) SEQUESTRO RELÂMPAGO COM USO DO VEÍCULO
   Como funciona: criminoso domina o condutor, mantém-no no carro por 2–6 horas
   para saque em caixas eletrônicos e cartões, depois abandona a vítima em local
   ermo. O veículo vai para desmanche.
   Prevalência: São Paulo, Rio, Recife e Fortaleza.
   Relato legítimo: período longo de restrição de liberdade, saque em múltiplos
   caixas, abandono em local distante do ponto inicial, alto nível de trauma.

D) ABORDAGEM EM GARAGEM / CONDOMÍNIO
   Como funciona: criminosos aguardam na entrada de garagens residenciais.
   O veículo é bloqueado antes de entrar ou enquanto o portão está abrindo.
   Horário: 22h–2h. Alta incidência em condomínios sem portaria blindada.

E) FALSA VIATURA / ABORDAGEM POLICIAL ENCENADA
   Como funciona: uso de viatura clonada com inscrições da Polícia Civil, sirene e
   giroflex. Motorista para achando que é abordagem policial legítima.
   Prevalência: Rio de Janeiro (mais registrado), algumas ocorrências em SP e MG.
   RED FLAG: se o associado relata essa modalidade, verificar se há BO registrado
   com essa especificidade — é crime de alto perfil com registro policial rigoroso.

DADOS CONTEXTUAIS — ROUBO:
- ~63% das ocorrências entre 19h e 10h (período noturno/madrugada).
- Terça a quinta concentram ~60% dos casos semanais.
- Estados líderes (2024): SP (~31.700), RJ (~30.900), PE (~11.700), BA (~11.100).
- Taxa de recuperação nacional: ~18% dos veículos subtraídos são recuperados.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. MODUS OPERANDI CRIMINOSO REAL — FURTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MODALIDADES COMUNS:

A) RELAY ATTACK (ATAQUE DE RETRANSMISSÃO) — CRESCENTE DESDE 2023
   Como funciona: dois criminosos operam em dupla com dispositivos de amplificação.
   - Criminoso A posiciona dispositivo próximo à residência da vítima (até 10m),
     capta o sinal da chave keyless mesmo através de paredes.
   - Criminoso B posiciona outro dispositivo junto ao veículo na rua.
   - Sinal é amplificado e retransmitido: o carro entende que a chave está presente,
     destranca e permite ignição.
   - Processo leva menos de 60 segundos. ZERO MARCAS DE ARROMBAMENTO.

   ⚠ REGRA CRÍTICA PARA ANÁLISE: em furtos por relay attack, a ausência de
   marcas de arrombamento É ESPERADA e não é indicador de fraude. Penalizar
   o associado pela falta de marcas quando o veículo tem keyless entry é erro
   analítico. Verificar se o modelo do veículo possui sistema keyless.

   Veículos mais vulneráveis: Toyota Corolla, Hyundai Creta, Honda HR-V,
   Volkswagen T-Cross, qualquer veículo com keyless entry/start (2018+).

B) JAMMER (BLOQUEADOR DE SINAL)
   Como funciona: dispositivo que emite frequências impedindo o fechamento remoto
   pelo controle. Condutor aperta o botão, acredita que travou, e o veículo
   permanece aberto. Criminoso aguarda em shoppings, supermercados, estacionamentos.
   Também usado pós-furto para bloquear GPS do rastreador durante fuga.
   Marcas físicas: nenhuma. Porta aberta, veículo intacto.

C) CHAVE MICHA / CHAVE FALSA
   Como funciona: instrumento fabricado para abrir fechaduras de modelos específicos.
   Ainda eficaz em veículos mais antigos (Gol, Uno, Palio, Celta).
   Marcas físicas: pequenos arranhões na fechadura do cilindro, sem destruição
   da coluna de direção. Distingue-se do relay attack pela ausência de keyless.

D) CÓPIA DE CHAVE / CLONE DE TRANSPONDER
   Como funciona: chave original copiada em oficina ou estacionamento desonesto.
   Transponder eletrônico clonado via equipamento OBD. Furto ocorre dias depois.
   Marcas físicas: nenhuma. Interior e ignição intactos.
   RED FLAG: se o veículo tem rastreador e ele foi desativado antes do furto,
   combinado com ausência de marcas e chave original com o associado → suspeito
   de clone ou de owner give-up.

E) REBOQUE FALSO
   Como funciona: criminosos se passam por funcionários de empresa de reboque
   (uniforme, guincho identificado) e removem o veículo estacionado sob alegação
   de irregularidade ou solicitação de terceiro. Prevalência: SP e BH.
   Relato legítimo: associado encontra o veículo ausente, sem saber como foi
   levado. Geralmente descobre pelo vizinho ou câmera do local.

F) "CASADINHOS" (DUPLA EM POSTO OU COMÉRCIO)
   Como funciona: um criminoso fura o pneu discretamente, o segundo aborda o
   motorista quando para para verificar e aproveita para levar o veículo ou
   pertences. Variante: distração enquanto o segundo acessa o interior.

DADOS CONTEXTUAIS — FURTO:
- Total nacional 2024: ~217.900 furtos de veículos.
- SP lidera com ~94.000 furtos em 2024.
- Furtos caíram ~2,6% em 2024 frente a 2023.
- Modelos mais furtados: VW Gol (~3.700 casos), Hyundai HB20 (~2.600),
  Fiat Uno (~2.600), Toyota Corolla (alta por peças valiosas), Fiat Strada.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. TIPOLOGIA DE FRAUDES ESPECÍFICAS — FURTO/ROUBO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A) OWNER GIVE-UP (DONO ENTREGA O CARRO) — A FRAUDE MAIS COMUM
   O proprietário combina previamente a entrega do veículo com terceiros
   (desmanche, atravessador) e depois registra BO alegando roubo ou furto.
   Estimativa do setor: ~20% dos roubos/furtos declarados em São Paulo
   são owner give-up (fonte: investigações da DIVECAR/SP).

   Dois formatos:
   - ENTREGA DIRETA: dono leva o carro ao local combinado, entrega as chaves,
     aguarda dias e registra BO.
   - ABANDONO ESTRATÉGICO: veículo deixado em área de alta criminalidade com
     janela entreaberta ou porta destrancada para ser furtado organicamente.

   Red flags específicos do owner give-up:
   • Veículo com dívidas de financiamento, IPVA atrasado ou valor de mercado
     menor que a dívida (incentivo financeiro claro).
   • Sinistro nos primeiros 90 dias de adesão à proteção.
   • Rastreador desativado antes do evento (não no momento — antes).
   • Atraso significativo no registro do BO (>12h para roubo, >24h para furto).
   • Interior do veículo muito limpo: pertences pessoais de valor removidos
     previamente pelo proprietário (documentos, óculos, objetos pessoais ausentes).
   • Associado relata roubo com violência mas não buscou atendimento médico
     nem foi levado para delegacia imediatamente.
   • Local do "roubo" é incompatível com o trajeto habitual do associado.
   • Associado teve tempo de remover todos os pertences antes do "roubo".

B) ROUBO TELEGRAFADO (VEÍCULO COM DEFEITO ESTRATEGICAMENTE ABANDONADO)
   Proprietário tem veículo com problema mecânico grave (motor fundido, câmbio
   quebrado) ou dívida de financiamento superior ao valor de mercado. Leva o
   carro a uma área de risco e o abandona, depois registra BO de furto.
   Foco: receber a indenização de perda total sem arcar com o reparo ou quitação.

   Red flags:
   • Veículo com histórico de problemas mecânicos recentes.
   • Sinistro em local de alto risco distante da rotina do associado.
   • Rastreador registra última posição em local atípico antes da desconexão.
   • Associado demorou para perceber que o veículo sumiu.

C) DUPLO SINISTRO (VEÍCULO RECUPERADO APÓS INDENIZAÇÃO)
   Associado registra roubo/furto, recebe indenização integral, e o veículo
   "reaparece" — ou estava em desmanche parcial, ou com o próprio proprietário.
   O associado tenta reter o veículo e a indenização.

   REGRA LEGAL CRÍTICA: após a "tradição" completa (transferência formal da
   documentação à associação), o veículo pertence à Loma como salvado.
   Se o associado retiver o bem, perde a indenização e pode responder por
   estelionato (art. 171 CP). Veículos recuperados pós-tradição são salvados
   de sinistro sujeitos a hasta pública.

   Red flags:
   • Associado aciona a Loma pedindo o veículo de volta após "recuperação".
   • Veículo aparece com o associado semanas após o pagamento.
   • Número de chassi do veículo recuperado não bate com o declarado
     (indica tentativa de recuperar veículo diferente do que foi recuperado
     pelo desmanche — veículo "dublê").

D) CPF EM MÚLTIPLAS APVs SIMULTANEAMENTE
   Associado contrata 2–3 proteções veiculares diferentes para o mesmo veículo
   e aciona todas simultâneas após o sinistro. Possível pela ausência de banco
   de dados unificado entre APVs.

   Red flag: solicitar declaração do associado de que não possui outra proteção
   veicular ou seguro para o mesmo veículo. Cruzar placa no maior número possível
   de bases antes da aprovação.

E) FRAUDE POR MIGRAÇÃO ENTRE APVs
   Associado frauda uma APV, é excluído, migra para outra (como a Loma) e repete.
   A ausência de acesso ao RNS da SUSEP por parte das APVs facilita esse ciclo.

   Ação obrigatória em sinistros de furto/roubo: solicitar ao associado declaração
   formal de sinistros em outras proteções/seguradoras nos últimos 3 anos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. INDICADORES FORENSES — ROUBO/FURTO REAL vs. FRAUDADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANÁLISE DAS MARCAS FÍSICAS POR MODALIDADE:

| Modalidade          | Marcas de arrombamento | Ignição | Coluna de direção |
|--------------------|------------------------|---------|-------------------|
| Relay attack       | NENHUMA                | Intacta | Intacta           |
| Jammer             | NENHUMA                | Intacta | Intacta           |
| Clone de transpond.| NENHUMA                | Intacta | Intacta           |
| Chave micha        | Arranhões no cilindro  | Intacta | Intacta           |
| Arrombamento forç. | Vidro quebrado/porta   | Danos   | Possíveis danos   |
| Owner give-up      | NENHUMA (chave entregue)| Intacta | Intacta          |

⚠ REGRA ESSENCIAL: a ausência de marcas físicas NÃO é sozinha um indicador de
fraude. Ela é ESPERADA para relay attack, jammer e clone. A análise deve combinar
a ausência de marcas com outros fatores (rastreador, BO, perfil financeiro).

MÓDULOS ELETRÔNICOS DO VEÍCULO (ECU/BCM/IMOBILIZADOR):
Os módulos de controle eletrônico registram eventos:
• Tentativas de ignição com transponder incorreto.
• Horários de desbloqueio de porta e acionamento de ignição.
• Em relay attack: logs mostram sequência de desbloqueio sem chave física presente.
• Em fraude com chave entregue pelo dono: logs são inconsistentes com o relato
  (ignição ligada normalmente pelo próprio proprietário antes do "roubo").

Se houver dúvida sobre o modo de subtração, recomendar vistoria eletrônica dos
módulos ECU/BCM como parte da sindicância.

ANÁLISE DO INTERIOR DO VEÍCULO:
• Roubo real com abordagem violenta: objetos pessoais frequentemente deixados
  pelo criminoso (documentos, celular simples), sinais de revistas às pressas,
  porta-luvas aberto, bancos revirados.
• Roubo simulado (owner give-up): interior muito limpo, pertences de valor
  removidos previamente, nada foi retirado pelo "criminoso" exceto o veículo.

CONSISTÊNCIA DO BO:
• Número do RO (Registro de Ocorrência): cruzar com padrão numérico da delegacia
  da região declarada. BOs com numeração incompatível com a regional = adulterado.
• Delegacia com competência: o BO deve ser da delegacia da jurisdição do local
  do crime. BO em delegacia distante do local declarado sem justificativa = suspeito.
• Para roubo: delegacia especializada em furtos/roubos de veículos (DIVECAR/DFRV)
  ou plantão — nunca delegacia eletrônica (tecnicamente impossível para roubo).

DADOS DO DETRAN / RENAVAM:
Após registro do BO, o DETRAN insere restrição de roubo/furto no RENAVAM.
O fluxo leva até 48h: delegacia → SINESP → SENATRAN → RENAVAM.
Verificar se a restrição já consta no RENAVAM é uma forma de confirmar que o BO
existe e foi devidamente comunicado ao sistema público.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. AVALIAÇÃO DO RELATO — ROUBO: O QUE É PLAUSÍVEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Um relato de roubo LEGÍTIMO normalmente contém:
• Descrição concreta da abordagem (se foi em sinaleiro, em movimento, em garagem).
• Número aproximado de criminosos (1 a 4 é comum; mais de 5 é incomum exceto
  em comboios em rodovias).
• Tipo de arma ou método de intimidação.
• Tempo estimado da abordagem (roubos rápidos: 30–120 segundos; sequestros: horas).
• O que o associado fez imediatamente após: chamou polícia, foi à delegacia,
  acionou o rastreador, ligou para a família.
• Estado emocional real imediatamente após: nervoso, com medo, em choque.

Red flags no relato de roubo:
• Detalhes insuficientes sobre a abordagem — quem fraudou não viveu o momento.
• Número de criminosos inconsistente entre o relato e o BO.
• Horário declarado incompatível com a rotina do associado (estava em local
  incomum sem justificativa plausível).
• Associado não buscou atendimento médico mesmo relatando violência física.
• Roubo relatado em local com câmeras que, ao serem verificadas, nada mostram.
• Associado afirma ter "entregado o carro" sem resistência em local onde
  poderia ter pedido ajuda (posto policial próximo, via movimentada).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. AVALIAÇÃO DO RELATO — FURTO: O QUE É PLAUSÍVEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Um relato de furto LEGÍTIMO normalmente contém:
• O veículo estava estacionado sem a presença do proprietário.
• O associado relata o momento em que percebeu o furto (voltou ao local e o
  carro não estava lá).
• Descrição do local, horário e contexto (foi ao trabalho, saiu do shopping,
  acordou de manhã e o carro não estava na rua).
• Ações imediatas: procurou o carro nos arredores, confirmou que não foi
  rebocado, ligou para a PM, registrou o BO.

Casos específicos por modalidade:
• Furto por jammer: o associado travou o carro, mas o sinal foi bloqueado.
  Plausível em shoppings e supermercados com histórico dessa modalidade.
• Furto de garagem: sem sinais de arrombamento no portão → investigar se
  câmeras captaram acesso à garagem por código ou chave duplicada.
• Furto com todas as chaves presentes (relay attack / clone): plausível em
  veículos keyless — NÃO é red flag isolado para esses modelos.

Red flags no relato de furto:
• Veículo em garagem "segura" sem NENHUM sinal de violação: se o modelo
  NÃO tem keyless, ausência de marcas é inconsistente.
• Todas as chaves com o associado E veículo é modelo antigo sem keyless:
  fortemente suspeito de owner give-up ou clone de chave.
• O associado "não percebeu" o furto por tempo incomum (deixou o carro por
  vários dias sem verificar, depois registrou BO).
• Furto em horário ou local inconsistente com a rotina declarada.
• Rastreador inativo antes do furto (não apenas durante).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. VEÍCULO RECUPERADO — PROCEDIMENTOS E IMPLICAÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECUPERAÇÃO ANTES DA INDENIZAÇÃO (pré-tradição):
O processo indenizatório é suspenso. A associação pode cobrir apenas danos
parciais ocorridos durante a subtração (vidros quebrados, interior danificado).
O associado retém o veículo.

RECUPERAÇÃO APÓS INDENIZAÇÃO COMPLETA (pós-tradição):
• O veículo passa a ser propriedade da Loma como "salvado de sinistro".
• O associado NÃO tem direito de reter o bem.
• Se retiver, perde a indenização e pode responder por estelionato (art. 171 CP).
• A Loma pode alienar o salvado para reduzir o impacto no rateio dos associados.
• Veículos recuperados pós-tradição têm restrição de "salvado" inserida no RENAVAM
  (remontagem sobre o mesmo chassi é vedada pelo CONTRAN).

IMPLICAÇÃO ANALÍTICA:
• Se o associado relata que "o carro foi recuperado" após o sinistro, verificar
  em que fase do processo está e orientar sobre os procedimentos corretos.
• Associado que insiste em recuperar o veículo após o pagamento deve ser
  orientado pela diretoria e, se necessário, encaminhado para medidas legais.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. DOCUMENTOS OBRIGATÓRIOS — CHECKLIST ESPECÍFICO POR TIPO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ROUBO (perda total + ressarcimento):
☐ BO PRESENCIAL (obrigatório — BO virtual é inválido para roubo)
☐ Extrato do DETRAN com queixa de roubo
☐ CRV original preenchido a favor da Loma, com firma reconhecida
☐ CRLV com IPVA quitado dos 2 últimos anos
☐ CNH do associado (e do condutor se diferente)
☐ Manual do veículo
☐ TODAS as chaves do veículo
   RED FLAG: associado que "perdeu" as chaves no roubo mas apresentou
   uma chave reserva → investigar quantas chaves o veículo tinha.
   Associado que tem todas as chaves consigo após "roubo" → suspeito
   de que os criminosos usaram cópia ou relay attack (plausível) ou de
   owner give-up (investigar outros fatores).
☐ Certidão negativa de furto e multa
☐ Procuração pública para transferência à Loma
☐ Relatório do rastreador (se obrigatório pelo valor do veículo)

FURTO (perda total + ressarcimento):
Idem ao roubo, com as especificidades:
☐ BO pode ser virtual se sem suspeito identificado
☐ Extrato do DETRAN com queixa de furto
☐ Relatório da empresa de rastreamento: status do módulo antes e durante o evento

ALERTAS DOCUMENTAIS ESPECÍFICOS PARA FURTO/ROUBO:
1. Ausência de todas as chaves em furto sem keyless entry = cobertura excluída
   ou fortemente suspeita.
2. CRLV com IPVA em atraso = pendência crítica + possível exclusão de cobertura.
3. BO com delegacia de jurisdição incompatível com o local declarado = investigar.
4. Relatório de rastreamento não disponibilizado = perda de cobertura por não
   colaboração (associado tem obrigação contratual de fornecer acesso).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. SCORE DE RISCO ESPECÍFICO — FURTO/ROUBO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Variáveis de MAIOR peso preditivo para fraude em furto/roubo:

PESO CRÍTICO (cada um eleva muito o risco):
• Rastreador inativo ANTES do evento (não apenas durante): é o indicador mais
  forte de fraude disponível. Probabilidade de coincidência genuína é ínfima.
• Sinistro nos primeiros 30 dias de adesão: fraude planejada.
• Alienação fiduciária em atraso (parcelas não pagas): motivação financeira clara.
• BO virtual em alegação de roubo: evento declarado impossível.
• Interior do veículo sem pertences pessoais: proprietário os removeu antes.

PESO ALTO:
• Atraso >12h no registro do BO para roubo.
• Atraso >24h para furto.
• Local do evento incompatível com rotina declarada.
• Veículo com valor de mercado menor que dívida de financiamento.
• Histórico de sinistro de mesmo tipo em outra APV/seguradora.
• Modelo do veículo incompatível com a modalidade declarada
  (relay attack em veículo de 1998 que não tem keyless = impossível).

PESO MÉDIO:
• Sinistro entre 31 e 90 dias de adesão.
• BO em delegacia fora da jurisdição do local declarado.
• Associado não acionou rastreador imediatamente após perceber o furto/roubo.
• Veículo com IPVA atrasado ou documentação irregular.
• Descrição muito vaga dos criminosos (ausência de qualquer detalhe descritivo).
• Associado que não foi à delegacia pessoalmente (registro por terceiro).
`

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 16 — REGRAS DE APRENDIZADO CONTÍNUO
// ─────────────────────────────────────────────────────────────────────────────

export const IANALISTA_APRENDIZADO = `
DIRETRIZES DE APRENDIZADO CONTÍNUO DO SISTEMA IANALISTA:

Este sistema foi projetado para evoluir continuamente. As regras abaixo orientam como
incorporar novos conhecimentos:

1. NOVOS REGULAMENTOS E ATUALIZAÇÕES:
   Sempre que um novo regulamento, adendo ou atualização da Loma for fornecido, o sistema
   deve incorporar as novas regras com precedência sobre as anteriores. Mudanças de cota de
   participação, novas exclusões ou novos prazos devem ser aplicados imediatamente.

2. CASOS REAIS ANALISADOS:
   Padrões identificados em casos reais (mesmo após revisão pela equipe Loma) devem ser
   adicionados à lista de red flags e indicadores de fraude para aprimorar futuras análises.

3. PRECEDÊNCIA DE CONHECIMENTO:
   Regulamento Loma específico > Práticas gerais de proteção veicular > Práticas de seguradoras.
   Nunca aplicar lógica de seguradoras reguladas pela SUSEP como se fosse igual às APVs.

4. INCERTEZA DECLARADA:
   Quando o sistema não tem certeza se uma situação está coberta ou excluída pelo regulamento,
   deve declarar explicitamente a incerteza e recomendar consulta ao regulamento atualizado.
   Nunca inventar cobertura ou exclusão sem embasamento documental.

5. FEEDBACK DA EQUIPE LOMA:
   Decisões da diretoria da Loma que difiram das recomendações do sistema devem ser registradas
   como casos de calibragem para futuras análises semelhantes.
`

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTAÇÃO CONSOLIDADA
// ─────────────────────────────────────────────────────────────────────────────

export const LOMA_KNOWLEDGE_BASE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BASE DE CONHECIMENTO REGULATÓRIO — LOMA PROTEÇÃO VEICULAR
(Documento vivo — sujeito a atualizações contínuas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${LOMA_CONTEXTO}

${LOMA_COBERTURAS}

${LOMA_EXCLUSOES}

${LOMA_PRAZOS}

${LOMA_DOCUMENTOS}

${LOMA_RESSARCIMENTO}

${LOMA_RASTREADOR}

${LOMA_SINDICANCIA}

${LOMA_FRAUDES}

${IANALISTA_FORENSE_IMAGENS}

${IANALISTA_LINGUISTICA}

${IANALISTA_SCORE_RISCO}

${IANALISTA_TELEMETRIA}

${IANALISTA_FRAUDE_IA}

${IANALISTA_FURTO_ROUBO}

${IANALISTA_APRENDIZADO}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIM DA BASE DE CONHECIMENTO REGULATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
