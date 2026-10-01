# Dados novos "A VALIDAR" (criados na implementação das ideias I1–I21)

> Tudo abaixo foi escrito pelo assistente como **valor provisório**, para o app funcionar enquanto o usuário levanta as fontes.
> Cada arquivo é só de dados: corrigir um valor não mexe no resto do código. Depois de corrigir, rode `npm test`.
> Enquanto estiver "A VALIDAR", **nada disto corrige o aluno**: aparece só como referência ou aviso.

| Assunto | Arquivo | O que conferir |
|---|---|---|
| Doses e apresentações do MVP (39 medicações) | `src/dados/medicacoes/rascunho-a-validar.ts` e `exemplos-a-validar.ts` | Copiadas do `docs/fase-0/doses-rascunho.md` (item do rascunho anotado em cada uma). Na aba **Banco** há o botão "Baixar lista do que falta validar (.csv)". |
| Apresentações da Santa Casa | planilha `docs/fase-0/apresentacoes-formulario.xlsx` | Preencher e importar na aba **Banco** (linha com "Onde conferi" entra como CONFERIDA). |
| Faixas etárias e classificação do RN | `src/dados/faixas-etarias.ts` | Pontos de corte por sociedade; faixa usada nas doses (criança até 11 anos, adolescente ≥ 12, como no rascunho); idade corrigida mostrada até 3 anos. |
| Horários das doses (aprazamento) | `src/dados/hospitais.ts` | Horários de cada intervalo na Santa Casa (ex.: 8/8h = 06–14–22) e hora da 1ª dose. Folga de 30 min para "atrasada" em `src/prescricao/aprazamento.ts`. |
| Soluções do soro | `src/dados/solucoes.ts` | Glicose e eletrólitos por mL (SG, SF, Ringer, glicose 25/50%, NaCl 20/10%, KCl 19,1/10%, gluconato de cálcio); referências de Na, K, VIG, osmolaridade e potássio máximo. |
| Alertas de segurança | `src/dados/alertas.ts` | Interação ceftriaxona + cálcio no RN < 28 dias; reatividade cruzada penicilina → cefalosporina. Concentração máxima EV: ceftriaxona 40 mg/mL (exemplo), vancomicina 5 mg/mL, KCl 40 mEq/L. |
| Limites de alarme do monitor | `src/dados/limites-alarme.ts` | FC, FR, SpO₂, PA, temperatura e glicemia por faixa de idade. |
| Exames | `src/dados/exames.ts` | Valores de referência e tempo até o resultado de cada exame. |
| Gasometria | `src/dados/gasometria.ts` | Referências arterial/venosa, margem das fórmulas de compensação, ânion gap normal, cortes do Δ/Δ e do lactato. |
| Equipos | `src/dados/equipos.ts` | Gotas por mL (macro 20, micro 60). Também: gotas/mL de cada frasco de gotas no banco. |
| Fórmulas de sódio | `src/calculos/eletrolitos.ts` | Sódio corrigido (fator 1,6) e déficit (0,6 × peso), como nos casos 10 e 15. |
| 16 casos clínicos | `src/casos/clinicos/` (um arquivo por caso) | Sinais, evolução sem tratamento, reação a cada medicação, resultados de exames, diurese e condutas esperadas com prazo. Nascimento, peso ao nascer e estatura que o texto do caso não traz são fictícios. |
| Caso de demonstração | `src/casos/demonstracao.ts` | Alergia a penicilinas e resultados de exames colocados só para mostrar os alertas e a tela de exames. |

## Dados novos das ideias B1–B15 (out/2026)

| Assunto | Arquivo | O que conferir |
|---|---|---|
| Catálogo de fontes (B6) | `src/dados/fontes/catalogo.ts` (aba **Banco → Catálogo de fontes**) | Título, edição, ano e link de cada documento (SBP Tratado 5ª ed. 2022, PCDT IST 2022, Red Book 2024–2027, PALS 2020, NRP 8ª ed. 2021, GINA 2024, ISPAD 2022, SSC 2020...) e qual é o documento **padrão** de cada sociedade (o "documento provável" das doses que só citam a sociedade). |
| TEC, Glasgow, ritmo e respiração dos 16 casos (B10) | `src/casos/clinicos/` (linha "B10: ... PROVISÓRIOS" em cada caso) | Valores iniciais e como mudam com cada medicação (ex.: adenosina → sinusal; amiodarona tira da FV; FV vira assistolia em 30 min sem tratamento; flumazenil com rebote em 60 min). |
| Valores padrão de TEC e Glasgow (B10) | `src/casos/tipos.ts` (`SINAIS_PADRAO`) | TEC 2 s e Glasgow 15 quando o caso não informa. |
| Peso pelo balanço (B10) | `src/motor/balanco.ts` (`pesoPeloBalanco`) | 1 mL ≈ 1 g, sem perdas insensíveis. As doses continuam usando o peso da admissão. |
| Resposta pela dose (B9) | `src/motor/avaliarDose.ts` (`FOLGA_DOSE`) | Folga de 10% antes de chamar de subdose/sobredose; efeito parcial proporcional (dose ÷ mínima, entre 10% e 90%). A faixa usada é a do caso (`faixaDose`) ou, sem ela, a regra do banco — mesmo A VALIDAR (serve só para o paciente reagir; **não corrige o aluno**). |
| Efeitos de sobredose (B9) | `src/dados/efeitos-sobredose.ts` | Efeito adverso de cada medicação acima da faixa (beta-2: taquicardia; adenosina: assistolia transitória; KCl: TV; insulina: hipoglicemia; corticoide: hiperglicemia; soro: congestão...). |
| Complicações do professor (B14) | `src/dados/complicacoes.ts` | Convulsão, dessaturação, apneia, choque, febre, hipoglicemia, bradicardia, TSV, PCR em FV/assistolia, anafilaxia: quanto cada sinal muda e as mensagens sugeridas. |
| Traçados do monitor (B11) | `src/monitor/monitor.ts` | Desenhos didáticos de cada ritmo (não são sinais reais). |
