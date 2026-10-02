/**
 * Exame do RN no alojamento conjunto (sem tela): sorteia um "RN virtual" com achados,
 * confere a classificação do aluno (normal / variação do normal / alterado),
 * interpreta o teste do coraçãozinho e soma os escores (Apgar, Silverman-Andersen).
 * Dados: src/dados/neonatal/exame-rn-a-validar.ts e escores-a-validar.ts (A VALIDAR).
 */

import {
  ACHADOS_RN,
  type AchadoRN,
  type AjusteCorpo,
  type CategoriaAchado,
  CORACAOZINHO,
  REGIOES_EXAME_RN,
  SINAIS_ALTERADOS_RN,
  SINAIS_VITAIS_RN,
} from '../dados/neonatal/exame-rn-a-validar';
import type { EscoreClinico, FaixaEscore } from '../dados/neonatal/escores-a-validar';
import type { Sexo } from './maturidade';

export type TomDePele = 'claro' | 'moreno' | 'negro';
export const TONS_DE_PELE: readonly TomDePele[] = ['claro', 'moreno', 'negro'];

export type Classificacao = 'normal' | CategoriaAchado;

export interface SinaisRN {
  fc: number;
  fr: number;
  temperatura: number;
}

export interface RnVirtual {
  semente: number;
  tom: TomDePele;
  sexo: Sexo;
  horasDeVida: number;
  sinais: SinaisRN;
  /** Sinal vital alterado sorteado (id de SINAIS_ALTERADOS_RN). */
  sinalAlterado?: string;
  /** Achado sorteado em cada região (null = normal). */
  achados: Record<string, string | null>;
}

/** Achados que mudam a cor do corpo todo: só um por RN. */
function mudaCor(a: AchadoRN): boolean {
  return !!(a.corpo?.cor || a.corpo?.ictericiaZona);
}

const entre = (sorteio: () => number, min: number, max: number) => min + sorteio() * (max - min);

/** Achados possíveis no exame (sem os "só no atlas"), por região e sexo. */
export function achadosSorteaveis(regiaoId: string, sexo: Sexo): AchadoRN[] {
  return ACHADOS_RN.filter((a) => a.regiao === regiaoId && !a.soNoAtlas && (!a.sexo || a.sexo === sexo));
}

/**
 * Sorteia um RN virtual. Cada região tem `chance` de ter um achado (variação ou alterado);
 * no máximo `maximoAchados` achados e um só que mude a cor do corpo.
 */
export function gerarRnVirtual(sorteio: () => number, semente = 0, opcoes: { chance?: number; maximoAchados?: number } = {}): RnVirtual {
  const chance = opcoes.chance ?? 0.32;
  const maximo = opcoes.maximoAchados ?? 4;
  const sexo: Sexo = sorteio() < 0.5 ? 'masculino' : 'feminino';
  const tom = (['claro', 'moreno', 'negro'] as const)[Math.floor(sorteio() * 3)] ?? 'moreno';
  const achados: Record<string, string | null> = {};
  let quantos = 0;
  let corUsada = false;
  let horasDeVida = Math.round(entre(sorteio, 24, 60));
  let horasFixas = false;
  let sinalAlterado: string | undefined;

  for (const r of REGIOES_EXAME_RN) {
    achados[r.id] = null;
    if (r.id === 'sinais-vitais') {
      if (sorteio() < chance * 0.6) sinalAlterado = SINAIS_ALTERADOS_RN[Math.floor(sorteio() * SINAIS_ALTERADOS_RN.length)]?.id;
      continue;
    }
    if (quantos >= maximo || sorteio() >= chance) continue;
    const possiveis = achadosSorteaveis(r.id, sexo).filter((a) => !(corUsada && mudaCor(a)) && !(horasFixas && a.horasDeVida !== undefined));
    const escolhido = possiveis[Math.floor(sorteio() * possiveis.length)];
    if (!escolhido) continue;
    achados[r.id] = escolhido.id;
    quantos += 1;
    if (mudaCor(escolhido)) corUsada = true;
    if (escolhido.horasDeVida !== undefined) {
      horasDeVida = escolhido.horasDeVida;
      horasFixas = true;
    }
  }

  const v = SINAIS_VITAIS_RN;
  const alterado = SINAIS_ALTERADOS_RN.find((s) => s.id === sinalAlterado);
  const sinais: SinaisRN = {
    fc: alterado?.fc ?? Math.round(entre(sorteio, v.fc.min + 5, v.fc.max - 5)),
    fr: alterado?.fr ?? Math.round(entre(sorteio, v.fr.min + 2, v.fr.max - 4)),
    temperatura: alterado?.temperatura ?? Math.round(entre(sorteio, v.temperatura.min + 0.1, v.temperatura.max - 0.1) * 10) / 10,
  };
  // desconforto respiratório sorteado no tórax: a FR combina com a descrição
  if (achados.torax === 'desconforto-respiratorio') sinais.fr = Math.max(sinais.fr, 74);
  return { semente, tom, sexo, horasDeVida, sinais, ...(sinalAlterado && { sinalAlterado }), achados };
}

export function achadoPorId(id: string | null | undefined): AchadoRN | undefined {
  return id ? ACHADOS_RN.find((a) => a.id === id) : undefined;
}

