# Casos clínicos iniciais (Fase 0) — TUDO "A VALIDAR"

> ⚠️ **Rascunho escrito pelo assistente.** Histórias, sinais vitais, exames, doses e reações do paciente precisam ser **conferidos pelo usuário** nas fontes.
> As doses usadas nas contas vêm do [`doses-rascunho.md`](doses-rascunho.md) (o número entre parênteses, ex.: "item 10", é o item desse rascunho). **Se uma dose for corrigida lá, as contas deste arquivo também precisam ser revistas.**
> Apresentações e reconstituições (volume de água para cada frasco) são as mais comuns no Brasil e precisam ser confrontadas com as da Santa Casa.
> Fator de correção da BIC = **volume final de 12 mL** (ver [`formulas.md`](formulas.md), item 7).
> Treinamento apenas: **não substitui protocolos institucionais.**

## Como cada caso está organizado
Cada caso segue a mesma estrutura, para virar depois um **arquivo de dados** do programa (um arquivo por caso). Assim, corrigir um caso não mexe nos outros nem no código.

1. **Identificação**: nome fictício, idade, peso, cenário (sala de parto, alojamento, PS, UTI, ambulatório).
2. **História** e **exame / sinais vitais iniciais** (o que aparece no monitor ao abrir o caso).
3. **Hipótese diagnóstica esperada.**
4. **Prescrição esperada**, na ordem da folha (O2 → dieta → soro → antibióticos → demais → exames → cuidados → SINAN), com as contas.
5. **Evolução do paciente**: o que acontece se o aluno acertar, atrasar ou errar.
6. **Pontos de ensino.**

## Resumo dos casos

| # | Caso | Faixa | Principais medicações |
|---|------|-------|----------------------|
| 1 | Hipoglicemia no RN filho de mãe diabética | RN | SG 10%, glicose 50% (concentrar soro), gluconato de cálcio |
| 2 | Sepse neonatal precoce | RN | SF 0,9%, ampicilina, gentamicina (BIC 12 mL) |
| 3 | Sífilis congênita com neurossífilis | RN | Penicilina cristalina (procaína e benzatina nas variações) |
| 4 | RN exposto ao HIV (alto risco) | RN | AZT, lamivudina, raltegravir |
| 5 | Toxoplasmose congênita | RN (ambulatório) | Sulfadiazina, pirimetamina, ácido folínico |
| 6 | Crise de asma grave | Criança | Salbutamol/fenoterol, ipratrópio, corticoides, salmeterol na alta |
| 7 | Laringite (crupe) moderada/grave | Criança | Dexametasona, adrenalina inalatória |
| 8 | Meningite / choque séptico | Criança | SF, ceftriaxona, dexametasona, vancomicina, dipirona, adrenalina contínua, hidrocortisona |
| 9 | Anafilaxia | Adolescente | Adrenalina IM, SF, metilprednisolona, salbutamol |
| 10 | Cetoacidose diabética | Adolescente | SF, insulina regular, KCl, SG 5% |
| 11 | Taquicardia supraventricular | Lactente | Adenosina |
| 12 | PCR em fibrilação ventricular | Criança | Adrenalina, amiodarona |
| 13 | Hipoglicemia grave sem acesso venoso | Criança | Glucagon, glicose 25%, SG 10% |
| 14 | Intoxicação por benzodiazepínico | Criança | Flumazenil |
| 15 | Hiponatremia com convulsão | Lactente | NaCl 3% (preparado do 20%), soro de manutenção com NaCl |
| 16 | Crise adrenal (hiperplasia adrenal congênita) | Criança | Hidrocortisona, SF, SG 10%, cortisona/prednisona na alta |

Medicação da lista **sem caso ainda**: dolutegravir (fica para um caso futuro de adolescente vivendo com HIV).

---

## Caso 1 — Hipoglicemia no RN filho de mãe diabética
**Identificação:** Maria, RN a termo (39 semanas), 2 h de vida, **4,2 kg** (GIG). Alojamento conjunto.
**História:** mãe com diabetes gestacional em uso de insulina, mal controlado.
**Exame / vitais:** tremores, hipoatividade, sucção fraca. FC 150 · FR 52 · SpO2 97% · Tax 36,6 °C · **glicemia capilar 28 mg/dL**.
**Hipótese:** hipoglicemia neonatal sintomática.

