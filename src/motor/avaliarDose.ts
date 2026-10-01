/**
 * B9 — Resposta que depende da dose: compara a dose dada com a faixa de referência.
 * - abaixo da faixa (subdose): o paciente responde só em parte;
 * - dentro da faixa: o efeito do caso;
 * - acima da faixa (sobredose): o efeito do caso + efeito adverso.
 *
 * Faixa: a do arquivo do caso (RespostaAMedicacao.faixaDose) ou, sem ela, a regra do banco.
 * Tudo isso é A VALIDAR: serve para o paciente reagir de forma didática, não corrige o aluno.
 */

import type { RespostaAMedicacao } from '../casos/tipos';
import { escolherRegras, FONTE_PADRAO } from '../dados/medicacoes/consulta';
import type { CodigoFonte, FaixaEtaria, Medicacao, UnidadeDroga, VariaveisParaRegra } from '../dados/medicacoes/tipos';
import { converterDroga, formatarNumero } from '../prescricao/comum';
import type { AvaliacaoDoseEvento } from './paciente';

/** Folga antes de chamar de subdose/sobredose (arredondamentos). A VALIDAR. */
export const FOLGA_DOSE = 0.1;

interface Faixa {
  min: number;
  max: number;
  unidade: UnidadeDroga;
  porKg: boolean;
  /** Dose máxima por dose (na mesma unidade), se a regra tiver. */
  teto?: number;
  origem: string;
}

function faixaDeReferencia(e: {
  medicacao: Medicacao | undefined;
  resposta?: RespostaAMedicacao;
  indicacao?: string;
  faixa: FaixaEtaria;
  variaveis?: VariaveisParaRegra;
  via?: string;
  fontePreferida?: CodigoFonte;
}): Faixa | undefined {
  const f = e.resposta?.faixaDose;
  if (f) return { min: f.min, max: f.max, unidade: f.unidade, porKg: f.por === 'kg', origem: 'faixa do caso' };
  if (!e.medicacao) return undefined;
  const indicacoes = e.indicacao ? [e.indicacao] : [...new Set(e.medicacao.regras.map((r) => r.indicacao))];
  for (const indicacao of indicacoes) {
    const { regras, fonteUsada } = escolherRegras(e.medicacao, indicacao, e.faixa, e.fontePreferida ?? FONTE_PADRAO, e.variaveis);
    const regra = regras.find((r) => !e.via || r.vias.includes(e.via as never)) ?? regras[0];
    const d = regra?.dose;
    // só dá para comparar dose "por vez" (por kg ou fixa); por dia, por m² e infusão ficam de fora
    if (!d || d.tipo === 'texto' || d.tipo === 'porM2' || d.por !== 'dose') continue;
    const m = regra.doseMaxima;
    const teto = m && m.por === 'dose' ? (converterDroga(m.valor, m.unidade, d.unidade) ?? undefined) : undefined;
    return {
      min: d.min,
      max: d.max,
      unidade: d.unidade,
      porKg: d.tipo === 'porKg',
      ...(teto !== undefined && { teto }),
      origem: `regra ${fonteUsada ?? ''} do banco`.trim(),
    };
  }
  return undefined;
}

/**
 * Classifica a dose. Devolve undefined quando não dá para comparar (sem faixa, unidades que não convertem):
 * aí o paciente recebe o efeito do caso, como antes.
 */
export function avaliarDose(e: {
  medicacao: Medicacao | undefined;
  resposta?: RespostaAMedicacao;
  indicacao?: string;
  faixa: FaixaEtaria;
  variaveis?: VariaveisParaRegra;
  via?: string;
  pesoKg: number;
  dose: number;
  unidade: UnidadeDroga;
  fontePreferida?: CodigoFonte;
}): AvaliacaoDoseEvento | undefined {
  if (!(e.dose > 0) || !(e.pesoKg > 0)) return undefined;
  const faixa = faixaDeReferencia(e);
  if (!faixa) return undefined;
  const naUnidade = converterDroga(e.dose, e.unidade, faixa.unidade);
  if (naUnidade === null) return undefined;
  const valor = faixa.porKg ? naUnidade / e.pesoKg : naUnidade;
  const u = `${faixa.unidade}${faixa.porKg ? '/kg' : ''}`;
  const texto = `${formatarNumero(valor)} ${u}; faixa ${formatarNumero(faixa.min)}–${formatarNumero(faixa.max)} ${u} (${faixa.origem}, A VALIDAR)`;
  if (valor < faixa.min * (1 - FOLGA_DOSE)) {
    return { nivel: 'subdose', fracao: Math.min(0.9, Math.max(0.1, valor / faixa.min)), texto };
  }
  if (valor > faixa.max * (1 + FOLGA_DOSE)) return { nivel: 'sobredose', texto };
  if (faixa.teto !== undefined && naUnidade > faixa.teto * (1 + FOLGA_DOSE)) {
    return { nivel: 'sobredose', texto: `${texto}; passa da dose máxima de ${formatarNumero(faixa.teto)} ${faixa.unidade}` };
  }
  return { nivel: 'certa', texto };
}
