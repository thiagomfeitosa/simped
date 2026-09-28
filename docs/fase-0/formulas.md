# Fórmulas de cálculo (Fase 0)

Estas são as contas que o aluno fará e que o programa conferirá. São **matemática pura**, sem doses. As doses virão do banco de medicações, sempre com fonte.

## 1. Dose por peso
- **Dose total** = dose prescrita (por kg) × peso (kg)
- Se a dose total passar da **dose máxima**, usa-se a dose máxima (o programa avisará o aluno).

## 2. Volume a aspirar
- **Volume (mL)** = dose total ÷ concentração da apresentação
- Ex. de unidades: mg ÷ (mg/mL) = mL; UI ÷ (UI/mL) = mL.

## 3. Diluição e rediluição
- Regra geral: **C1 × V1 = C2 × V2**
  (concentração inicial × volume inicial = concentração final × volume final)
- **Rediluição**: repete-se a mesma regra a partir da solução já diluída (ex.: aspira 1 mL da 1ª diluição e completa até 10 mL).
- O programa conferirá cada etapa escrita pelo aluno: o volume aspirado, o volume de diluente, a concentração final e a quantidade que será efetivamente administrada.

## 4. Infusão contínua (mcg/kg/min → mL/h)
- **mL/h** = dose (mcg/kg/min) × peso (kg) × 60 ÷ concentração da solução (mcg/mL)
- E o inverso: dose (mcg/kg/min) = mL/h × concentração (mcg/mL) ÷ (peso × 60)

## 5. Velocidade de infusão de glicose (VIG)
- **VIG (mg/kg/min)** = vazão (mL/h) × concentração de glicose (%) ÷ (6 × peso em kg)
  - Dedução: % = g/100 mL → mL/h × % × 1000 ÷ 100 ÷ 60 ÷ peso.

## 6. Soro de manutenção (Holliday-Segar)
- Até 10 kg: 100 mL/kg/dia
- 10–20 kg: 1000 mL + 50 mL/kg para cada kg acima de 10
- Acima de 20 kg: 1500 mL + 20 mL/kg para cada kg acima de 20
- Vazão (mL/h) = volume do dia ÷ 24
- Cálculo de eletrólitos no soro (Na, K) e mistura de SG 5% + SG 50% para atingir a concentração desejada ficam no mesmo módulo. Os valores-alvo serão definidos com fonte (A VALIDAR).

## 7. Fator de correção da BIC (A VALIDAR — precisa da sua definição)
Cada hospital acrescenta um volume extra para compensar o que fica no equipo/extensão ou a perda da seringa. A forma exata varia, por isso o programa deixará isso **configurável**. Possibilidades que conhecemos:
- **(a) Volume fixo acrescentado**: prepara-se volume da infusão + X mL (ex.: +20 mL para preencher o equipo), mantendo a mesma concentração.
- **(b) Fator multiplicador**: volume preparado = volume necessário × fator (ex.: × 1,2).
- **(c) Volume mínimo da seringa/frasco**: completa-se sempre até um volume padrão (ex.: seringa de 50 mL), recalculando a quantidade de droga.

**Pergunta ao usuário:** como é feito no seu hospital? Qual é o valor? Com um exemplo real (droga, peso, vazão e o que é preparado) consigo escrever a fórmula exata.
