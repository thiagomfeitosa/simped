# SimPed — Simulador de Prescrição em Emergências Pediátricas

## Sobre o usuário
- O dono do projeto é médico/estudante de medicina e **não sabe programar**.
- Explique tudo em **português**, com linguagem simples, sem jargão técnico desnecessário.
- Antes de mudanças grandes, explique o plano em poucas linhas. Depois de cada entrega, diga **como testar** (o que clicar, o que deve aparecer).
- **Sempre que o código mudar**, terminar a resposta com os comandos para o usuário abrir o app no Mac (a pasta é `~/simped`, baixada com git clone):
  ```
  cd simped
  git pull origin claude/busy-lamport-34608n
  npm install
  npm run dev
  ```
  e lembrar de abrir http://localhost:5173 no navegador.
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
  - `medicacoes-ampliacao.md`: +50 medicações (códigos A1–A50) **aprovadas pelo usuário**; já no banco (B8) com apresentações de rascunho A VALIDAR e **sem doses**. Banco total: 90 (o NaCl 3% preparado conta à parte, código 8b).
  - `variaveis-paciente.md`: variáveis obrigatórias do paciente (regra fixa), incluindo puberdade/Tanner.
  - `faixas-etarias.md`: pontos de corte (RN/neonato, lactente, criança, adolescente, IG, peso ao nascer) **por sociedade**. O nome da faixa segue a fonte escolhida (padrão SBP); as doses usam sempre números. Tabela A VALIDAR.
- Decisão do usuário: seguir em frente com os dados "A VALIDAR" como estão; a validação será feita depois. Por isso, tudo que é dado clínico (doses, apresentações, casos) deve ficar em arquivos de dados isolados, para ser corrigido sem mexer no resto do código, e cada item continua marcado "A VALIDAR" até o usuário conferir.
- **Motor de cálculo pronto** em `src/calculos/` (TypeScript + Vitest, `npm test`): dose por peso com dose máxima, volume a aspirar, reconstituição, diluição/rediluição em etapas, infusão contínua (por min ou por h), VIG, mistura de duas soluções, Holliday-Segar, seringa da BIC com volume final configurável (`src/dados/hospitais.ts`) e conferência da resposta do aluno. Testes usam números ilustrativos, não doses.
- **Banco de medicações** em `src/dados/medicacoes/`: `tipos.ts` (formato; `codigo` = Nº da lista/planilha), `consulta.ts` (escolha da fonte com queda para SBP, condições por idade/IG/peso, verificador de integridade; só valor CONFERIDO corrige o aluno), `exemplos-a-validar.ts` + `rascunho-a-validar.ts` (as 39 do MVP copiadas do rascunho, TUDO A VALIDAR), `ampliacao-a-validar.ts` (A1–A50, B8, sem doses), `index.ts` (banco completo), `resumo.ts` (situação da validação e .csv).
- **Versão do banco (B7)**: `src/dados/medicacoes/versao.ts` + `versoes/historico-banco.json` (cada versão com o que mudou: era → ficou, quem conferiu) + `versoes/banco-publicado.json` (banco da última versão). **Toda mudança no banco (dado novo, correção, .json de conferências gravado em `validacoes-conferidas.json`) exige `npm run nova-versao-banco -- "o que mudou"`** — o teste falha até isso ser feito. Depois, `npm run gerar-planilha` atualiza `docs/fase-0/apresentacoes-formulario.xlsx` (o teste também avisa). Versão atual: 2 (B8).
- **Item de medicação** (seções 4–6): regras, preparo (diluição/BIC/infusão) e decisões provisórias em `docs/fase-1/item-de-medicacao.md`; lógica em `src/prescricao/itemMedicacao.ts` e `preparo.ts`. A conta é sempre conferida; dose/via/intervalo só corrigem com valor CONFERIDO.
- **App com 11 abas** (inclui Professor, B14, 🚨 Parada, C2 (telas em `src/telas/parada/`), 👶 Recém-nascido e 🩺 Atenção básica, D2–D6) (React + Vite, `npm run dev`; como rodar e como abrir com dois cliques: `README.md`). A barra do topo fica em `src/App.tsx` e a aba vai no endereço (`#prescrever`, `#banco`...). Cada aba é baixada na 1ª vez que abre (B20) e depois fica aberta (trocar de aba não perde nada). Estilos: `src/estilos-base.css` (peças padronizadas, B19), `src/componentes/passo-a-passo/estilos.css`, `src/telas/estilos-prescrever.css` e `estilos-paginas.css` (dentro de `.modo-prescrever`).
- **Aba "Passo a passo"** (`src/componentes/passo-a-passo/`, roteiros em `src/dados/roteiros/`, fórmulas próprias em `src/logica/`): trilha de setas, animações, explicação, rascunho e folha preenchidos etapa a etapa. Detalhes: `docs/passo-a-passo.md`. **11 roteiros** em 3 temas (doses "A VALIDAR", lista em `docs/roteiros-a-validar.md`): RN com sepse, icterícia, hipocalcemia no RN; **Preparo**: rediluição + seringa da BIC (penicilina no prematuro), infusão contínua (adrenalina), adrenalina 1:10.000; **Distúrbios**: desidratação grave, hiponatremia, hipernatremia, hipocalemia, hipercalemia (out/2026). A lista de casos é recolhível. Pendente: hipoglicemia no RN, CAD (insulina em UI/kg/h), exsanguineotransfusão, fonte SBP × AAP na icterícia.
- **Ideias I1–I21 todas implementadas** (out/2026; lista em `docs/ideias.md`; como testar cada uma: `docs/fase-1/guia-das-funcionalidades.md`; dados provisórios criados: `docs/a-validar-dados-novos.md`). Em resumo:
  - **Aba Prescrever**: menu com os **16 casos** de `casos-clinicos.md` + demonstração (`src/casos/clinicos/`, um arquivo por caso, verificador em `src/casos/index.ts`); ficha com **variáveis calculadas** (`src/paciente/`); **relógio** que anda sozinho; regras de dose com **condições** (idade em h/d/m/a, IG, IPM, peso) e dose **por m²**; **monitor** com ECG/pleth e alarmes por idade; **item de medicação** com diluição/rediluição, seringa da BIC (volume final das Configurações) e infusão contínua; **soro** montado (VIG, Na, K, osmolaridade); **horários** da enfermagem (checar dose); **alertas** (alergia, repetida, interação, concentração máxima, potássio); **receita de alta**; **imprimir/PDF**; **exames** que chegam pelo relógio + **leitura guiada da gasometria**; **balanço hídrico**; **relatório** final com histórico.
  - **Abas Treino** (contas sem fim), **Calculadoras**, **Casos** (editor sem programar, casos guardados no computador), **Banco** (situação da validação, .csv do que falta, **importação da planilha** `.xlsx` sem internet) e **Configurações** (fonte, faixa, hospital, modo treino × prova, margem).
  - **Banco de medicações**: as 39 do MVP copiadas do `doses-rascunho.md` em `src/dados/medicacoes/rascunho-a-validar.ts` (tudo A VALIDAR; nada corrige o aluno); banco completo em `src/dados/medicacoes/index.ts`; apresentações importadas da planilha valem por cima (`ContextoBanco.tsx`).
  - **Dois cliques**: `npm run arquivo-unico` (gera `dist-arquivo/SimPed.html`), `npm run desktop` (Electron) e workflow manual `.github/workflows/instaladores.yml` (gera .dmg/.exe no GitHub).