**Prescrição esperada:**
1. Dieta: seio materno se sugar bem; senão, sonda (A VALIDAR conduta).
2. **Bolus de SG 10%** 2 mL/kg (item 3) = 2 × 4,2 = **8,4 mL EV em 1 min**.
3. **Soro de manutenção** com VIG 6 mg/kg/min e hídrico de 80 mL/kg/dia (item 3):
   - Volume do dia = 80 × 4,2 = 336 mL → vazão = 336 ÷ 24 = **14 mL/h**.
   - Concentração de glicose necessária = VIG × 6 × peso ÷ vazão = 6 × 6 × 4,2 ÷ 14 = **10,8%**.
   - Mistura (SG 10% + glicose 50%) para 336 mL a 10,8%: glicose 50% = **6,7 mL**; SG 10% = **329,3 mL**.
   - Conferência: com só SG 10% a 14 mL/h, a VIG seria 14 × 10 ÷ (6 × 4,2) = 5,6 mg/kg/min.
4. Gluconato de cálcio 10% no soro (item 6): 2 mL/kg/dia = **8,4 mL/dia** (A VALIDAR se entra já no 1º dia).
5. Exames: glicemia capilar 30 min após o bolus e depois de 1/1 h até estabilizar; cálcio.
6. Cuidados: manter aquecido, observar tremores e apneia.

**Evolução:**
- Acerto: 30 min depois, glicemia 60–70 mg/dL, tremores param.
- Sem bolus ou sem soro: glicemia cai para 20 mg/dL, apneia e convulsão.
- Glicose 50% em bolus: alerta de solução hiperosmolar (flebite, risco no RN), mesmo que a glicemia suba.

**Pontos de ensino:** fórmula da VIG; como concentrar um soro misturando duas soluções; a glicose 50% não é para bolus no RN.

---

## Caso 2 — Sepse neonatal precoce
**Identificação:** João, RN de 37 semanas, 18 h de vida, **3,0 kg**. UTI neonatal.
**História:** bolsa rota há 24 h, mãe febril no parto, pesquisa de estreptococo do grupo B desconhecida.
**Exame / vitais:** gemido, tiragem, pele moteada, TEC 4 s. FC 180 · FR 70 · SpO2 91% · Tax 38,2 °C · glicemia 60 mg/dL · PA média 35 mmHg.
**Hipótese:** sepse neonatal precoce.

**Prescrição esperada:**
1. O2: cateter, capuz ou CPAP, alvo de SpO2 91–95% (A VALIDAR).
2. Dieta: jejum.
3. Expansão: SF 0,9% 10 mL/kg (item 1) = **30 mL**, tempo de infusão A VALIDAR; reavaliar.
4. Soro de manutenção: SG 10% a 60 mL/kg/dia = 180 mL/dia = **7,5 mL/h** → VIG = 7,5 × 10 ÷ (6 × 3) = **4,2 mg/kg/min**.
5. **Ampicilina** 50 mg/kg/dose (item 10) = **150 mg**; intervalo (8/8 h ou 12/12 h) pela tabela de IG e dias de vida, A VALIDAR.
   - Frasco 500 mg + 5 mL de água destilada ≈ 100 mg/mL → aspirar **1,5 mL**.
6. **Gentamicina** (≥ 35 semanas: 4 mg/kg 24/24 h, item 11) = **12 mg**.
   - Ampola 40 mg/mL (1 mL) + 9 mL de SF = 4 mg/mL → aspirar **3 mL**.
   - **BIC (12 mL):** 3 mL de gentamicina + **9 mL de SF** = 12 mL; infundir em 30 min = **24 mL/h**.
7. Exames: **hemocultura antes do antibiótico**, hemograma, PCR, glicemia, gasometria, RX de tórax; líquor quando estável.
8. Cuidados: monitorização contínua, incubadora, controle da diurese.

**Evolução:**
- Acerto, com antibiótico na 1ª hora: TEC 2–3 s, FC 150, SpO2 95%.
- Atraso no antibiótico ou sem expansão: choque (hipotensão, acidose metabólica na gasometria).
- Erro na diluição da gentamicina (ex.: dose 10 vezes maior): alerta de toxicidade (rim e audição).

**Pontos de ensino:** diluição e rediluição; fator da BIC de 12 mL; hemocultura antes do antibiótico.

---

## Caso 3 — Sífilis congênita com neurossífilis
**Identificação:** Ana, RN de 38 semanas, 2 dias de vida, **2,9 kg**. Alojamento conjunto.
**História:** mãe com VDRL 1:32 no parto e tratamento inadequado na gestação.
**Exame / vitais:** assintomática. FC 140 · FR 44 · SpO2 98% · Tax 36,8 °C.
**Exames já disponíveis:** VDRL do RN **1:128** (maior que o materno), líquor com **VDRL reagente**.
**Hipótese:** sífilis congênita com neurossífilis.

