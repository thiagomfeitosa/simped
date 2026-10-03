# Imagens do SimPed — como trocar pelos seus desenhos/fotos

No Mac, esta pasta fica em **`simped/imagens`** (dentro da pasta do projeto, a mesma onde você roda `npm run dev`).
Para abrir pelo Finder: Finder → menu **Ir → Ir para a Pasta…** → digite `~/simped/imagens` → Enter.

## O que tem aqui
- **`originais/`** — as ilustrações que o app usa hoje, uma pasta por parte do app. O nome de cada arquivo diz o que ela é
  (ex.: `01-recem-nascido/zonas-de-kramer/kramer-zona-3.jpg`). **Não mexa** nesta pasta: ela é refeita pelo comando abaixo.
- **`minhas/`** — as mesmas pastas, vazias. É aqui que você coloca as **suas** imagens.
- **`LISTA.md`** e **`lista.csv`** — a lista de todas as imagens: o que é, onde aparece no app, o tamanho e observações.
  O `.csv` abre no Excel/Numbers e tem uma coluna "já troquei?" para você ir marcando.

## Como trocar uma imagem
1. Ache a imagem em `originais/` (ou na lista).
2. Salve a sua **com o mesmo nome, na mesma pasta, dentro de `minhas/`**. Pode ser `.png`, `.jpg` ou `.webp`.
   Ex.: `minhas/01-recem-nascido/zonas-de-kramer/kramer-zona-3.jpg`
3. Na próxima conversa, peça para ligar as suas imagens ao app (é a etapa seguinte; por enquanto o app ainda usa os desenhos).

## Dicas
- **Mesmo enquadramento**: imagens em que o app desenha por cima (bebê inteiro com zonas, áreas clicáveis do exame, visor da balança)
  precisam ter o bebê/objeto na mesma posição e proporção do original.
- 🎨 **Tom de pele**: o original está na pele clara. Se quiser as 3 versões, acrescente no fim do nome `-pele-parda` ou `-pele-negra`
  (ex.: `kramer-zona-3-pele-negra.jpg`). Sem elas, a sua imagem vale para os 3 tons.
- 🎞️ **Animadas** (respiração, balança, seringa enchendo, RCP): uma foto parada perde o movimento. A lista diz, em cada uma, o que funciona
  (2 quadros, vídeo curto em loop ou só o objeto "vazio").
- **Tamanho**: de preferência igual ou maior que o original (a lista mostra o tamanho em pixels), proporção parecida.
- **Pacientes reais**: só com consentimento e sem identificar a pessoa.

## Pasta `05-parada-animacao-rcp` (animação da RCP, aba 🚨 Parada)
- Aqui ficam as peças da **cena animada da RCP**: o paciente na maca (RN, lactente, criança, adolescente, nos 3 tons de pele),
  os **avatares** da equipe (cada pele, cabelo e cor de roupa) e os objetos (bolsa-válvula-máscara, desfibrilador, seringa...).
  Ela aparece em `originais/` depois de `npm run exportar-imagens` (e a pasta vazia correspondente em `minhas/`).
- **Como uma imagem entra numa animação**: o app não "toca um vídeo"; ele monta a cena a cada quadro, mexendo nas **peças separadas**
  (o tórax afunda, o braço desce, a bolsa é apertada, o clarão do choque). Por isso, para a animação continuar funcionando, a sua imagem
  deve ser **uma peça por arquivo**, no mesmo enquadramento do original, com **fundo transparente** (`.png` ou `.webp`):
  - peça que **não se mexe** (maca, carrinho, monitor, roupa do avatar): basta uma imagem;
  - peça que **se mexe entre duas posições** (tórax em cima × afundado, bolsa cheia × apertada, mãos abaixadas × ao alto): mande **2 quadros**,
    terminando o nome em `-quadro-1` e `-quadro-2` (o app passa de um para o outro conforme o movimento);
  - a lista (`LISTA.md`) diz, em cada peça da RCP, o que funciona melhor.
- Uma foto inteira da cena (tudo junto) **não serve** para a animação: só como referência do estilo que você quer.

## Para refazer os originais (quando o app ganhar imagens novas)
`npm run exportar-imagens` (refaz `originais/`, `LISTA.md` e `lista.csv`; não toca em `minhas/`).
