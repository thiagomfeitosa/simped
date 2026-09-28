# SimPed

Simulador de Prescrição em Emergências Pediátricas — software de treinamento para cálculo de doses, diluições e montagem da folha de prescrição, com paciente virtual que reage em tempo real.

> ⚠️ Ferramenta de **treinamento**. Não substitui protocolos institucionais nem julgamento clínico.

- Visão geral, regras do projeto e roteiro de fases: [`CLAUDE.md`](CLAUDE.md)
- Documentos da Fase 0 (planejamento): [`docs/fase-0/`](docs/fase-0/)
- Modo "Passo a passo": [`docs/passo-a-passo.md`](docs/passo-a-passo.md)

## Como abrir o app no computador
Precisa do [Node.js](https://nodejs.org) (versão 20 ou mais nova) instalado uma única vez.

No Terminal, dentro da pasta do projeto:

```bash
npm install     # só na primeira vez (baixa as peças do programa)
npm run dev     # abre o app
```

Depois abra no navegador o endereço que aparecer (normalmente http://localhost:5173).

Outros comandos:
- `npm test` — roda os testes automáticos das contas.
- `npm run build` — gera a versão final em `dist/`.
