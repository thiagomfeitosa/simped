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

## Para refazer os originais (quando o app ganhar imagens novas)
`npm run exportar-imagens` (refaz `originais/`, `LISTA.md` e `lista.csv`; não toca em `minhas/`).
