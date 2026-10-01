/**
 * Funções que leem o banco: escolher a regra pela fonte preferida e verificar a integridade dos dados.
 */

import type {
  CodigoFonte,
  CondicoesDaRegra,
  FaixaEtaria,
  FaixaNumerica,
  Medicacao,
  RegraDeDose,
  VariaveisParaRegra,
} from './tipos';

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
  variaveis?: VariaveisParaRegra,
): RegrasEscolhidas {
  const candidatas = medicacao.regras.filter(
    (r) => r.indicacao === indicacao && regraValeParaPaciente(r, faixa, variaveis),
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

const NOME_CONDICAO: Record<keyof CondicoesDaRegra, [string, string]> = {
  idadeHoras: ['idade', 'h de vida'],
  idadeDias: ['idade', 'dias de vida'],
  idadeMeses: ['idade', 'meses'],
  idadeAnos: ['idade', 'anos'],
  igNascerSemanas: ['IG ao nascer', 'semanas'],
  idadePosMenstrualSemanas: ['idade pós-menstrual', 'semanas'],
  pesoKg: ['peso', 'kg'],
};

function dentroDaFaixa(valor: number, faixa: FaixaNumerica): boolean {
  return (faixa.de === undefined || valor >= faixa.de) && (faixa.ate === undefined || valor < faixa.ate);
}

/**
 * A regra vale para este paciente? Confere a faixa etária e, se a regra tiver condições numéricas
 * e as variáveis forem informadas, cada condição (idade em dias, IG, peso...).
 */
export function regraValeParaPaciente(
  regra: RegraDeDose,
  faixa: FaixaEtaria,
  variaveis?: VariaveisParaRegra,
): boolean {
  if (!regra.faixas.includes(faixa)) return false;
  return condicoesValem(regra.condicoes, variaveis);
}

/** Todas as condições numéricas valem para estas variáveis? Sem condições ou sem variáveis: vale. */
export function condicoesValem(condicoes: CondicoesDaRegra | undefined, variaveis: VariaveisParaRegra | undefined): boolean {
  if (!condicoes || !variaveis) return true;
  return (Object.entries(condicoes) as [keyof CondicoesDaRegra, FaixaNumerica][]).every(([nome, f]) =>
    dentroDaFaixa(variaveis[nome], f),
  );
}

/** Ex.: "idade < 7 dias de vida", "peso 2 a < 3 kg". */
export function textoCondicoes(condicoes: CondicoesDaRegra | undefined): string {
  if (!condicoes) return '';
  return (Object.entries(condicoes) as [keyof CondicoesDaRegra, FaixaNumerica][])
    .map(([nome, f]) => {
      const [rotulo, unidade] = NOME_CONDICAO[nome];
      if (f.de !== undefined && f.ate !== undefined) return `${rotulo} ${f.de} a < ${f.ate} ${unidade}`;
      if (f.de !== undefined) return `${rotulo} ≥ ${f.de} ${unidade}`;
      if (f.ate !== undefined) return `${rotulo} < ${f.ate} ${unidade}`;
      return '';
    })
    .filter(Boolean)
    .join(' e ');
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
  const codigos = new Set<string>();

  for (const med of medicacoes) {
    if (idsMedicacao.has(med.id)) problemas.push(`Medicação repetida: ${med.id}.`);
    idsMedicacao.add(med.id);
    if (med.codigo !== undefined) {
      const codigo = med.codigo.trim().toUpperCase();
      if (!codigo) problemas.push(`${med.id}: código vazio.`);
      else if (codigos.has(codigo)) problemas.push(`${med.id}: código "${med.codigo}" repetido (é o Nº da planilha).`);
      codigos.add(codigo);
    }

    const idsInternos = new Set<string>();
    for (const item of [...med.apresentacoes, ...med.regras]) {
      if (idsInternos.has(item.id)) problemas.push(`${med.id}: id repetido "${item.id}".`);
      idsInternos.add(item.id);
    }

    for (const ap of med.apresentacoes) {
      if (ap.status === 'CONFERIDO' && !ap.fonte?.documento && !ap.fonte?.documentoId) {
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
      if (regra.status === 'CONFERIDO' && !regra.fonte.documento && !regra.fonte.documentoId) {
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
      for (const [nome, f] of Object.entries(regra.condicoes ?? {}) as [string, FaixaNumerica][]) {
        if (f.de === undefined && f.ate === undefined) problemas.push(`${onde}: condição ${nome} vazia.`);
        if (f.de !== undefined && f.ate !== undefined && f.de >= f.ate) {
          problemas.push(`${onde}: condição ${nome} com "de" maior ou igual ao "até".`);
        }
      }
      if (regra.doseMaxima && regra.doseMaxima.valor <= 0) {
        problemas.push(`${onde}: dose máxima deve ser maior que zero.`);
      }
    }
  }
  return problemas;
}
