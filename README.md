# SimPed

Simulador de Prescrição em Emergências Pediátricas — software de treinamento para cálculo de doses, diluições e montagem da folha de prescrição, com paciente virtual que reage em tempo real.

> ⚠️ Ferramenta de **treinamento**. Não substitui protocolos institucionais nem julgamento clínico.

- Visão geral, regras do projeto e roteiro de fases: [`CLAUDE.md`](CLAUDE.md)
- Documentos da Fase 0 (planejamento): [`docs/fase-0/`](docs/fase-0/)
- Plano da Fase 1: [`docs/fase-1/plano.md`](docs/fase-1/plano.md)

## Como rodar no computador
1. Instale o **Node.js** (versão LTS) em https://nodejs.org (só uma vez).
2. Abra o **Terminal** na pasta do projeto e rode (só na primeira vez): `npm install`
3. Para abrir o app: `npm run dev` e abra no navegador o endereço que aparecer (ex.: http://localhost:5173).
4. Para rodar os testes das fórmulas: `npm test`
