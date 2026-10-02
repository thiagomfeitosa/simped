/**
 * Carteira de vacinação (sem tela): pela idade e pelas doses já tomadas, diz o que está em dia,
 * o que aplicar hoje, o que está atrasado, o que já passou da idade e o que vem depois.
 * Regra simples (A VALIDAR): numa série (ex.: pentavalente), só a próxima dose não tomada
 * pode ser aplicada hoje — as seguintes esperam o intervalo.
 * Dados: src/dados/atencao-basica/vacinas-a-validar.ts.
 */

import { CALENDARIO_PNI, type DoseVacina } from '../dados/atencao-basica/vacinas-a-validar';

export type SituacaoDose = 'tomada' | 'aplicar-hoje' | 'atrasada' | 'aguardar-intervalo' | 'perdeu-a-idade' | 'futura';

export const NOME_SITUACAO: Record<SituacaoDose, string> = {
  tomada: 'Tomada',
  'aplicar-hoje': 'Aplicar hoje',
  atrasada: 'Atrasada — aplicar hoje',
  'aguardar-intervalo': 'Atrasada — depois da dose anterior',
  'perdeu-a-idade': 'Passou da idade (não aplicar)',
  futura: 'Próximas',
};

/** Tolerância (meses) para considerar a dose "atrasada" e não só "do dia". */
const MARGEM_ATRASO_MESES = 1;

export interface LinhaCarteira {
  dose: DoseVacina;
  situacao: SituacaoDose;
}

export function situacaoDasDoses(idadeMeses: number, tomadas: ReadonlySet<string>, calendario: readonly DoseVacina[] = CALENDARIO_PNI): LinhaCarteira[] {
  const passou = (d: DoseVacina) => d.idadeMaximaMeses !== undefined && idadeMeses > d.idadeMaximaMeses;
  // série que perdeu a 1ª dose não começa mais (ex.: rotavírus depois de 3 meses e 15 dias)
  const seriesPerdidas = new Set<string>();
  const proximaDaSerie = new Map<string, string>();
  for (const d of calendario) {
    if (tomadas.has(d.id) || seriesPerdidas.has(d.serie) || proximaDaSerie.has(d.serie)) continue;
    if (passou(d)) {
      if (!calendario.some((x) => x.serie === d.serie && tomadas.has(x.id))) seriesPerdidas.add(d.serie);
      continue;
    }
    proximaDaSerie.set(d.serie, d.id);
  }
  return calendario.map((d) => {
    let situacao: SituacaoDose;
    if (tomadas.has(d.id)) situacao = 'tomada';
    else if (passou(d) || seriesPerdidas.has(d.serie)) situacao = 'perdeu-a-idade';
    else if (idadeMeses < d.idadeMeses) situacao = 'futura';
    else if (proximaDaSerie.get(d.serie) !== d.id) situacao = 'aguardar-intervalo';
    else situacao = idadeMeses >= d.idadeMeses + MARGEM_ATRASO_MESES ? 'atrasada' : 'aplicar-hoje';
    return { dose: d, situacao };
  });
}

/** Doses para aplicar hoje (em dia ou atrasadas, sem as que aguardam intervalo). */
export function dosesDeHoje(idadeMeses: number, tomadas: ReadonlySet<string>): string[] {
  return situacaoDasDoses(idadeMeses, tomadas)
    .filter((l) => l.situacao === 'aplicar-hoje' || l.situacao === 'atrasada')
    .map((l) => l.dose.id);
}

/** Uma criança para treinar: idade sorteada e algumas doses esquecidas. */
export function sortearCarteira(sorteio: () => number): { idadeMeses: number; tomadas: Set<string> } {
  const idades = [2, 3, 4, 5, 6, 7, 9, 12, 13, 15, 18, 48, 50, 110, 135];
  const idadeMeses = idades[Math.floor(sorteio() * idades.length)] ?? 12;
  const tomadas = new Set<string>();
  for (const d of CALENDARIO_PNI) {
    if (d.idadeMeses > idadeMeses || d.id === 'gripe' || d.id.startsWith('covid')) continue;
    // a dose mais recente tem mais chance de faltar
    const recente = idadeMeses - d.idadeMeses <= 1;
    if (sorteio() > (recente ? 0.55 : 0.18)) tomadas.add(d.id);
  }
  return { idadeMeses, tomadas };
}

/** Confere as doses que o aluno marcou para aplicar hoje. */
export function conferirDosesDeHoje(idadeMeses: number, tomadas: ReadonlySet<string>, marcadas: ReadonlySet<string>): { certas: string[]; faltaram: string[]; aMais: string[] } {
  const devidas = new Set(dosesDeHoje(idadeMeses, tomadas).filter((id) => id !== 'gripe' && !id.startsWith('covid')));
  return {
    certas: [...marcadas].filter((id) => devidas.has(id)),
    faltaram: [...devidas].filter((id) => !marcadas.has(id)),
    aMais: [...marcadas].filter((id) => !devidas.has(id)),
  };
}

export function textoIdadeMeses(meses: number): string {
  if (meses === 0) return 'ao nascer';
  if (meses < 24) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  return resto ? `${anos} anos e ${resto} meses` : `${anos} anos`;
}