**Prescrição esperada:**
1. Dieta: seio materno livre demanda.
2. **Penicilina G cristalina** 50.000 UI/kg/dose EV (item 13) = **145.000 UI**, **12/12 h** (até 7 dias de vida; depois 8/8 h), por **10 dias**.
   - Frasco 5.000.000 UI + 8 mL de água destilada ≈ 10 mL = **500.000 UI/mL** (A VALIDAR bula).
   - Rediluição: 1 mL + 9 mL de SF = **50.000 UI/mL** → aspirar **2,9 mL**.
3. Exames: hemograma, função hepática, RX de ossos longos, avaliação oftalmológica e auditiva, VDRL de seguimento.
4. Cuidados: tratar e testar a mãe e as parcerias sexuais (penicilina benzatina, item 15).
5. **SINAN: sífilis congênita** (notificação compulsória) e sífilis em gestante, se ainda não notificada.

**Variações do caso (mudando os exames):**
- Líquor normal → penicilina G **procaína** 50.000 UI/kg IM 1x/dia por 10 dias (item 14).
- Situações previstas no fluxograma do MS → penicilina G **benzatina** 50.000 UI/kg IM dose única (item 15). Critérios A VALIDAR com o PCDT atual.

**Evolução:** sinais vitais estáveis. A nota vem da escolha correta da penicilina, da dose e da notificação. Benzatina em caso de neurossífilis → aviso de "tratamento inadequado".

**Pontos de ensino:** qual penicilina usar em cada situação; reconstituição de frasco em UI; notificação.

---

## Caso 4 — RN exposto ao HIV (alto risco)
**Identificação:** Pedro, RN de 39 semanas, 1 h de vida, **3,2 kg**. Sala de parto → alojamento.
**História:** mãe vivendo com HIV, carga viral detectável no 3º trimestre, má adesão. Cesárea eletiva.
**Exame / vitais:** normais. FC 138 · FR 46 · SpO2 98% · Tax 36,7 °C.
**Hipótese:** RN exposto ao HIV, **alto risco** de transmissão.

**Prescrição esperada** (iniciar o mais cedo possível, idealmente nas primeiras horas; prazo exato A VALIDAR):
1. Dieta: **aleitamento materno contraindicado** → fórmula infantil. Inibir a lactação da mãe (medicação fora da lista do MVP).
2. **Zidovudina (AZT)** 4 mg/kg/dose 12/12 h por 28 dias (item 19) = **12,8 mg = 1,3 mL** da solução 10 mg/mL.
3. **Lamivudina (3TC)** 2 mg/kg/dose 12/12 h por 28 dias (item 20) = **6,4 mg = 0,64 mL** da solução 10 mg/mL.
4. **Raltegravir**, 1ª semana 1,5 mg/kg 1x/dia (item 21) = **4,8 mg**. Sachê 100 mg em 10 mL de água = 10 mg/mL → **0,48 mL** (preparo A VALIDAR). Da 2ª à 4ª semana: 3 mg/kg/dose 12/12 h = 9,6 mg.
5. Exames: carga viral (RNA-HIV) do RN, hemograma (anemia pelo AZT).
6. Cuidados: banho logo após o parto; seguimento no serviço especializado.
7. **SINAN: gestante HIV e criança exposta ao HIV** (A VALIDAR fichas).

**Evolução:** sinais vitais estáveis. A nota vem do tempo até a 1ª dose, das doses e da dieta. Se o aluno liberar o seio materno → erro grave.

**Pontos de ensino:** profilaxia em 3 drogas no alto risco; mudança de dose do raltegravir por semana.

---

## Caso 5 — Toxoplasmose congênita (ambulatório)
**Identificação:** Lívia, RN de 7 dias, **3,1 kg**. Ambulatório de seguimento.
**História:** mãe com soroconversão para toxoplasmose no 3º trimestre.
**Exames:** IgM positiva no RN, **coriorretinite** no fundo de olho, calcificações na USG transfontanela.
**Hipótese:** toxoplasmose congênita sintomática.

