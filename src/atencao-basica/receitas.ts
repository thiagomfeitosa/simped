/**
 * Receitas da atenção básica (sem tela): quanto dar por tomada (mg/UI), quanto medir
 * (mL, gotas, jatos, comprimidos), o texto da posologia e a conferência da resposta do aluno.
 * Dados (A VALIDAR): src/dados/atencao-basica/receitas-a-validar.ts.
 */

import { arredondar, conferirValor, type Tolerancia } from '../calculos';
import type { ItemReceita } from '../dados/atencao-basica/receitas-a-validar';

export interface ContaItem {
  /** Tomadas por dia (vazio = dose única / se necessário sem intervalo). */
  tomadasPorDia?: number;
  /** Dose por tomada (na unidade da apresentação: mg, UI, mcg). */
  dosePorTomada: number;
  /** A dose bateu no máximo. */
  limitada: boolean;
  /** Quanto medir por tomada. */
  medida?: { valor: number; unidade: 'mL' | 'gotas' | 'jatos' | 'comprimido(s)' | 'g de pó' };
  /** Conta por extenso. */
  passos: string[];
  /** Linha da receita ("Dar 6 mL de 8/8 h por 10 dias"). */
  posologia: string;
}

const n = (v: number) => arredondar(v, v < 1 ? 3 : v < 10 ? 2 : 1).toLocaleString('pt-BR');
const MEDIR: Record<string, string> = { oral: 'Dar', nasal: 'Aplicar', inalatória: 'Fazer', tópica: 'Aplicar', intramuscular: 'Aplicar' };

/** Faz a conta de um item da receita para o peso. Itens sem dose (tópicos, SRO) devolvem null. */
export function contaDoItem(item: ItemReceita, pesoKg: number): ContaItem | null {
  const d = item.dose;
  if (!d) return null;
  const ap = item.apresentacao;
  const u = ap.unidade;
  const tomadasPorDia = item.intervaloH ? 24 / item.intervaloH : undefined;
  const passos: string[] = [];
  let dose: number;
  let limitada = false;
  if (d.tipo === 'porKgDose') {
    dose = d.valor * pesoKg;
    passos.push(`${n(d.valor)} ${u}/kg/dose × ${n(pesoKg)} kg = ${n(dose)} ${u} por tomada`);
    if (d.maximoPorDose !== undefined && dose > d.maximoPorDose) {
      dose = d.maximoPorDose;
      limitada = true;
      passos.push(`passou do máximo: usar ${n(dose)} ${u}`);
    }
  } else if (d.tipo === 'porKgDia') {
    let dia = d.valor * pesoKg;
    passos.push(`${n(d.valor)} ${u}/kg/dia × ${n(pesoKg)} kg = ${n(dia)} ${u} por dia`);
    if (d.maximoPorDia !== undefined && dia > d.maximoPorDia) {
      dia = d.maximoPorDia;
      limitada = true;
      passos.push(`passou do máximo diário: usar ${n(dia)} ${u}/dia`);
    }
    const vezes = tomadasPorDia ?? 1;
    dose = dia / vezes;
    if (vezes > 1) passos.push(`${n(dia)} ÷ ${vezes} tomadas (de ${item.intervaloH}/${item.intervaloH} h) = ${n(dose)} ${u} por tomada`);
  } else {
    dose = d.valor;
    passos.push(`dose fixa: ${n(dose)} ${u} por tomada`);
  }

  let medida: ContaItem['medida'];
  if (ap.concentracao !== undefined) {
    const c = ap.concentracao;
    if (ap.forma === 'gotas') {
      const ml = dose / c;
      const gotas = ml * (ap.gotasPorMl ?? 20);
      passos.push(`${n(dose)} ${u} ÷ ${n(c)} ${u}/mL = ${n(ml)} mL × ${ap.gotasPorMl ?? 20} gotas/mL = ${n(gotas)} gotas`);
      medida = { valor: arredondar(gotas, 1), unidade: 'gotas' };
    } else if (ap.forma === 'spray') {
      const jatos = dose / c;
      passos.push(`${n(dose)} ${u} ÷ ${n(c)} ${u}/jato = ${n(jatos)} jatos`);
      medida = { valor: arredondar(jatos, 1), unidade: 'jatos' };
    } else if (ap.forma === 'comprimido') {
      const cps = dose / c;
      passos.push(`${n(dose)} ${u} ÷ ${n(c)} ${u}/comprimido = ${n(cps)} comprimido(s)`);
      medida = { valor: arredondar(cps, 2), unidade: 'comprimido(s)' };
    } else if (ap.forma === 'sache') {
      const g = dose / c;
      passos.push(`${n(dose)} ${u} = ${n(g)} g de pó`);
      medida = { valor: arredondar(g, 2), unidade: 'g de pó' };
    } else {
      const ml = dose / c;
      passos.push(`${n(dose)} ${u} ÷ ${n(c)} ${u}/mL = ${n(ml)} mL`);
      medida = { valor: arredondar(ml, 2), unidade: 'mL' };
    }
  }

  const intervalo = item.intervaloH ? (item.intervaloH === 24 ? '1 vez ao dia' : `de ${item.intervaloH}/${item.intervaloH} h`) : '';
  const quanto = medida ? `${n(medida.valor)} ${medida.unidade}` : `${n(dose)} ${u}`;
  const posologia = `${MEDIR[item.via] ?? 'Dar'} ${quanto}${medida ? ` (${n(dose)} ${u})` : ''} por via ${item.via}${intervalo ? `, ${intervalo}` : ''}, ${item.duracao}.`;
  return { ...(tomadasPorDia !== undefined && { tomadasPorDia }), dosePorTomada: arredondar(dose, 4), limitada, ...(medida && { medida }), passos, posologia };
}

export interface ConferenciaItem {
  doseCerta: boolean;
  medidaCerta: boolean;
  conta: ContaItem;
}

/** Confere a dose por tomada e a medida (mL/gotas/jatos) digitadas pelo aluno. */
export function conferirItem(item: ItemReceita, pesoKg: number, resposta: { dose: number | null; medida: number | null }, tolerancia: Tolerancia = { relativa: 0.05, absoluta: 0.05 }): ConferenciaItem | null {
  const conta = contaDoItem(item, pesoKg);
  if (!conta) return null;
  const doseCerta = resposta.dose !== null && conferirValor(resposta.dose, conta.dosePorTomada, tolerancia).correto;
  // gotas e jatos: aceita arredondar para o inteiro mais próximo
  const tolMedida = conta.medida?.unidade === 'gotas' || conta.medida?.unidade === 'jatos' ? { relativa: tolerancia.relativa, absoluta: 0.5 } : tolerancia;
  const medidaCerta = !conta.medida || (resposta.medida !== null && conferirValor(resposta.medida, conta.medida.valor, tolMedida).correto);
  return { doseCerta, medidaCerta, conta };
}
