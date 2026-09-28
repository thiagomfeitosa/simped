# Modo "Passo a passo" (roteiros didáticos)

Tela que mostra, etapa por etapa, como montar uma prescrição e fazer as contas.
Primeira tela do app (antecipa parte da Fase 1).

## O que aparece na tela
1. **Trilha de setas** (topo): cada seta é uma etapa, agrupadas pela seção da folha (1. Identificação, 2. Oxigenoterapia…). Clicar numa seta pula para ela.
2. **Animação** (esquerda): muda a cada etapa e anda **para trás** quando o aluno volta.
   - *Paciente na balança*: o visor conta até o peso.
   - *Blocos de multiplicação*: um bloco por kg; a soma cresce até a dose total.
   - *Bancada*: frasco/ampola, seringa com camadas de líquido (medicação + SF), bolsa de soro, BIC com visor de mL/h, setas mostrando para onde o líquido vai, régua de VIG.
   - *Cartões*: itens sem conta (O₂, dieta, exames, cuidados, SINAN).
   - *Revisão final*: carimbo e checklist.
   - Botão **↻ Repetir animação**.
   - *Régua de exame*: faixas coloridas (grave / leve / normal…) e ponteiro que anda até o valor do paciente (Na, K, bilirrubina, % de perda de peso); linhas tracejadas para limites (teto de 24 h, limiar de fototerapia).
   - *Barras*: comparam concentrações (mEq/mL das soluções de NaCl; K⁺ na seringa de 12 mL × limite periférico).
   - *Mistura*: bolsa que recebe os componentes um a um (SG 5% + SF 0,9% + KCl) e mostra a composição final (Na⁺, K⁺ em mEq/L).
   - *Icterícia*: RN com as zonas de Kramer acendendo, bilirrubinômetro transcutâneo e fototerapia (luz azul + protetor ocular).
   - *Multiplicação por faixas*: blocos de cores diferentes por faixa de peso (Holliday-Segar: 100 mL/kg + 50 mL/kg).
3. **Explicação** (direita): texto simples + conta em tempos ligados por setas (fórmula → números → passos intermediários → resultado), dica e selo **A VALIDAR** com a fonte prevista.
   - A conta aparece **devagar**, um tempo de cada vez (a seta se desenha, depois a linha aparece).
   - Cada conta tem os seus botões **↶ Desfazer** / **Refazer ↷** (um tempo de cada vez) e **↻** (rever a conta do começo). Eles mexem só na conta, não no passo a passo geral. Os pontinhos mostram em que tempo a conta está.
   - Ao chegar **voltando** de uma etapa seguinte, a conta já aparece pronta (dá para desfazer).
4. **Navegação**: botões ◀ Voltar / Avançar ▶ e setas ← → do teclado.
5. **Rascunho de cálculos** e **folha de prescrição**: vão sendo preenchidos; a linha nova aparece "sendo escrita" e marcada de amarelo. Uma linha da folha pode crescer ao longo das etapas (ex.: gentamicina → + volume → + SF → + BIC). A conta da etapa atual só é escrita no rascunho quando o resultado aparece (e some se o aluno desfizer o resultado).
6. **Etapa final automática — "Prescrição com os cálculos"**: em todos os roteiros, a última seta mostra a folha inteira com as contas de cada item escritas logo abaixo dele (fórmula + conta "à mão"), selo A VALIDAR por item, link "ver etapa N" para voltar à explicação, opção de esconder as contas e botão **Imprimir**.
7. **Velocidade das animações** (canto superior direito): Devagar / Normal / Rápido. A escolha fica guardada no navegador. O "Normal" já é mais lento que a versão anterior.

