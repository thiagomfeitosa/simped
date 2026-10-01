# Fórmulas de cálculo (Fase 0)

Estas são as contas que o aluno fará e que o programa conferirá. São **matemática pura**, sem doses. As doses virão do banco de medicações, sempre com fonte.

> **Já programadas e testadas** em `src/calculos/` (um arquivo por fórmula; os testes automáticos ficam nos arquivos `*.test.ts`, com os exemplos escritos em português). Configuração por hospital em `src/dados/hospitais.ts`.

## 1. Dose por peso
- **Dose total** = dose prescrita (por kg) × peso (kg)
- Se a dose total passar da **dose máxima**, usa-se a dose máxima (o programa avisará o aluno).

## 2. Volume a aspirar
- **Volume (mL)** = dose total ÷ concentração da apresentação
- Ex. de unidades: mg ÷ (mg/mL) = mL; UI ÷ (UI/mL) = mL.
- **Reconstituição** de um pó: concentração = quantidade de droga ÷ volume (ex.: 500 mg em 5 mL = 100 mg/mL).

## 3. Diluição e rediluição
- Regra geral: **C1 × V1 = C2 × V2**
  (concentração inicial × volume inicial = concentração final × volume final)
- **Rediluição**: repete-se a mesma regra a partir da solução já diluída (ex.: aspira 1 mL da 1ª diluição e completa até 10 mL).
- O programa conferirá cada etapa escrita pelo aluno: o volume aspirado, o volume de diluente, a concentração final e a quantidade que será efetivamente administrada.

## 4. Infusão contínua (mcg/kg/min → mL/h)
- **mL/h** = dose (mcg/kg/min) × peso (kg) × 60 ÷ concentração da solução (mcg/mL)
- E o inverso: dose (mcg/kg/min) = mL/h × concentração (mcg/mL) ÷ (peso × 60)
- Dose **por hora** (ex.: insulina em UI/kg/h): mesma conta sem o × 60.
- Dose e concentração na mesma unidade (mcg com mcg/mL). Se a solução estiver em mg/mL, converter antes (1 mg = 1000 mcg).

## 5. Velocidade de infusão de glicose (VIG)
- **VIG (mg/kg/min)** = vazão (mL/h) × concentração de glicose (%) ÷ (6 × peso em kg)
  - Dedução: % = g/100 mL → mL/h × % × 1000 ÷ 100 ÷ 60 ÷ peso.

## 6. Soro de manutenção (Holliday-Segar)
- Até 10 kg: 100 mL/kg/dia
- 10–20 kg: 1000 mL + 50 mL/kg para cada kg acima de 10
- Acima de 20 kg: 1500 mL + 20 mL/kg para cada kg acima de 20
- Vazão (mL/h) = volume do dia ÷ 24
- **Mistura de duas soluções** (ex.: SG 5% + glicose 50%): volume da mais concentrada = volume final × (desejada − menor) ÷ (maior − menor); o resto é da menos concentrada.
- A regra de Holliday-Segar não vale para todas as idades (ex.: RN usa outras tabelas). Quando usar é decisão clínica, com fonte (A VALIDAR).
- Cálculo de eletrólitos no soro (Na, K) e mistura de SG 5% + SG 50% para atingir a concentração desejada ficam no mesmo módulo. Os valores-alvo serão definidos com fonte (A VALIDAR).

## 7. Fator de correção da BIC (rediluição para volume final fixo)
- **Regra da Santa Casa (alojamento conjunto): volume final = 12 mL.** Cada hospital poderá configurar o seu valor.
- O volume da medicação (já diluída/pronta) é **retirado de 12**, e o restante é completado com soro fisiológico:
  - **Volume de SF (mL)** = 12 − volume da medicação (mL)
  - **Concentração final** = quantidade de droga ÷ 12 mL
- Exemplos do usuário:
  - Gentamicina: 0,3 mL da medicação já diluída + **11,7 mL** de SF = 12 mL
  - NaCl: 5 mL de NaCl + **7 mL** de SF = 12 mL
- O programa confere: (1) volume da medicação, (2) volume de SF, (3) soma = volume final configurado, (4) concentração final.
- Se o volume da medicação passar do volume final (ex.: 13 mL), o programa avisa que a regra não se aplica.

## 8. Conferência da resposta do aluno
- O programa aceita uma pequena diferença de arredondamento.
- **Margem provisória: 1% do valor correto. A DEFINIR com o usuário** (ex.: aceitar 0,05 mL de diferença em volumes? arredondar dose para 1 casa decimal?).
