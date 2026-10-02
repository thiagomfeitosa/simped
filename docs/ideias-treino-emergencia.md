# Ideias C1–C6: treino e emergência (out/2026)

> Pedido do usuário: "faça todas e mais 3 ideias que você pensar". C1–C3 foram as 3 ideias propostas pelo assistente;
> C4–C6 foram escolhidas pelo assistente e feitas na mesma conversa. **Todas feitas.**
> Dados clínicos novos: "A VALIDAR", lista em `docs/a-validar-dados-novos.md` → "C1–C6".
> Como testar cada uma: `docs/fase-1/guia-das-funcionalidades.md` → "Treino e emergência (C1–C6)".

| Código | Ideia | Onde | Dado do usuário |
|---|---|---|---|
| ✅ C1 | **Caça-erros**: folha pronta "de um colega" (prescrição final de um roteiro do Passo a passo) com 3–4 erros plantados de conta (dose ×10, volume a aspirar, volume final da seringa, vazão, VIG, mg × mcg, concentração) ou de segurança (potássio em bolus). O aluno marca as linhas e o tipo; ao conferir, cada erro é explicado (estava → o certo é) | aba **Treino → 🔎 Caça-erros**; lógica `src/estudo/cacaErros.ts` | nenhum (usa os roteiros) |
| ✅ C2 | **Código de parada**: relógio do código, ciclos de 2 min, adrenalina a cada 3–5 min (contador colorido), desfibrilador em J/kg, carrinho com 4 gavetas (o aluno diz quantos mL aspirar e a conta é conferida), 3 cenários (assistolia, FV, AESP por hipovolemia), registro com horário e avaliação do algoritmo no fim | aba **🚨 Parada**; motor `src/parada/parada.ts`; dados `src/dados/parada-a-validar.ts` | depois (doses, energias, tempos, tubo) |
| ✅ C3 | **Caderno de erros e treino dirigido**: cada acerto/erro (contas e caça-erros) é anotado por assunto; revisão espaçada em 5 caixas (0, 1, 3, 7, 14 dias); "🎯 Treinar meus pontos fracos"; evolução por dia. Três tipos de conta novos: vazão, unidades e rediluição | aba **Treino → 📒 Caderno de erros**; lógica `src/estudo/caderno.ts` (gaveta `simped.caderno`, entra no backup) | nenhum |
| ✅ C4 | **Oxigenoterapia ligada ao paciente**: instalar O₂ (cateter, máscaras, CPAP, bolsa-válvula-máscara, ventilador) muda a SpO₂ do monitor e a pO₂/SatO₂ da gasometria arterial (modelo: gás alveolar + gradiente A-a + curva da hemoglobina). Em apneia/gasping só a ventilação resolve | **Prescrever** → painel do paciente → 🫁 Oxigênio; modelo `src/motor/oxigenacao.ts`; dados `src/dados/oxigenio-a-validar.ts` | depois (FiO₂ por fluxo) |
| ✅ C5 | **Peso estimado na emergência**: fórmulas pela idade (APLS e a antiga) quando não há balança | **Calculadoras** → 🚨 Peso estimado; **Parada** (ao lado do peso); `src/calculos/pesoEstimado.ts`, dados `src/dados/peso-estimado-a-validar.ts` | depois (fórmulas) |
| ✅ C6 | **Folha de emergência por peso**: tabela imprimível com dose/kg, dose para o peso, apresentação, preparo e mL a aspirar de cada droga do carrinho, bolus de SF, energia do choque e tubo pela idade | **Parada → 📄 Folha de emergência**; **Calculadoras → Folha de emergência para X kg**; `src/telas/FolhaEmergencia.tsx` | depois (mesmos dados do C2) |

## Decisões provisórias do assistente
- O caça-erros só planta erros que dá para achar **pela própria folha** (contas) ou por uma regra de segurança clássica; nunca "dose de referência errada" (as doses ainda são A VALIDAR).
- No código de parada, o ritmo só muda numa **checagem de ritmo** e só quando o que o cenário pede já foi feito (ex.: FV → 3 choques + adrenalina + amiodarona). Dose com volume errado conta como dada (a avaliação aponta o erro).
- A SpO₂ escrita nos casos passa a significar **SpO₂ em ar ambiente**; o professor, em "Alterar sinais", muda essa SpO₂ (a do monitor sai do modelo de O₂).
- A aba nova **🚨 Parada** fica entre Prescrever e Treino; a barra do topo continua numa linha de 1280 a 1920 px (o "Relatar problema" vira só o ícone 🐞 abaixo de 1920 px).
