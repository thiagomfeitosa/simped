# SimPed — Simulador de Prescrição em Emergências Pediátricas

## Sobre o usuário
- O dono do projeto é médico/estudante de medicina e **não sabe programar**.
- Explique tudo em **português**, com linguagem simples, sem jargão técnico desnecessário.
- Antes de mudanças grandes, explique o plano em poucas linhas. Depois de cada entrega, diga **como testar** (o que clicar, o que deve aparecer).
- Trabalhe em passos pequenos e testáveis. Nunca deixe o app quebrado ao final de uma tarefa.

## Objetivo do software
Treinar prescrição hospitalar e ambulatorial em emergências pediátricas (RN, criança, adolescente). O aluno deve escrever a medicação, apresentação, dose, posologia, cálculos de diluição, rediluição e rediluição com fator de correção da BIC (configurável por hospital), e ver em tempo real o efeito no paciente.

## Ordem da folha de prescrição
1. Identificação do paciente
2. Oxigenoterapia (se aplicável)
3. Dieta
4. Reposição volêmica, glicose e eletrólitos (inclui correções de Na/K)
5. Antibióticos / antiparasitários / ARV
6. Demais medicações
7. Exames solicitados
8. Orientações / cuidados
9. Notificação SINAN (se aplicável)

## Elementos principais
- Painel removível do paciente (RN / criança / adolescente) com evolução do caso.
- Painel de medicação selecionada (apresentação, diluição, aplicação animadas).
- Rascunho de cálculos (texto livre) + prancheta com folha oficial de prescrição.
- Monitorização: ECG (monitor e papel impresso), SpO2 com pletismografia, FC, FR, padrão respiratório, PA, glicemia capilar/sérica, temperatura (axilar, retal, oral), gasometria arterial/venosa.
- Carrinho de parada interativo com gavetas.
- Laboratório: bilirrubinômetro transcutâneo arrastável (glabela/esterno), bilirrubinas, hemograma, TORCHS, PCR/VHS, procalcitonina, albumina, G6PD, teste do pezinho, teste do coraçãozinho, enzimas cardíacas.
- Imagem: RX, TC, RM, USG (POCUS, transfontanela, ecocardiograma).
- Futuro: modo online professor–aluno (professor vê tudo e altera cenários em tempo real).

## Stack técnico (decidido)
- React + TypeScript (Vite)
- 3D: Three.js via React Three Fiber (+ drei)
- Traçados (ECG, pleth): Canvas/SVG
- Desktop (macOS/Windows): Electron
- Mobile (iOS/Android): Capacitor
- Online (fase futura): Node.js + WebSockets + PostgreSQL
- Um único código-fonte para todas as plataformas.

## Arquitetura (princípios)
- **Lógica clínica separada da interface**: fórmulas de dose/diluição/BIC e o motor fisiológico ficam em módulos puros de TypeScript, sem dependência de telas, com testes automatizados (Vitest).
- **Banco de medicações em arquivos de dados** (JSON/TS), não espalhado pelo código: nome, apresentações, concentração, faixas de dose por peso/idade, dose máxima, diluentes compatíveis, velocidade de infusão, fonte.
- **Motor do paciente como estado + eventos** (medicação administrada, tempo passando, intervenção do professor), pensado desde já para permitir o modo online depois.
- **Offline primeiro**: nada deve depender de internet na fase inicial.
- **Variáveis do paciente obrigatórias** (detalhes em `docs/fase-0/variaveis-paciente.md`): todo paciente tem sempre peso, data/hora de nascimento, idade gestacional ao nascer, peso ao nascer etc. O programa guarda só os dados de origem e **calcula** a idade em horas, dias, semanas, meses e anos, a idade pós-menstrual, a idade corrigida e a superfície corporal; a idade avança com o relógio do caso. Toda regra de dose pode depender de qualquer uma dessas variáveis.

## Segurança clínica
- Todo valor de dose/faixa deve registrar a **fonte** de referência no banco de dados.
- **Nunca inventar doses.** Quando não houver certeza, marcar o item como **"A VALIDAR"** e avisar o usuário.
- O app é para treinamento; exibir aviso de que **não substitui protocolos institucionais**.

## Roteiro de fases
- **Fase 0** — Lista fechada de 15–20 medicações do MVP + fórmulas documentadas + casos clínicos iniciais.
- **Fase 1** — MVP desktop offline 2D: ficha do paciente, sinais vitais numéricos, folha de prescrição completa, rascunho de cálculos, validação de doses, reação simples dos sinais vitais.
- **Fase 2** — Monitorização realista: ECG (monitor + papel), pletismografia, padrões respiratórios, gasometria.
- **Fase 3** — Laboratório interativo (bilirrubinômetro, hemograma, TORCHS, teste do coraçãozinho, etc.).
- **Fase 4** — Exames de imagem.
- **Fase 5** — 3D: frascos, ampolas, seringas, BIC, carrinho de parada, avatar do paciente, animações.
- **Fase 6** — Web + iOS/Android.
- **Fase 7** — Modo online professor–aluno.