**Prescrição esperada (ambulatorial):**
1. **Sulfadiazina** 100 mg/kg/dia VO 12/12 h (item 16) = 310 mg/dia → **155 mg 12/12 h** (suspensão manipulada; mL conforme a concentração da farmácia).
2. **Pirimetamina** (item 17): 2 mg/kg/dia = **6,2 mg 1x/dia por 2 dias** → depois 1 mg/kg/dia = **3,1 mg 1x/dia** até 2–6 meses → depois 3x/semana até completar 1 ano.
3. **Ácido folínico** 10 mg VO 3x/semana (item 18), até 1 semana depois de parar a pirimetamina.
4. Corticoide pela coriorretinite ativa: indicação e dose A VALIDAR (prednisolona).
5. Exames: **hemograma periódico** (a pirimetamina causa neutropenia), fundo de olho, audição, neuroimagem.
6. **SINAN: toxoplasmose congênita** (e gestacional, se ainda não notificada).

**Evolução:** consulta seguinte com hemograma. Sem ácido folínico → neutropenia no retorno.

**Pontos de ensino:** esquema escalonado da pirimetamina; ácido folínico, e não ácido fólico.

---

## Caso 6 — Crise de asma grave
**Identificação:** Lucas, 7 anos, **22 kg**. Pronto-socorro.
**História:** asma sem controle, sem medicação de manutenção, tosse e chiado há 2 dias.
**Exame / vitais:** fala frases curtas, tiragem, sibilos difusos. FC 140 · FR 40 · **SpO2 89%** · Tax 37,2 °C.
**Hipótese:** crise de asma grave.

**Prescrição esperada:**
1. **O2** para SpO2 ≥ 94% (A VALIDAR alvo).
2. **Salbutamol** (item 24): spray 100 mcg, 1 jato/2 kg = 11 → **máximo de 10 jatos** com espaçador, 20/20 min na 1ª hora. Ou nebulização 0,15 mg/kg = **3,3 mg = 0,66 mL** (5 mg/mL).
   - Alternativa: **fenoterol** 1 gota/3 kg ≈ **7 gotas** em 3–5 mL de SF (item 25).
3. **Brometo de ipratrópio** 250 mcg = **20 gotas**, junto com o beta-2, 20/20 min, 3 doses (item 26).
4. **Corticoide sistêmico** na 1ª hora:
   - VO: prednisolona 1–2 mg/kg (máx 40–60 mg, item 32) → ex.: 1 mg/kg = 22 mg = **7,3 mL** da solução 3 mg/mL.
   - EV, se vomitar ou estiver grave: metilprednisolona 1–2 mg/kg/dia (item 29) ou hidrocortisona 4–5 mg/kg/dose = 88–110 mg (item 28).
5. Exames: gasometria se não melhorar; potássio se usar muito beta-2.

**Evolução:**
- Acerto: após 1 h, SpO2 95%, FR 28, sibilos esparsos.
- Sem corticoide: melhora parcial e volta a piorar em 4 h.
- Beta-2 em excesso: FC 170, tremor, potássio baixo.
- Sem O2 e sem broncodilatador: SpO2 cai, sonolência, hipercapnia na gasometria (sinal de gravidade).

**Alta (prescrição ambulatorial):** prednisolona ou prednisona (comprimido 20 mg, item 31) por 3–5 dias; salbutamol spray de resgate; manutenção com corticoide inalatório. Em crianças ≥ 4 anos, **fluticasona + salmeterol** (ex.: 25/50 mcg, 2 jatos 12/12 h) conforme etapa do GINA — **nunca salmeterol sozinho** (item 27). Etapa exata A VALIDAR.

**Pontos de ensino:** jatos por peso e dose máxima; salmeterol não é resgate.

---

## Caso 7 — Laringite (crupe) moderada/grave
**Identificação:** Sofia, 2 anos, **12 kg**. Pronto-socorro.
**História:** tosse ladrante e rouquidão desde a noite anterior, piorando.
**Exame / vitais:** **estridor em repouso**, tiragem. FC 150 · FR 44 · SpO2 94% · Tax 37,8 °C.
**Hipótese:** laringotraqueíte viral (crupe) moderada a grave.

**Prescrição esperada:**
1. Manter a criança calma, no colo da mãe; O2 se SpO2 < 92% (A VALIDAR).
2. **Dexametasona** 0,6 mg/kg (item 33) = **7,2 mg** IM, EV ou VO → **1,8 mL** da ampola 4 mg/mL. (O elixir 0,1 mg/mL daria 72 mL, inviável.)
3. **Adrenalina inalatória** 0,5 mL/kg da 1:1.000 (item 34) = 6 mL → **máximo de 5 mL** puros na nebulização.
4. Observar **2–4 h** depois da adrenalina (efeito rebote).

