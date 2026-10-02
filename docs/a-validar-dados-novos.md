# Dados novos "A VALIDAR" (criados na implementação das ideias I1–I21)

> Tudo abaixo foi escrito pelo assistente como **valor provisório**, para o app funcionar enquanto o usuário levanta as fontes.
> Cada arquivo é só de dados: corrigir um valor não mexe no resto do código. Depois de corrigir, rode `npm test`.
> Enquanto estiver "A VALIDAR", **nada disto corrige o aluno**: aparece só como referência ou aviso.

| Assunto | Arquivo | O que conferir |
|---|---|---|
| Doses e apresentações do MVP (39 medicações) | `src/dados/medicacoes/rascunho-a-validar.ts` e `exemplos-a-validar.ts` | Copiadas do `docs/fase-0/doses-rascunho.md` (item do rascunho anotado em cada uma). Na aba **Banco** há o botão "Baixar lista do que falta validar (.csv)". |
| Apresentações da Santa Casa | planilha gerada pelo app (aba **Banco → ⬇ Baixar planilha para preencher**; cópia em `docs/fase-0/apresentacoes-formulario.xlsx`) | Preencher e importar na aba **Banco** (linha com "Onde conferi" entra como CONFERIDA). Agora com as 90 medicações. |
| Faixas etárias e classificação do RN | `src/dados/faixas-etarias.ts` | Pontos de corte por sociedade; faixa usada nas doses (criança até 11 anos, adolescente ≥ 12, como no rascunho); idade corrigida mostrada até 3 anos. |
| Horários das doses (aprazamento) | `src/dados/hospitais.ts` | Horários de cada intervalo na Santa Casa (ex.: 8/8h = 06–14–22) e hora da 1ª dose. Folga de 30 min para "atrasada" em `src/prescricao/aprazamento.ts`. |
| Soluções do soro | `src/dados/solucoes.ts` | Glicose e eletrólitos por mL (SG, SF, Ringer, glicose 25/50%, NaCl 20/10%, KCl 19,1/10%, gluconato de cálcio); referências de Na, K, VIG, osmolaridade e potássio máximo. |
| Alertas de segurança | `src/dados/alertas.ts` | Interação ceftriaxona + cálcio no RN < 28 dias; reatividade cruzada penicilina → cefalosporina. Concentração máxima EV: ceftriaxona 40 mg/mL (exemplo), vancomicina 5 mg/mL, KCl 40 mEq/L. |
| Limites de alarme do monitor | `src/dados/limites-alarme.ts` | FC, FR, SpO₂, PA, temperatura e glicemia por faixa de idade. |
| Exames | `src/dados/exames.ts` | Valores de referência e tempo até o resultado de cada exame. |
| Gasometria | `src/dados/gasometria.ts` | Referências arterial/venosa, margem das fórmulas de compensação, ânion gap normal, cortes do Δ/Δ e do lactato. |
| Equipos | `src/dados/equipos.ts` | Gotas por mL (macro 20, micro 60). Também: gotas/mL de cada frasco de gotas no banco. |
| Fórmulas de sódio | `src/calculos/eletrolitos.ts` | Sódio corrigido (fator 1,6) e déficit (0,6 × peso), como nos casos 10 e 15. |
| 16 casos clínicos | `src/casos/clinicos/` (um arquivo por caso) | Sinais, evolução sem tratamento, reação a cada medicação, resultados de exames, diurese e condutas esperadas com prazo. Nascimento, peso ao nascer e estatura que o texto do caso não traz são fictícios. |
| Caso de demonstração | `src/casos/demonstracao.ts` | Alergia a penicilinas e resultados de exames colocados só para mostrar os alertas e a tela de exames. |

## Dados novos das ideias B1–B15 (out/2026)

