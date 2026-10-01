/**
 * B16 — Limites das variações de cada caso (peso e idade sorteados ao "variar" o caso).
 * TUDO A VALIDAR: valores PROVISÓRIOS escritos pelo assistente, escolhidos para não mudar a história
 * do caso (ex.: RN "com 2 h de vida" não muda de idade; glucagon "≥ 25 kg" continua acima de 25 kg).
 * O usuário confere e corrige aqui, sem mexer no resto do código.
 *
 * - pesoKg: o peso atual é sorteado entre min e max.
 * - idadeDias: o nascimento anda até `maisNovo` dias para depois e até `maisVelho` dias para antes
 *   (0 e 0 = idade fixa). Sem esse campo, a idade não muda.
 * - apresentacoes: sortear qual apresentação a farmácia tem hoje (padrão: sim).
 *
 * Casos sem linha aqui (ex.: os criados no editor sem limites) usam o padrão: peso ±10%, idade fixa.
 */

import type { LimitesVariacao } from './tipos';

const FIXA = { maisNovo: 0, maisVelho: 0 };

function limites(min: number, max: number, idadeDias = FIXA, observacao?: string): LimitesVariacao {
  return { pesoKg: { min, max }, idadeDias, status: 'A_VALIDAR', ...(observacao && { observacao }) };
}

export const LIMITES_VARIACAO: Readonly<Record<string, LimitesVariacao>> = {
  demonstracao: limites(14, 18, { maisNovo: 180, maisVelho: 180 }),
  'caso01-hipoglicemia-rn': limites(4, 4.6, FIXA, 'RN GIG (≥ 4 kg); idade fixa: a queixa fala em 2 h de vida.'),
  'caso02-sepse-neonatal': limites(2.6, 3.4, FIXA, 'Idade fixa: a queixa fala em 18 h de vida.'),
  'caso03-sifilis-congenita': limites(2.6, 3.3, FIXA, 'Idade fixa: o intervalo da penicilina muda depois de 7 dias de vida.'),
  'caso04-rn-exposto-hiv': limites(2.7, 3.7, FIXA, 'Idade fixa: a queixa fala em 1 h de vida.'),
  'caso05-toxoplasmose-congenita': limites(2.8, 3.6),
  'caso06-asma-grave': limites(18, 27, { maisNovo: 180, maisVelho: 180 }),
  'caso07-crupe': limites(10.5, 14, { maisNovo: 90, maisVelho: 90 }),
  'caso08-meningite-choque': limites(13, 19, { maisNovo: 180, maisVelho: 180 }),
  'caso09-anafilaxia': limites(42, 60, { maisNovo: 180, maisVelho: 180 }),
  'caso10-cetoacidose': limites(32, 45, { maisNovo: 180, maisVelho: 180 }),
  'caso11-tsv': limites(5.2, 7, { maisNovo: 30, maisVelho: 30 }),
  'caso12-pcr-fv': limites(21, 30, { maisNovo: 180, maisVelho: 180 }),
  'caso13-hipoglicemia-sem-acesso': limites(26, 36, { maisNovo: 180, maisVelho: 180 }, 'Sempre ≥ 25 kg (dose do glucagon na conduta).'),
  'caso14-intoxicacao-bzd': limites(12, 16, { maisNovo: 120, maisVelho: 120 }),
  'caso15-hiponatremia': limites(7, 9.5, { maisNovo: 30, maisVelho: 30 }),
  'caso16-crise-adrenal': limites(15, 21, { maisNovo: 180, maisVelho: 180 }, 'Fica entre 3 e 12 anos (dose da hidrocortisona na conduta).'),
};

/** Variação de peso dos casos sem limites próprios (± 10%). A VALIDAR. */
export const VARIACAO_PADRAO_PESO = 0.1;
