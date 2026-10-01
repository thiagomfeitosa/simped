# SimPed

Simulador de Prescrição em Emergências Pediátricas — software de treinamento para cálculo de doses, diluições e montagem da folha de prescrição, com paciente virtual que reage em tempo real.

> ⚠️ Ferramenta de **treinamento**. Não substitui protocolos institucionais nem julgamento clínico.

- Visão geral, regras do projeto e roteiro de fases: [`CLAUDE.md`](CLAUDE.md)
- Documentos da Fase 0 (planejamento): [`docs/fase-0/`](docs/fase-0/)
- Modo "Passo a passo": [`docs/passo-a-passo.md`](docs/passo-a-passo.md)
- Modo "Prescrever" (item de medicação estruturado): [`docs/fase-1/item-de-medicacao.md`](docs/fase-1/item-de-medicacao.md)
- Motor de cálculo (fórmulas de dose, diluição, BIC etc.): [`src/calculos/`](src/calculos/)

## Como abrir o app no computador
Precisa do [Node.js](https://nodejs.org) (versão 20 ou mais nova) instalado uma única vez.

No Terminal, dentro da pasta do projeto:

```bash
npm install     # só na primeira vez (baixa as peças do programa)
npm run dev     # abre o app
```

Depois abra no navegador o endereço que aparecer (normalmente http://localhost:5173).

Abas do topo:
- **Passo a passo** — aprender vendo as contas animadas.
- **Prescrever** — escolher um caso clínico e praticar na folha (ou na receita de alta), com o paciente reagindo, monitor, exames, horários da enfermagem, balanço hídrico e relatório final. **🎲 Variar o caso** sorteia outro peso, idade e apresentação da farmácia (para não decorar o gabarito).
- **Treino** — contas sem fim com números inventados.
- **Calculadoras** — idade/IPM, superfície corporal, Holliday-Segar, VIG, infusão, diluição, gotejamento, sódio.
- **Casos** — editor para criar ou copiar casos clínicos sem programar.
- **Banco** — medicações, o que falta validar (lista em .csv) e importação da planilha de apresentações.
- **Professor** — mudar sinais e ritmo, disparar complicações, mandar mensagem e ver a folha do aluno ao vivo (mesma janela ou "Abrir janela do professor").
- **Configurações** — fonte das doses, hospital (volume final da BIC, horários), modo treino/prova, margem de arredondamento.

No topo, **🐞 Relatar problema** copia o que aconteceu para colar na conversa.

Outros comandos:
- `npm test` — roda os testes automáticos das contas; tudo verde = conferido.
- `npm run teste-tela` — abre o app num navegador automático e clica como o aluno (na 1ª vez: `npx playwright install chromium`).
- `npm run conferir-tudo` — tipos + testes + arquivo único + testes de tela.
- `npm run build` — gera a versão final em `dist/`.
- `npm run site` — gera e abre a versão de **site** (http://localhost:4173), a que dá para instalar como app.
- `npm run gerar-icones` — redesenha os ícones do app instalado (`public/icones/`), se o desenho mudar.
- `npm run nova-versao-banco -- "o que mudou"` — registra uma versão nova do banco de medicações (obrigatório depois de mudar qualquer dado do banco; o teste avisa).
- `npm run gerar-planilha` — atualiza `docs/fase-0/apresentacoes-formulario.xlsx` com a lista atual de medicações.

No GitHub, cada envio roda a **Conferência** sozinho (aba Actions): ✔ verde = nada quebrou.

## Abrir com dois cliques (sem Terminal)

Há três jeitos (e um quarto, para celular e tablet, logo abaixo). Os dados guardados (configurações, casos criados, histórico) ficam separados em cada jeito.

1. **Arquivo único `SimPed.html`** (qualquer navegador, sem internet, sem instalar nada):
   - no Terminal, `npm run arquivo-unico` gera `dist-arquivo/SimPed.html`;
   - ou baixe pronto no GitHub (jeito 3, item "SimPed-arquivo-unico");
   - depois é só dar dois cliques no arquivo.
2. **Programa de computador (Electron)**: `npm run desktop` abre o SimPed numa janela própria.
3. **Instaladores para Mac e Windows, feitos pelo GitHub** (não precisa de Terminal):
   1. no site do GitHub, abra o repositório → aba **Actions** → **"Instaladores (Mac, Windows e arquivo único)"**;
   2. clique em **Run workflow** (botão à direita) → **Run workflow**;
   3. espere terminar (alguns minutos) e, embaixo, em **Artifacts**, baixe `SimPed-macos-latest` (.dmg) ou `SimPed-windows-latest` (.exe);
   4. no Mac, o programa não tem assinatura da Apple: na **primeira vez**, clique com o **botão direito** no SimPed → **Abrir** → **Abrir**. Depois, abre com dois cliques normalmente.

## Instalar no celular ou tablet (app pelo navegador)

O SimPed também funciona como **app instalável** (PWA): ícone próprio, tela cheia e **sem internet** depois da primeira abertura. Funciona em iPhone, iPad, Android e computador. As telas se ajustam ao tamanho (no celular, o Prescrever mostra um painel por vez).

1. **Publicar o site** (uma vez; o GitHub faz tudo, sem Terminal):
   1. no site do GitHub, abra o repositório → **Settings** → **Pages** → em **Source**, escolha **GitHub Actions** (só na primeira vez);
   2. aba **Actions** → **"Site (GitHub Pages, app instalável)"** → **Run workflow** → **Run workflow**;
   3. quando terminar (alguns minutos), o endereço é **https://thiagomfeitosa.github.io/simped/**. Repita o passo 2 sempre que quiser publicar uma versão nova.
   - Atenção: o site fica **público** (qualquer pessoa com o endereço abre). As doses continuam marcadas "A VALIDAR".
2. **Instalar**, abrindo o endereço no aparelho:
   - **iPhone/iPad** (Safari): Compartilhar (quadrado com seta) → **Adicionar à Tela de Início**;
   - **Android** (Chrome): menu ⋮ → **Instalar app**;
   - **Computador** (Chrome/Edge): ícone de instalar no fim da barra de endereço, ou o botão **📲 Instalar** no topo do app;
   - **Mac com Safari**: Arquivo → **Adicionar ao Dock**.
3. Quando houver versão nova publicada, o app avisa embaixo: **🔄 Há uma versão nova do SimPed → Atualizar agora**.

Para experimentar no próprio Mac sem publicar: `npm run site` e instale pelo Chrome (endereço http://localhost:4173).
Cada jeito de abrir guarda os dados separados; para levar configurações, casos e histórico de um para outro, use **Configurações → Backup**.
