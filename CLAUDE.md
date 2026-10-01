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
4. Reposição volêmica e glicose
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
- Decisões e resultados ficam gravados em arquivos do projeto, não só no chat: uma conversa nova deve conseguir continuar lendo apenas este arquivo e `docs/`.
- Ler fontes pelo número de página; transcrever tabelas em `referencias/trechos/`.

## Estado atual
- Fase 0 em andamento. Documentos em `docs/fase-0/`:
  - `medicacoes-mvp.md`: lista definida pelo usuário (inclui cortisona, hidrocortisona e metilprednisolona, manter todas); faltam as apresentações (usuário vai levantar).
  - `fontes.md`: fontes e regra de escolha.
  - `doses-rascunho.md`: rascunho de apresentações e doses feito pelo assistente, TUDO "A VALIDAR" (usuário vai conferir nas fontes).
  - `formulas.md`: fórmulas; fator de correção da BIC da Santa Casa = volume final de 12 mL (medicação + SF completando até 12).
  - `apresentacoes-formulario.xlsx`: planilha para o usuário levantar as apresentações da Santa Casa (pré-preenchida com nome, seção e o rascunho do assistente como referência).
- **Motor de cálculo pronto** em `src/calculos/` (TypeScript + Vitest, `npm test`): dose por peso com dose máxima, volume a aspirar, reconstituição, diluição/rediluição em etapas, infusão contínua (por min ou por h), VIG, mistura de duas soluções, Holliday-Segar, seringa da BIC com volume final configurável (`src/dados/hospitais.ts`) e conferência da resposta do aluno. Testes usam números ilustrativos, não doses.
- Pendente com o usuário: margem de arredondamento aceita na correção (provisório: 1%), ver `formulas.md` item 8.
- Próximo passo: usuário preenche a planilha de apresentações; depois, molde do banco de medicações e casos clínicos iniciais.
