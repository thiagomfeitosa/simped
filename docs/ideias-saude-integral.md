# Ideias D1–D7: além da emergência — RN, atenção básica, briefing/debriefing e visual lilás (out/2026)

> Pedido do usuário: aba de avaliação do RN (Capurro somático, idade gestacional, New Ballard, Capurro
> somático-neurológico, exame físico no alojamento conjunto), parte ilustrada "o mais realista possível" sobre
> problemas do RN, atenção básica de puericultura e hebiatria (receitas de problemas comuns, exame físico,
> vacinas, marcos do DNPM, com ilustrações), briefing e debriefing na PCR, e visual em lilás/roxo sem
> perder o texto preto. **Tudo feito.**
> Dados clínicos novos: "A VALIDAR", lista em `docs/a-validar-dados-novos.md` → "D1–D7".
> Como testar: `docs/fase-1/guia-das-funcionalidades.md` → "Recém-nascido, atenção básica e briefing (D1–D7)".

| Código | O que é | Onde | Dado do usuário |
|---|---|---|---|
| ✅ D1 | **Visual lilás/roxo**: barra do topo em gradiente roxo com letras brancas, aba atual em branco; botões, títulos, foco e destaques em roxo; fundo lilás bem claro. Texto continua quase preto; verde/âmbar/vermelho (certo, atenção, perigo), cores das seções da folha, monitor e desenhos de objetos reais não mudaram. Abas de ferramentas viram só ícone em telas médias. Ícones do app instalado em roxo | `src/estilos-base.css` (variáveis `--roxo-*`, `--lilas-*`, `--barra-topo`), `src/estilos.css`, `src/App.tsx` | nenhum |
| ✅ D2 | **Capurro somático, Capurro somático-neurológico e New Ballard**: cada critério com desenho de cada opção (pele, orelha, mama, mamilo, pregas plantares, lanugo, xale/cachecol, cabeça na tração, postura, janela quadrada, retração do braço, ângulo poplíteo, calcanhar–orelha), soma, conta por extenso e classificação. Modo treino: o app sorteia um RN e mostra só os desenhos | aba **👶 Recém-nascido → Capurro e New Ballard**; lógica `src/neonatal/maturidade.ts`; dados `src/dados/neonatal/maturidade-a-validar.ts`; desenhos `src/ilustracoes/Criterios.tsx` | conferir tabelas |
| ✅ D3 | **Idade gestacional pelas datas**: IG e DPP pela DUM (Naegele) e pela USG, qual usar (regra de redatação), comparação com o Capurro/Ballard, classificação (pré-termo extremo … pós-termo), peso ao nascer e PIG/AIG/GIG pelo percentil | **Recém-nascido → Idade gestacional** | conferir faixas |
| ✅ D4 | **Exame no alojamento conjunto com RN virtual**: bebê sorteado (sexo, tom de pele, horas de vida, sinais vitais, 0–4 achados) desenhado de corpo inteiro; 13 regiões (clicando no corpo ou na lista), cada uma com "como examinar", o que se encontra, desenho de perto e a pergunta "normal, variação do normal ou alterado?"; resumo com urgências que passaram; teste do coraçãozinho e triagens | **Recém-nascido → Exame no alojamento conjunto**; lógica `src/neonatal/exame.ts`; dados `src/dados/neonatal/exame-rn-a-validar.ts` | conferir textos e faixas |
| ✅ D5 | **Atlas ilustrado do RN** (≈50 achados: pele, cabeça, olhos, boca, clavícula, tórax, coração, umbigo, genitália em texto, coluna, membros/quadril, neurológico) em 3 tons de pele; **zonas de Kramer** interativas; **Apgar** e **Silverman-Andersen** | **Recém-nascido → Atlas do RN** e **Apgar e Silverman**; desenhos `src/ilustracoes/BebeCorpo.tsx` e `src/ilustracoes/detalhes/` | conferir condutas |
| ✅ D6 | **Atenção básica**: 17 problemas comuns com caso, exame, **receita com a conta conferida** (mg → mL/gotas/jatos/comprimidos) e receita pronta com orientações e sinais de alarme; **exame físico** ilustrado (otoscopia, oroscopia, exantemas e piodermites, hidratação com sinal da prega animado, respiração, sinais meníngeos) + quiz "o que é isto?"; **vacinas** (calendário PNI, carteira interativa, treino "o que aplicar hoje?"); **desenvolvimento** (marcos da Caderneta com desenhos, classificação e conduta, reflexos, sinais de alerta); **consulta de puericultura** por idade; **hebiatria** (HEEADSSS, sigilo, Tanner em texto, puberdade, PA) | aba **🩺 Atenção básica**; lógica `src/atencao-basica/`; dados `src/dados/atencao-basica/`; desenhos `src/ilustracoes/AtencaoBasica.tsx`, `Desenvolvimento.tsx` | conferir doses, calendário, marcos |
| ✅ D7 | **Briefing e debriefing na PCR**: antes — papéis da equipe com nomes e lista de conferência (peso, doses, via aérea, desfibrilador, alça fechada, plano); depois — números tirados do registro (tempo até choque/adrenalina, intervalos, checagens, fração de compressão **estimada**), roteiro em 4 fases (reação, descrição, análise plus/delta, resumo), autoavaliação da equipe (CRM) e arquivo .txt para baixar/imprimir | aba **🚨 Parada** (etapas 1-2-3); lógica `src/parada/debriefing.ts`; dados `src/dados/parada-briefing-a-validar.ts`; tela `src/telas/BriefingDebriefing.tsx` | conferir roteiro |

