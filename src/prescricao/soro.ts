/**
 * Montador de soro (seção 4 da folha), sem tela.
 * O aluno junta soluções (SG, glicose hipertônica, NaCl, KCl...) e escreve as contas;
 * o programa calcula volume, vazão, VIG, sódio e potássio por kg por dia, concentrações e
 * osmolaridade aproximada, e confere o que o aluno escreveu.
 *
 * As contas são matemática sobre as concentrações de src/dados/solucoes.ts (A VALIDAR):
 * por isso são sempre conferidas. Metas (quanto de Na/K/VIG dar) só aparecem como referência.
 */

import { conferirValor, hollidaySegarMlDia, type Tolerancia } from '../calculos';
import { REFERENCIAS_SORO, type Solucao, SOLUCOES } from '../dados/solucoes';
import { formatarNumero, lerNumero, type Verificacao } from './comum';

export interface ComponenteSoro {
  solucaoId: string;
  volumeMl: string;
}

export interface CamposSoro {
  componentes: ComponenteSoro[];
  /** Tempo para correr o soro (h). */
  horas: string;
  /** Respostas do aluno (opcionais, mas a vazão é obrigatória para administrar). */
  vazaoMlH: string;
  vig: string;
  sodioMEqKgDia: string;
  potassioMEqKgDia: string;
}

export function soroVazio(): CamposSoro {
  return {
    componentes: [{ solucaoId: 'sg5', volumeMl: '' }],
    horas: '24',
    vazaoMlH: '',
    vig: '',
    sodioMEqKgDia: '',
    potassioMEqKgDia: '',
  };
}

export interface ResumoSoro {
  volumeTotalMl: number;
  horas: number;
  vazaoMlH: number;
  glicoseG: number;
  glicosePct: number;
  vigMgKgMin: number;
  sodioMEq: number;
  potassioMEq: number;
  calcioMEq: number;
  /** Por kg por dia, supondo que o soro se repete até completar 24 h. */
  sodioMEqKgDia: number;
  potassioMEqKgDia: number;
  sodioMEqL: number;
  potassioMEqL: number;
  /** Aproximada: glicose (g/L × 1000 ÷ 180) + 2 × (Na + K) + Ca, em mOsm/L. */
  osmolaridade: number;
  /** Holliday-Segar para o peso (mL/dia), só como referência. */
  hollidaySegarMlDia: number;
}

/** Números do soro a partir de volumes já lidos. Devolve null se não houver volume. */
export function calcularSoro(
  componentes: readonly { solucao: Solucao; volumeMl: number }[],
  horas: number,
  pesoKg: number,
): ResumoSoro | null {
  const volumeTotalMl = componentes.reduce((soma, c) => soma + c.volumeMl, 0);
  if (!(volumeTotalMl > 0) || !(horas > 0) || !(pesoKg > 0)) return null;
  const somar = (f: (s: Solucao) => number | undefined) =>
    componentes.reduce((soma, c) => soma + (f(c.solucao) ?? 0) * c.volumeMl, 0);
  const glicoseG = somar((s) => (s.glicosePct !== undefined ? s.glicosePct / 100 : undefined));
  const sodioMEq = somar((s) => s.sodioMEqPorMl);
  const potassioMEq = somar((s) => s.potassioMEqPorMl);
  const calcioMEq = somar((s) => s.calcioMEqPorMl);
  const vazaoMlH = volumeTotalMl / horas;
  const glicosePct = (glicoseG / volumeTotalMl) * 100;
  const porDia = 24 / horas;
  const litros = volumeTotalMl / 1000;
  return {
    volumeTotalMl,
    horas,
    vazaoMlH,
    glicoseG,
    glicosePct,
    // VIG = vazão × % ÷ (6 × peso) (fórmula 5 de formulas.md)
    vigMgKgMin: (vazaoMlH * glicosePct) / (6 * pesoKg),
    sodioMEq,
    potassioMEq,
    calcioMEq,
    sodioMEqKgDia: (sodioMEq * porDia) / pesoKg,
    potassioMEqKgDia: (potassioMEq * porDia) / pesoKg,
    sodioMEqL: sodioMEq / litros,
    potassioMEqL: potassioMEq / litros,
    osmolaridade: ((glicoseG / litros) * 1000) / 180 + 2 * ((sodioMEq + potassioMEq) / litros) + calcioMEq / litros,
    hollidaySegarMlDia: hollidaySegarMlDia(pesoKg),
  };
}

