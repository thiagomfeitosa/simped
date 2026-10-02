/**
 * Idade gestacional (sem tela): soma dos escores de maturidade (Capurro, New Ballard),
 * conversão em semanas e dias, IG pela DUM e pela USG, classificação do RN.
 * Os dados (pontos de cada critério, constantes, faixas) ficam em
 * src/dados/neonatal/maturidade-a-validar.ts — TUDO A VALIDAR.
 */

import {
  CLASSIFICACAO_IG_DETALHADA,
  CLASSIFICACAO_PESO_IG,
  type CriterioMaturidade,
  type MetodoMaturidade,
  REDATAR_PELA_USG,
} from '../dados/neonatal/maturidade-a-validar';

export type Sexo = 'masculino' | 'feminino';

/** Critérios que valem para o RN (no Ballard, só os genitais do sexo escolhido). */
export function criteriosDoMetodo(metodo: MetodoMaturidade, sexo: Sexo): CriterioMaturidade[] {
  return metodo.criterios.filter((c) => !c.sexo || c.sexo === sexo);
}

export interface SemanasDias {
  semanas: number;
  dias: number;
}

export function paraSemanasDias(totalDias: number): SemanasDias {
  const d = Math.max(0, Math.round(totalDias));
  return { semanas: Math.floor(d / 7), dias: d % 7 };
}

export function textoIg(sd: SemanasDias): string {
  return sd.dias === 0 ? `${sd.semanas} semanas` : `${sd.semanas} semanas e ${sd.dias} dia${sd.dias > 1 ? 's' : ''}`;
}

export interface ResultadoMaturidade {
  /** Todos os critérios foram respondidos. */
  completo: boolean;
  /** Nomes dos critérios ainda sem resposta. */
  faltam: string[];
  pontos: number;
  /** IG estimada em dias (arredondada). */
  igDias: number;
  ig: SemanasDias;
  /** Ballard: pontos fora da tabela (−10 a 50). */
  foraDaTabela?: 'abaixo' | 'acima';
  /** A conta, por extenso, para o aluno conferir. */
  conta: string;
}

/**
 * Soma os pontos e converte em idade gestacional.
 * - Capurro: IG (dias) = constante (204 somático; 200 somático-neurológico) + pontos.
 * - New Ballard: IG (semanas) = 24 + 0,4 × pontos.
 */
export function calcularMaturidade(metodo: MetodoMaturidade, respostas: Readonly<Record<string, number>>, sexo: Sexo = 'masculino'): ResultadoMaturidade {
  const criterios = criteriosDoMetodo(metodo, sexo);
  const faltam = criterios.filter((c) => respostas[c.id] === undefined).map((c) => c.nome);
  for (const c of criterios) {
    const r = respostas[c.id];
    if (r !== undefined && !c.opcoes.some((o) => o.pontos === r)) throw new Error(`${c.nome}: ${r} pontos não é uma opção.`);
  }
  const pontos = criterios.reduce((s, c) => s + (respostas[c.id] ?? 0), 0);
  const conv = metodo.conversao;
  if (conv.tipo === 'dias') {
    const igDias = conv.constante + pontos;
    const ig = paraSemanasDias(igDias);
    return {
      completo: faltam.length === 0,
      faltam,
      pontos,
      igDias,
      ig,
      conta: `${conv.constante} + ${pontos} = ${igDias} dias ÷ 7 = ${textoIg(ig)}`,
    };
  }
  const semanas = conv.semanasNoZero + conv.semanasPorPonto * pontos;
  const igDias = Math.round(semanas * 7);
  const ig = paraSemanasDias(igDias);
  const foraDaTabela = pontos < conv.minimo ? 'abaixo' : pontos > conv.maximo ? 'acima' : undefined;
  const porPonto = String(conv.semanasPorPonto).replace('.', ',');
  return {
    completo: faltam.length === 0,
    faltam,
    pontos,
    igDias,
    ig,
    ...(foraDaTabela && { foraDaTabela }),
    conta: `${conv.semanasNoZero} + ${porPonto} × (${pontos}) = ${String(Math.round(semanas * 10) / 10).replace('.', ',')} semanas ≈ ${textoIg(ig)}`,
  };
}

