# Ideias para acelerar as bases da plataforma (B1–B20)

> Sugeridas pelo assistente em out/2026, depois de concluídas as ideias I1–I21 (`docs/ideias.md`).
> **Feitas em out/2026 (pedido do usuário: "faça todas as opções que você me deu")**: B1, B2, B3, B5, B6, B9, B10, B11, B12, B13, B14 e B15 (✅ na tabela).
> Como testar cada uma: `docs/fase-1/guia-das-funcionalidades.md` ("Novidades das bases"). Dados provisórios: `docs/a-validar-dados-novos.md`.
> Ainda livres para escolher: B4, B7, B8, B16, B17, B18, B19, B20.
> Regra de sempre: dado clínico novo entra como valor fictício **"A VALIDAR"**, em arquivo de dados separado.

Legenda "Dado do usuário": **nenhum** = só código; **depois** = funciona com valor fictício e o usuário corrige quando puder.

## A. Segurança para mexer rápido sem quebrar

| Código | Ideia | O que muda | Dado do usuário |
|---|---|---|---|
| ✅ B1 | Testes de tela automáticos + conferência no GitHub a cada envio | Os testes que hoje faço "na mão" no navegador (abrir cada aba, jogar um caso, gerar relatório) viram parte do projeto (`npm run teste-tela`). O GitHub roda testes, tipos e build a cada envio e avisa se algo quebrou. | nenhum |
| ✅ B2 | Unificar as duplicações | Uma só lista de seções da folha e um só motor de fórmulas (passo a passo e Prescrever usam o mesmo). Menos lugares para corrigir quando uma conta mudar. | nenhum |
| ✅ B3 | Tela "algo deu errado" + "Relatar problema" | Em vez de tela branca, mensagem amigável e um botão que copia o que aconteceu (aba, caso, erro) para colar na conversa. Acelera o conserto. | nenhum |
| B4 | Backup e restauração | Um botão salva tudo o que fica no computador (configurações, casos criados, histórico, apresentações importadas) num arquivo; outro restaura em outro computador. | nenhum |

## B. Acelerar a validação (a sua parte)

| Código | Ideia | O que muda | Dado do usuário |
|---|---|---|---|
| ✅ B5 | Modo validação dentro do app | Na aba Banco, cada dose/apresentação tem "Conferir": você digita a fonte, a edição e a página (e corrige o valor, se for o caso). O app marca CONFERIDO e gera o arquivo para entrar no projeto. Sem planilha intermediária para as doses. | o usuário confere |
| ✅ B6 | Catálogo de fontes como dado | `referencias/catalogo.md` vira lista no app (código, título, edição, ano, link). Cada dose aponta para uma fonte do catálogo; a tela mostra de onde veio cada número. | o usuário cadastra as fontes |
| B7 | Versão do banco e histórico de mudanças | Cada correção de dado fica registrada (o que era, o que ficou, quem conferiu, quando). O app mostra "banco versão X" e o relatório diz com qual versão o aluno treinou. | nenhum |
| B8 | Ampliação: as 50 medicações A1–A50 no banco | Entram com nome, seção, classe e apresentações do rascunho, dose em texto "A VALIDAR". A planilha de apresentações passa a ser **gerada pelo app** a partir do banco (sempre em dia com a lista). | depois |

## C. Motor do paciente (base das fases 2, 5 e 7)

| Código | Ideia | O que muda | Dado do usuário |
|---|---|---|---|
| ✅ B9 | Resposta que depende da dose | Subdose → efeito parcial; dose certa → efeito do caso; sobredose → efeito adverso (ex.: taquicardia com beta-2 em excesso). Hoje qualquer dose dá o mesmo efeito. | depois (efeitos por caso) |
| ✅ B10 | Mais variáveis no paciente | Ritmo cardíaco (sinusal, TSV, FV, assistolia, bradicardia), TEC, Glasgow, padrão respiratório, peso que muda com o balanço. Base do monitor realista (Fase 2) e do avatar (Fase 5). | depois |
| ✅ B11 | Traçados por ritmo no monitor | ECG de FV, TSV, bradicardia e assistolia desenhados de verdade (hoje a FV aparece como linha reta). Usa o ritmo de B10. | nenhum |
| ✅ B12 | Registro completo da sessão | Tudo o que o aluno faz (escreveu item, corrigiu, conferiu, deu dose, pediu exame) vira uma lista de eventos com horário. Dá para **rever o caso** passo a passo depois, e é a base do modo online. | nenhum |
| ✅ B13 | Salvar e continuar o caso | Fechou o app no meio do caso? Ao abrir, ele pergunta se quer continuar de onde parou (usa B12). | nenhum |

## D. Professor e online (preparar a Fase 7 sem servidor)

| Código | Ideia | O que muda | Dado do usuário |
|---|---|---|---|
| ✅ B14 | Painel do professor (mesmo computador) | Uma aba para o professor mudar sinais vitais, disparar uma complicação ("convulsão", "dessatura") e ver a folha do aluno ao vivo. O motor já aceita "professor alterou sinais"; falta a tela. | nenhum |
| ✅ B15 | Professor e aluno em duas janelas | Prova de conceito do modo online usando duas janelas do mesmo computador (o que o professor faz aparece na janela do aluno). Valida a arquitetura de eventos antes de gastar com servidor. | nenhum |
| B16 | Variações automáticas dos casos | Cada caso pode ser jogado com outro peso/idade/apresentação sorteados (dentro de limites do caso), para treinar as contas sem decorar o gabarito. | depois (limites por caso) |

## E. Plataformas (preparar as fases 5 e 6)

| Código | Ideia | O que muda | Dado do usuário |
|---|---|---|---|
| B17 | Layout para tablet e celular | Telas que se reorganizam em iPad/celular (painéis em abas, botões maiores). Base da Fase 6. | nenhum |
| B18 | "Instalar" pelo navegador (PWA) | O site vira um app instalável no celular/tablet/computador, funcionando sem internet, antes do Capacitor. | nenhum |
| B19 | Peças visuais padronizadas | Um só conjunto de botões, campos, painéis e cores para todas as abas (hoje há dois estilos). Acelera telas novas e prepara o tema escuro. | nenhum |
| B20 | Carregar as abas sob demanda | O app abre mais rápido (hoje é um arquivo de 610 KB): cada aba só carrega quando é aberta. Importante para celular e para o 3D. | nenhum |

## Ordem sugerida pelo assistente
1. **B1 + B2 + B3** — rede de segurança: tudo o que vier depois anda mais rápido e com menos risco.
2. **B5 + B6** — destravam a sua validação (o gargalo atual do projeto).
3. **B12 + B13** — registro de eventos: base de rever o caso, continuar depois, professor e online.
4. **B10 + B11 + B9** — paciente mais realista (Fase 2).
5. **B14 + B15** — professor, já preparando a Fase 7.
