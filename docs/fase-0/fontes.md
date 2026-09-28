# Fontes de referência

Cada dose, faixa, dose máxima e posologia do banco de medicações terá **uma ou mais fontes**. O usuário poderá **escolher qual fonte seguir** nas configurações. A padrão é a **SBP**.

| Código | Fonte | Uso |
|--------|-------|-----|
| `SBP` | Sociedade Brasileira de Pediatria (tratado, documentos científicos, departamentos, incluindo Neonatologia e Adolescência) | **Padrão** |
| `MS` | Ministério da Saúde (PCDTs: sífilis, HIV/transmissão vertical, toxoplasmose; manuais de neonatologia) | Opção. Principal para itens com protocolo nacional (sífilis, HIV) |
| `AAP` | American Academy of Pediatrics (inclui Red Book e diretrizes de neonatologia) | Opção |
| Outras | AHA/PALS, NRP, GINA, sociedades de neonatologia etc. | Opção, adicionadas conforme necessidade |

## Como vai funcionar no programa
- Cada valor no banco guarda: **fonte**, **documento/edição/ano** e, quando possível, **página ou seção**.
- Se as fontes discordarem, o programa mostra a dose da fonte escolhida e avisa que existe divergência.
- Quando uma medicação não tiver valor para a fonte escolhida, o programa **cai para a SBP** e avisa.
- Valor sem fonte confirmada fica marcado **"A VALIDAR"** e não é usado para corrigir o aluno.
