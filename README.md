# SimPed

Simulador de Prescrição em Emergências Pediátricas — software de treinamento para cálculo de doses, diluições e montagem da folha de prescrição, com paciente virtual que reage em tempo real.

> ⚠️ Ferramenta de **treinamento**. Não substitui protocolos institucionais nem julgamento clínico.

- Visão geral, regras do projeto e roteiro de fases: [`CLAUDE.md`](CLAUDE.md)
- Documentos da Fase 0 (planejamento): [`docs/fase-0/`](docs/fase-0/)
- Motor de cálculo (fórmulas de dose, diluição, BIC etc.): [`src/calculos/`](src/calculos/)

## Abrir o app e rodar os testes

Precisa do [Node.js](https://nodejs.org) instalado. No Terminal, dentro da pasta do projeto:

```
npm install   # só na primeira vez
npm run dev   # abre o app: copie o endereço que aparecer (http://localhost:5173) no navegador
npm test      # roda os testes automáticos; tudo verde = conferido
```
