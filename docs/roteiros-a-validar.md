# Valores "A VALIDAR" dos roteiros do Passo a passo

> Tudo abaixo foi escrito pelo assistente a partir do `docs/fase-0/doses-rascunho.md` e de conhecimento geral, **sem consulta direta às fontes**.
> Nenhum desses valores pode ser usado para corrigir o aluno antes de ser conferido na fonte indicada (documento, edição, ano, página).
> Onde está cada valor: constantes no topo de cada arquivo em `src/dados/roteiros/` — trocar o número lá refaz todas as contas, a folha e a prescrição final.

Legenda: ☐ = conferir · Fonte = fonte prevista.

## Desidratação grave — Plano C (`desidratacao-plano-c.ts`)
| ☐ | Valor usado | Fonte |
|---|---|---|
| ☐ | Critérios de desidratação grave (≥ 2 sinais: letargia, não bebe, prega desaparece muito lentamente, pulso fraco) | MS — Manejo do paciente com diarreia |
| ☐ | Fase rápida (< 5 anos): SF 0,9% **20 mL/kg em 30 min**, repetir até hidratar; RN e cardiopatas: 10 mL/kg; ≥ 5 anos: 30 mL/kg SF + Ringer lactato 70 mL/kg | MS |
| ☐ | Manutenção: SG 5% + SF 0,9% **4:1**, volume de Holliday-Segar | MS |
| ☐ | **KCl 10% 2 mL para cada 100 mL** da manutenção; só com diurese | MS |
| ☐ | Reposição: **50 mL/kg/dia**, SG 5% + SF 0,9% **1:1** | MS |
| ☐ | Limite de K⁺ em veia periférica **40 mEq/L** (60–80 em acesso central, conforme protocolo) | PALS / protocolo do serviço |
| ☐ | Divergência: MS (4:1, hipotônico ≈ 30 mEq/L de Na) × AAP 2018 (isotônico dos 28 dias aos 18 anos) | MS · AAP 2018 (Feld et al.) |
| ☐ | Zinco: < 6 meses 10 mg/dia; ≥ 6 meses **20 mg/dia**, 10 a 14 dias | MS / OMS |
| ☐ | Antibiótico só em disenteria com comprometimento do estado geral ou suspeita de cólera grave | MS |
| ☐ | Faixas: Na < 130 hipo / 130–150 iso / > 150 hipernatrêmica; K 3,5–5,5 | SBP / laboratório |
| ☐ | SINAN: surto de diarreia e suspeita de cólera são notificáveis | MS — lista vigente |

## Hiponatremia com convulsão (`hiponatremia.ts`)
| ☐ | Valor usado | Fonte |
|---|---|---|
| ☐ | NaCl 3% **2 mL/kg em 10 min** (rascunho: 2–5 mL/kg em 10–20 min), repetir até parar a crise (máx. 2–3 doses) | PALS / SBP |
| ☐ | Preparo: NaCl 20% + água destilada (3 mL + 17 mL = 20 mL; 15 mL + 85 mL = 100 mL) | Rascunho / farmácia do serviço |
| ☐ | Estimativa de subida: mEq ÷ (0,6 × peso) | SBP / PALS |
| ☐ | Teto: subir no máximo **8 mEq/L em 24 h** (rascunho: 8–10) | SBP / PALS |
| ☐ | Manutenção isotônica (soro glicofisiológico) após a crise, sem restrição hídrica neste caso | AAP 2018 / SBP |
| ☐ | K⁺ de manutenção **≈ 2 mEq/100 mL** do Holliday | SBP (rascunho) |
| ☐ | Faixas: < 125 grave, 125–134 leve/moderada, 135–145 normal | SBP / PALS |
| ☐ | O₂ por máscara com reservatório 10 L/min, meta SpO₂ ≥ 94% | PALS / AHA |
| ☐ | Na sérico de 2/2 h, depois 4/4 h | SBP (rascunho) |

## Hipocalemia grave (`hipocalemia.ts`)
| ☐ | Valor usado | Fonte |
|---|---|---|
| ☐ | Correção **0,5 mEq/kg** (rascunho: 0,5–1; máx. 40 mEq) em **2 h** | PALS |
| ☐ | Velocidade máxima **0,5 mEq/kg/h** (rascunho: 0,5–1) | PALS |
| ☐ | Concentração máxima em veia periférica **40 mEq/L** | PALS / protocolo |
| ☐ | Diluir em SF 0,9% (não em soro glicosado) | PALS / protocolo |
| ☐ | K⁺ de manutenção ≈ 2 mEq/100 mL do Holliday | SBP (rascunho) |
| ☐ | Faixas: < 2,5 grave; 2,5–3,4 leve/moderada; 3,5–5,5 normal | PALS / SBP |
| ☐ | Dosar magnésio junto | SBP / PALS |

## Icterícia neonatal (`ictericia-neonatal.ts`)
| ☐ | Valor usado | Fonte |
|---|---|---|
| ☐ | Limiares com **48 h**, IG ≥ 38 sem, sem fatores de risco: fototerapia **13 mg/dL**; exsanguineotransfusão **21 mg/dL** | SBP — Icterícia no RN ≥ 35 semanas (tabela por horas de vida) |
| ☐ | Fatores de risco baixam os limiares (doença hemolítica, G6PD, asfixia, sepse, acidose, albumina baixa) | SBP |
| ☐ | Zonas de Kramer: 1) 4–8 · 2) 5–12 · 3) 8–16 · 4) 11–18 · 5) > 15 mg/dL | Kramer (1969) / SBP |
| ☐ | Perda de peso: até 7% esperada; 7–10% avaliar amamentação; > 10% excessiva | SBP / Academy of Breastfeeding Medicine |
| ☐ | Fototerapia intensiva: irradiância ≥ 30 µW/cm²/nm; expor o máximo de pele; proteção ocular | AAP 2022 / SBP |
| ☐ | Amamentação mantida, 8–12 mamadas/dia; soro EV não é rotina | SBP / AAP 2022 |
| ☐ | BT de controle em até 12 h do início da fototerapia | SBP / AAP 2022 |
| ☐ | Temperatura de 3/3 h | Protocolo do serviço |
| ☐ | Local do item "fototerapia" na folha (seção 6) | Modelo de folha do serviço |

