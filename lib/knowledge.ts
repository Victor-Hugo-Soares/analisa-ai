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
 * Versão: 1.0 — Abril/2026
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
// SEÇÃO 10 — REGRAS DE APRENDIZADO CONTÍNUO
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

${IANALISTA_APRENDIZADO}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FIM DA BASE DE CONHECIMENTO REGULATÓRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