**Evolução:**
- Acerto: estridor só ao chorar após 30 min, FR 30.
- Só adrenalina, sem corticoide: melhora e volta o estridor depois de 2 h.
- Alta logo após a adrenalina: o caso volta ao PS pior.

**Pontos de ensino:** dose máxima da adrenalina inalatória; tempo de observação.

---

## Caso 8 — Meningite / choque séptico
**Identificação:** Gabriel, 4 anos, **16 kg**. Sala de emergência.
**História:** febre há 12 h, vômitos, sonolência, manchas na pele.
**Exame / vitais:** petéquias e púrpura, rigidez de nuca, TEC 4 s, extremidades frias. FC 170 · FR 36 · **PA 80/40** · SpO2 94% · Tax 39,5 °C · Glasgow 12 · glicemia 70 mg/dL.
**Hipótese:** meningite / doença meningocócica com choque séptico.

**Prescrição esperada:**
1. **O2** em máscara.
2. Dieta: jejum.
3. **SF 0,9%** 20 mL/kg (item 1) = **320 mL** em 5–20 min; reavaliar após cada bolus (até 40–60 mL/kg na 1ª hora, se não houver sinais de sobrecarga).
4. Manutenção após estabilizar (Holliday): 1000 + 6 × 50 = 1300 mL/dia = **54 mL/h** (composição A VALIDAR).
5. **Ceftriaxona** 100 mg/kg/dia (item 9) = 1.600 mg/dia → **800 mg 12/12 h**. Frasco 1 g + 10 mL de água destilada = 100 mg/mL → **8 mL**.
6. **Dexametasona** 0,15 mg/kg/dose 6/6 h (item 33) = **2,4 mg = 0,6 mL**, antes ou junto com o 1º antibiótico. Indicação na doença meningocócica A VALIDAR.
7. **Vancomicina** (se houver suspeita de pneumococo resistente, conforme protocolo; A VALIDAR): 60 mg/kg/dia (item 12) = **240 mg 6/6 h**. Diluir a ≤ 5 mg/mL (≥ 48 mL) e infundir em ≥ 60 min.
8. **Dipirona** 10–25 mg/kg (item 23), ex.: 20 mg/kg = 320 mg = **0,64 mL** (500 mg/mL). Cuidado: EV pode baixar a PA.
9. **Choque que não melhora com volume → adrenalina contínua** 0,05–1 mcg/kg/min (item 34):
   - Solução: 1 mg (1 mL) + 99 mL de SF = **10 mcg/mL**.
   - Para 0,1 mcg/kg/min: 0,1 × 16 × 60 ÷ 10 = **9,6 mL/h**.
10. **Choque refratário às catecolaminas → hidrocortisona** até 50 mg/m²/dia (item 28). Superfície corporal ≈ (4 × 16 + 7) ÷ (16 + 90) = **0,67 m²** → 33,5 mg/dia ≈ **8,4 mg 6/6 h**.
11. Exames: hemocultura, hemograma, PCR, procalcitonina, lactato, gasometria, eletrólitos, glicemia, coagulograma. **Líquor só depois de estabilizar.**
12. Cuidados: **isolamento de gotículas** por 24 h de antibiótico; quimioprofilaxia dos contatos (medicação fora do MVP).
13. **SINAN: meningite / doença meningocócica — notificação imediata.**

**Evolução:**
- Acerto: após 2 bolus + antibiótico, TEC 2 s, FC 130, PA 95/55.
- Punção lombar com o paciente instável: alerta.
- Sem volume: PA cai, lactato sobe, Glasgow cai.
- Volume em excesso: estertores, fígado aumenta, SpO2 cai (sobrecarga).

**Pontos de ensino:** reavaliação após cada bolus; conta de infusão contínua em mcg/kg/min → mL/h; superfície corporal.

---

## Caso 9 — Anafilaxia
**Identificação:** Beatriz, 14 anos, **50 kg**. Pronto-socorro.
**História:** comeu camarão há 20 min.
**Exame / vitais:** urticária generalizada, edema de lábios, sibilância, tontura. FC 130 · FR 30 · **PA 80/50** · SpO2 92%.
**Hipótese:** anafilaxia.