- **Motor do paciente** em `src/motor/paciente.ts`: estado + eventos (tempo passa, medicação administrada, professor altera sinais, anotação); o paciente é recalculado a partir da lista de eventos. Os efeitos vêm do arquivo do caso (`evolucaoNatural`, `respostas`), nunca do motor.
- Usuário decidiu **adiar a planilha de apresentações** e avançar o código primeiro. A planilha agora é **gerada pelo app** (aba Banco → "Baixar planilha para preencher", B8), sempre com todas as medicações do banco.
- Pendente com o usuário: margem de arredondamento aceita na correção (provisório: 1%), ver `formulas.md` item 8.
- Pendente com o usuário (item de medicação): deslocamento do pó na reconstituição; gotas/mL de cada frasco e dos equipos (`src/dados/equipos.ts`). O "modo prova" já existe em Configurações (padrão: treino).
- **Duplicações resolvidas (B2)**: uma só lista de seções (`src/dados/secoes.ts`; ids `volemia`, `medicacoes`, `cuidados`) e um só motor de fórmulas (`src/calculos/`, usado também pelos roteiros do Passo a passo; `src/logica/calculos.ts` foi removido).
- **Tudo unificado no ramo principal** (casos clínicos + passo a passo + prescrever), em out/2026. O ramo `claude/stoic-hamilton-t3fhgb` (primeiro esqueleto do app) ficou de fora: foi substituído.
- **Ideias B1–B20 feitas** (out/2026; lista em `docs/ideias-bases.md`, como testar em `docs/fase-1/guia-das-funcionalidades.md` → "Novidades das bases", dados provisórios em `docs/a-validar-dados-novos.md`):
  - **B1** testes de tela (`npm run teste-tela`, Playwright, pasta `testes-tela/`) + `.github/workflows/conferencia.yml` (tipos, testes, arquivo único e telas a cada envio). Toda tarefa nova deve manter `npm run conferir-tudo` verde e, se mexer em tela, ganhar teste em `testes-tela/`.
  - **B3** proteção de erro por aba + "🐞 Relatar problema" (`src/diagnostico/`).
  - **B6** catálogo de fontes como dado (`src/dados/fontes/`; `Fonte.documentoId`; "documento provável" quando a dose só cita a sociedade). **B5** modo validação na aba Banco (`src/dados/medicacoes/validacoes.ts`): conferência com documento + página vira registro; `validacoes-conferidas.json` (no projeto) vale para todos — quando o usuário mandar o .json baixado do app, gravar nesse arquivo.
  - **B12** registro completo da sessão (`src/sessao/sessao.ts`; estado recalculado da lista; "⏪ Rever o caso") e **B13** salvar e continuar. Arquitetura: `docs/fase-1/sessao-e-professor.md`.
  - **B10** TEC, Glasgow, ritmo cardíaco e padrão respiratório (mudam por degraus) + peso pelo balanço; os 16 casos têm valores provisórios. **B11** traçados por ritmo (FV, TV, TSV, assistolia, AESP, BAV total). **B9** reação pela dose (`src/motor/avaliarDose.ts`, `src/dados/efeitos-sobredose.ts`).
  - **B14** aba Professor (sinais, ritmo, complicações de `src/dados/complicacoes.ts`, mensagens, folha ao vivo) e **B15** duas janelas (`src/sessao/canal.ts`, `?papel=professor`).
  - **B4** backup e restauração (Configurações; `src/backup/backup.ts`: toda gaveta `simped.*` entra sozinha, menos `simped.canal`). **B7** versão do banco e histórico (aba Banco, relatório do caso, relatar problema). **B8** A1–A50 no banco + planilha gerada pelo app (`src/importacao/planilha.ts`, `xlsx-escrever.ts`); vias novas `intranasal` e `ocular`.
  - **B16** variações dos casos (`src/casos/variacao.ts`; limites por caso A VALIDAR em `src/casos/variacoes-a-validar.ts`): botão 🎲 no Prescrever e no Professor, opção "Variar os casos sempre" nas Configurações, painel no editor; a variação (peso, idade, apresentação da farmácia) é da sessão e vai junto ao continuar, à outra janela e ao relatório. **B17** tablet/celular: regras de tela pequena todas em `src/estilos-telas-pequenas.css`; o Prescrever mostra um painel por vez abaixo de 1000 px; regra testada: nenhuma tela rola de lado (`testes-tela/telas-pequenas.spec.ts`) — tela nova deve passar nesse teste. **B18** app instalável (PWA): `public/manifest.webmanifest`, ícones (`npm run gerar-icones`), service worker gerado no build (`src/pwa/`, plugin em `vite.config.ts`), botão Instalar/aviso de versão nova; não liga no `npm run dev` nem no arquivo único/Electron; `npm run site` testa no Mac; publicação manual no GitHub Pages (`.github/workflows/site.yml`, endereço https://thiagomfeitosa.github.io/simped/ — o usuário precisa ligar Settings → Pages → GitHub Actions e rodar o workflow; ainda não publicado).
  - **B19** peças visuais padronizadas: `src/estilos-base.css` (cores, cantos, sombras, botões `.botao`/`.botao-principal`, `.cartao`, `.selo`, foco do teclado), carregado primeiro; o Prescrever usa os mesmos tokens (apelidos em `estilos-prescrever.css`). Barra do topo numa linha e fixa no alto. **Tela nova usa essas peças** (guia: `docs/estilo-visual.md`). **B20** abas sob demanda: cada aba é um pedaço (`React.lazy` em `src/App.tsx`), montada na 1ª abertura e mantida depois; banco/casos/sessão em `src/Provedores.tsx` (o Passo a passo não espera por eles); as outras abas baixam em segundo plano; o arquivo único continua sem pedaços (`vite build --mode arquivo-unico`). Testes de tela esperam a aba carregar (`esperarAba` em `testes-tela/ajuda.ts`).
- **Fase 2 começou (out/2026)** — guia em `docs/fase-1/guia-das-funcionalidades.md` → "Fase 2":
  - **Exames ligados ao paciente**: o motor do paciente tem variáveis de laboratório (`VariavelLab`: pCO₂, HCO₃⁻, lactato, K, Na, Cl, cetonemia) que mudam como os sinais (`muda('hco3', ...)` nos casos). O exame mostra o paciente **no minuto da coleta** (`PedidoExame.eventosAte`) e o pH/BE são recalculados (Henderson-Hasselbalch) em `src/motor/laboratorio.ts`. Efeitos A VALIDAR: caso 10 (insulina), caso 15 (NaCl 3%), `src/dados/efeitos-laboratorio.ts` (bicarbonato, insulina, salbutamol, KCl — valem quando o caso não define), convulsão em `complicacoes.ts`; partida normal em `src/dados/laboratorio-dinamico.ts`. O professor vê "🧪 Se colher agora".
  - **Monitor**: 3ª curva (respiração por padrão), onda T pelo potássio, **🧾 Tira de ECG** em papel (`src/telas/TiraEcg.tsx`, imprime só a tira). **Respiração animada** na beira do leito (`src/telas/RespiracaoAnimada.tsx`).
  - Ainda da Fase 2: ECG de 12 derivações, sons (ausculta), mais casos com efeito nos exames. (pO₂/SatO₂ ligados à oxigenoterapia: feito em C4.)
- **Ideias C1–C6 feitas (out/2026)** — lista em `docs/ideias-treino-emergencia.md`, como testar no guia ("Treino e emergência"), dados em `docs/a-validar-dados-novos.md` → "C1–C6":
  - **C1 caça-erros** e **C3 caderno de erros** na aba Treino (sub-abas Contas / Caça-erros / Caderno; `src/estudo/cacaErros.ts`, `caderno.ts`; gaveta `simped.caderno`). Treino ganhou contas de vazão, unidades e rediluição.
  - **C2 código de parada** (aba 🚨 Parada; motor `src/parada/parada.ts` estado + eventos; dados `src/dados/parada-a-validar.ts`), **C5 peso estimado** (`src/calculos/pesoEstimado.ts`) e **C6 folha de emergência por peso** (`src/telas/FolhaEmergencia.tsx`, também nas Calculadoras).
  - **C4 oxigenoterapia ligada ao paciente**: evento `oxigenio` no motor e ação `oxigenio` na sessão; a SpO₂ dos casos é **em ar ambiente** e a vista vem de `sinaisVistos()` (modelo em `src/motor/oxigenacao.ts`); gasometria arterial com pO₂/SatO₂. Telas que mostram SpO₂ devem usar `sinaisVistos`.
- **Ideias D1–D7 feitas (out/2026)** — escopo ampliado além da emergência; lista, decisões e **próximas opções E1–E15** em `docs/ideias-saude-integral.md`; como testar no guia ("Recém-nascido, atenção básica e briefing"); dados em `docs/a-validar-dados-novos.md` → "D1–D7":
  - **D1 visual lilás/roxo**: tokens `--roxo-*`, `--lilas-*`, `--barra-topo` em `src/estilos-base.css`; barra do topo roxa; abas de ferramentas viram só ícone em telas médias (`compacta` em `src/App.tsx`); texto, cores de certo/atenção/perigo, seções da folha e monitor não mudaram. Guia: `docs/estilo-visual.md`.
  - **D2–D5 aba 👶 Recém-nascido** (`src/telas/neonatal/`; lógica `src/neonatal/`; dados `src/dados/neonatal/`): Capurro somático e somático-neurológico, New Ballard (com desenho de cada opção e treino "reconhecer"), IG por DUM/USG, exame no alojamento conjunto com **RN virtual** sorteado, atlas de ≈50 achados, zonas de Kramer, Apgar e Silverman.
  - **D6 aba 🩺 Atenção básica** (`src/telas/atencao-basica/`; lógica `src/atencao-basica/`; dados `src/dados/atencao-basica/`): 17 receitas de problemas comuns com conta conferida, exame físico ilustrado + quiz, vacinas (calendário PNI, carteira, treino), DNPM (Caderneta), consulta de puericultura, hebiatria (HEEADSSS, Tanner em texto, PA).
  - **Ilustrações realistas** em `src/ilustracoes/` (SVG próprio, 3 tons de pele, sem fotos; genitália/mamas só em texto). Estilos das abas novas: `src/telas/estilos-saude.css`. As duas abas novas não usam banco/casos (`semProvedores`).
  - **D7 briefing e debriefing na 🚨 Parada** (`src/parada/debriefing.ts`, `src/telas/BriefingDebriefing.tsx`, dados `src/dados/parada-briefing-a-validar.ts`): papéis, conferência, números do código, fração de compressão estimada, GAS/PEARLS, CRM, baixar .txt.
- **Parada em equipe (out/2026)** — guia em `docs/fase-1/guia-das-funcionalidades.md` → "Parada em equipe"; dados em `docs/a-validar-dados-novos.md`. A aba 🚨 Parada tem 3 telas (Preparar / Código / Debriefing, `src/telas/parada/`). Cada membro tem papel (8 papéis) e vê só o painel do seu papel + "O que a equipe fez". Compressões pela tecla (padrão Espaço) e ventilações (padrão ↑), configuráveis (`Configuracoes.teclaCompressao/teclaVentilacao`); ritmo, série 15:2/30:2, via avançada, pausas e fração medida em `src/parada/rcp.ts`. Sala dividida entre janelas do mesmo computador (`src/parada/sala.ts`, canal `simped.canal-parada`; mescla sem perder nada; pronta para a Fase 7). Ordens do líder com "entendido", avisos do tempo, anotação e flush/elevar membro em `src/parada/equipe.ts`. Pedido do usuário: **"despoluir" as páginas** — a Parada foi a primeira; próximas telas a limpar: Prescrever e outras (perguntar quais incomodam mais).
- **Animação da RCP (out/2026)** — guia → "Animação da RCP"; dados A VALIDAR em `docs/a-validar-dados-novos.md`. A cena sai da sala (`src/parada/cena.ts`, `montarCena`: função do tempo, igual em todas as janelas; faixas e técnica de compressão em `src/dados/parada-cena-a-validar.ts`); desenho em `src/telas/parada/CenaRcp.tsx` + `src/ilustracoes/rcp/`; painel ao vivo `src/telas/parada/PainelCena.tsx` (só ele redesenha a 60/s; botão esconder, gaveta `simped.parada.cena`). Avatar de cada membro (🎨 no Preparar; `Membro.avatar`), modo **só assistir** para professor/telão (`?assistir=parada`, `TelaObservador.tsx`; cartão "🚨 Parada ao vivo" na aba Professor abre `?janela=parada&assistir=parada`; tela observadora fica fora dos papéis; quem deixa de assistir no meio do código volta no fim da fila) e **🎬 Rever o código** no debriefing. **Janelas extras da Parada** (telão e "tela de um colega") levam `?janela=parada` (papel `parada` em `src/sessao/papel.ts`): só leem a sessão do Prescrever (não perguntam "continuar", não gravam, não mandam ações; o canal só aceita ações com `de: 'professor'`); o Electron abre as janelas do próprio app (`electron/main.cjs`). Nomes e balões da cena arrumados em `src/ilustracoes/rcp/rotulos.ts`. Testes: `testes-tela/parada-cena.spec.ts`, `parada-janelas.spec.ts`, `src/ilustracoes/rcp/cena-desenho.test.ts`.
- **Pasta `imagens/` (out/2026)**: catálogo de todas as ilustrações em `src/imagens/catalogo.tsx` (+ `catalogo-parada.tsx`), galeria em `galeria.html` (só no `npm run dev`); `npm run exportar-imagens` refaz `imagens/originais/`, `LISTA.md` e `lista.csv`; o usuário põe as imagens dele em `imagens/minhas/` com o mesmo nome (como fazer: `imagens/LEIA-ME.md`). **Próxima conversa: ligar as imagens do usuário (`imagens/minhas/`) ao app.**
- Próximo passo: o usuário **validar os dados** — agora direto no app (aba Banco → **Conferir**; baixar o .json e mandar na conversa; ao gravar, criar versão nova do banco) — e conferir o **catálogo de fontes**; lista completa em `docs/a-validar-dados-novos.md` (inclui as escolhas provisórias de B8: seção da folha, faixas, receituário). Também **preencher a planilha** de apresentações (baixar na aba Banco; importa lá mesmo), **as doses de A1–A50** (Conferir na regra "Dose ainda não cadastrada") e os **limites das variações** dos casos (B16, `src/casos/variacoes-a-validar.ts`). Se quiser o app no celular: publicar o site (README → "Instalar no celular ou tablet"). Código: mais cenários de parada (bradicardia com pulso, TSV) e o caderno de erros recebendo também as conferências do Prescrever; continuar a Fase 2 (ECG de 12 derivações, ausculta) ou os roteiros pendentes do Passo a passo; tema escuro (as cores já estão em variáveis). Validar também os dados de C2/C4/C5 e de D2–D7 (Capurro/Ballard, exame do RN, receitas, calendário vacinal, marcos). Escolher as próximas opções E1–E15 (`docs/ideias-saude-integral.md`).
