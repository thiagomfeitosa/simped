# Guia das funcionalidades (como testar)

Abra o app (`npm run dev`, ou `SimPed.html`, ou `npm run desktop` — ver README). Código entre parênteses = ideia de `docs/ideias.md`.

## Aba Prescrever
- **Caso** (I3): menu no topo, agrupado por tema. Trocar de caso começa do zero (pede confirmação).
- **Ficha do paciente** (I1): nascimento, idade (texto + "Idade em todas as unidades"), IG, peso ao nascer, idade pós-menstrual (< 1 ano), idade corrigida (prematuro), superfície corporal, alergias.
- **Relógio** (I2): ▶ Iniciar / ⏸ Pausar, velocidade (1×, 10×, 60×, 300×), +5/+15/+60 min, +1 dia. A idade avança; regra que depende da idade troca sozinha (ex.: penicilina cristalina 12/12h → 8/8h aos 7 dias).
- **Monitor** (I12): ECG e pletismografia correndo; número em alarme pisca em vermelho; 🔕/🔔 liga o bipe; "Silenciar 2 min".
- **Item de medicação** (I5): "+ diluição/rediluição", "+ seringa da BIC (12 mL)" e intervalo "infusão contínua". "Conferir" mostra cada conta.
- **Soro** (I6): botão "+ soro" na seção 4; escreva vazão, VIG, Na e K e confira.
- **Horários** (I7): coluna da direita; dose "na hora" ganha botão "Checar" (só a dose checada chega ao paciente).
- **Alertas** (I8): caixa vermelha no topo da folha (alergia, repetida, interação); concentração máxima aparece na conferência do item.
- **Receita de alta** (I9): botão no topo; "+ medicação oral", quanto dar por vez e quantos frascos comprar.
- **Imprimir / PDF** (I10): sai só o documento escolhido; "Salvar como PDF" na janela de impressão.
- **Exames** (I13): escolha e "Pedir"; o resultado sai depois no relógio do caso; gasometria tem **Leitura guiada** (I14).
- **Balanço hídrico** (I15): soros/infusões contam pela vazão; registre entradas/saídas; escreva balanço e diurese e confira.
- **📋 Relatório** (I18): condutas esperadas, prazos, hemocultura antes do antibiótico, tempo até a 1ª dose, erros por tipo; "Salvar no histórico".

## Outras abas
- **Treino** (I16): contas com números inventados; Enter confere e passa; placar por tipo.
- **Calculadoras** (I17): idade/IPM, SC, Holliday, VIG, infusão, diluição, mistura, gotejamento, conversão, sódio.
- **Casos** (I4): "Começar de" → editar → "Salvar no app" / "▶ Jogar este caso" / baixar ou abrir .json.
- **Banco** (I20): situação da validação, lista .csv do que falta validar, detalhes de cada medicação; importar a planilha (I19).
- **Configurações** (I11): fonte das doses, nome da faixa etária, hospital (volume final da BIC, hora da 1ª dose), modo treino × prova, margem de arredondamento.

## Novidades das bases (B1–B20 — out/2026)
Lista e motivo de cada uma: `docs/ideias-bases.md`. Arquitetura da sessão e do professor: `docs/fase-1/sessao-e-professor.md`.