## Roteiros disponíveis
| Roteiro | Arquivo | Conteúdo |
|---|---|---|
| RN com suspeita de sepse — prescrição completa | `src/dados/roteiros/sepse-neonatal.ts` | 20 etapas: todas as seções da folha; soro com VIG; ampicilina (reconstituição, aspiração, fator BIC 12 mL, vazão); gentamicina (0,3 mL + 11,7 mL, exemplo da Santa Casa) |
| Icterícia neonatal — fototerapia | `src/dados/roteiros/ictericia-neonatal.ts` | 12 etapas: zonas de Kramer, bilirrubinômetro, horas de vida, limiar de fototerapia (régua), perda de peso, amamentação mantida, fototerapia, exames e cuidados |
| Desidratação grave — Plano C e soro com Na/K | `src/dados/roteiros/desidratacao-plano-c.ts` | 20 etapas: grau de desidratação, Na/K da admissão, expansão 20 mL/kg (vazão), Holliday-Segar por faixas, soro 4:1, KCl 10% 2 mL/100 mL, concentração de Na⁺ e K⁺ do soro, vazão, reposição 50 mL/kg/dia, zinco, SINAN |
| Hiponatremia com convulsão — NaCl 3% | `src/dados/roteiros/hiponatremia.ts` | 17 etapas: mEq/mL das soluções de NaCl, dose 2 mL/kg, preparo do NaCl 3% a partir do 20% (C1V1 = C2V2 + AD), vazão, quanto o Na sobe, teto de 24 h, manutenção isotônica com KCl |
| Hipocalemia grave — correção com KCl | `src/dados/roteiros/hipocalemia.ts` | 14 etapas: K⁺ de manutenção (mEq → mL), correção 0,5 mEq/kg, mL de KCl 19,1%, por que a seringa de 12 mL NÃO serve (667 mEq/L), diluição até 40 mEq/L, velocidade em mEq/kg/h |
| Diluição: adrenalina 1:10.000 na PCR | `src/dados/roteiros/adrenalina-pcr.ts` | 8 etapas: por que diluir, C1 × V1 = C2 × V2, volume a administrar |

(Cada roteiro tem ainda a etapa final automática "Prescrição com os cálculos".)

**Todas as doses, tempos de infusão, limiares e condutas desses roteiros vêm do `docs/fase-0/doses-rascunho.md` (ou do conhecimento geral do assistente) e estão marcados "A VALIDAR".** Lista para conferência: `docs/roteiros-a-validar.md`.

## Como criar um roteiro novo (para o assistente)
- Criar `src/dados/roteiros/<nome>.ts` exportando um `Roteiro` (formato em `src/dados/roteiros/tipos.ts`) e incluí-lo em `src/dados/roteiros/index.ts`.
- Os números devem ser **calculados** com as funções de `src/logica/calculos.ts`, nunca digitados à mão.
- Cada roteiro tem um `tema` (agrupa o menu: Neonatologia, Distúrbios hidroeletrolíticos, Emergência).
- Cada etapa: `secao`, `curto` (nome na seta), `titulo`, `explicacao`, e opcionalmente `conta` (com `passos` intermediários, se a conta tiver mais de um tempo), `dica`, `aValidar` + `fonte`, `cena`, `linha` (linha da folha; o mesmo `id` reescreve a linha) e `linhaDaConta` (quando a conta deve aparecer embaixo de outra linha na prescrição final).
- Cenas disponíveis: `paciente`, `multiplicacao` (com `faixas` opcionais), `cartoes`, `bancada`, `conclusao`, `regua`, `barras`, `mistura`, `ictericia`. A etapa final (`prescricao-final`) é acrescentada sozinha — não escrever.
- Eletrólitos: usar `meqPorMl(%, MG_POR_MEQ.NaCl | KCl)`, `meqPorLitro`, `volumeMinimoDiluicao`, `volumeDoConcentrado`, `deficitSodio`, `subidaEstimadaSodio`, `meqPorKgPorHora`, `dividirEmProporcao` (todas em `src/logica/calculos.ts`, com testes).
- Na cena `bancada`, `estadoInicial` é como a bancada aparece ao chegar avançando; a animação vai dele até `estado`.
- Rodar `npm test` (os testes conferem a integridade dos roteiros).

## Próximos roteiros sugeridos
- Rediluição (depende das apresentações da Santa Casa).
- Hipercalemia (gluconato de cálcio, glicose + insulina, salbutamol) e hipocalcemia no RN.
- Hipernatremia (correção lenta da água livre).
- Hipoglicemia no RN (bolus de SG 10% + VIG).
- Exsanguineotransfusão (volume = 2 volemias) como continuação do roteiro de icterícia.
- Infusão contínua (mcg/kg/min → mL/h).
- Escolha da fonte (SBP × AAP 2022) nos limiares de fototerapia.