**Prescrição esperada:**
1. **Adrenalina IM** 0,01 mg/kg da 1:1.000 (item 34) = 0,5 mg → **0,5 mL IM no vasto lateral da coxa** (máximo no adolescente 0,5 mg). Repetir em 5–15 min se não melhorar.
2. Deitar com as pernas elevadas; **O2**.
3. **SF 0,9%** 20 mL/kg = **1000 mL** rápido.
4. **Salbutamol** spray, máximo de 10 jatos, para o broncoespasmo (item 24).
5. **Metilprednisolona** 1–2 mg/kg (item 29) = **50–100 mg** EV (máx 125 mg). Ajuda contra a reação tardia, não substitui a adrenalina.
6. Anti-histamínico: fora da lista do MVP.
7. Cuidados: observar ≥ 4–6 h pelo risco de reação bifásica (tempo A VALIDAR).

**Evolução:**
- Adrenalina IM na hora: PA 105/65, SpO2 96% em 10 min.
- Corticoide ou anti-histamínico **antes** da adrenalina: piora (PA 70/40).
- Adrenalina 1:1.000 EV em bolus: taquicardia ventricular (erro grave).
- Via SC: resposta lenta.

**Alta:** evitar o alimento, plano de ação por escrito, prescrição de autoinjetor de adrenalina, encaminhar ao alergista.

**Pontos de ensino:** adrenalina IM primeiro; diferença entre 1:1.000 e 1:10.000.

---

## Caso 10 — Cetoacidose diabética (CAD)
**Identificação:** Rafael, 12 anos, **38 kg**. Sala de emergência.
**História:** poliúria, polidipsia e emagrecimento há 3 semanas; vômitos hoje.
**Exame / vitais:** desidratado (~10%), respiração de Kussmaul, hálito cetônico. FC 128 · FR 34 · PA 104/64 · SpO2 98% · Glasgow 15.
**Exames:** **glicemia 480 mg/dL**, pH 7,05, bicarbonato 6, K 5,2, Na 131, cetonemia positiva.
**Hipótese:** cetoacidose diabética grave (abertura de diabetes tipo 1).

**Prescrição esperada:**
1. Dieta: jejum.
2. **SF 0,9%** 10–20 mL/kg em 1 h (item 1) = **380–760 mL**.
3. Reposição do déficit em 24–48 h (cálculo e tipo de soro A VALIDAR com o ISPAD).
4. **Insulina regular** contínua 0,05–0,1 UI/kg/h (item 39), **sem bolus**, iniciando 1–2 h depois do início da hidratação:
   - Solução 50 UI em 50 mL de SF = 1 UI/mL → 0,1 UI/kg/h = 3,8 UI/h = **3,8 mL/h**.
5. **KCl** no soro assim que K < 5,5 e houver diurese: ex. 40 mEq/L → em 500 mL = 20 mEq = **7,8 mL de KCl 19,1%** (2,56 mEq/mL, item 7). Nunca em bolus.
6. **SG 5%** no soro quando a glicemia chegar a 250–300 mg/dL (valor A VALIDAR).
7. Exames: glicemia capilar 1/1 h; gasometria e eletrólitos a cada 2–4 h; cetonemia.
8. Cuidados: balanço hídrico, avaliação neurológica 1/1 h.

**Evolução:**
- Acerto: após 6 h, pH 7,20, glicemia 250, K 4,0.
- Insulina em bolus, glicemia caindo rápido demais ou volume excessivo: **edema cerebral** (dor de cabeça, bradicardia, hipertensão, Glasgow caindo).
- Sem potássio: K 2,8, onda U no ECG, arritmia.
- Bicarbonato EV sem indicação: aviso.

**Pontos de ensino:** sódio corrigido = Na + 1,6 × (glicemia − 100) ÷ 100 = 131 + 1,6 × 3,8 ≈ **137**; potássio cai com a insulina.

---

## Caso 11 — Taquicardia supraventricular (TSV)
**Identificação:** Davi, 4 meses, **6 kg**. Pronto-socorro.
**História:** irritado, recusando mamadas, pálido há algumas horas.
**Exame / vitais:** **FC 260**, QRS estreito, sem onda P visível. FR 50 · PA 80/50 · SpO2 96% · TEC 3 s.
**Hipótese:** TSV com estabilidade hemodinâmica.

**Prescrição esperada:**
1. Monitor, acesso venoso, **manobra vagal** (gelo na face).
2. **Adenosina** (item 36): 1ª dose 0,1 mg/kg = **0,6 mg**; 2ª dose 0,2 mg/kg = **1,2 mg**.
   - Rediluição: 1 mL (3 mg) + 9 mL de SF = 0,3 mg/mL → 1ª dose **2 mL**; 2ª dose **4 mL**.
   - Bolus **rápido**, seguido de flush de SF (técnica das duas seringas), em acesso próximo ao coração.