/** Classificação certa de uma região do RN virtual. */
export function classificacaoEsperada(rn: RnVirtual, regiaoId: string): Classificacao {
  if (regiaoId === 'sinais-vitais') return rn.sinalAlterado || avaliarSinais(rn.sinais).length > 0 ? 'alterado' : 'normal';
  return achadoPorId(rn.achados[regiaoId])?.categoria ?? 'normal';
}

export interface ConferenciaRegiao {
  regiaoId: string;
  resposta?: Classificacao;
  esperado: Classificacao;
  certo: boolean;
  achado?: AchadoRN;
  urgente: boolean;
}

/** Confere todas as regiões respondidas (e marca as urgências não percebidas). */
export function conferirExame(rn: RnVirtual, respostas: Readonly<Record<string, Classificacao>>): { regioes: ConferenciaRegiao[]; acertos: number; respondidas: number; urgenciasPerdidas: string[] } {
  const regioes = REGIOES_EXAME_RN.map((r): ConferenciaRegiao => {
    const esperado = classificacaoEsperada(rn, r.id);
    const achado = achadoPorId(rn.achados[r.id]);
    const resposta = respostas[r.id];
    return {
      regiaoId: r.id,
      ...(resposta && { resposta }),
      esperado,
      certo: resposta === esperado,
      ...(achado && { achado }),
      urgente: !!achado?.urgente,
    };
  });
  const respondidas = regioes.filter((r) => r.resposta);
  return {
    regioes,
    acertos: respondidas.filter((r) => r.certo).length,
    respondidas: respondidas.length,
    urgenciasPerdidas: regioes.filter((r) => r.urgente && r.resposta && r.resposta !== 'alterado').map((r) => r.achado!.nome),
  };
}

/** Como o corpo inteiro deve ser desenhado (soma dos ajustes dos achados sorteados). */
export function ajusteDoCorpo(rn: RnVirtual): AjusteCorpo {
  return Object.values(rn.achados).reduce<AjusteCorpo>((soma, id) => ({ ...soma, ...(achadoPorId(id)?.corpo ?? {}) }), {});
}

// ---- Teste do coraçãozinho -------------------------------------------------------------

export type ResultadoCoracaozinho = 'normal' | 'repetir' | 'alterado';

export function interpretarCoracaozinho(maoDireita: number, pe: number, tentativa: 1 | 2): { resultado: ResultadoCoracaozinho; texto: string } {
  const diferenca = Math.abs(maoDireita - pe);
  const normal = maoDireita >= CORACAOZINHO.minimo && pe >= CORACAOZINHO.minimo && diferenca < CORACAOZINHO.diferencaMaxima;
  if (normal) return { resultado: 'normal', texto: `Normal: as duas ≥ ${CORACAOZINHO.minimo}% e diferença de ${diferenca}% (< ${CORACAOZINHO.diferencaMaxima}%).` };
  const motivo = maoDireita < CORACAOZINHO.minimo || pe < CORACAOZINHO.minimo ? `SpO₂ abaixo de ${CORACAOZINHO.minimo}%` : `diferença de ${diferenca}% (≥ ${CORACAOZINHO.diferencaMaxima}%)`;
  return tentativa === 1
    ? { resultado: 'repetir', texto: `Alterado na 1ª medida (${motivo}): repetir em 1 hora.` }
    : { resultado: 'alterado', texto: `Alterado de novo (${motivo}): não dar alta; ecocardiograma em até 24 h.` };
}

// ---- Sinais vitais ---------------------------------------------------------------------

export function avaliarSinais(s: SinaisRN): string[] {
  const v = SINAIS_VITAIS_RN;
  const fora: string[] = [];
  if (s.fc < v.fc.min) fora.push(`FC ${s.fc} bpm abaixo de ${v.fc.min}`);
  if (s.fc > v.fc.max) fora.push(`FC ${s.fc} bpm acima de ${v.fc.max}`);
  if (s.fr < v.fr.min) fora.push(`FR ${s.fr} irpm abaixo de ${v.fr.min}`);
  if (s.fr > v.fr.max) fora.push(`FR ${s.fr} irpm acima de ${v.fr.max}`);
  if (s.temperatura < v.temperatura.min) fora.push(`T ${String(s.temperatura).replace('.', ',')} °C abaixo de ${String(v.temperatura.min).replace('.', ',')}`);
  if (s.temperatura > v.temperatura.max) fora.push(`T ${String(s.temperatura).replace('.', ',')} °C acima de ${String(v.temperatura.max).replace('.', ',')}`);
  return fora;
}

// ---- Escores somados (Apgar, Silverman) ---------------------------------------------

export function somarEscore(escore: EscoreClinico, respostas: Readonly<Record<string, number>>): { pontos: number; completo: boolean; faixa?: FaixaEscore } {
  const completo = escore.criterios.every((c) => respostas[c.id] !== undefined);
  const pontos = escore.criterios.reduce((s, c) => s + (respostas[c.id] ?? 0), 0);
  const faixa = escore.faixas.find((f) => pontos >= f.de && pontos <= f.ate);
  return { pontos, completo, ...(faixa && { faixa }) };
}
