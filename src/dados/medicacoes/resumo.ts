/**
 * Resumo do banco de medicações (sem tela): quanto já foi conferido e a lista do que falta validar.
 */

import { textoCondicoes } from './consulta';
import type { Medicacao, RegraDeDose } from './tipos';

export interface ResumoBanco {
  medicacoes: number;
  apresentacoes: number;
  apresentacoesConferidas: number;
  regras: number;
  regrasConferidas: number;
}

export function resumirBanco(banco: readonly Medicacao[]): ResumoBanco {
  const aps = banco.flatMap((m) => m.apresentacoes);
  const regras = banco.flatMap((m) => m.regras);
  return {
    medicacoes: banco.length,
    apresentacoes: aps.length,
    apresentacoesConferidas: aps.filter((a) => a.status === 'CONFERIDO').length,
    regras: regras.length,
    regrasConferidas: regras.filter((r) => r.status === 'CONFERIDO').length,
  };
}

/** "10–25 mg/kg/dose (máx. 4.000 mg/dia)". */
export function textoDaRegra(r: RegraDeDose): string {
  const d = r.dose;
  if (d.tipo === 'texto') return d.descricao;
  const pt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
  const faixa = d.min === d.max ? pt(d.min) : `${pt(d.min)}–${pt(d.max)}`;
  const por = d.tipo === 'porKg' ? '/kg' : d.tipo === 'porM2' ? '/m²' : '';
  const maxima = r.doseMaxima ? ` (máx. ${pt(r.doseMaxima.valor)} ${r.doseMaxima.unidade}/${r.doseMaxima.por})` : '';
  return `${faixa} ${d.unidade}${por}/${d.por}${maxima}`;
}

function csv(celula: string): string {
  return /[;"\n]/.test(celula) ? `"${celula.replace(/"/g, '""')}"` : celula;
}

/**
 * Lista do que falta validar, em CSV (abre no Excel; separador ";").
 * Uma linha por apresentação ou regra A VALIDAR, com o que conferir e onde.
 */
export function listaAValidarCsv(banco: readonly Medicacao[]): string {
  const linhas = [['Medicação', 'Tipo', 'Item', 'Valor atual (A VALIDAR)', 'Fonte provável', 'Conferido? (S/N)', 'Fonte conferida e página'].join(';')];
  for (const m of banco) {
    for (const a of m.apresentacoes.filter((x) => x.status === 'A_VALIDAR')) {
      const conc = a.concentracaoPorMl ? `${a.concentracaoPorMl.valor} ${a.concentracaoPorMl.unidade}/mL` : a.quantidade ? `${a.quantidade.valor} ${a.quantidade.unidade}` : '';
      linhas.push([m.nome, 'Apresentação', a.descricao, conc, a.fonte?.codigo ?? '', '', ''].map(csv).join(';'));
    }
    for (const r of m.regras.filter((x) => x.status === 'A_VALIDAR')) {
      const cond = textoCondicoes(r.condicoes);
      const item = `${r.indicacao} — ${r.faixas.join('/')}${cond ? ` (${cond})` : ''} — ${r.vias.join('/')}`;
      const intervalo = r.intervalosHoras ? ` · ${r.intervalosHoras.map((h) => `${h}/${h}h`).join(' ou ')}` : '';
      linhas.push([m.nome, 'Dose', item, `${textoDaRegra(r)}${intervalo}`, r.fonte.codigo, '', ''].map(csv).join(';'));
    }
  }
  return linhas.join('\n');
}