3. Se ficar instável (hipotensão, má perfusão): cardioversão sincronizada 0,5–1 J/kg = 3–6 J (A VALIDAR PALS).

**Evolução:**
- Acerto: breve pausa no monitor e ritmo sinusal com FC 140.
- Adenosina lenta ou sem flush: não reverte.
- Demora de horas: insuficiência cardíaca (fígado aumenta, TEC 4 s).

**Pontos de ensino:** rediluição para medir volumes muito pequenos; a adenosina age em segundos.

---

## Caso 12 — PCR em fibrilação ventricular
**Identificação:** Igor, 8 anos, **25 kg**. Sala de emergência (trazido pelo SAMU em RCP).
**História:** caiu de repente na aula de educação física.
**Monitor:** **fibrilação ventricular**, sem pulso.
**Hipótese:** PCR em ritmo chocável.

**Conduta / prescrição esperada (PALS; A VALIDAR com a versão vigente):**
1. RCP de alta qualidade.
2. **Desfibrilação** 2 J/kg = **50 J**; depois 4 J/kg = **100 J**.
3. **Adrenalina** 0,01 mg/kg (item 34) = **0,25 mg = 2,5 mL da 1:10.000** EV/IO, a cada 3–5 min.
   - 1:10.000 = 1 mL da ampola 1 mg/mL + 9 mL de SF.
4. **Amiodarona** 5 mg/kg (item 35) = **125 mg = 2,5 mL** (50 mg/mL) em bolus, após o 3º choque; pode repetir até 15 mg/kg.
5. Procurar causas reversíveis.

**Evolução:**
- Sequência correta: retorno da circulação após o 3º ou 4º ciclo (ritmo sinusal, FC 120, PA 90/50).
- Adrenalina 1:1.000 (dose 10 vezes maior): alerta de erro grave.
- Choque atrasado: a FV fica mais fina e a chance de sucesso cai.

**Pontos de ensino:** preparo da 1:10.000; energia por kg; ordem dos fármacos.

---

## Caso 13 — Hipoglicemia grave sem acesso venoso
**Identificação:** Clara, 9 anos, **30 kg**, diabetes tipo 1 em uso de insulina. Pronto-socorro.
**História:** aplicou insulina e não almoçou; chegou convulsionando.
**Exame / vitais:** convulsão, sem acesso venoso após 2 tentativas. **Glicemia capilar 32 mg/dL**. FC 120 · SpO2 95%.

**Prescrição esperada:**
1. **Glucagon** IM (item 38): ≥ 25 kg → **1 mg**.
2. Quando houver acesso: **glicose** 0,5–1 g/kg (itens 3 e 4). Para 0,5 g/kg = 15 g: com SG 10%, 5 mL/kg = **150 mL**; com glicose 25%, 2 mL/kg = **60 mL**.
3. Depois: soro com SG 10% e glicemia capilar de 30/30 min até estabilizar.
4. Cuidados: dieta assim que acordar; revisar o esquema de insulina.

> Nota: as doses do rascunho (0,5–1 g/kg) dão volumes grandes; a dose ideal e a velocidade de infusão são **A VALIDAR** com PALS/ISPAD.

**Evolução:** glucagon → glicemia 70 em 10–15 min e a convulsão para. Sem tratamento → convulsão continua.

**Pontos de ensino:** alternativa quando não há acesso; conversão entre g/kg e mL/kg por concentração.

---

## Caso 14 — Intoxicação por benzodiazepínico
**Identificação:** Tiago, 3 anos, **14 kg**. Pronto-socorro.
**História:** encontrado com a cartela de clonazepam da avó há 1 h. Sem outros remédios em casa.
**Exame / vitais:** sonolento, responde à dor. FR 14 · SpO2 92% · FC 100 · PA 90/60 · pupilas normais.
**Hipótese:** intoxicação exógena por benzodiazepínico.

**Prescrição esperada:**
1. Prioridade: via aérea, O2, monitorização.
2. **Flumazenil** 0,01 mg/kg (item 37) = **0,14 mg = 1,4 mL** (0,1 mg/mL) em 15 s; repetir a cada 1 min até o total de 0,05 mg/kg = **0,7 mg**.
   - Não usar se houver suspeita de ingestão de antidepressivo tricíclico ou se a criança usa benzodiazepínico de forma crônica (risco de convulsão).
3. Contato com o Centro de Informação Toxicológica (CIATox).
4. Observar: o efeito do flumazenil é mais curto que o do clonazepam (sedação volta).
5. **SINAN: intoxicação exógena.**

