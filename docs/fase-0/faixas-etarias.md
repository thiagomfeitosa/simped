# Faixas etárias por sociedade / fonte

> ⚠️ Tabela montada pelo assistente a partir de conhecimento geral. **Cada linha precisa ser conferida no documento original** (documento, ano, página) antes de virar regra do programa. Itens com dúvida maior estão marcados **A VALIDAR**.

## Como o programa usa isto
- O **nome da faixa** (RN, lactente, criança, adolescente…) **depende da fonte escolhida** pelo usuário. Padrão: **SBP**. As outras fontes são selecionáveis, como nas doses.
- As **doses nunca dependem do nome da faixa**, e sim dos números (idade em horas/dias/semanas/meses/anos, IG, peso), como está em `variaveis-paciente.md`. Exemplo: uma dose do GINA para "6–11 anos" fica gravada como "idade ≥ 6 e < 12 anos". Assim, trocar a fonte de exibição não muda nenhuma dose.
- Cada regra de dose guarda a faixa **da fonte de onde a dose veio**. Se a dose é do PALS, vale o "criança" do PALS (1 ano até a puberdade), mesmo que a tela esteja mostrando nomes da SBP.
- **"Neonato" e "recém-nascido"** são usados como sinônimos no Brasil: período neonatal = 0 a 28 dias. Onde uma fonte diferenciar, isso aparece na tabela.

## 1. Tabela comparativa

| Fonte | Recém-nascido / neonato | Lactente | Criança (pré-escolar / escolar) | Adolescente | Limite superior da pediatria |
|---|---|---|---|---|---|
| **SBP** (padrão) | 0 a 28 dias | 29 dias a < 2 anos | Pré-escolar: 2 a < 7 anos · Escolar: 7 a < 10 anos (A VALIDAR) | 10 a 19 anos (segue a OMS) — A VALIDAR | A VALIDAR (recomendação da SBP sobre atendimento pediátrico até 19/20 anos) |
| **OMS** | Neonatal: 0 a 28 dias (precoce 0–6 d; tardio 7–27 d) | *Infant*: < 1 ano | *Child*: < 10 anos para faixas de saúde (a Convenção da ONU chama de criança todo < 18 anos) | 10 a 19 anos (*young people*: 10–24) | — |
| **MS** (políticas de saúde) | 0 a 28 dias | < 1 ano (“menor de 1 ano”) nas estatísticas | Criança: 0 a 9 anos (PNAISC); primeira infância: 0 a 6 anos (Marco Legal da Primeira Infância, Lei 13.257/2016) | 10 a 19 anos (segue a OMS) | — |
| **ECA** (Lei 8.069/1990) — definição legal | — | — | Criança: até 12 anos incompletos | 12 a 18 anos | 18 anos (exceções até 21 anos) |
| **AAP** (Bright Futures) | Neonatal: 0 a 28 dias | *Infancy*: nascimento a 11 meses | *Early childhood*: 1 a 4 anos · *Middle childhood*: 5 a 10 anos | *Adolescence*: 11 a 21 anos | 21 anos (declaração da AAP de 2017, com flexibilidade) |
| **AHA / PALS** | *Newly born*: do nascimento até sair da sala de parto (aplica-se o NRP) | *Infant*: < 1 ano (exceto o *newly born*) | *Child*: 1 ano até a **puberdade** (mamas na menina, pelos axilares no menino) | Depois da puberdade: protocolo de **adulto** (ACLS) | Puberdade |
| **NRP / SBP-Reanimação Neonatal** | Sala de parto e período de transição; a SBP aplica o fluxograma neonatal ao RN na unidade neonatal (limite A VALIDAR) | — | — | — | — |
| **ICH E11** (base das bulas e estudos de medicamentos: FDA/EMA; ANVISA A VALIDAR) | RN pré-termo; RN a termo: 0 a 27 dias | *Infants and toddlers*: 28 dias a 23 meses | *Children*: 2 a 11 anos | 12 a 16–18 anos (conforme a região) | 16–18 anos |
| **GINA** (asma) | — | — | ≤ 5 anos · 6 a 11 anos | ≥ 12 anos (junto com adultos) | — |
| **ISPAD** (diabetes) | — | — | Crianças e adolescentes, sem subdivisão fixa | — | < 18 anos (A VALIDAR) |

## 2. Classificação do RN pela idade gestacional

| Fonte | Classificação |
|---|---|
| **OMS** | Pré-termo < 37 semanas: **extremo** < 28 · **muito pré-termo** 28 a < 32 · **moderado a tardio** 32 a < 37. Termo 37 a < 42. Pós-termo ≥ 42 |
| **AAP / ACOG** | **Pré-termo tardio** 34s0d a 36s6d · **Termo precoce** 37s0d a 38s6d · **Termo completo** 39s0d a 40s6d · **Termo tardio** 41s0d a 41s6d · **Pós-termo** ≥ 42s0d |
| **SBP / MS** | Seguem a OMS; subdivisões usadas pela SBP A VALIDAR |

## 3. Classificação pelo peso ao nascer (OMS, usada pelo MS e pela SBP)
- **Baixo peso:** < 2.500 g
- **Muito baixo peso:** < 1.500 g
- **Extremo baixo peso:** < 1.000 g
- **Peso × IG (PIG / AIG / GIG):** < percentil 10 / entre p10 e p90 / > percentil 90 na curva de referência. Curva adotada (Intergrowth-21st, Fenton ou outra): A VALIDAR.

## 4. Períodos em torno do nascimento (OMS / CID-10)
- **Período perinatal:** de 22 semanas de gestação até 7 dias completos de vida.
- **Neonatal precoce:** 0 a 6 dias · **neonatal tardio:** 7 a 27 dias · **pós-neonatal:** 28 dias a < 1 ano.

## 5. Onde as fontes divergem (atenção no programa)
1. **Início da adolescência:** 10 anos (OMS, MS, SBP) × 11 anos (AAP) × 12 anos (ECA, ICH E11, GINA).
2. **Fim do lactente:** < 1 ano (OMS, AHA, AAP) × < 2 anos (SBP, ICH E11).
3. **Criança no PALS** não termina numa idade, e sim na **puberdade**. O programa vai precisar de uma variável "puberdade iniciada: sim/não" (ou o estadiamento de Tanner) no paciente.
4. **Limite superior da pediatria:** 18 (ECA), 19 (OMS), 21 (AAP).
5. O período neonatal é "0 a 28 dias" em algumas fontes e "0 a 27 dias completos" em outras, que dizem o mesmo contando de outro jeito. O programa usa **idade < 28 dias completos** = neonatal (A VALIDAR).