## Fontes de referência
- Padrão: **SBP**. Opcionais e selecionáveis pelo usuário: **MS**, **AAP** e outras sociedades (neonatologia, AHA/PALS, NRP, GINA etc.). Detalhes em `docs/fase-0/fontes.md`.
- Escopo etário: neonatologia + pediatria + hebiatria.
- Biblioteca de fontes em `referencias/`: `catalogo.md` (códigos das fontes), `publicas/` (vai para o GitHub), `privado/` (livros com direitos autorais; fica só no Mac, ignorado pelo git), `trechos/` (tabelas transcritas com página).

## Como trabalhamos (economia de tokens)
- Uma conversa por tarefa (ex.: "Validar penicilinas", "Casos clínicos", "Fase 1 – folha de prescrição"). Ao terminar, atualizar a seção "Estado atual" deste arquivo e abrir conversa nova para a próxima tarefa.
- **Ao terminar a tarefa, juntar o ramo da conversa no ramo principal do GitHub** (`claude/busy-lamport-34608n`, o padrão do repositório), com testes passando. Autorizado pelo usuário: assim a próxima conversa já começa com tudo. Sem isso, o trabalho fica espalhado em ramos que as conversas novas não veem.
- Decisões e resultados ficam gravados em arquivos do projeto, não só no chat: uma conversa nova deve conseguir continuar lendo apenas este arquivo e `docs/`.
- Ler fontes pelo número de página; transcrever tabelas em `referencias/trechos/`.

## Estado atual
- Fase 0 concluída em rascunho (validação clínica pendente com o usuário). Documentos em `docs/fase-0/`:
  - `medicacoes-mvp.md`: lista definida pelo usuário (inclui cortisona, hidrocortisona e metilprednisolona, manter todas); faltam as apresentações (usuário vai levantar).
  - `fontes.md`: fontes e regra de escolha.
  - `doses-rascunho.md`: rascunho de apresentações e doses feito pelo assistente, TUDO "A VALIDAR" (usuário vai conferir nas fontes).
  - `formulas.md`: fórmulas; fator de correção da BIC da Santa Casa = volume final de 12 mL (medicação + SF completando até 12).
  - `apresentacoes-formulario.xlsx`: planilha para o usuário levantar as apresentações da Santa Casa (pré-preenchida com nome, seção e o rascunho do assistente como referência).
  - `casos-clinicos.md`: 16 casos iniciais escritos pelo assistente, TUDO "A VALIDAR" (doses tiradas do `doses-rascunho.md`). Dolutegravir ainda sem caso.
  - `medicacoes-ampliacao.md`: +50 medicações (códigos A1–A50) **aprovadas pelo usuário**; ainda sem doses e sem apresentações. Banco total: 89.
  - `variaveis-paciente.md`: variáveis obrigatórias do paciente (regra fixa), incluindo puberdade/Tanner.
  - `faixas-etarias.md`: pontos de corte (RN/neonato, lactente, criança, adolescente, IG, peso ao nascer) **por sociedade**. O nome da faixa segue a fonte escolhida (padrão SBP); as doses usam sempre números. Tabela A VALIDAR.
