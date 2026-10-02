/**
 * Fase 2 — exames ligados ao paciente (sem tela).
 *
 * O caso traz os exames da ADMISSÃO (src/casos/clinicos/). Depois, o que acontece no caso
 * (insulina na cetoacidose, bicarbonato, convulsão…) mexe nas variáveis de laboratório do
 * motor do paciente, e o exame colhido mais tarde mostra:
 *   valor da admissão + quanto a variável mudou desde o início.
 * Sem nada acontecer, o resultado é exatamente o do arquivo do caso.
 *
 * O pH e o BE são calculados (química, não dose):
 * - pH: Henderson-Hasselbalch, pH = 6,1 + log₁₀(HCO₃⁻ ÷ (0,0307 × pCO₂)). Para manter o pH do caso
 *   na admissão, o que muda é a DIFERENÇA: pH = pH do caso + log₁₀(HCO₃⁻/HCO₃⁻ do caso) − log₁₀(pCO₂/pCO₂ do caso).
 * - BE (Van Slyke simplificada): BE = 0,93 × (HCO₃⁻ − 24,4 + 14,8 × (pH − 7,4)).
 * Glicose sérica e SatO₂ acompanham a glicemia capilar e a SpO₂ do monitor.
 */

import { type CasoClinico, type SinaisVitais, VARIAVEIS_LAB, type VariavelLab } from '../casos/tipos';
import { examePorId } from '../dados/exames';
import { LAB_NORMAL, ORIGEM_LAB, PCO2_NORMAL } from '../dados/laboratorio-dinamico';
import { oxigenar, po2DaSaturacao } from './oxigenacao';
import type { EstadoPaciente } from './paciente';

export type ValoresLab = Record<VariavelLab, number>;

const EH_LAB = new Set<string>(VARIAVEIS_LAB);

/** Valor da admissão de uma variável no caso (do 1º exame que a informa), se houver. */
function valorDoCaso(caso: CasoClinico, variavel: VariavelLab): number | undefined {
  for (const exameId of ORIGEM_LAB[variavel]) {
    const v = caso.resultadosExames?.[exameId]?.valores?.[variavel];
    if (v !== undefined) return v;
  }
  return undefined;
}

/** Laboratório no início do caso: os exames da admissão; o que o caso não informa parte do normal (A VALIDAR). */
export function labInicial(caso: CasoClinico): ValoresLab {
  return Object.fromEntries(VARIAVEIS_LAB.map((v) => [v, valorDoCaso(caso, v) ?? LAB_NORMAL[v]])) as ValoresLab;
}

/**
 * Valor de partida de uma variável num exame que o caso NÃO traz (ex.: pediram gasometria arterial
 * e o caso só tem a venosa): o valor da admissão que existir (a pCO₂ ajustada entre venosa e arterial)
 * ou, se o caso não tiver nenhum, o normal (A VALIDAR).
 */
function baseParaExame(caso: CasoClinico, variavel: VariavelLab, exameId: string): number {
  const ehGaso = (id: string): id is keyof typeof PCO2_NORMAL => id in PCO2_NORMAL;
  const origem = ORIGEM_LAB[variavel].find((e) => caso.resultadosExames?.[e]?.valores?.[variavel] !== undefined);
  if (origem) {
    const valor = caso.resultadosExames![origem]!.valores![variavel]!;
    return variavel === 'pco2' && ehGaso(origem) && ehGaso(exameId) ? valor - PCO2_NORMAL[origem] + PCO2_NORMAL[exameId] : valor;
  }
  return variavel === 'pco2' && ehGaso(exameId) ? PCO2_NORMAL[exameId] : LAB_NORMAL[variavel];
}

/** pH pela equação de Henderson-Hasselbalch (HCO₃⁻ em mEq/L, pCO₂ em mmHg). */
export function phHendersonHasselbalch(hco3: number, pco2: number): number {
  return 6.1 + Math.log10(hco3 / (0.0307 * pco2));
}

/** Excesso de bases (Van Slyke simplificada). */
export function excessoDeBases(hco3: number, ph: number): number {
  return 0.93 * (hco3 - 24.4 + 14.8 * (ph - 7.4));
}

function arred(valor: number, casas: number): number {
  const f = 10 ** casas;
  return Math.round(valor * f) / f;
}

const CASAS: Record<string, number> = { ph: 2, pco2: 1, hco3: 1, be: 1, lactato: 1, k: 1, na: 0, cl: 0, bhb: 1, glicose: 0, sato2: 0, po2: 0 };

/**
 * Valores de um exame colhido com o paciente no estado `naColeta`.
 * Devolve só os analitos que têm valor (do caso ou porque mudaram); objeto vazio = nada a mostrar.
 */
