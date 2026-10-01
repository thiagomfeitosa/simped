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
- **Banco de medicações (molde)** em `src/dados/medicacoes/`: `tipos.ts` (formato), `consulta.ts` (escolha da fonte com queda para SBP, verificador de integridade; só valor CONFERIDO corrige o aluno), `exemplos-a-validar.ts` (adrenalina, dipirona, ceftriaxona copiadas do rascunho, TUDO A VALIDAR).
- **App único com duas abas** (React + Vite, `npm run dev`; como rodar: `README.md`). A barra do topo fica em `src/App.tsx` e a aba escolhida vai no endereço (`#passo-a-passo` / `#prescrever`). As duas telas ficam abertas ao mesmo tempo: trocar de aba não perde o que o aluno fez. Os estilos de cada aba são separados (`src/componentes/passo-a-passo/estilos.css` é a base; `src/telas/estilos-prescrever.css` vale só dentro de `.modo-prescrever`).
- **Aba "Passo a passo"** (`src/componentes/passo-a-passo/`, roteiros em `src/dados/roteiros/`, fórmulas próprias em `src/logica/`): trilha de setas, animações (avançar/voltar, setas do teclado), explicação, rascunho e folha preenchidos etapa a etapa. Detalhes e como criar roteiros: `docs/passo-a-passo.md`.
  - Roteiros (menu agrupado por tema): **Neonatologia** — RN com sepse, icterícia neonatal (fototerapia); **Distúrbios hidroeletrolíticos** — desidratação grave (Plano C + soro 4:1 com KCl + reposição), hiponatremia com convulsão (NaCl 3% do 20%, teto 24 h), hipocalemia (KCl, concentração e velocidade); **Emergência** — adrenalina 1:10.000. Doses todas "A VALIDAR"; lista para conferir: `docs/roteiros-a-validar.md`.
  - Todo roteiro termina na etapa automática **"Prescrição com os cálculos"** (folha completa + contas de cada item, imprimível).
  - Contas animadas devagar, com **desfazer/refazer por conta**; seletor de velocidade das animações (Devagar/Normal/Rápido).
  - Pendente: roteiro de rediluição (aguarda apresentações da Santa Casa); hipercalemia/hipocalcemia; hipernatremia; infusão contínua; escolha de fonte (SBP × AAP 2022) nos limiares de icterícia.
- **Aba "Prescrever"** (`src/telas/Prescrever.tsx`): painel do paciente removível com sinais vitais, folha de prescrição nas 9 seções (itens em texto livre ou de medicação, numerados pela ordem da folha; estado em `src/prescricao/estado.ts`), rascunho de cálculos, aviso de treinamento.
- **Item de medicação estruturado** (seções 4–6, botão "+ medicação"): medicação → apresentação → indicação → dose → reconstituição (pó) → volume → via → intervalo; botões "Conferir" e "Administrar" (manda a dose para o motor do paciente). A conta do volume é sempre conferida; dose/via/intervalo só corrigem com valor CONFERIDO. Regras e decisões provisórias em `docs/fase-1/item-de-medicacao.md`; lógica em `src/prescricao/itemMedicacao.ts`.
- **Motor do paciente** em `src/motor/paciente.ts`: estado + eventos (tempo passa, medicação administrada, professor altera sinais); o paciente é recalculado a partir da lista de eventos. Os efeitos vêm do arquivo do caso (`evolucaoNatural`, `respostas`), nunca do motor. Caso atual: `src/casos/demonstracao.ts` (fictício, A VALIDAR).
- Usuário decidiu **adiar a planilha de apresentações** e avançar o código primeiro.
- Pendente com o usuário: margem de arredondamento aceita na correção (provisório: 1%), ver `formulas.md` item 8.
- Pendente com o usuário (item de medicação): deslocamento do pó na reconstituição, conversão gotas ↔ mL, mostrar ou esconder o gabarito ("modo prova").
- Duplicações a resolver (vieram de duas linhas de trabalho paralelas): fórmulas em `src/logica/calculos.ts` (passo a passo) e em `src/calculos/` (prescrever); lista de seções da folha em `src/dados/secoes.ts` e em `src/prescricao/secoes.ts`. Unificar numa tarefa própria, com os testes das duas.
- **Tudo unificado no ramo principal** (casos clínicos + passo a passo + prescrever), em out/2026. O ramo `claude/stoic-hamilton-t3fhgb` (primeiro esqueleto do app) ficou de fora: foi substituído.
- Próximo passo (código): diluição, rediluição e BIC dentro do item de medicação (etapas C1×V1 = C2×V2, infusão contínua em mL/h e seringa com volume final do hospital), conferidas pelo motor de cálculo. Depois: casos clínicos reais e preenchimento do banco.