export interface ResultadoSoro {
  resumo: ResumoSoro | null;
  faltando: string[];
  verificacoes: Verificacao[];
  completo: boolean;
}

/** Confere o soro montado pelo aluno. */
export function conferirSoro(campos: CamposSoro, pesoKg: number, tolerancia: Tolerancia): ResultadoSoro {
  const faltando: string[] = [];
  const verificacoes: Verificacao[] = [];
  let numerosValidos = true;

  const lidos: { solucao: Solucao; volumeMl: number }[] = [];
  campos.componentes.forEach((c, i) => {
    const solucao = SOLUCOES.find((s) => s.id === c.solucaoId);
    if (!solucao) {
      faltando.push(`solução ${i + 1}`);
      return;
    }
    if (c.volumeMl.trim() === '') {
      faltando.push(`volume de ${solucao.nome}`);
      return;
    }
    const v = lerNumero(c.volumeMl);
    if (v === null || v <= 0) {
      numerosValidos = false;
      verificacoes.push({ assunto: 'preenchimento', situacao: 'errado', texto: `Volume de ${solucao.nome} "${c.volumeMl}" não é um número maior que zero.` });
      return;
    }
    lidos.push({ solucao, volumeMl: v });
  });
  if (campos.componentes.length === 0) faltando.push('solução');

  const horas = lerNumero(campos.horas);
  if (campos.horas.trim() === '') faltando.push('tempo (h)');
  else if (horas === null || horas <= 0 || horas > 24) {
    numerosValidos = false;
    verificacoes.push({ assunto: 'preenchimento', situacao: 'errado', texto: `Tempo "${campos.horas}" deve ser de 0 a 24 h.` });
  }

  const resumo = horas !== null && horas > 0 && horas <= 24 ? calcularSoro(lidos, horas, pesoKg) : null;
  if (campos.vazaoMlH.trim() === '') faltando.push('vazão (mL/h)');

  if (resumo) {
    const conferir = (texto: string, esperado: number, oQue: string, unidade: string, conta: string, obrigatorio: boolean) => {
      if (texto.trim() === '') return;
      const valor = lerNumero(texto);
      if (valor === null || valor < 0) {
        if (obrigatorio) numerosValidos = false;
        verificacoes.push({ assunto: 'volume', situacao: 'errado', texto: `${oQue} "${texto}" não é um número.` });
        return;
      }
      const ok = conferirValor(valor, esperado, tolerancia).correto;
      verificacoes.push({
        assunto: 'volume',
        situacao: ok ? 'certo' : 'errado',
        texto: ok
          ? `${oQue} ${oQue === 'Vazão' || oQue === 'VIG' ? 'certa' : 'certo'}: ${conta}.`
          : `${oQue} não confere: ${conta} (você escreveu ${formatarNumero(valor)} ${unidade}).`,
      });
    };
    const r = resumo;
    const volumes = lidos.map((c) => formatarNumero(c.volumeMl)).join(' + ');
    conferir(
      campos.vazaoMlH,
      r.vazaoMlH,
      'Vazão',
      'mL/h',
      `(${volumes}) mL = ${formatarNumero(r.volumeTotalMl)} mL ÷ ${formatarNumero(r.horas)} h = ${formatarNumero(r.vazaoMlH)} mL/h`,
      true,
    );
    conferir(
      campos.vig,
      r.vigMgKgMin,
      'VIG',
      'mg/kg/min',
      `glicose ${formatarNumero(r.glicoseG)} g em ${formatarNumero(r.volumeTotalMl)} mL = ${formatarNumero(r.glicosePct)}%; ` +
        `${formatarNumero(r.vazaoMlH)} mL/h × ${formatarNumero(r.glicosePct)} ÷ (6 × ${formatarNumero(pesoKg)} kg) = ${formatarNumero(r.vigMgKgMin)} mg/kg/min`,
      false,
    );
    const porDia = r.horas === 24 ? '' : ` × (24 ÷ ${formatarNumero(r.horas)} h)`;
    conferir(
      campos.sodioMEqKgDia,
      r.sodioMEqKgDia,
      'Sódio',
      'mEq/kg/dia',
      `${formatarNumero(r.sodioMEq)} mEq${porDia} ÷ ${formatarNumero(pesoKg)} kg = ${formatarNumero(r.sodioMEqKgDia)} mEq/kg/dia`,
      false,
    );
    conferir(
      campos.potassioMEqKgDia,
      r.potassioMEqKgDia,
      'Potássio',
      'mEq/kg/dia',
      `${formatarNumero(r.potassioMEq)} mEq${porDia} ÷ ${formatarNumero(pesoKg)} kg = ${formatarNumero(r.potassioMEqKgDia)} mEq/kg/dia`,
      false,
    );

    // referências (A VALIDAR): só informam
    const ref = REFERENCIAS_SORO;
    const fora = (valor: number, faixa: { min: number; max: number }) => valor < faixa.min || valor > faixa.max;
    const avisos: string[] = [];
    if (r.sodioMEq > 0 && fora(r.sodioMEqKgDia, ref.sodioMEqKgDia)) avisos.push(`Na ${formatarNumero(r.sodioMEqKgDia)} mEq/kg/dia (ref. ${ref.sodioMEqKgDia.min}–${ref.sodioMEqKgDia.max})`);
    if (r.potassioMEq > 0 && fora(r.potassioMEqKgDia, ref.potassioMEqKgDia)) avisos.push(`K ${formatarNumero(r.potassioMEqKgDia)} mEq/kg/dia (ref. ${ref.potassioMEqKgDia.min}–${ref.potassioMEqKgDia.max})`);
    if (r.glicoseG > 0 && fora(r.vigMgKgMin, ref.vigMgKgMin)) avisos.push(`VIG ${formatarNumero(r.vigMgKgMin)} mg/kg/min (ref. ${ref.vigMgKgMin.min}–${ref.vigMgKgMin.max})`);
    if (avisos.length > 0) {
      verificacoes.push({ assunto: 'dose', situacao: 'a-validar', texto: `Fora da referência (A VALIDAR, não corrige): ${avisos.join('; ')}.` });
    }
    if (r.potassioMEqL > ref.potassioPerifericoMaxMEqL) {
      verificacoes.push({
        assunto: 'alerta',
        situacao: 'atencao',
        texto: `Potássio ${formatarNumero(r.potassioMEqL)} mEq/L no soro: acima de ${ref.potassioPerifericoMaxMEqL} mEq/L costuma exigir acesso central (A VALIDAR).`,
      });
    }
    const potassioPorKgH = r.potassioMEq / r.horas / pesoKg;
    if (potassioPorKgH > ref.potassioMaxMEqKgH) {
      verificacoes.push({
        assunto: 'alerta',
        situacao: 'atencao',
        texto: `Potássio correndo a ${formatarNumero(potassioPorKgH)} mEq/kg/h: acima de ${ref.potassioMaxMEqKgH} mEq/kg/h (A VALIDAR).`,
      });
    }
    if (r.osmolaridade > ref.osmolaridadePerifericaMax) {
      verificacoes.push({
        assunto: 'alerta',
        situacao: 'atencao',
        texto: `Osmolaridade aproximada ${formatarNumero(r.osmolaridade)} mOsm/L: acima de ${ref.osmolaridadePerifericaMax}, muitos serviços pedem acesso central (A VALIDAR).`,
      });
    }
  }

  return { resumo, faltando, verificacoes, completo: faltando.length === 0 && numerosValidos && resumo !== null };
}

/** Linha da folha: "SG 5% 500 mL + NaCl 20% 10 mL + KCl 19,1% 5 mL — EV em 24 h (21,5 mL/h)". */
export function textoDoSoro(campos: CamposSoro): string {
  const partes = campos.componentes
    .map((c) => {
      const s = SOLUCOES.find((x) => x.id === c.solucaoId);
      const v = lerNumero(c.volumeMl);
      return s && v !== null ? `${s.nome} ${formatarNumero(v)} mL` : '';
    })
    .filter(Boolean);
  if (partes.length === 0) return '';
  const horas = lerNumero(campos.horas);
  const vazao = lerNumero(campos.vazaoMlH);
  const tempo = horas !== null ? ` — EV em ${formatarNumero(horas)} h` : '';
  const bomba = vazao !== null ? ` (${formatarNumero(vazao)} mL/h)` : '';
  return `${partes.join(' + ')}${tempo}${bomba}`;
}