## Rediluição + seringa da BIC — penicilina (`rediluicao-penicilina.ts`)
| ☐ | Valor usado | Fonte |
|---|---|---|
| ☐ | Penicilina G cristalina **50.000 UI/kg/dose EV 12/12 h** (até 7 dias de vida), **10 dias** | MS — PCDT Sífilis |
| ☐ | Frasco de 5.000.000 UI reconstituído com **10 mL** (pó sem deslocamento) | Bula |
| ☐ | Rediluição 1 mL + 9 mL de AD (50.000 UI/mL); regra "redilua se < 0,1 mL" | Protocolo do serviço |
| ☐ | Penicilina na regra dos **12 mL** da BIC; tempo de infusão **30 min** (exemplo, sem fonte) | Rotina da Santa Casa / bula |
| ☐ | Exames da sífilis congênita (hemograma, função hepática, RX de ossos longos, fundo de olho, audição, VDRL seriado) | MS — PCDT Sífilis |
| ☐ | Interrupção > 1 dia → reiniciar o esquema | MS — PCDT Sífilis |
| ☐ | Sífilis congênita: notificação compulsória | MS |

## Infusão contínua — adrenalina (`infusao-continua-adrenalina.ts`)
| ☐ | Valor usado | Fonte |
|---|---|---|
| ☐ | Faixa **0,05 a 1 mcg/kg/min**; dose inicial **0,1 mcg/kg/min** | PALS |
| ☐ | Solução padrão **1 mg em 50 mL de SF 0,9%** (20 mcg/mL); diluente SF ou SG 5% | Protocolo do serviço |
| ☐ | Concentrar a solução em doses altas; via exclusiva; acesso central preferencial | Protocolo do serviço |

## Hipercalemia (`hipercalemia.ts`)
| ☐ | Valor usado | Fonte |
|---|---|---|
| ☐ | Faixas: 5,5–6,5 alto; > 6,5 grave (com ECG alterado = grave) | PALS / SBP |
| ☐ | Gluconato de cálcio 10% **100 mg/kg** (rascunho: 60–100; máx. 2 g), **diluído 1:1 em SF**, em **15 min** | PALS / protocolo |
| ☐ | Glicose **0,5 g/kg** (glicose 25%) em **30 min** + insulina regular **0,1 UI/kg** (máx. 10 UI) | PALS |
| ☐ | Rediluição da insulina **50 UI em 50 mL de SF (1 UI/mL)** | Rascunho (ISPAD) / protocolo |
| ☐ | Salbutamol nebulização **2,5 mg (< 25 kg)** / 5 mg (≥ 25 kg) + **3 mL de SF** | PALS |
| ☐ | K de controle em 1–2 h; glicemia capilar de 30/30 min nas primeiras horas | PALS / protocolo |

## Hipocalcemia no RN (`hipocalcemia-rn.ts`)
| ☐ | Valor usado | Fonte |
|---|---|---|
| ☐ | Ca total < 8 mg/dL (< 7 muito baixo); Ca iônico < 1,0 mmol/L | SBP — Neonatologia |
| ☐ | Ataque **100 mg/kg (1 mL/kg)** em **15 min** — valor do PALS; **conferir a dose neonatal** | SBP-Neonatologia / Neofax |
| ☐ | Ca elementar **9,3 mg/mL** e **0,45 mEq/mL** no gluconato 10% | Bula |
| ☐ | Cálcio na regra dos 12 mL da BIC, diluído em SF | Protocolo do serviço |
| ☐ | Manutenção **4 mL/kg/dia** no soro (rascunho: 2–4); hídrico 80 mL/kg/dia de SG 10%; VIG 4–6 | SBP — Neonatologia |
| ☐ | Ca iônico de controle em 6–8 h; glicemia capilar de 3/3 h | SBP — Neonatologia |

## Hipernatremia (`hipernatremia.ts`)
| ☐ | Valor usado | Fonte |
|---|---|---|
| ☐ | Faixas: 145–155 alto; > 155 muito alto | SBP / Nelson |
| ☐ | Queda máxima **10 mEq/L em 24 h** (≈ 0,5 mEq/L/h) | SBP / Nelson / PALS |
| ☐ | Déficit de água livre = 0,6 × peso × (Na/Na meta − 1); regra de **4 mL/kg por mEq/L** | Nelson / SBP |
| ☐ | Repor o déficit em **48 h** junto com a manutenção | Nelson / SBP |
| ☐ | Soro **SG 5% + SF 0,9% 1:1** (Na ≈ 77 mEq/L) + KCl 2 mEq/100 mL após diurese | Nelson / SBP |
| ☐ | Na de controle de **4/4 h** e condutas de ajuste | Nelson / SBP |

## Constantes químicas (não precisam de validação clínica)
- 1 mEq de NaCl = 58,5 mg; 1 mEq de KCl = 74,5 mg → NaCl 0,9% ≈ 0,154 · 3% ≈ 0,513 · 20% ≈ 3,42 mEq/mL; KCl 10% ≈ 1,34 · 19,1% ≈ 2,56 mEq/mL.
- Holliday-Segar (fórmula de 1957): 100 / 50 / 20 mL/kg por faixa.
