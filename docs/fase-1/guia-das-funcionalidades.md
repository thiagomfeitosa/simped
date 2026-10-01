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
