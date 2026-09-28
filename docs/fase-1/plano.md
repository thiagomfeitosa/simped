# Fase 1 — MVP desktop offline 2D

Objetivo: ficha do paciente, sinais vitais numéricos, folha de prescrição completa, rascunho de cálculos, validação de doses e reação simples dos sinais vitais.

## Passos (cada um termina com o app funcionando)
| # | Passo | Situação |
|---|-------|----------|
| 1 | Alicerce: projeto React + TypeScript + Vite, fórmulas da Fase 0 com testes, primeira tela (aviso, paciente, folha com as 9 seções, rascunho, calculadora da BIC) | ✅ feito |
| 2 | Banco de medicações em arquivo de dados (apresentações + fonte; doses só depois de validadas, o resto fica "A VALIDAR") | depende das apresentações do usuário |
| 3 | Item de medicação estruturado na folha: medicação → apresentação → dose → via → posologia → diluição/rediluição/BIC, com conferência das contas | |
| 4 | Motor do paciente (estado + eventos) e sinais vitais numéricos | depende dos casos clínicos |
| 5 | Validação de doses contra o banco (só valores com fonte confirmada) | |
| 6 | Reação simples dos sinais vitais à prescrição | |
| 7 | Empacotar como aplicativo de desktop (Electron) para macOS/Windows | |

## Onde fica cada coisa no código
- `src/clinica/` — lógica clínica pura (fórmulas), com testes (`*.test.ts`). Não depende de telas.
- `src/dados/` — dados: hospitais (volume final da BIC), pacientes, ordem da folha. Futuramente, o banco de medicações.
- `src/interface/` — telas (React).

## Observações do passo 1
- O paciente da tela é **fictício e de demonstração**, sem conduta clínica.
- A calculadora da BIC usa o volume final configurado por hospital em `src/dados/hospitais.ts` (Santa Casa = 12 mL).
- Nenhuma dose foi colocada no programa.