| Assunto | Arquivo | O que conferir |
|---|---|---|
| Catálogo de fontes (B6) | `src/dados/fontes/catalogo.ts` (aba **Banco → Catálogo de fontes**) | Título, edição, ano e link de cada documento (SBP Tratado 5ª ed. 2022, PCDT IST 2022, Red Book 2024–2027, PALS 2020, NRP 8ª ed. 2021, GINA 2024, ISPAD 2022, SSC 2020...) e qual é o documento **padrão** de cada sociedade (o "documento provável" das doses que só citam a sociedade). |
| TEC, Glasgow, ritmo e respiração dos 16 casos (B10) | `src/casos/clinicos/` (linha "B10: ... PROVISÓRIOS" em cada caso) | Valores iniciais e como mudam com cada medicação (ex.: adenosina → sinusal; amiodarona tira da FV; FV vira assistolia em 30 min sem tratamento; flumazenil com rebote em 60 min). |
| Valores padrão de TEC e Glasgow (B10) | `src/casos/tipos.ts` (`SINAIS_PADRAO`) | TEC 2 s e Glasgow 15 quando o caso não informa. |
| Peso pelo balanço (B10) | `src/motor/balanco.ts` (`pesoPeloBalanco`) | 1 mL ≈ 1 g, sem perdas insensíveis. As doses continuam usando o peso da admissão. |
| Resposta pela dose (B9) | `src/motor/avaliarDose.ts` (`FOLGA_DOSE`) | Folga de 10% antes de chamar de subdose/sobredose; efeito parcial proporcional (dose ÷ mínima, entre 10% e 90%). A faixa usada é a do caso (`faixaDose`) ou, sem ela, a regra do banco — mesmo A VALIDAR (serve só para o paciente reagir; **não corrige o aluno**). |
| Efeitos de sobredose (B9) | `src/dados/efeitos-sobredose.ts` | Efeito adverso de cada medicação acima da faixa (beta-2: taquicardia; adenosina: assistolia transitória; KCl: TV; insulina: hipoglicemia; corticoide: hiperglicemia; soro: congestão...). |
| Complicações do professor (B14) | `src/dados/complicacoes.ts` | Convulsão, dessaturação, apneia, choque, febre, hipoglicemia, bradicardia, TSV, PCR em FV/assistolia, anafilaxia: quanto cada sinal muda e as mensagens sugeridas. |
| Traçados do monitor (B11) | `src/monitor/monitor.ts` | Desenhos didáticos de cada ritmo (não são sinais reais). |

## Dados novos de B8 — ampliação A1–A50 (out/2026)

Arquivo único: `src/dados/medicacoes/ampliacao-a-validar.ts` (49 medicações; a A26, amoxicilina, já estava em `exemplos-a-validar.ts`). Tudo A VALIDAR.

| Assunto | O que conferir |
|---|---|
| **Apresentações** (192 no banco, 111 delas novas) | Escritas de memória pelo assistente (as mais comuns no Brasil), **sem consulta à bula**. Conferir com a bula e com a Santa Casa: aba **Banco → ⬇ Baixar planilha para preencher**. Atenção especial: noradrenalina (concentração do sal × da base), sulfametoxazol + trimetoprima (concentração escrita em trimetoprima), citrato de cafeína (citrato × cafeína base), paracetamol EV, cefotaxima e alprostadil (disponibilidade no Brasil), imunoglobulina humana (frasco varia com o fabricante), IGHAHB e vacina hepatite B (sem conteúdo informado). |
| **Doses** | **Nenhuma foi escrita.** Cada indicação da lista aprovada virou uma regra com a dose em texto "Dose ainda não cadastrada (A VALIDAR)" — 87 regras. Para preencher: aba **Banco → Conferir** na regra (escolha "por kg", "fixa"..., documento e página) e mande o .json na conversa; ou mande os valores na conversa. Se uma dose depender da idade (RN × criança), avise: a regra precisa ser dividida no arquivo. |
| Seção da folha | Provisória: **bicarbonato, sulfato de magnésio e SRO na seção 4** (eletrólitos/hidratação); **antivirais, antifúngicos, rifampicina, isoniazida e profilaxia ocular na seção 5** (anti-infecciosos); furosemida, manitol, vitamina K, imunobiológicos e o resto na seção 6. A seção errada é marcada como erro na conferência do item: confirme (ex.: magnésio na asma). |
| Faixa etária das regras | Só RN: alprostadil, vitamina K, profilaxia ocular, IGHAHB + vacina, cafeína, surfactante e as indicações neonatais (convulsão neonatal, herpes neonatal, fungemia neonatal, enterocolite, sepse neonatal da cefotaxima, RN de mãe bacilífera, profilaxia no prematuro). RN e criança: nirsevimabe/palivizumabe. Criança e adolescente: SRO. **Cabergolina: "adolescente" (é para a mãe, não para o RN)**. O resto: todas as faixas. |
| Fonte provável | Código da sociedade em cada regra (SBP na maioria; PALS em antídotos e intubação; SSC em vasoativos; GINA no magnésio; MS em SRO, profilaxias, SMX-TMP, oseltamivir, cabergolina). Nada conferido. |
| Receituário na alta | Controle especial: midazolam, diazepam, fenobarbital, fenitoína, levetiracetam, cetamina, fentanil, morfina. Antimicrobiano (2 vias): antibióticos (amoxicilina + clavulanato a SMX-TMP, rifampicina). Conferir com a legislação vigente. |
| Etiquetas de alergia/interação | Penicilinas (amoxicilina + clavulanato, oxacilina), cefalosporinas (cefotaxima), carbapenêmicos (meropeném), benzodiazepínicos, opioides, catecolaminas etc. (campo `classes`). |
| Alertas novos | Anfotericina B: "desoxicolato e lipossomal têm doses diferentes". Surfactante: "poractanto e beractanto têm concentrações diferentes". Prometazina: restrição por idade a conferir. |
| Vias novas | `intranasal` (midazolam) e `ocular` (profilaxia ocular). A importação da planilha entende "IN/intranasal/nasal" e "ocular/oftálmica". |
| Códigos (Nº da planilha) | Cada medicação tem `codigo`: nº do MVP (1…38, 32b) ou da ampliação (A1…A50). O NaCl 3% preparado ganhou o **8b** (antes dividia o nº 8 com o NaCl 20%). |

