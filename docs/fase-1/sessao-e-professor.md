# Sessão do caso, professor e duas janelas (B12–B15)

Para uma conversa nova continuar daqui (Fase 7 — modo online). Implementado em out/2026.

## Registro da sessão (B12)
- `src/sessao/sessao.ts` (sem tela, com testes). Tudo o que acontece num caso é uma `AcaoSessao`
  (escrever/editar itens da folha e da receita, rascunho, relógio, administrar, checar horário, pedir exame,
  balanço, conferir, relatório; do professor: alterar sinais/ritmo, complicação, mensagem).
- Cada ação vira um `RegistroSessao` = `{ n, horaReal, minutoCaso, autor: 'aluno' | 'professor', acao }`.
- O estado da tela (`EstadoSessao`: folha, receita, rascunho, eventos do paciente, exames, balanço, checagens,
  mensagens) é **recalculado a partir da lista** (`reproduzirSessao`). `fazerNaSessao` faz o mesmo passo a passo
  (testado: dá o mesmo resultado).
- Digitação seguida (rascunho, mesmo item, relógio minuto a minuto) vira **um registro só**.
- O paciente continua no motor próprio (`src/motor/paciente.ts`): a sessão guarda os `eventosPaciente`.
- "⏪ Rever o caso" (`src/telas/RevisaoSessao.tsx`) reproduz a lista até qualquer ponto.

## Onde a sessão mora
- `src/sessao/ContextoSessao.tsx` (`ProvedorSessao`, no `App.tsx`): caso atual + sessão, para o Prescrever,
  o painel do professor e a outra janela. `geracao` muda a cada sessão nova (as telas usam como `key`).

## Continuar depois (B13)
- A cada ação (com trabalho de verdade), a sessão é gravada em `localStorage['simped.sessao-em-andamento']`
  (`guardarSessao` / `lerSessaoGuardada`, versão 1).
- `src/sessao/PerguntaContinuar.tsx` pergunta ao abrir o app. Trocar de caso, recomeçar ou "começar do zero" apagam.

## Professor (B14)
- Aba `#professor` (`src/telas/Professor.tsx`). Ações com `autor: 'professor'`.
- Complicações prontas: `src/dados/complicacoes.ts` (A VALIDAR). Mudanças podem ser absolutas (`alvo`) ou
  variações (`modo: 'soma'`).

## Duas janelas (B15) — prova de conceito do online
- `src/sessao/canal.ts`: BroadcastChannel + evento `storage` (para funcionar também no `SimPed.html` de dois cliques).
- Mensagens (`MensagemCanal`): `ola` (professor chegou), `estado` (aluno → professor: caso + registros inteiros),
  `acao` (professor → aluno), `trocarCaso`.
- A janela do **aluno é a dona** da sessão: aplica as ações do professor e devolve o estado. A janela do professor
  (`?papel=professor#professor`) só espelha e manda ações; não grava a sessão no computador.
- Electron: `electron/main.cjs` permite abrir a janela com `papel=professor`.

## Para o modo online (Fase 7)
- Trocar o transporte do canal por WebSocket (mesmas mensagens). O servidor guarda a lista de registros
  (PostgreSQL) e repassa: como o estado sai da lista, aluno e professor sempre veem a mesma coisa.
- Cuidados: hoje o `estado` manda a lista inteira a cada mudança (bom para a mesma máquina); na rede, mandar
  só os registros novos (`n` maior que o último recebido).