## Decisões provisórias do assistente
- **Realismo dos desenhos**: tudo é desenhado pelo próprio app (SVG), sem fotos — funciona offline e sem problema de direitos autorais. A pele tem volume (gradientes), grão (ruído) e sombra; os achados mudam de aparência com o tom de pele (ex.: icterícia quase não aparece na pele negra; mancha mongólica e melanose pustulosa aparecem como na pele parda/negra).
- **Genitália e Tanner só em texto**, de propósito (sem desenho de genitais/mamas de criança e adolescente). No atlas, os achados de genitália aparecem como cartão de texto.
- O exame do RN usa 3 categorias (normal / variação do normal / alterado). Achados que precisam só de acompanhamento (ex.: hemangioma, cefalo-hematoma) contam como "alterado".
- Na avaliação do desenvolvimento, a faixa anterior só é olhada quando falta marco da faixa atual (como na Caderneta/AIDPI).
- Na carteira de vacinas, só a próxima dose de cada série pode ser aplicada; os intervalos mínimos entre doses não são calculados. Influenza e COVID-19 ficam fora da conferência do treino.
- A fração de compressão do debriefing é **estimada** (10 s por checagem, 5 s por choque, 10 s por intubação).
- As abas novas não dependem do banco de medicações (abrem rápido); as doses da atenção básica ficam em arquivo próprio, todas A VALIDAR.

## Próximas opções (para o usuário escolher)
| Código | Ideia |
|---|---|
| E1 | **Curvas de crescimento** (OMS 0–5 e 5–19 anos, Intergrowth-21st para o RN) com plotagem de peso, estatura, PC e IMC — precisa das tabelas oficiais (o usuário baixa da OMS e o app lê). |
| E2 | **Nomograma de bilirrubina** (AAP 2022 / Bhutani) ligado ao bilirrubinômetro arrastável da Fase 3, com decisão de fototerapia e exsanguineotransfusão. |
| E3 | **Reanimação neonatal na sala de parto** (fluxograma SBP/NRP): minuto de ouro, VPP, FC pelo estetoscópio/monitor, compressões 3:1, adrenalina endotraqueal/venosa — com briefing/debriefing iguais aos da PCR. |
| E4 | **Ausculta**: sons cardíacos e pulmonares sintetizados (sibilos, crepitações, estridor, sopros inocentes × patológicos). |
| E5 | **Puericultura longitudinal**: acompanhar a mesma criança de 0 a 2 anos em consultas sucessivas (crescimento, vacinas, marcos, intercorrências), como num prontuário. |
| E6 | **AIDPI completo** (2 meses a 5 anos): avaliar → classificar por cores → tratar → orientar, com casos. |
| E7 | **Amamentação**: pega e posição ilustradas, fissura, ingurgitamento, mastite, ordenha, volume de fórmula quando indicado. |
| E8 | **Alimentação e dieta**: introdução alimentar por idade, cálculo de kcal e de fórmula infantil, dieta na desnutrição e na obesidade. |
| E9 | **Hebiatria ampliada**: contracepção (critérios da OMS), IST, PEP/PrEP, triagem de depressão (PHQ-A) e de uso de substâncias (CRAFFT), violência. |
| E10 | **Modo OSCE / prova prática**: estações cronometradas (exame do RN, receita, vacinas, PCR) com checklist do avaliador e nota — usa o painel do professor. |
| E11 | **Documentos para treinar**: notificação SINAN, Declaração de Nascido Vivo, atestados e receita de controle especial. |
| E12 | **Prevenção de acidentes** por idade e checklist de segurança da casa. |
| E13 | **Flashcards** dos atlas e marcos (revisão espaçada, ligada ao caderno de erros). |
| E14 | **Tema escuro** (as cores já estão em variáveis lilás/roxo). |
| E15 | **Fotos reais** no atlas (quando o usuário tiver imagens próprias ou com licença livre), lado a lado com o desenho. |