## Dados novos de B16 — variações dos casos (out/2026)

Arquivo único: `src/casos/variacoes-a-validar.ts`. Tudo A VALIDAR, escrito pelo assistente.

| Assunto | O que conferir |
|---|---|
| **Limites de peso por caso** | Ex.: caso 6 (asma, 22 kg) sorteia de 18 a 27 kg; caso 2 (sepse neonatal, 3 kg) de 2,6 a 3,4 kg. Escolhidos para não mudar a história: caso 1 continua GIG (≥ 4 kg); caso 13 continua ≥ 25 kg (dose do glucagon na conduta); caso 16 fica entre 3 e 12 anos (hidrocortisona). Confira se cada faixa é plausível para a idade. |
| **Limites de idade** | RN (casos 1 a 5): idade **fixa** (a queixa fala em "2 h de vida", "18 h de vida"; a penicilina muda depois de 7 dias). Lactentes: ± 30 dias (casos 11 e 15); crupe ± 90 dias; intoxicação ± 120 dias; os demais ± 180 dias. |
| Casos sem limites próprios | Casos criados no editor: peso ± 10%, idade fixa (ou os limites escritos no painel **🎲 Variações** do editor). |
| Estatura e peso ao nascer | Regra do assistente (não é dado clínico de dose): a estatura acompanha o peso pela raiz cúbica (criança proporcional); o peso ao nascer acompanha o peso só no período neonatal (mesma % de perda). Sinais vitais, exames e reações do caso **não mudam** com a variação. |
| Apresentação da farmácia | Para cada medicação do caso, sorteia **uma** apresentação entre as de mesma forma e mesmas vias (ex.: gentamicina 10, 20 ou 40 mg/mL; KCl 19,1% ou 10%; prednisolona 1 ou 3 mg/mL). Comprimidos, soros, sprays e nebulização ficam fora. As apresentações continuam as do rascunho (A VALIDAR). |


## Dados novos da Fase 2 — exames ligados ao paciente, ECG e respiração (out/2026)

| Assunto | Arquivo | O que conferir |
|---|---|---|
| Valores "normais" de partida do laboratório | `src/dados/laboratorio-dinamico.ts` | pCO₂ 40 (arterial) / 46 (venosa), HCO₃⁻ 24, lactato 1, K 4,2, Na 140, Cl 104, cetonemia 0,2 — usados quando o caso não traz o exame mas algo mexe nele; limites físicos de cada variável. |
| Efeito geral de medicações nos exames | `src/dados/efeitos-laboratorio.ts` | Bicarbonato (HCO₃⁻ +5 em 15 min, K −0,3, Na +2); insulina (K −0,6 em 1 h); salbutamol (K −0,5); KCl (K +0,4). Valem quando o caso não define o efeito nos exames. |
| Convulsão (complicação do professor) | `src/dados/complicacoes.ts` | Agora também mexe na gasometria: lactato +4, HCO₃⁻ −5, pCO₂ +15 (acidose mista). |
| Caso 10 (CAD) — insulina | `src/casos/clinicos/caso10-cetoacidose.ts` | Em 6 h: HCO₃⁻ 6 → 12, pCO₂ 17 → 26, cetonemia 6,5 → 2; K 5,2 → 3,9 em 4 h. |
| Caso 15 (hiponatremia) — NaCl 3% | `src/casos/clinicos/caso15-hiponatremia.ts` | Na dos eletrólitos 118 → 122 em 15 min (como diz a observação do caso). |
| Onda T pelo potássio | `src/monitor/monitor.ts` (`ondaTPeloPotassio`) | K ≥ 6: T alta e pontuda; K ≤ 3: T achatada e onda U. Desenho didático. |
| Curva de respiração e figura animada | `src/monitor/monitor.ts` (`respiracaoDoPadrao`), `src/telas/RespiracaoAnimada.tsx` | Forma de cada padrão (Kussmaul profunda, gasping a cada ~5 s, tiragem no desconforto). |

