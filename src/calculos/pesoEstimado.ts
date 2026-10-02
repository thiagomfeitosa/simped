/**
 * Peso estimado pela idade (emergência sem balança). Os coeficientes são DADOS, A VALIDAR,
 * em src/dados/peso-estimado-a-validar.ts.
 */
import { PESO_ESTIMADO_ANTIGA, PESO_ESTIMADO_APLS } from '../dados/peso-estimado-a-validar';
import { ErroDeCalculo } from './validacao';

export interface PesoEstimado {
  pesoKg: number;
  formula: string;
  conta: string;
}

/** APLS: lactente pela idade em meses; criança e escolar pela idade em anos (até 12 anos). */
export function pesoEstimadoApls(idadeMeses: number): PesoEstimado {
  if (!Number.isFinite(idadeMeses) || idadeMeses < 0) throw new ErroDeCalculo(`Idade inválida: ${idadeMeses} meses.`);
  const faixa = PESO_ESTIMADO_APLS.find((f) => idadeMeses <= f.ateMeses);
  if (!faixa) throw new ErroDeCalculo('A fórmula vale até 12 anos: acima disso, use o peso real (ou o de adulto).');
  const idade = faixa.usa === 'meses' ? idadeMeses : Math.floor(idadeMeses / 12);
  const pesoKg = faixa.multiplicador * idade + faixa.soma;
  const n = (x: number) => x.toLocaleString('pt-BR');
  return { pesoKg, formula: faixa.formula, conta: `(${n(faixa.multiplicador)} × ${n(idade)}) + ${n(faixa.soma)} = ${n(pesoKg)} kg` };
}

/** Fórmula antiga: (idade + 4) × 2, de 1 a 10 anos. Fora da faixa: null. */
export function pesoEstimadoAntigo(idadeAnos: number): PesoEstimado | null {
  if (idadeAnos < PESO_ESTIMADO_ANTIGA.deAnos || idadeAnos > PESO_ESTIMADO_ANTIGA.ateAnos) return null;
  const anos = Math.floor(idadeAnos);
  const pesoKg = (anos + 4) * 2;
  return { pesoKg, formula: PESO_ESTIMADO_ANTIGA.formula, conta: `(${anos} + 4) × 2 = ${pesoKg} kg` };
}
