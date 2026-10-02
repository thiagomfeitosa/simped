/**
 * Vigilância do desenvolvimento (sem tela): faixa etária da criança, classificação no formato
 * da Caderneta da Criança / AIDPI e a conduta. Dados: src/dados/atencao-basica/desenvolvimento-a-validar.ts.
 *
 * Classificação (A VALIDAR):
 * - Provável atraso: falta 1+ marco da faixa ANTERIOR (olhada só quando falta marco da faixa atual),
 *   ou PC fora de −2/+2 z, ou 3+ alterações fenotípicas;
 * - Alerta para o desenvolvimento: falta 1+ marco da faixa da criança;
 * - Adequado com fatores de risco: todos os marcos presentes, mas há fator de risco;
 * - Adequado: todos os marcos presentes e nenhum fator de risco.
 */

import { FAIXAS_DNPM, type FaixaDesenvolvimento } from '../dados/atencao-basica/desenvolvimento-a-validar';

export type ClassificacaoDnpm = 'provavel-atraso' | 'alerta' | 'adequado-com-risco' | 'adequado';

export const TEXTO_CLASSIFICACAO: Record<ClassificacaoDnpm, { nome: string; conduta: string; tom: 'perigo' | 'atencao' | 'normal' }> = {
  'provavel-atraso': { nome: 'Provável atraso no desenvolvimento', conduta: 'Referir para avaliação neuropsicomotora (equipe especializada); orientar a família.', tom: 'perigo' },
  alerta: { nome: 'Alerta para o desenvolvimento', conduta: 'Orientar a estimulação em casa e marcar retorno em 30 dias; se continuar, encaminhar.', tom: 'atencao' },
  'adequado-com-risco': { nome: 'Desenvolvimento adequado com fatores de risco', conduta: 'Elogiar, orientar a estimulação e os sinais de alerta; retorno mais próximo.', tom: 'atencao' },
  adequado: { nome: 'Desenvolvimento adequado', conduta: 'Elogiar a família, orientar a estimulação; próxima consulta de rotina.', tom: 'normal' },
};

export function faixaDaIdade(idadeMeses: number): FaixaDesenvolvimento {
  return FAIXAS_DNPM.find((f) => idadeMeses >= f.deMeses && idadeMeses < f.ateMeses) ?? FAIXAS_DNPM[FAIXAS_DNPM.length - 1]!;
}

export function faixaAnterior(faixa: FaixaDesenvolvimento): FaixaDesenvolvimento | undefined {
  const i = FAIXAS_DNPM.indexOf(faixa);
  return i > 0 ? FAIXAS_DNPM[i - 1] : undefined;
}

export interface AvaliacaoDnpm {
  idadeMeses: number;
  /** Marcos presentes (ids). */
  presentes: ReadonlySet<string>;
  fatoresDeRisco: number;
  perimetroCefalicoAlterado?: boolean;
  alteracoesFenotipicas?: number;
}

export function classificarDesenvolvimento(a: AvaliacaoDnpm): { classificacao: ClassificacaoDnpm; faixa: FaixaDesenvolvimento; faltamDaFaixa: string[]; faltamDaAnterior: string[] } {
  const faixa = faixaDaIdade(a.idadeMeses);
  const anterior = faixaAnterior(faixa);
  const faltamDaFaixa = faixa.marcos.filter((m) => !a.presentes.has(m.id)).map((m) => m.texto);
  // a faixa anterior só é olhada quando falta algum marco da faixa da criança (como na Caderneta/AIDPI)
  const faltamDaAnterior = anterior && faltamDaFaixa.length > 0 ? anterior.marcos.filter((m) => !a.presentes.has(m.id)).map((m) => m.texto) : [];
  let classificacao: ClassificacaoDnpm;
  if (faltamDaAnterior.length > 0 || a.perimetroCefalicoAlterado || (a.alteracoesFenotipicas ?? 0) >= 3) classificacao = 'provavel-atraso';
  else if (faltamDaFaixa.length > 0) classificacao = 'alerta';
  else if (a.fatoresDeRisco > 0) classificacao = 'adequado-com-risco';
  else classificacao = 'adequado';
  return { classificacao, faixa, faltamDaFaixa, faltamDaAnterior };
}
