# Fase 1 — Item de medicação estruturado na folha

Nas seções **4, 5 e 6** da folha há o botão **"+ medicação"**. O aluno preenche, nesta ordem:

1. **Medicação** (lista do banco; trocar a medicação limpa o item)
2. **Apresentação** (se houver só uma, já vem escolhida)
3. **Indicação** (as regras do banco para a faixa etária do paciente; se houver só uma, já vem escolhida)
4. **Dose** (quantidade por dose) e **unidade** (mg, mcg, g, UI, mEq — vem com a unidade da apresentação)
5. **Reconstituir em … mL** (só para pó)
6. **Volume a aspirar** (mL)
7. **Via** e **intervalo** (dose única, 4/4h, 6/6h, 8/8h, 12/12h, 24/24h)

O programa escreve a linha da folha (ex.: *Dipirona — Ampola 500 mg/mL, 2 mL — 240 mg (0,48 mL) EV 6/6h*).
O botão **"Conferir"** mostra a conferência; **"Administrar"** só funciona com o item completo e manda a dose para o motor do paciente (aparece na linha do tempo e o paciente reage conforme o caso).

## O que é conferido

| O quê | Como | Corrige o aluno? |
|---|---|---|
| Seção da folha | a medicação tem uma seção no banco (ex.: ceftriaxona = 5) | Sim (é classificação, não dose) |
| Conta do volume | volume = dose ÷ concentração (com mg↔mcg↔g; pó: quantidade ÷ mL de reconstituição) | **Sim, sempre**: é só matemática sobre a apresentação mostrada na tela |
| Unidades | dose em UI com apresentação em mg/mL etc. | Sim (não dá para converter) |
| Nº de ampolas/frascos | avisa quando a dose usa mais de uma unidade | Só aviso |
| Dose | compara com a faixa da regra (por kg ou fixa; por dose ou por dia), já limitada pela dose máxima; mostra a faixa calculada para o peso | **Só com regra CONFERIDA.** Com "A VALIDAR" aparece só como referência |
| Dose máxima de outro período | ex.: regra por dose com máximo por dia | Só com regra CONFERIDA |
| Via | via da apresentação e via da regra | Só com dado CONFERIDO |
| Intervalo | intervalos aceitos na regra | Só com regra CONFERIDA |
| Avisos | troca de fonte (ex.: "SBP não tem, usando PALS") e alertas da medicação | Só aviso |

Selos na tela: **✔ certo**, **✘ errado**, **⚠ atenção**, **A VALIDAR** (referência ainda não conferida — não corrige).

## Decisões provisórias (o usuário pode mudar)

- **A conta errada mostra a conta certa** (modo treino). Futuro: "modo prova" que esconde o gabarito.
- **Dose única não é comparada com o intervalo da referência** (ex.: antitérmico "agora").
- Todas as medicações aparecem em qualquer uma das seções 4–6; pôr na seção errada é marcado como erro (treina a ordem da folha).
- **Reconstituição:** concentração = quantidade do frasco ÷ mL de diluente. O volume que o pó ocupa (deslocamento) é ignorado — **A VALIDAR** com o usuário.
- **Gotas:** por enquanto o volume é em mL; conversão gotas ↔ mL fica para depois (depende do frasco, A VALIDAR).
- Margem de arredondamento: 1% (ainda pendente, ver `docs/fase-0/formulas.md`, item 8).
- Fonte: SBP como padrão (a função já aceita outra fonte; falta a tela para o usuário escolher).

## Preparo: diluição, rediluição, BIC e infusão contínua (I5)

Abaixo dos campos do item há botões para o preparo. Tudo aqui é **matemática sobre números da tela**, por isso é **sempre conferido** (mesmo com dose A VALIDAR):

| Botão / opção | O aluno escreve | O programa confere |
|---|---|---|
| **+ diluição** / **+ rediluição** | aspirar V1 mL (da apresentação ou da etapa anterior) + diluente (SF 0,9%, AD, SG 5%) até V2 mL → concentração | C2 = C1 × V1 ÷ V2. Cada etapa parte da concentração **certa** da anterior (um erro não contamina as seguintes). Com diluição, o campo "Volume a administrar" é conferido na solução final. |
| **+ seringa da BIC (12 mL)** | SF da seringa, concentração final; opcional: tempo (min) e vazão (mL/h) | SF = volume final − volume da dose; concentração = dose ÷ volume final; vazão = volume ÷ tempo × 60. Volume final vem de Configurações (Santa Casa = 12 mL). Dose maior que o volume final: avisa que a regra não se aplica. |
| Intervalo **"infusão contínua"** | dose (mcg ou mg/kg/min ou /h), mL da medicação na seringa, SF, concentração, vazão | SF, concentração final (com mg ↔ mcg) e vazão = dose × peso (× 60 se por minuto) ÷ concentração. Mostra quantas horas a seringa dura. A dose da infusão é comparada com a regra por min/h (só corrige se CONFERIDA). |

Exemplos usados nos testes (`src/prescricao/preparo.test.ts`): gentamicina 0,3 mL + 11,7 mL SF = 12 mL; NaCl 5 mL + 7 mL SF; adrenalina 1 mL + 9 mL SF = 0,1 mg/mL.

## Onde fica no código

- `src/prescricao/itemMedicacao.ts` — lógica (sem tela): campos, linha da folha, conferência. Testes em `itemMedicacao.test.ts`.
- `src/prescricao/estado.ts` — a folha guarda itens de texto e itens de medicação.
- `src/prescricao/preparo.ts` — diluição em etapas, seringa da BIC e infusão contínua (sem tela), testes em `preparo.test.ts`.
- `src/prescricao/comum.ts` — leitura de números, formatação, conversão de unidades e formato das verificações.
- `src/telas/ItemMedicacaoFolha.tsx` e `src/telas/PreparoItem.tsx` — a tela do item e do preparo.