- **B3 — "Algo deu errado"**: em **Configurações**, clique em **Testar a tela de erro** → aparece a mensagem amigável só naquela aba (as outras continuam). **📋 Copiar relato do problema** copia aba, caso, erro e navegador; **↻ Tentar de novo** volta. No topo, **🐞 Relatar problema** faz o mesmo a qualquer hora (escreva o que estava fazendo e copie).
- **B2 — Unificação**: nada muda na tela. O Passo a passo e o Prescrever usam o mesmo motor de contas (`src/calculos/`) e a mesma lista de seções (`src/dados/secoes.ts`).
- **B1 — Testes de tela**: `npm run teste-tela` abre o app num navegador automático e clica como o aluno (todas as abas, roteiros, prescrever/administrar, exames, todos os casos, tela de erro, validação, rever o caso, continuar, professor, duas janelas, arquivo único). Na 1ª vez no seu computador: `npx playwright install chromium`. `npm run conferir-tudo` roda tudo. No GitHub, cada envio roda essa conferência sozinho (aba **Actions** → "Conferência"; ✔ verde = tudo certo).
- **B6 — Catálogo de fontes**: aba **Banco** → **Catálogo de fontes**: lista de documentos (A VALIDAR); **Editar** corrige edição/ano/link; **+ Novo documento** cadastra. Em cada dose aparece "fonte: SBP (documento provável: Tratado de Pediatria...)"; no Prescrever, a **Conferir** do item mostra "De onde vem a dose de referência".
- **B5 — Modo validação**: aba **Banco** → busque uma medicação → abra → **Conferir** ao lado da dose/apresentação → escolha o documento, escreva a **página** (obrigatória para CONFERIDO), corrija o valor se precisar → **✔ Conferido — marcar CONFERIDO**. O contador "regras conferidas" sobe e, no Prescrever, aquela dose passa a dar ✔/✘. **⬇ Baixar conferências (.json)** gera o arquivo para entrar no projeto (mande na conversa); **📂 Carregar** traz de outro computador. "Só o que falta conferir" filtra a lista.
- **B12 — Rever o caso**: no Prescrever, faça algumas coisas e clique **⏪ Rever o caso**: a lista mostra tudo com o horário do caso e o real; clique num ponto (ou ◀ ▶ / ▶ Reproduzir) para ver a folha, os sinais e o rascunho daquele momento. **⬇ Baixar registro (.json)** guarda a sessão. **↺ Recomeçar** zera o caso.
- **B13 — Continuar depois**: escreva algo num caso, feche a aba do navegador e abra o app de novo → aparece **"Continuar de onde parou?"** → **▶ Continuar o caso** volta com folha, relógio, exames e rascunho; **Começar do zero** apaga.
- **B10 — Paciente mais completo**: no painel do paciente, bloco **Beira do leito** (TEC, Glasgow, respiração; alterado em vermelho) e "pelo balanço: X kg" ao lado do peso quando há soro/registros. Casos bons para ver: 12 (PCR), 11 (TSV), 14 (benzodiazepínico), 10 (Kussmaul).
- **B11 — Traçados por ritmo**: caso 12 → monitor em **FV** (ondas caóticas, FC/SpO₂/PA "---", alarme "FV — SEM PULSO"); caso 11 → **TSV**. No modo **prova** (Configurações) o nome do ritmo some ("reconheça pelo traçado").
- **B9 — Reação pela dose**: caso de demonstração (16 kg) → dipirona com indicação "Febre/dor": 80 mg (5 mg/kg) → linha do tempo "dose abaixo da faixa: efeito parcial"; 800 mg (50 mg/kg) → "dose acima da faixa: efeito adverso — Hipotensão". No caso 11, adenosina em subdose não reverte a TSV.
- **B14 — Painel do professor**: aba **👩‍🏫 Professor**: monitor do paciente, **Alterar sinais agora** (mude só o que quiser, inclusive ritmo e respiração), **+1/+5/+15 min**, **Complicações** (um clique: convulsão, PCR em FV...), **Mensagem para o aluno**, **Folha do aluno (ao vivo)** e **Últimas ações**. Volte ao Prescrever: a mensagem aparece em roxo no topo e a linha do tempo mostra o que o professor fez.
- **B8 — Ampliação A1–A50**: aba **Banco** → o quadro mostra **90** medicações. Busque "midazolam" → abra → apresentações de rascunho (A VALIDAR) e as regras "Crise convulsiva", "Sedação", "Intubação" com **"Dose ainda não cadastrada (A VALIDAR)"**: nenhuma dose foi inventada. Para preencher, use **Conferir** na regra (tipo "por kg", valor, documento e página). No Prescrever, as 49 novas aparecem na lista de medicações (a dose não corrige o aluno enquanto for texto).
- **B8 — Planilha gerada pelo app**: aba **Banco** → **Importar planilha de apresentações** → **⬇ Baixar planilha para preencher (.xlsx)** → abre no Excel com as 3 abas (Como preencher, Apresentações, Listas), uma linha por medicação do banco (Nº = código: 1…38, 8b, A1…A50), células amarelas para preencher e listas de escolha. Preencha e volte em **📂 Escolher planilha**. O arquivo do projeto `docs/fase-0/apresentacoes-formulario.xlsx` é o mesmo (atualizado com `npm run gerar-planilha`).
- **B7 — Versão do banco**: aba **Banco** → painel **Versão do banco**: "Versão 2 de 01/10/2026 · código …" e **Histórico de mudanças** (cada versão com o que entrou/mudou: era → ficou, quem conferiu e quando). Faça uma conferência (B5) → o painel avisa **"mudanças que ainda não entraram no projeto"** e **Ver as mudanças deste computador** mostra o que mudou. No Prescrever, **Relatório** → linha "Banco de medicações: versão 2 de …" (ou "+ mudanças deste computador (código …)"); o histórico de relatórios guarda a versão. O 🐞 Relatar problema também diz a versão.
- **B4 — Backup e restauração**: aba **⚙ Configurações** → **Backup e restauração**: lista o que está guardado neste computador → **💾 Salvar backup (.json)** baixa um arquivo `simped-backup-AAAA-MM-DD.json`. No outro computador (ou depois de apagar tudo): **📂 Restaurar backup…** → escolha o arquivo → confira a lista → **Restaurar agora** (substitui o que havia; o app recarrega). Arquivo que não é backup do SimPed é recusado.
- **B16 — Variar o caso**: no **Prescrever**, escolha um caso (ex.: 2, sepse neonatal) e clique **🎲 Variar o caso** → aparece a faixa verde "🎲 Caso variado: Peso 3,27 kg (no caso original: 3 kg) · Farmácia hoje — Gentamicina: Ampola 40 mg/mL…". O peso (e a idade, nos casos que deixam) muda no painel do paciente, na identificação da folha e em todas as contas; na seção 5, a gentamicina só tem **uma** ampola na lista. **Voltar ao caso original** desfaz. Em **⚙ Configurações → Conferência**, marque **🎲 Variar os casos sempre** para sortear toda vez que abrir um caso. A variação vai junto ao "continuar depois", ao relatório ("🎲 Caso variado: …") e à janela do professor (botão **🎲 Variar o caso do aluno**). No editor de **Casos**, o painel **🎲 Variações** mostra/edita os limites do caso.
- **B17 — Tablet e celular**: no computador, deixe a janela do navegador estreita (ou, no Chrome, botão direito → Inspecionar → ícone de celular). Abaixo de ~1000 px, o Prescrever ganha a barra **👤 Paciente · 📝 Folha · 🕒 Horários e exames · ✏️ Rascunho** (um painel por vez, sem perder nada ao trocar) com os sinais do paciente embaixo (FC, SpO₂, FR, PA e relógio). No celular, a barra do topo vira uma linha que rola de lado; tabelas largas rolam dentro delas; botões e campos ficam maiores na tela de toque. Nenhuma tela rola de lado.
- **B18 — Instalar pelo navegador (app)**: no Terminal, `npm run site` (abre http://localhost:4173) → no Chrome do Mac aparece o ícone de **instalar** no fim da barra de endereço (ou **📲 Instalar** no topo do app) → o SimPed abre numa janela própria, com ícone (seringa) no Dock/Launchpad. Em **⚙ Configurações → 📲 Instalar como app**: "✔ Guardado neste aparelho: abre mesmo sem internet". Teste: desligue o Wi-Fi e abra de novo. No **celular/tablet**, publique o site uma vez (README → "Instalar no celular ou tablet") e abra o endereço: iPhone/iPad no Safari → Compartilhar → **Adicionar à Tela de Início**; Android no Chrome → **Instalar app**. Quando sair versão nova do site, aparece embaixo "🔄 Há uma versão nova do SimPed" → **Atualizar agora**.
- **B15 — Duas janelas**: no painel do professor, **🪟 Abrir janela do professor** abre outra janela (faixa roxa "Janela do professor", "● Conectado à janela do aluno"). Deixe as duas lado a lado: o que o aluno escreve aparece na do professor; complicações e mensagens do professor aparecem na do aluno. Funciona no navegador, no `SimPed.html` e no programa de computador.
- **B20 — Abas sob demanda**: nada muda na tela. Cada aba é um pedaço separado do app, baixado só na primeira vez que ela é aberta (no celular, o Passo a passo abre baixando ~460 KB em vez de ~850 KB). Depois de aberta, a aba fica montada como antes (trocar de aba não perde nada) e as outras são baixadas em segundo plano. Se a internet estiver lenta, aparece "Abrindo…" por um instante. O arquivo único (`npm run arquivo-unico`) continua sendo um arquivo só.

## Onde fica no código
| Assunto | Lógica (sem tela, com testes) | Tela |
|---|---|---|
| Variáveis do paciente | `src/paciente/` | `src/telas/PainelPaciente.tsx` |
| Relógio | `src/motor/paciente.ts` (`acrescentarEvento`) | `src/telas/ControlesCaso.tsx`, `useRelogio.ts` |
| Configurações | `src/configuracoes/` | `src/telas/Configuracoes.tsx` |
| Preparo (diluição/BIC/infusão) | `src/prescricao/preparo.ts` | `src/telas/PreparoItem.tsx` |
| Soro | `src/prescricao/soro.ts` | `src/telas/ItemSoroFolha.tsx` |
| Aprazamento | `src/prescricao/aprazamento.ts` | `src/telas/QuadroHorarios.tsx` |
| Alertas | `src/prescricao/alertas.ts` | `src/telas/FolhaPrescricao.tsx` |
| Receita | `src/prescricao/receita.ts` | `src/telas/ReceitaAlta.tsx` |
| Monitor | `src/monitor/monitor.ts` | `src/telas/Monitor.tsx` |
| Exames e gasometria | `src/exames/` | `src/telas/PainelExames.tsx` |
| Balanço | `src/motor/balanco.ts` | `src/telas/PainelBalanco.tsx` |
| Casos e editor | `src/casos/` | `src/telas/EditorCasos.tsx` |
| Relatório | `src/relatorio/relatorio.ts` | `src/telas/RelatorioCaso.tsx` |
| Treino | `src/estudo/treino.ts` | `src/telas/TreinoContas.tsx` |
| Calculadoras | `src/calculos/` | `src/telas/Calculadoras.tsx` |
| Importação da planilha | `src/importacao/` | `src/telas/Banco.tsx` |
| Desktop | `electron/main.cjs`, `scripts/arquivo-unico.mjs` | — |
| Seções da folha (lista única) | `src/dados/secoes.ts` | Passo a passo e Prescrever |
| "Algo deu errado" / relatar problema (B3) | `src/diagnostico/relato.ts` | `src/diagnostico/ProtecaoDeErro.tsx` |
| Testes de tela (B1) | `testes-tela/`, `playwright.config.ts` | `.github/workflows/conferencia.yml` |
| Catálogo de fontes (B6) | `src/dados/fontes/` | `src/telas/banco/CatalogoFontes.tsx` |
| Modo validação (B5) | `src/dados/medicacoes/validacoes.ts`, `validacoes-conferidas.json` | `src/telas/banco/ConferirItem.tsx`, `src/telas/Banco.tsx` |
| Registro da sessão, continuar (B12/B13) | `src/sessao/sessao.ts` | `src/sessao/ContextoSessao.tsx`, `PerguntaContinuar.tsx`, `src/telas/RevisaoSessao.tsx` |
| Ritmo, TEC, Glasgow, respiração (B10) | `src/casos/tipos.ts`, `src/motor/paciente.ts` | `src/telas/PainelPaciente.tsx` |
| Traçados por ritmo (B11) | `src/monitor/monitor.ts` | `src/telas/Monitor.tsx` |
| Reação pela dose (B9) | `src/motor/avaliarDose.ts`, `src/dados/efeitos-sobredose.ts` | `src/telas/Prescrever.tsx` |
| Professor e duas janelas (B14/B15) | `src/dados/complicacoes.ts`, `src/sessao/canal.ts` | `src/telas/Professor.tsx` |
| Backup e restauração (B4) | `src/backup/backup.ts` | `src/telas/PainelBackup.tsx` (em Configurações) |
| Versão do banco e histórico (B7) | `src/dados/medicacoes/versao.ts`, `versoes/historico-banco.json`, `versoes/banco-publicado.json`, `scripts/nova-versao-banco.mjs` | `src/telas/banco/VersaoBanco.tsx`, `src/telas/RelatorioCaso.tsx` |
| Ampliação A1–A50 (B8) | `src/dados/medicacoes/ampliacao-a-validar.ts` | aba Banco |
| Planilha gerada pelo app (B8) | `src/importacao/planilha.ts`, `xlsx-escrever.ts`, `scripts/gerar-planilha.mjs` | `src/telas/Banco.tsx` |
| Variações dos casos (B16) | `src/casos/variacao.ts`; limites (dados, A VALIDAR) em `src/casos/variacoes-a-validar.ts` | `src/telas/Prescrever.tsx` (🎲 e faixa verde), `src/sessao/ContextoSessao.tsx`, `src/telas/Configuracoes.tsx`, `src/telas/EditorCasos.tsx` |
| Tablet e celular (B17) | — | `src/estilos-telas-pequenas.css` (todas as regras de tela pequena num lugar só), barra de painéis em `src/telas/Prescrever.tsx`; teste: `testes-tela/telas-pequenas.spec.ts` |
| Abas sob demanda (B20) | `vite.config.ts` (arquivo único sem pedaços: `--mode arquivo-unico`) | `src/App.tsx` (`telaSobDemanda`, `adiantarAbas`), `src/Provedores.tsx`; teste: `testes-tela/abas.spec.ts` |
| App instalável (B18) | `src/pwa/montarServiceWorker.ts` (+ plugin em `vite.config.ts`), modelo `src/pwa/sw-modelo.js`, `src/pwa/pwa.ts` | `src/pwa/ComponentesPwa.tsx`; manifesto e ícones em `public/` (`npm run gerar-icones`); publicação: `.github/workflows/site.yml`; teste: `testes-tela/pwa.spec.ts` |