- Decisão do usuário: seguir em frente com os dados "A VALIDAR" como estão; a validação será feita depois. Por isso, tudo que é dado clínico (doses, apresentações, casos) deve ficar em arquivos de dados isolados, para ser corrigido sem mexer no resto do código, e cada item continua marcado "A VALIDAR" até o usuário conferir.
- **Motor de cálculo pronto** em `src/calculos/` (TypeScript + Vitest, `npm test`): dose por peso com dose máxima, volume a aspirar, reconstituição, diluição/rediluição em etapas, infusão contínua (por min ou por h), VIG, mistura de duas soluções, Holliday-Segar, seringa da BIC com volume final configurável (`src/dados/hospitais.ts`) e conferência da resposta do aluno. Testes usam números ilustrativos, não doses.
- **Banco de medicações** em `src/dados/medicacoes/`: `tipos.ts` (formato), `consulta.ts` (escolha da fonte com queda para SBP, condições por idade/IG/peso, verificador de integridade; só valor CONFERIDO corrige o aluno), `exemplos-a-validar.ts` + `rascunho-a-validar.ts` (as 39 do MVP copiadas do rascunho, TUDO A VALIDAR), `index.ts` (banco completo), `resumo.ts` (situação da validação e .csv).
- **Item de medicação** (seções 4–6): regras, preparo (diluição/BIC/infusão) e decisões provisórias em `docs/fase-1/item-de-medicacao.md`; lógica em `src/prescricao/itemMedicacao.ts` e `preparo.ts`. A conta é sempre conferida; dose/via/intervalo só corrigem com valor CONFERIDO.
- **App com 7 abas** (React + Vite, `npm run dev`; como rodar e como abrir com dois cliques: `README.md`). A barra do topo fica em `src/App.tsx` e a aba vai no endereço (`#prescrever`, `#banco`...). Todas as telas ficam abertas ao mesmo tempo (trocar de aba não perde nada). Estilos: `src/componentes/passo-a-passo/estilos.css` (base), `src/telas/estilos-prescrever.css` e `estilos-paginas.css` (dentro de `.modo-prescrever`).
- **Aba "Passo a passo"** (`src/componentes/passo-a-passo/`, roteiros em `src/dados/roteiros/`, fórmulas próprias em `src/logica/`): trilha de setas, animações, explicação, rascunho e folha preenchidos etapa a etapa. Detalhes: `docs/passo-a-passo.md`. Roteiros: RN com sepse, icterícia, desidratação grave, hiponatremia, hipocalemia, adrenalina 1:10.000 (doses "A VALIDAR", lista em `docs/roteiros-a-validar.md`). Pendente: rediluição, hipercalemia/hipocalcemia, hipernatremia, infusão contínua, fonte SBP × AAP na icterícia.
- **Ideias I1–I21 todas implementadas** (out/2026; lista em `docs/ideias.md`; como testar cada uma: `docs/fase-1/guia-das-funcionalidades.md`; dados provisórios criados: `docs/a-validar-dados-novos.md`). Em resumo:
  - **Aba Prescrever**: menu com os **16 casos** de `casos-clinicos.md` + demonstração (`src/casos/clinicos/`, um arquivo por caso, verificador em `src/casos/index.ts`); ficha com **variáveis calculadas** (`src/paciente/`); **relógio** que anda sozinho; regras de dose com **condições** (idade em h/d/m/a, IG, IPM, peso) e dose **por m²**; **monitor** com ECG/pleth e alarmes por idade; **item de medicação** com diluição/rediluição, seringa da BIC (volume final das Configurações) e infusão contínua; **soro** montado (VIG, Na, K, osmolaridade); **horários** da enfermagem (checar dose); **alertas** (alergia, repetida, interação, concentração máxima, potássio); **receita de alta**; **imprimir/PDF**; **exames** que chegam pelo relógio + **leitura guiada da gasometria**; **balanço hídrico**; **relatório** final com histórico.
  - **Abas Treino** (contas sem fim), **Calculadoras**, **Casos** (editor sem programar, casos guardados no computador), **Banco** (situação da validação, .csv do que falta, **importação da planilha** `.xlsx` sem internet) e **Configurações** (fonte, faixa, hospital, modo treino × prova, margem).
  - **Banco de medicações**: as 39 do MVP copiadas do `doses-rascunho.md` em `src/dados/medicacoes/rascunho-a-validar.ts` (tudo A VALIDAR; nada corrige o aluno); banco completo em `src/dados/medicacoes/index.ts`; apresentações importadas da planilha valem por cima (`ContextoBanco.tsx`).
  - **Dois cliques**: `npm run arquivo-unico` (gera `dist-arquivo/SimPed.html`), `npm run desktop` (Electron) e workflow manual `.github/workflows/instaladores.yml` (gera .dmg/.exe no GitHub).
- **Motor do paciente** em `src/motor/paciente.ts`: estado + eventos (tempo passa, medicação administrada, professor altera sinais, anotação); o paciente é recalculado a partir da lista de eventos. Os efeitos vêm do arquivo do caso (`evolucaoNatural`, `respostas`), nunca do motor.
- Usuário decidiu **adiar a planilha de apresentações** e avançar o código primeiro.
- Pendente com o usuário: margem de arredondamento aceita na correção (provisório: 1%), ver `formulas.md` item 8.
- Pendente com o usuário (item de medicação): deslocamento do pó na reconstituição; gotas/mL de cada frasco e dos equipos (`src/dados/equipos.ts`). O "modo prova" já existe em Configurações (padrão: treino).
- Duplicações a resolver (vieram de duas linhas de trabalho paralelas): fórmulas em `src/logica/calculos.ts` (passo a passo) e em `src/calculos/` (prescrever); lista de seções da folha em `src/dados/secoes.ts` e em `src/prescricao/secoes.ts`. Unificar numa tarefa própria, com os testes das duas.
- **Tudo unificado no ramo principal** (casos clínicos + passo a passo + prescrever), em out/2026. O ramo `claude/stoic-hamilton-t3fhgb` (primeiro esqueleto do app) ficou de fora: foi substituído.
- **Novas ideias para as bases** em `docs/ideias-bases.md` (códigos B1–B20, com ordem sugerida); o usuário escolhe quais fazer.
- Próximo passo: o usuário **validar os dados** (lista em `docs/a-validar-dados-novos.md` e o .csv da aba Banco) e **preencher a planilha** de apresentações (importa na aba Banco; depois uma conversa grava o .json no projeto). Código: unificar as duplicações acima; Fase 2 (traçado de FV/arritmias, padrões respiratórios).