Química usada (não é dose, mas confira se quiser): pH por Henderson-Hasselbalch, pH = 6,1 + log₁₀(HCO₃⁻ ÷ (0,0307 × pCO₂)); BE = 0,93 × (HCO₃⁻ − 24,4 + 14,8 × (pH − 7,4)).

## Dados novos de C1–C6 — treino e emergência (out/2026)

| Assunto | Arquivo | O que conferir |
|---|---|---|
| Drogas do carrinho de parada | `src/dados/parada-a-validar.ts` (`DROGAS_PARADA`) | Adrenalina 0,01 mg/kg (máx. 1 mg) da 1:10.000 (1 mL + 9 mL de SF), a cada 3–5 min; amiodarona 5 mg/kg (máx. 300 mg) depois do 3º choque; glicose 25% 0,5 g/kg; gluconato de cálcio 10% 60 mg/kg (máx. 2 g) — valores do rascunho (PALS). |
| Bolus na PCR | idem (`EXPANSAO_PARADA`) | SF 0,9% 20 mL/kg (rascunho: 10–20). |
| Energia do choque | idem (`CHOQUE`) | 2 J/kg, depois 4 J/kg; máx. 10 J/kg ou dose de adulto (200 J) — PALS 2020, **não está no rascunho**. |
| Tempos do algoritmo | idem (`TEMPOS_PARADA`) | Ciclo de 2 min; adrenalina a cada 3–5 min; 1ª adrenalina no não chocável até 5 min; tolerância de 20 s na checagem. |
| Tubo endotraqueal | idem (`TUBO`) | Com cuff = idade/4 + 3,5; sem cuff = idade/4 + 4; < 1 ano: 3,0 / 3,5; profundidade ≈ 3 × nº — **não está no rascunho**. |
| Cenários da parada | idem (`CENARIOS_PARADA`) | Assistolia (8 meses, 8 kg; volta com 2 adrenalinas); FV (6 anos, 20 kg; volta com 3 choques + adrenalina + amiodarona); AESP por hipovolemia (13 anos, 45 kg; volta com adrenalina + SF). |
| Peso estimado pela idade | `src/dados/peso-estimado-a-validar.ts` | APLS: (0,5 × meses) + 4 até 12 meses; (2 × anos) + 8 de 1 a 5 anos; (3 × anos) + 7 de 6 a 12 anos; antiga: (idade + 4) × 2 de 1 a 10 anos. |
| Oxigenoterapia | `src/dados/oxigenio-a-validar.ts` | FiO₂ por dispositivo e fluxo (cateter 25% + 4%/L até 37%; máscara simples 35–50%; com reservatório 60–90%; bolsa 90–100%); CPAP 40% e ventilador 60% de partida; FR 20 quando ventilado. Modelo de oxigenação em `src/motor/oxigenacao.ts` (simplificação didática). |
| Caça-erros e caderno | `src/estudo/cacaErros.ts`, `src/estudo/caderno.ts` | Sem dado clínico novo (usam os roteiros). Intervalos da revisão espaçada (0, 1, 3, 7, 14 dias) são escolha didática. |

## Dados novos de D1–D7 — recém-nascido, atenção básica e briefing (out/2026)
Tudo escrito pelo assistente de memória, **sem conferência**. Cada item tem `status: 'A_VALIDAR'` no arquivo.

