# Ideias para implementar (banco de ideias)

> Lista sugerida pelo assistente em out/2026. **Situação: TODAS (I1–I21) implementadas** a pedido do usuário, com testes.
> Como testar cada uma: `docs/fase-1/guia-das-funcionalidades.md`. Dados provisórios criados: `docs/a-validar-dados-novos.md`.
> Regra para todas: onde precisar de dado clínico (dose, apresentação, valor normal, limite de alarme), usar **valor fictício marcado "A VALIDAR"**, num arquivo de dados separado, para o usuário trocar depois sem mexer no resto.

Legenda da coluna "Dado do usuário": **nenhum** = só contas/tela, dá para fazer completo agora; **depois** = funciona já com valor fictício e o usuário corrige quando mandar os dados.

## A. Paciente e relógio do caso

| Código | Ideia | O que o aluno vê | Dado do usuário |
|---|---|---|---|
| I1 | Ficha com as variáveis obrigatórias (`docs/fase-0/variaveis-paciente.md`) | Data/hora de nascimento, IG, peso ao nascer → o programa calcula idade em horas/dias/semanas/meses/anos, idade pós-menstrual, idade corrigida, superfície corporal e classificação do RN (pré-termo, baixo peso etc.). Hoje a ficha só tem "idade em texto". | nenhum (pontos de corte já estão em `faixas-etarias.md`, A VALIDAR) |
| I2 | Relógio do caso | Pausar, 1×, 10×, 60×, "pular 1 h". A idade avança junto; uma regra que muda com a idade (ex.: RN completou 7 dias) passa a valer sozinha. | nenhum |
| I3 | Os 16 casos de `casos-clinicos.md` jogáveis | Menu de casos na aba Prescrever; cada caso com história, sinais e reações às medicações. | depois (reações fictícias) |
| I4 | Editor de casos (sem programar) | Tela para escrever história, sinais, evolução e reações e salvar num arquivo. | o usuário preenche quando quiser |

## B. Folha de prescrição

| Código | Ideia | O que o aluno vê | Dado do usuário |
|---|---|---|---|
| I5 | Diluição, rediluição e BIC no item de medicação (já era o próximo passo) | Etapas C1×V1 = C2×V2, mL/h e seringa com volume final do hospital, conferidas pelo motor de cálculo. | depois (apresentações) |
| I6 | Montador de soro de manutenção | Aluno escolhe volume, SG 5%/10%, glicose 50%, NaCl 20%, KCl → o programa mostra em tempo real VIG, Na e K (mEq/kg/dia), mL/h e gotas/min. | depois (concentrações e faixas-alvo) |
| I7 | Aprazamento (horários) | 8/8h vira 06–14–22; a enfermagem "checa" cada dose; dose atrasada ou esquecida aparece; o paciente só reage à dose checada. | depois (horário padrão do hospital) |
| I8 | Alertas de segurança | Alergia do paciente, medicação repetida, incompatibilidade (ex.: ceftriaxona + cálcio no RN), concentração máxima em veia periférica, velocidade máxima. | depois (regras dos alertas) |
| I9 | Receita de alta / ambulatorial | Receita simples e de controle especial, dose em mL/gotas, duração, quantos frascos comprar. | depois (apresentações orais) |
| I10 | Imprimir / salvar em PDF a prescrição do aluno | Folha impressa com o aviso de treinamento e os selos "A VALIDAR". | nenhum |
| I11 | Tela de Configurações | Fonte (SBP/MS/AAP), hospital (volume final da BIC, horários), modo treino × modo prova (esconde o gabarito), margem de arredondamento. | nenhum (usa os valores provisórios) |

## C. Monitor e exames (prévia simples, 2D, das Fases 2–3)

| Código | Ideia | O que o aluno vê | Dado do usuário |
|---|---|---|---|
| I12 | Monitor 2D | ECG e pletismografia desenhados correndo na tela, números atualizando, alarme com som quando sai do limite para a idade. | depois (limites por idade) |
| I13 | Exames que "chegam" depois | Aluno pede na seção 7; o resultado aparece X minutos depois no relógio do caso; valores vêm do arquivo do caso. | depois (valores por caso) |
| I14 | Gasometria com leitura guiada | Resultado + passo a passo: pH → distúrbio primário → compensação → ânion gap. | depois (valores de referência) |
| I15 | Balanço hídrico e diurese | Entradas (soro, dieta, medicações) − saídas → diurese em mL/kg/h. | nenhum |

## D. Estudo e progresso

| Código | Ideia | O que o aluno vê | Dado do usuário |
|---|---|---|---|
| I16 | Treino de contas infinito | O programa sorteia exercícios com números inventados (volume a aspirar, reconstituição, VIG, BIC, gotas/min) e corrige na hora. Só matemática, não usa dose real. | nenhum |
| I17 | Aba "Calculadoras" | Superfície corporal, Holliday-Segar, VIG, idade pós-menstrual/corrigida, conversões (mg↔mcg, mEq), reaproveitando `src/calculos/`. | nenhum |
| I18 | Relatório final do caso | Tempo até a primeira dose, erros por tipo (conta, unidade, via, seção), checklist de condutas esperadas; histórico salvo no computador (sem internet). | depois (checklist de cada caso) |

## E. Para facilitar a parte do usuário (dados)

| Código | Ideia | O que muda | Dado do usuário |
|---|---|---|---|
| I19 | Importador da planilha | O usuário preenche apresentações/doses no Excel (modelo pronto) e o programa converte direto para o banco, sem digitação à mão. | a planilha que o usuário já vai preparar |
| I20 | Tela "Banco de medicações" | Lista das 89 medicações com status (A VALIDAR / CONFERIDO), fonte e o que falta: vira o checklist da validação. | nenhum |
| I21 | Abrir com dois cliques (Electron) | App no Mac/Windows sem Terminal e sem `npm run dev`. | nenhum |

## Ordem em que foram feitas
I1 → I2 → I11 → I5 → I6 → I7 → I8 → I9 → I10 → I12 → I13/I14 → I15 → (banco do rascunho) → I3/I18 → I4 → I16/I17 → I19/I20 → I21.

## Ordem sugerida originalmente
1. **I1 + I2** — base que as regras de dose precisam (idade em horas/dias, IG); não depende de dado do usuário.
2. **I5** — coração do objetivo (diluição, rediluição, BIC).
3. **I19 + I20** — deixam tudo pronto para quando os dados chegarem.
4. **I16** — rápido de fazer e já serve para estudar.
