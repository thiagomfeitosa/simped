# Catálogo de fontes do SimPed

Toda dose do banco de medicações aponta para um **código de documento** desta lista.

> **Desde B6 (out/2026) a lista "oficial" fica no app**: `src/dados/fontes/catalogo.ts`
> (aba **Banco → Catálogo de fontes**, onde dá para conferir, editar e cadastrar documentos).
> Os títulos, edições e anos foram preenchidos pelo assistente: **tudo A VALIDAR**.

| Código | Sociedade | Documento (provisório, A VALIDAR) | Padrão da sociedade? |
|--------|-----------|-----------------------------------|----------------------|
| `SBP-TRATADO` | SBP | Tratado de Pediatria, 5ª ed., 2022 | sim |
| `SBP-DOCUMENTOS` | SBP | Documentos científicos dos Departamentos da SBP | |
| `MS-PCDT-IST` | MS | PCDT Atenção Integral às Pessoas com IST, 2022 | sim |
| `MS-PCDT-TV` | MS | PCDT Prevenção da Transmissão Vertical de HIV, Sífilis e Hepatites, 2022 | |
| `MS-ATENCAO-RN` | MS | Atenção à Saúde do Recém-Nascido, 2ª ed., 2014 | |
| `AAP-REDBOOK` | AAP | Red Book, 33ª ed. (2024–2027) | sim |
| `AHA-PALS` | PALS | Diretrizes PALS (AHA), 2020 | sim |
| `NRP-MANUAL` | NRP | Textbook of Neonatal Resuscitation, 8ª ed., 2021 | sim |
| `GINA` | GINA | GINA, 2024 | sim |
| `ISPAD` | ISPAD | ISPAD Clinical Practice Consensus Guidelines, 2022 | sim |
| `ASBAI-ANAFILAXIA` | ASBAI | Guia de anafilaxia da ASBAI | sim |
| `BULA` | BULA | Bula do medicamento (Bulário ANVISA) | sim |
| `HOSPITAL-SANTA-CASA` | HOSPITAL | Rotinas e padronização da Santa Casa | sim |
| `NEOFAX` | NEOFAX | Neofax (Micromedex) | sim |
| `SSC-PEDIATRIA` | SSC | Surviving Sepsis Campaign pediátrico, 2020 | sim |

"Padrão da sociedade" = documento usado quando a dose cita só a sociedade (ex.: "SBP"): a tela mostra
"documento provável" até o usuário conferir e escolher o documento certo.

## Como adicionar ou corrigir uma fonte
1. Salve o arquivo:
   - documento público → `referencias/publicas/`
   - livro ou material protegido → `referencias/privado/`
2. No app: aba **Banco → Catálogo de fontes → + Novo documento** (ou **Editar**). Depois **Baixar catálogo (.json)** e mande na conversa para entrar no projeto.
3. Os trechos usados (tabelas de dose) são transcritos em `referencias/trechos/`, com a página, para conferência.