**Evolução:** flumazenil → acorda, FR 22, SpO2 97%; após ~1 h volta a sonolência se não for observado.

**Pontos de ensino:** antídoto não substitui suporte; contraindicações.

---

## Caso 15 — Hiponatremia com convulsão
**Identificação:** Helena, 10 meses, **8 kg**. Sala de emergência.
**História:** diarreia há 3 dias; mãe ofereceu muita água e chá.
**Exame / vitais:** **convulsão generalizada** há 5 min. FC 150 · FR 40 · SpO2 94%. **Na 118 mEq/L**, glicemia 90.
**Hipótese:** hiponatremia hipotônica sintomática grave.

**Prescrição esperada:**
1. O2, posição lateral, via aérea.
2. **NaCl 3%** 2–5 mL/kg em 10–20 min (item 8), ex.: 3 mL/kg = **24 mL**; repetir se continuar convulsionando.
   - Preparo de 100 mL de NaCl 3%: **15 mL de NaCl 20% + 85 mL de água destilada**.
3. Depois: correção lenta. mEq de Na = (Na desejado − Na atual) × 0,6 × peso → para subir de 118 para 125: 7 × 0,6 × 8 = **33,6 mEq**. **Não subir mais que 8–10 mEq/L em 24 h.**
4. Soro de manutenção (Holliday): 8 kg × 100 = **800 mL/dia = 33 mL/h**, isotônico; NaCl 20% (3,4 mEq/mL) acrescentado conforme a oferta desejada (A VALIDAR).
5. Exames: sódio de 2/2–4/4 h, potássio, gasometria, glicemia.

**Evolução:**
- Acerto: convulsão para em minutos; Na 122 após o bolus.
- Correção rápida demais (> 10–12 mEq/L em 24 h): alerta de desmielinização osmótica.
- Anticonvulsivante sem corrigir o sódio: a convulsão continua.

**Pontos de ensino:** diferença entre SF, NaCl 20% e NaCl 3%; preparo do 3%; limite de correção.

---

## Caso 16 — Crise adrenal (hiperplasia adrenal congênita)
**Identificação:** Bruno, 5 anos, **18 kg**, hiperplasia adrenal congênita em uso de hidrocortisona oral. Pronto-socorro.
**História:** febre e vômitos há 1 dia; não conseguiu tomar os remédios.
**Exame / vitais:** letárgico, desidratado. FC 150 · **PA 70/40** · FR 30 · Tax 38,5 °C. **Na 124, K 6,2, glicemia 50.**
**Hipótese:** crise adrenal.

**Prescrição esperada:**
1. **Hidrocortisona** EV em bolus (item 28): 3–12 anos → **50 mg**. Depois 50–100 mg/m²/dia 6/6 h: superfície ≈ (4 × 18 + 7) ÷ (18 + 90) = **0,73 m²** → 36,5–73 mg/dia ≈ **9–18 mg 6/6 h**.
2. **SF 0,9%** 20 mL/kg = **360 mL**, reavaliar.
3. **Hipoglicemia:** glicose 0,5 g/kg = 9 g = **90 mL de SG 10%** (dose A VALIDAR, item 3).
4. Hipercalemia: monitor de ECG; **gluconato de cálcio** (item 6) só se houver alteração no ECG. O K costuma cair com a hidrocortisona e o volume.
5. Exames: eletrólitos, glicemia, gasometria.

**Evolução:**
- Acerto: PA 95/60, glicemia 90, criança mais ativa em 1–2 h.
- Só volume, sem hidrocortisona: melhora curta e volta a hipotensão.
- Hidrocortisona atrasada: choque refratário.

**Alta:** orientar a **dose de estresse** oral em doença (quanto aumentar: A VALIDAR); reposição oral com hidrocortisona (ou cortisona / prednisona conforme a equivalência — itens 30 e 31, A VALIDAR com endocrinologia pediátrica).

**Pontos de ensino:** reconhecer a crise adrenal; dose de estresse; superfície corporal.

---

## O que o usuário precisa validar (resumo)
1. Todas as doses (vêm do `doses-rascunho.md`).
2. Reconstituições dos frascos (ampicilina, penicilina cristalina, ceftriaxona, raltegravir) com as bulas e apresentações da Santa Casa.
3. Alvos de SpO2, tempos de infusão de bolus, tempos de observação.
4. Critérios do MS para sífilis congênita (procaína × benzatina) e para a profilaxia do HIV.
5. Fichas de notificação do SINAN de cada caso.
6. Se os sinais vitais iniciais e as reações descritas são realistas.