/** Classificação detalhada pela IG (em dias): pré-termo extremo … pós-termo. */
export function classificarIgDetalhada(igDias: number): { nome: string; grupo: 'pre-termo' | 'termo' | 'pos-termo' } {
  const c = CLASSIFICACAO_IG_DETALHADA.find((f) => igDias < f.ateDias) ?? CLASSIFICACAO_IG_DETALHADA[CLASSIFICACAO_IG_DETALHADA.length - 1]!;
  return { nome: c.nome, grupo: c.grupo };
}

/** PIG / AIG / GIG pelo percentil de peso lido na curva de crescimento fetal/neonatal. */
export function classificarPesoParaIg(percentil: number): { sigla: 'PIG' | 'AIG' | 'GIG'; nome: string } {
  if (percentil < CLASSIFICACAO_PESO_IG.pigAbaixoDoPercentil) return { sigla: 'PIG', nome: 'Pequeno para a idade gestacional' };
  if (percentil > CLASSIFICACAO_PESO_IG.gigAcimaDoPercentil) return { sigla: 'GIG', nome: 'Grande para a idade gestacional' };
  return { sigla: 'AIG', nome: 'Adequado para a idade gestacional' };
}

// ---- Datas (sem fuso: "AAAA-MM-DD" vira número de dias) ------------------------------

const MS_DIA = 86_400_000;

/** "2026-03-15" → dias desde 1970-01-01 (sem horário de verão nem fuso). */
export function diaDoTexto(texto: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto.trim());
  if (!m) throw new Error(`Data inválida: "${texto}" (use AAAA-MM-DD).`);
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(ms);
  if (d.getUTCMonth() !== Number(m[2]) - 1) throw new Error(`Data inválida: "${texto}".`);
  return Math.round(ms / MS_DIA);
}

export function textoDoDia(dia: number): string {
  return new Date(dia * MS_DIA).toISOString().slice(0, 10);
}

/** Data no formato brasileiro (15/03/2026). */
export function dataBr(dia: number): string {
  const [a, m, d] = textoDoDia(dia).split('-');
  return `${d}/${m}/${a}`;
}

/** Duração da gestação pela regra de Naegele: DPP = DUM + 280 dias (40 semanas). */
export const GESTACAO_DIAS = 280;

export interface IgPorData {
  /** IG na data de referência, em dias. */
  igDias: number;
  ig: SemanasDias;
  /** Data provável do parto (dia). */
  dpp: number;
}

/** IG na data de referência contada pela DUM. */
export function igPelaDum(dum: string, referencia: string): IgPorData {
  const dDum = diaDoTexto(dum);
  const igDias = diaDoTexto(referencia) - dDum;
  return { igDias, ig: paraSemanasDias(igDias), dpp: dDum + GESTACAO_DIAS };
}

/** IG na data de referência contada pela USG (IG medida no dia do exame + dias desde o exame). */
export function igPelaUsg(dataUsg: string, igNaUsg: SemanasDias, referencia: string): IgPorData {
  const igNaUsgDias = igNaUsg.semanas * 7 + igNaUsg.dias;
  const igDias = igNaUsgDias + (diaDoTexto(referencia) - diaDoTexto(dataUsg));
  return { igDias, ig: paraSemanasDias(igDias), dpp: diaDoTexto(dataUsg) - igNaUsgDias + GESTACAO_DIAS };
}

export interface DecisaoIg {
  usar: 'DUM' | 'USG';
  motivo: string;
  diferencaDias: number;
  escolhida: IgPorData;
}

/**
 * Compara a DUM com a USG (a mais precoce disponível) e diz qual usar,
 * pela regra de redatação (REDATAR_PELA_USG, A VALIDAR).
 */
export function decidirIg(dum: string, dataUsg: string, igNaUsg: SemanasDias, referencia: string): DecisaoIg {
  const pelaDum = igPelaDum(dum, referencia);
  const pelaUsg = igPelaUsg(dataUsg, igNaUsg, referencia);
  const diferencaDias = Math.abs(pelaDum.igDias - pelaUsg.igDias);
  const regra = REDATAR_PELA_USG.find((r) => igNaUsg.semanas < r.ateSemanas)!;
  const redata = diferencaDias > regra.diferencaMaiorQueDias;
  return {
    usar: redata ? 'USG' : 'DUM',
    diferencaDias,
    escolhida: redata ? pelaUsg : pelaDum,
    motivo: `${regra.texto} → diferença de ${diferencaDias} dia(s): ${redata ? 'vale a USG' : 'mantém a DUM'}.`,
  };
}
