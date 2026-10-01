/**
 * Funções que leem o banco: escolher a regra pela fonte preferida e verificar a integridade dos dados.
 */

import type { CodigoFonte, FaixaEtaria, Medicacao, RegraDeDose } from './tipos';

export const FONTE_PADRAO: CodigoFonte = 'SBP';

export interface RegrasEscolhidas {
  regras: RegraDeDose[];
  /** Fonte de onde vieram as regras devolvidas (ou undefined se não houver nenhuma). */
  fonteUsada?: CodigoFonte;
  /** Avisos para mostrar ao aluno (ex.: caiu para a SBP; fontes divergem). */
  avisos: string[];
}

/**
 * Regras de uma indicação para uma faixa etária, seguindo a fonte escolhida (docs/fase-0/fontes.md):
 * 1. usa a fonte preferida;
 * 2. se ela não tiver valor, cai para a SBP e avisa;
 * 3. se nem a SBP tiver, usa a primeira fonte disponível e avisa;
 * 4. avisa quando existe mais de uma fonte para o mesmo caso (possível divergência).
 */
export function escolherRegras(
  medicacao: Medicacao,
  indicacao: string,
  faixa: FaixaEtaria,
  fontePreferida: CodigoFonte = FONTE_PADRAO,
): RegrasEscolhidas {
  const candidatas = medicacao.regras.filter(
    (r) => r.indicacao === indicacao && r.faixas.includes(faixa),
  );
  if (candidatas.length === 0) {
    return { regras: [], avisos: [`Sem regra de dose para ${medicacao.nome} — ${indicacao} (${faixa}).`] };
  }

  const fontes = [...new Set(candidatas.map((r) => r.fonte.codigo))];
  const avisos: string[] = [];
  let fonteUsada: CodigoFonte;
  if (fontes.includes(fontePreferida)) {
    fonteUsada = fontePreferida;
  } else if (fontes.includes(FONTE_PADRAO)) {
    fonteUsada = FONTE_PADRAO;
    avisos.push(`A fonte ${fontePreferida} não tem este valor; usando ${FONTE_PADRAO}.`);
  } else {
    fonteUsada = fontes[0] as CodigoFonte;
    avisos.push(`A fonte ${fontePreferida} não tem este valor; usando ${fonteUsada}.`);
  }
  if (fontes.length > 1) {
    avisos.push(`Há mais de uma fonte para este caso (${fontes.join(', ')}): podem divergir.`);
  }

  const regras = candidatas.filter((r) => r.fonte.codigo === fonteUsada);
  if (regras.some((r) => r.status === 'A_VALIDAR')) {
    avisos.push('Dose de referência A VALIDAR: não é usada para corrigir o aluno.');
  }
  return { regras, fonteUsada, avisos };
}

/** Só valores conferidos e estruturados (não 'texto') podem corrigir o aluno. */
export function podeCorrigirAluno(regra: RegraDeDose): boolean {
  return regra.status === 'CONFERIDO' && regra.dose.tipo !== 'texto';
}

/**
 * Procura problemas nos dados (roda nos testes automáticos, então um erro de digitação
 * no banco faz o teste ficar vermelho). Devolve a lista de problemas encontrados.
 */
export function verificarBanco(medicacoes: readonly Medicacao[]): string[] {
  const problemas: string[] = [];
  const idsMedicacao = new Set<string>();

  for (const med of medicacoes) {
    if (idsMedicacao.has(med.id)) problemas.push(`Medicação repetida: ${med.id}.`);
    idsMedicacao.add(med.id);

    const idsInternos = new Set<string>();
    for (const item of [...med.apresentacoes, ...med.regras]) {
      if (idsInternos.has(item.id)) problemas.push(`${med.id}: id repetido "${item.id}".`);
      idsInternos.add(item.id);
    }

    for (const ap of med.apresentacoes) {
      if (ap.status === 'CONFERIDO' && !ap.fonte?.documento) {
        problemas.push(`${med.id}/${ap.id}: apresentação CONFERIDA sem documento de fonte.`);
      }
      if (ap.concentracaoPorMl && ap.concentracaoPorMl.valor <= 0) {
        problemas.push(`${med.id}/${ap.id}: concentração deve ser maior que zero.`);
      }
      if (ap.volumeMl !== undefined && ap.volumeMl <= 0) {
        problemas.push(`${med.id}/${ap.id}: volume deve ser maior que zero.`);
      }
    }

    for (const regra of med.regras) {
      const onde = `${med.id}/${regra.id}`;
      if (regra.status === 'CONFERIDO' && !regra.fonte.documento) {
        problemas.push(`${onde}: regra CONFERIDA sem documento de fonte.`);
      }
      if (regra.faixas.length === 0) problemas.push(`${onde}: sem faixa etária.`);
      if (regra.vias.length === 0) problemas.push(`${onde}: sem via.`);
      if (regra.dose.tipo !== 'texto') {
        if (regra.dose.min <= 0 || regra.dose.max <= 0) {
          problemas.push(`${onde}: dose deve ser maior que zero.`);
        }
        if (regra.dose.min > regra.dose.max) {
          problemas.push(`${onde}: dose mínima maior que a máxima.`);
        }
      }
      if (regra.doseMaxima && regra.doseMaxima.valor <= 0) {
        problemas.push(`${onde}: dose máxima deve ser maior que zero.`);
      }
    }
  }
  return problemas;
}
