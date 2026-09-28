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
3. **Explicação** (direita): texto simples + conta em três tempos (fórmula → números → resultado), dica e selo **A VALIDAR** com a fonte prevista.
4. **Navegação**: botões ◀ Voltar / Avançar ▶ e setas ← → do teclado.
5. **Rascunho de cálculos** e **folha de prescrição**: vão sendo preenchidos; a linha nova aparece "sendo escrita" e marcada de amarelo. Uma linha da folha pode crescer ao longo das etapas (ex.: gentamicina → + volume → + SF → + BIC).

## Roteiros disponíveis
| Roteiro | Arquivo | Conteúdo |
|---|---|---|
| RN com suspeita de sepse — prescrição completa | `src/dados/roteiros/sepse-neonatal.ts` | 20 etapas: todas as seções da folha; soro com VIG; ampicilina (reconstituição, aspiração, fator BIC 12 mL, vazão); gentamicina (0,3 mL + 11,7 mL, exemplo da Santa Casa) |
| Diluição: adrenalina 1:10.000 na PCR | `src/dados/roteiros/adrenalina-pcr.ts` | 8 etapas: por que diluir, C1 × V1 = C2 × V2, volume a administrar |

**Todas as doses, tempos de infusão e condutas desses roteiros vêm do `docs/fase-0/doses-rascunho.md` e estão marcados "A VALIDAR".**

## Como criar um roteiro novo (para o assistente)
- Criar `src/dados/roteiros/<nome>.ts` exportando um `Roteiro` (formato em `src/dados/roteiros/tipos.ts`) e incluí-lo em `src/dados/roteiros/index.ts`.
- Os números devem ser **calculados** com as funções de `src/logica/calculos.ts`, nunca digitados à mão.
- Cada etapa: `secao`, `curto` (nome na seta), `titulo`, `explicacao`, e opcionalmente `conta`, `dica`, `aValidar` + `fonte`, `cena` e `linha` (linha da folha; o mesmo `id` reescreve a linha).
- Na cena `bancada`, `estadoInicial` é como a bancada aparece ao chegar avançando; a animação vai dele até `estado`.
- Rodar `npm test` (os testes conferem a integridade dos roteiros).

## Próximos roteiros sugeridos
- Rediluição (depende das apresentações da Santa Casa).
- Soro de manutenção com eletrólitos (Holliday-Segar, Na/K, SG 5% + SG 50%).
- Infusão contínua (mcg/kg/min → mL/h).
