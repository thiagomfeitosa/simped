# Variáveis do paciente (regra obrigatória)

> **Regra do projeto:** todo paciente do simulador tem **sempre** as variáveis abaixo, e toda regra de dose, contraindicação ou alerta pode depender de qualquer uma delas.
> Exemplos reais de dependência: gentamicina (IG + dias de vida), penicilina cristalina (12/12 h até 7 dias de vida, depois 8/8 h), glucagon (peso), ipratrópio (idade em anos), dipirona (< 3 meses ou < 5 kg), ceftriaxona (≤ 28 dias com cálcio EV), raltegravir (semana de vida + IG + peso).

## 1. Princípio: uma fonte, várias unidades
Para não haver contradição (ex.: "5 dias" num lugar e "2 semanas" em outro), o programa guarda **apenas os dados de origem** e **calcula** o resto:

| Dado de origem (digitado no caso) | O que o programa calcula a partir dele |
|---|---|
| **Data e hora do nascimento** | Idade em **horas, dias, semanas, meses e anos** |
| **Data e hora atual do cenário** (relógio do caso) | Idade que **avança** com o tempo do caso (a posologia muda sozinha quando o RN completa 7 dias, por exemplo) |
| **Idade gestacional ao nascer** (semanas + dias) | Idade pós-menstrual, idade corrigida, classificação do RN |

Assim, corrigir um dado de origem atualiza tudo, sem quebrar o resto.

## 2. Idade
| Variável | Unidade | Quando é usada |
|---|---|---|
| Idade em **horas** | h | Primeiras horas/dias de vida: hipoglicemia, bilirrubina (nomograma por horas de vida), início da profilaxia do HIV |
| Idade em **dias** | d | Período neonatal (0–28 dias), intervalos de antibiótico no RN |
| Idade em **semanas** | sem | Raltegravir, lactentes jovens |
| Idade em **meses** | m | Lactentes; restrições de bula (ex.: "< 3 meses") |
| Idade em **anos** | a | Crianças e adolescentes; doses por faixa etária |

## 3. Idade gestacional (neonatologia)
| Variável | Definição |
|---|---|
| **IG ao nascer** | Semanas + dias de gestação no nascimento (ex.: 34s 3d) |
| **Idade pós-menstrual** | IG ao nascer + idade cronológica (ex.: nasceu com 30s, tem 4 semanas de vida → 34 semanas) |
| **Idade corrigida** | Idade cronológica − (40 semanas − IG ao nascer). Usada no prematuro até ~2–3 anos (limite A VALIDAR) |

Classificação automática do RN:
- Pela IG: **pré-termo** (< 37s), **termo** (37s–41s6d), **pós-termo** (≥ 42s). Subdivisões do pré-termo A VALIDAR.
- Pelo peso ao nascer: **baixo peso** (< 2.500 g), **muito baixo peso** (< 1.500 g), **extremo baixo peso** (< 1.000 g).
- Peso × IG: **PIG / AIG / GIG** (curva de referência, ex.: Intergrowth-21st ou Fenton, A VALIDAR).

## 4. Medidas do corpo
| Variável | Unidade | Observação |
|---|---|---|
| **Peso atual** | kg (RN também em g) | Base da maioria das doses |
| **Peso ao nascer** | g | Classificação do RN; algumas doses neonatais |
| Estatura / comprimento | cm | Para a superfície corporal |
| Perímetro cefálico | cm | RN e lactentes |
| **Superfície corporal** | m² | Calculada: Mosteller (com estatura) ou (4 × peso + 7) ÷ (peso + 90) sem estatura |
| Peso ideal / peso de dosagem | kg | Adolescente com obesidade; regra de uso A VALIDAR por medicação |

## 5. Faixa etária (calculada)
- **RN:** 0–28 dias · **Lactente:** 29 dias a < 2 anos · **Pré-escolar:** 2 a < 7 anos · **Escolar:** 7 a < 10 anos · **Adolescente:** 10–19 anos (OMS) ou 12–18 anos (ECA).
- ⚠️ O `doses-rascunho.md` usa "criança = lactente a 11 anos; adolescente = 12 a 18 anos". Qual corte usar: **A VALIDAR com o usuário**. As doses do banco sempre usam idade/peso em números, não o nome da faixa; o nome serve só para exibir.

## 6. Outras variáveis clínicas
| Variável | Por que importa |
|---|---|
| Sexo | Curvas de crescimento, alguns valores de referência |
| Alergias | Bloqueio/alerta de prescrição |
| Função renal (creatinina, diurese, clearance estimado) | Ajuste de dose (gentamicina, vancomicina, aciclovir) |
| Função hepática | Ajuste de dose |
| Gestante / puérpera / amamentando (adolescente) | Contraindicações |
| Medicações em uso | Interações (ex.: ceftriaxona + cálcio no RN) |
| Condições de base (HIV, anemia falciforme, cardiopatia, HAC, DM1…) | Escolha de tratamento e profilaxias |

## 7. Dados maternos (para o RN)
Tipo sanguíneo, sorologias (sífilis/VDRL, HIV e carga viral, hepatite B, toxoplasmose, outras TORCHS), diabetes gestacional, bolsa rota (horas), febre materna, estreptococo do grupo B, tratamentos feitos na gestação, uso de drogas.

## 8. Configuração do hospital (não é do paciente, mas entra nas contas)
Fator de correção da BIC (Santa Casa = volume final de 12 mL), apresentações disponíveis, protocolos locais.