| Assunto | Arquivo | O que conferir |
|---|---|---|
| Capurro somático e somático-neurológico | `src/dados/neonatal/maturidade-a-validar.ts` | Pontos de cada opção (textura da pele 0–20; orelha 0–24; glândula mamária 0–15; mamilo 0–15; pregas plantares 0–20; xale 0–18; cabeça 0–12) e constantes (IG em dias = 204 + pontos; 200 + pontos). |
| New Ballard | idem | Textos e pontos de −1/−2 a 5 de cada critério; conversão IG = 24 + 0,4 × pontos (−10 = 20 s; 50 = 44 s). |
| Classificação pela IG | idem (`CLASSIFICACAO_IG_DETALHADA`) | Pré-termo extremo < 28; muito pré-termo 28–31+6; moderado 32–33+6; tardio 34–36+6; termo precoce 37–38+6; completo 39–40+6; tardio 41–41+6; pós-termo ≥ 42. |
| Redatar pela USG | idem (`REDATAR_PELA_USG`) | Diferença DUM × USG que muda a data (ACOG 700): ≤ 8+6 s: > 5 d; 9–13+6: > 7 d; 14–15+6: > 7 d; 16–21+6: > 10 d; 22–27+6: > 14 d; ≥ 28: > 21 d. |
| PIG/AIG/GIG | idem (`CLASSIFICACAO_PESO_IG`) | Percentis 10 e 90. |
| Exame do RN e atlas | `src/dados/neonatal/exame-rn-a-validar.ts` | Texto de cada região (normal e como examinar), ≈50 achados (o que se vê, explicação, diferencial, conduta, categoria, urgente). Sinais vitais normais (FC 120–160, FR 40–60, T 36,5–37,5 °C); alterados sorteados (FR 72, T 38,1, T 36,0, FC 190). |
| Triagens e coraçãozinho | idem (`TRIAGENS_NEONATAIS`, `CORACAOZINHO`) | Prazos (pezinho 3º–5º dia etc.); coraçãozinho: ≥ 95% e diferença < 3% normal; senão repetir em 1 h; persistindo, eco em 24 h. |
| Zonas de Kramer | idem (`ZONAS_KRAMER`) | Bilirrubina aproximada por zona (4–8; 5–12; 8–16; 11–18; > 15 mg/dL). |
| Apgar e Silverman-Andersen | `src/dados/neonatal/escores-a-validar.ts` | Itens e faixas (Apgar 0–3 / 4–6 / 7–10; Silverman 0 / 1–3 / 4–6 / 7–10). |
| Receitas de problemas comuns | `src/dados/atencao-basica/receitas-a-validar.ts` | Apresentações e doses: paracetamol 10 mg/kg/dose (gotas 200 mg/mL, 20 gotas/mL); amoxicilina 50 mg/kg/dia (8/8 h na OMA, 12/12 h na faringoamigdalite); zinco 20 mg/dia; sulfato ferroso 3 mg/kg/dia (tratamento) e 1 mg/kg/dia (profilaxia); vitamina D 400 UI; albendazol 400 mg; nistatina 100.000 UI 6/6 h; cefalexina 50 mg/kg/dia 6/6 h; PEG 0,4 g/kg/dia; salbutamol 400 mcg (4 jatos); ibuprofeno 400 mg; permetrina, mupirocina, adapaleno+peróxido (uso tópico); durações e máximos. |
| Exame físico de doenças comuns | `src/dados/atencao-basica/exame-fisico-a-validar.ts` | Descrições e condutas (otoscopia, oroscopia, exantemas, hidratação/planos A-B-C, FR do AIDPI, sinais meníngeos). |
| Calendário de vacinas | `src/dados/atencao-basica/vacinas-a-validar.ts` | Calendário PNI 2024–2025 (idades, doses, idade máxima do rotavírus 3 m 15 d / 7 m 29 d, HPV dose única 9–14 anos, ACWY 11–14, VIP no reforço, meningo C × ACWY aos 12 meses, COVID-19). Conferir a versão vigente do MS. |
| Desenvolvimento | `src/dados/atencao-basica/desenvolvimento-a-validar.ts` | Marcos por faixa (formato Caderneta/AIDPI), reflexos primitivos e até quando, sinais de alerta, fatores de risco; regra da classificação em `src/atencao-basica/desenvolvimento.ts`. |
| Consulta de puericultura e hebiatria | `src/dados/atencao-basica/puericultura-a-validar.ts` | Calendário de consultas, orientações e suplementos por idade; HEEADSSS; sigilo; Tanner (texto); idades da puberdade; PA ≥ 13 anos (AAP 2017). |
| Briefing e debriefing | `src/dados/parada-briefing-a-validar.ts` | Papéis da equipe, lista do briefing, fases do debriefing, itens de CRM, pausas usadas na fração de compressão estimada (10 s / 5 s / 10 s; meta > 80%). |

