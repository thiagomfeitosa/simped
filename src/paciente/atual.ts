/**
 * O paciente "agora": dados de origem do caso + variáveis calculadas no minuto atual do relógio do caso.
 * É isso que as telas e a conferência da prescrição usam (faixa, idade, peso).
 */

import type { CasoClinico, Paciente } from '../casos/tipos';
import type { FonteDeFaixa } from '../dados/faixas-etarias';
import type { FaixaEtaria } from '../dados/medicacoes/tipos';
import { calcularVariaveis, somarMinutos, type VariaveisCalculadas } from './variaveis';

export interface PacienteAtual extends Paciente {
  /** Instante atual do caso (início + minutos do relógio). */
  agora: Date;
  variaveis: VariaveisCalculadas;
  /** Atalhos usados por várias telas. */
  faixa: FaixaEtaria;
  idadeTexto: string;
}

export function pacienteNoMinuto(caso: CasoClinico, tempoMin: number, fonteDaFaixa: FonteDeFaixa = 'SBP'): PacienteAtual {
  const agora = somarMinutos(caso.inicio, tempoMin);
  const variaveis = calcularVariaveis(caso.paciente, agora, fonteDaFaixa);
  return { ...caso.paciente, agora, variaveis, faixa: variaveis.faixa, idadeTexto: variaveis.idadeTexto };
}
