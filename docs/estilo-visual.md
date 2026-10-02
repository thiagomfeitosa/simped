# Peças visuais padronizadas (B19)

Um só conjunto de cores, cantos, sombras, botões, campos e cartões para todas as abas.
Arquivo: `src/estilos-base.css` (carregado antes de todos os outros estilos, em `src/main.tsx`).

## Regra para telas novas
1. **Não inventar cor nem canto**: usar as variáveis abaixo (`var(--primaria)`, `var(--raio-pequeno)`...).
2. Botão: `className="botao"` (+ `botao-principal` na ação principal da tela, `botao-perigo` para apagar/recomeçar, `botao-discreto` para ações secundárias com cara de link).
   Nas abas de prática (`.modo-prescrever`), um `<button>` sem classe já sai com o mesmo visual de `.botao`; `aria-pressed="true"` deixa o botão roxo (botões de alternar).
3. Painel/cartão: `className="cartao"` (nas abas de prática, `.painel` tem o mesmo visual).
4. Etiqueta pequena: `className="selo"` (+ `selo-perigo`, `selo-ok`).
5. Campos (`input`, `select`, `textarea`) nas abas de prática já saem com borda, canto e foco padronizados, e nunca ficam mais largos que a tela.
6. Foco do teclado: todo elemento focado ganha o anel roxo (`--foco`; na barra do topo, anel branco). Não remover.
7. Tela pequena: regras só em `src/estilos-telas-pequenas.css`, e a tela nova tem de passar em `testes-tela/telas-pequenas.spec.ts` (nada rola de lado).

## Paleta lilás/roxo (D1, out/2026)
- **Cor principal**: roxo (`--primaria` #6d3fb2, `--primaria-escura` #4b2580); fundo lilás bem claro (`--fundo`, `--fundo-pagina`).
- **Escala** para destaques e desenhos: `--roxo-900` … `--roxo-500` e `--lilas-400` … `--lilas-50`. Barra do topo: `--barra-topo` (gradiente roxo, letras brancas; a aba atual fica branca com letra roxa).
- **Não mudam** (de propósito): o texto quase preto (`--texto`), verde/âmbar/vermelho de certo/atenção/perigo, as cores das 9 seções da folha, o monitor (fundo preto, traçados coloridos), o papel da folha e da tira de ECG, os líquidos didáticos e os desenhos que imitam objetos reais.
- **Abas compactas**: em telas médias, as abas de ferramentas mostram só o ícone (`compacta` em `src/App.tsx`); o nome continua para leitor de tela e aparece ao passar o mouse.

## Ilustrações realistas (D2–D6)
- Ficam em `src/ilustracoes/` (SVG desenhado pelo app, sem fotos: funciona offline e sem direitos autorais).
- Pele: use `PALETAS`/`paletaComTinta` (`pele.ts`) e o `<FiltrosPele>` (gradiente de volume, grão da pele, desfoques); toda figura de pessoa aceita os 3 tons (`claro`, `moreno`, `negro`).
- Braços, pernas e dedos: `capsula()` (`formas.ts`). Ids de gradiente/filtro: `idSvg(useId())`.
- Genitália e mamas de crianças/adolescentes: **só texto**, sem desenho.
- Regras de tela das abas Recém-nascido e Atenção básica: `src/telas/estilos-saude.css` (tela pequena continua em `src/estilos-telas-pequenas.css`).

## Variáveis (`:root`)
| Grupo | Variáveis |
|---|---|
| Fundo e superfícies | `--fundo`, `--fundo-pagina` (gradiente suave da página), `--superficie`, `--superficie-2`, `--primaria-suave`, `--perigo-suave`, `--ok-suave` |
| Texto e bordas | `--texto`, `--texto-suave`, `--borda` |
| Cores de ação | `--primaria`, `--primaria-escura`, `--seta` (laranja de destaque), `--ok`, `--atencao`, `--atencao-fundo`, `--perigo` |
| Lilás/roxo (D1) | `--roxo-900`, `--roxo-800`, `--roxo-700`, `--roxo-600`, `--roxo-500`, `--lilas-400`, `--lilas-300`, `--lilas-200`, `--lilas-100`, `--lilas-50`, `--barra-topo` |
| Seções da folha | `--secao-1` … `--secao-9`, `--secao-revisao`, `--secao-final` |
| Faixas (réguas, barras) | `--tom-normal`, `--tom-atencao`, `--tom-perigo`, `--tom-info` |
| Líquidos (cores didáticas) | `--liq-medicacao`, `--liq-medicacao2`, `--liq-sf`, `--liq-agua`, `--liq-glicose`, `--liq-adrenalina`, `--liq-mistura` |
| Cantos | `--raio-pequeno` (8 px: botões, campos), `--raio-medio` (12 px: painéis), `--raio` (14 px: blocos grandes), `--raio-pilula` |
| Sombras e foco | `--sombra-leve` (painéis), `--sombra` (blocos em destaque), `--foco` (anel do teclado) |
| Controles | `--altura-controle` (36 px), `--transicao` |
| Fontes | `--fonte`, `--fonte-mao` (rascunho "à mão") |

Nas abas de prática, os nomes antigos (`--painel`, `--suave`, `--destaque`) continuam valendo, mas são só apelidos destas variáveis (`src/telas/estilos-prescrever.css`).

## Tema escuro (próximo passo possível)
Com as cores todas em variáveis, um tema escuro é redefinir o bloco `:root` dentro de `[data-tema='escuro']`.
Ainda há cores fixas em alguns desenhos (papel da folha, prancheta, monitor, bancada do Passo a passo), que são de propósito (imitam o objeto real) e precisariam de versões escuras próprias.