export function valoresNaColeta(
  exameId: string,
  caso: CasoClinico,
  naColeta: Pick<EstadoPaciente, 'lab' | 'sinais'> & Partial<Pick<EstadoPaciente, 'oxigenio' | 'clinico'>>,
): Record<string, number> {
  const exame = examePorId(exameId);
  if (!exame) return {};
  const doCaso = caso.resultadosExames?.[exameId]?.valores ?? {};
  const inicio = labInicial(caso);
  const sinaisIniciais: Partial<SinaisVitais> = caso.sinaisIniciais;
  const ids = new Set(exame.analitos.map((a) => a.id));
  // oxigenação na coleta (SatO₂ e pO₂ da gasometria arterial)
  const oxi = oxigenar({
    spo2Ar: naColeta.sinais.spo2,
    oxigenio: naColeta.oxigenio ?? { dispositivo: 'ar', fio2: 0.21 },
    pco2: naColeta.lab.pco2,
    padrao: naColeta.clinico?.padraoRespiratorio ?? 'normal',
  });
  const mudouOxi = (naColeta.oxigenio?.fio2 ?? 0.21) > 0.21 || (sinaisIniciais.spo2 !== undefined && Math.abs(naColeta.sinais.spo2 - sinaisIniciais.spo2) > 1e-9);
  const r: Record<string, number> = {};
  let mudou = false;

  for (const id of ids) {
    if (id === 'ph' || id === 'be') continue; // calculados no fim
    if (EH_LAB.has(id)) {
      const v = id as VariavelLab;
      const delta = naColeta.lab[v] - inicio[v];
      if (Math.abs(delta) > 1e-9) mudou = true;
      // valor do caso neste exame; se o caso não traz, só aparece quando algo mudou (partindo de baseParaExame)
      // (na gasometria arterial com O₂ instalado, mostra a gasometria inteira, não só pO₂/SatO₂)
      const aparece = Math.abs(delta) > 1e-9 || (mudouOxi && exameId === 'gasometria-arterial');
      const base = doCaso[id] ?? (aparece ? baseParaExame(caso, v, exameId) : undefined);
      if (base !== undefined) r[id] = base + delta;
    } else if (id === 'glicose' && doCaso.glicose !== undefined && sinaisIniciais.glicemiaMgDl !== undefined) {
      r.glicose = doCaso.glicose + (naColeta.sinais.glicemiaMgDl - sinaisIniciais.glicemiaMgDl);
    } else if (id === 'sato2' && doCaso.sato2 !== undefined && sinaisIniciais.spo2 !== undefined) {
      r.sato2 = Math.min(100, doCaso.sato2 + (oxi.spo2 - sinaisIniciais.spo2));
    } else if (id === 'po2' && sinaisIniciais.spo2 !== undefined && (doCaso.po2 !== undefined || mudouOxi)) {
      // com O₂ (ou se a SpO₂ mudou), a pO₂ segue o modelo, mantendo a diferença da admissão do caso
      r.po2 = doCaso.po2 === undefined ? oxi.po2 : mudouOxi ? doCaso.po2 + (oxi.po2 - po2DaSaturacao(sinaisIniciais.spo2)) : doCaso.po2;
    } else if (id === 'sato2' && mudouOxi) {
      r.sato2 = oxi.spo2;
    } else if (doCaso[id] !== undefined) {
      r[id] = doCaso[id];
    }
  }

  // pH e BE: do caso enquanto nada mudou; depois, recalculados a partir do HCO₃⁻ e da pCO₂
  if (ids.has('ph') && r.hco3 !== undefined && r.pco2 !== undefined) {
    const temBaseDoCaso = doCaso.ph !== undefined && doCaso.hco3 !== undefined && doCaso.pco2 !== undefined;
    if (temBaseDoCaso) {
      r.ph = doCaso.ph! + Math.log10(r.hco3 / doCaso.hco3!) - Math.log10(r.pco2 / doCaso.pco2!);
    } else if (doCaso.ph !== undefined && !mudou) {
      r.ph = doCaso.ph;
    } else {
      r.ph = phHendersonHasselbalch(r.hco3, r.pco2);
    }
    if (ids.has('be')) {
      if (doCaso.be !== undefined && temBaseDoCaso) r.be = doCaso.be + 0.93 * (r.hco3 - doCaso.hco3! + 14.8 * (r.ph - doCaso.ph!));
      else if (doCaso.be !== undefined && !mudou) r.be = doCaso.be;
      else r.be = excessoDeBases(r.hco3, r.ph);
    }
  } else {
    if (doCaso.ph !== undefined) r.ph = doCaso.ph;
    if (doCaso.be !== undefined) r.be = doCaso.be;
  }

  // arredonda só o que foi calculado aqui; o que veio pronto do caso fica como está
  return Object.fromEntries(Object.entries(r).map(([id, v]) => [id, id in CASAS ? arred(v, CASAS[id]!) : v]));
}
