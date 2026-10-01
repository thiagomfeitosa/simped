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

