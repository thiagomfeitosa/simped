/**
 * Leitura guiada da gasometria (sem tela), em passos:
 * 1) pH → 2) distúrbio primário → 3) compensação esperada → 4) ânion gap e delta/delta → 5) lactato.
 * Referências e pontos de corte em src/dados/gasometria.ts (A VALIDAR).
 */

import { formatarNumero } from '../prescricao/comum';
import { PARAMETROS_GASOMETRIA as P, REFERENCIA_GASOMETRIA } from '../dados/gasometria';

export interface ValoresGasometria {
  ph: number;
  pco2: number;
  hco3: number;
  na?: number;
  cl?: number;
  /** g/dL */
  albumina?: number;
  lactato?: number;
}

export type DisturbioPrimario =
  | 'acidose metabólica'
  | 'acidose respiratória'
  | 'alcalose metabólica'
  | 'alcalose respiratória'
  | 'acidose mista'
  | 'alcalose mista'
  | 'normal'
  | 'possível distúrbio misto';

export interface PassoGasometria {
  titulo: string;
  texto: string;
  conta?: string;
}

export interface LeituraGasometria {
  passos: PassoGasometria[];
  primario: DisturbioPrimario;
  /** Resumo em uma linha. */
  conclusao: string;
}

const n = formatarNumero;

export function interpretarGasometria(v: ValoresGasometria, tipo: 'arterial' | 'venosa' = 'arterial'): LeituraGasometria {
  const ref = REFERENCIA_GASOMETRIA[tipo];
  const passos: PassoGasometria[] = [];
  const achados: string[] = [];

  // 1. pH
  const acidemia = v.ph < ref.ph.min;
  const alcalemia = v.ph > ref.ph.max;
  passos.push({
    titulo: '1. pH',
    texto: acidemia
      ? `pH ${n(v.ph)} < ${n(ref.ph.min)}: ACIDEMIA.`
      : alcalemia
        ? `pH ${n(v.ph)} > ${n(ref.ph.max)}: ALCALEMIA.`
        : `pH ${n(v.ph)} dentro de ${n(ref.ph.min)}–${n(ref.ph.max)}: normal (pode haver distúrbio compensado ou misto).`,
  });

  // 2. distúrbio primário
  const hco3Baixo = v.hco3 < ref.hco3.min;
  const hco3Alto = v.hco3 > ref.hco3.max;
  const pco2Alto = v.pco2 > ref.pco2.max;
  const pco2Baixo = v.pco2 < ref.pco2.min;
  let primario: DisturbioPrimario;
  if (acidemia) {
    primario = hco3Baixo && pco2Alto ? 'acidose mista' : hco3Baixo ? 'acidose metabólica' : pco2Alto ? 'acidose respiratória' : 'possível distúrbio misto';
  } else if (alcalemia) {
    primario = hco3Alto && pco2Baixo ? 'alcalose mista' : hco3Alto ? 'alcalose metabólica' : pco2Baixo ? 'alcalose respiratória' : 'possível distúrbio misto';
  } else {
    primario = (hco3Baixo || hco3Alto) && (pco2Baixo || pco2Alto) ? 'possível distúrbio misto' : 'normal';
  }
  passos.push({
    titulo: '2. Distúrbio primário',
    texto:
      `HCO₃⁻ ${n(v.hco3)} (ref. ${ref.hco3.min}–${ref.hco3.max}) e pCO₂ ${n(v.pco2)} (ref. ${ref.pco2.min}–${ref.pco2.max}). ` +
      {
        'acidose metabólica': 'Acidemia com HCO₃⁻ baixo: ACIDOSE METABÓLICA.',
        'acidose respiratória': 'Acidemia com pCO₂ alta: ACIDOSE RESPIRATÓRIA.',
        'alcalose metabólica': 'Alcalemia com HCO₃⁻ alto: ALCALOSE METABÓLICA.',
        'alcalose respiratória': 'Alcalemia com pCO₂ baixa: ALCALOSE RESPIRATÓRIA.',
        'acidose mista': 'HCO₃⁻ baixo E pCO₂ alta: ACIDOSE MISTA (metabólica + respiratória).',
        'alcalose mista': 'HCO₃⁻ alto E pCO₂ baixa: ALCALOSE MISTA.',
        normal: 'Sem distúrbio ácido-base aparente.',
        'possível distúrbio misto': 'pH e valores não combinam com um distúrbio único: pensar em distúrbio misto.',
      }[primario],
  });
  achados.push(primario);

  // 3. compensação esperada
  const m = P.margemCompensacao;
  const compensacao = (esperado: number, medido: number, unidade: string, acima: string, abaixo: string, conta: string) => {
    const dentro = Math.abs(medido - esperado) <= m;
    const texto = dentro
      ? `Medido ${n(medido)} ${unidade}, dentro do esperado (${n(esperado - m)}–${n(esperado + m)}): compensação adequada.`
      : medido > esperado + m
        ? `Medido ${n(medido)} ${unidade}, ACIMA do esperado (${n(esperado - m)}–${n(esperado + m)}): ${acima}.`
        : `Medido ${n(medido)} ${unidade}, ABAIXO do esperado (${n(esperado - m)}–${n(esperado + m)}): ${abaixo}.`;
    if (!dentro) achados.push(medido > esperado + m ? acima : abaixo);
    passos.push({ titulo: '3. Compensação', texto, conta });
  };
  if (primario === 'acidose metabólica') {
    const esperado = 1.5 * v.hco3 + 8;
    compensacao(esperado, v.pco2, 'mmHg', 'acidose respiratória associada', 'alcalose respiratória associada', `Winter: pCO₂ esperada = 1,5 × ${n(v.hco3)} + 8 = ${n(esperado)} ± ${m}`);
  } else if (primario === 'alcalose metabólica') {
    const esperado = 0.7 * v.hco3 + 21;
    compensacao(esperado, v.pco2, 'mmHg', 'acidose respiratória associada', 'alcalose respiratória associada', `pCO₂ esperada = 0,7 × ${n(v.hco3)} + 21 = ${n(esperado)} ± ${m}`);
  } else if (primario === 'acidose respiratória') {
    const agudo = P.hco3Normal + 0.1 * (v.pco2 - P.pco2Normal);
    const cronico = P.hco3Normal + 0.35 * (v.pco2 - P.pco2Normal);
    passos.push({
      titulo: '3. Compensação',
      texto: `HCO₃⁻ esperado: ~${n(agudo)} se aguda, ~${n(cronico)} se crônica. Medido: ${n(v.hco3)}.` + (v.hco3 > cronico + m ? ' Acima até do crônico: alcalose metabólica associada.' : v.hco3 < agudo - m ? ' Abaixo do agudo: acidose metabólica associada.' : ''),
      conta: `Aguda: 24 + 0,1 × (${n(v.pco2)} − 40) · Crônica: 24 + 0,35 × (${n(v.pco2)} − 40)`,
    });
    if (v.hco3 > cronico + m) achados.push('alcalose metabólica associada');
    if (v.hco3 < agudo - m) achados.push('acidose metabólica associada');
  } else if (primario === 'alcalose respiratória') {
    const agudo = P.hco3Normal - 0.2 * (P.pco2Normal - v.pco2);
    const cronico = P.hco3Normal - 0.5 * (P.pco2Normal - v.pco2);
    passos.push({
      titulo: '3. Compensação',
      texto: `HCO₃⁻ esperado: ~${n(agudo)} se aguda, ~${n(cronico)} se crônica. Medido: ${n(v.hco3)}.` + (v.hco3 < cronico - m ? ' Abaixo até do crônico: acidose metabólica associada.' : v.hco3 > agudo + m ? ' Acima do agudo: alcalose metabólica associada.' : ''),
      conta: `Aguda: 24 − 0,2 × (40 − ${n(v.pco2)}) · Crônica: 24 − 0,5 × (40 − ${n(v.pco2)})`,
    });
    if (v.hco3 < cronico - m) achados.push('acidose metabólica associada');
    if (v.hco3 > agudo + m) achados.push('alcalose metabólica associada');
  } else {
    passos.push({ titulo: '3. Compensação', texto: 'Não se aplica (sem distúrbio primário único).' });
  }
  if (tipo === 'venosa') {
    passos.push({ titulo: 'Atenção', texto: 'Gasometria venosa: as fórmulas de compensação foram feitas para sangue arterial; interpretar com cautela.' });
  }

  // 4. ânion gap
  if (v.na !== undefined && v.cl !== undefined) {
    const ag = v.na - (v.cl + v.hco3);
    const corrigido = v.albumina !== undefined ? ag + 2.5 * (4 - v.albumina) : ag;
    const contaAlb = v.albumina !== undefined ? ` · corrigido p/ albumina ${n(v.albumina)}: ${n(ag)} + 2,5 × (4 − ${n(v.albumina)}) = ${n(corrigido)}` : '';
    const elevado = corrigido > P.anionGapNormal + P.anionGapMargem;
    let texto = elevado
      ? `Ânion gap ${n(corrigido)}: ELEVADO (normal ${P.anionGapNormal} ± ${P.anionGapMargem}).`
      : `Ânion gap ${n(corrigido)}: normal (${P.anionGapNormal} ± ${P.anionGapMargem}).`;
    let conta = `AG = Na − (Cl + HCO₃⁻) = ${n(v.na)} − (${n(v.cl)} + ${n(v.hco3)}) = ${n(ag)}${contaAlb}`;
    if (elevado) achados.push('ânion gap elevado');
    if (elevado && v.hco3 < P.hco3Normal) {
      const delta = (corrigido - P.anionGapNormal) / (P.hco3Normal - v.hco3);
      conta += ` · Δ/Δ = (${n(corrigido)} − ${P.anionGapNormal}) ÷ (24 − ${n(v.hco3)}) = ${n(delta)}`;
      if (delta < P.deltaRelacaoMin) {
        texto += ' Δ/Δ < 1: acidose de ânion gap normal associada.';
        achados.push('acidose de ânion gap normal associada');
      } else if (delta > P.deltaRelacaoMax) {
        texto += ' Δ/Δ > 2: alcalose metabólica associada.';
        achados.push('alcalose metabólica associada');
      } else {
        texto += ' Δ/Δ entre 1 e 2: acidose de ânion gap aumentado "pura".';
      }
    } else if (!elevado && primario === 'acidose metabólica') {
      texto += ' Acidose metabólica com AG normal (hiperclorêmica).';
      achados.push('hiperclorêmica');
    }
    passos.push({ titulo: '4. Ânion gap', texto, conta });
  } else {
    passos.push({ titulo: '4. Ânion gap', texto: 'Para calcular, peça eletrólitos (Na e Cl).' });
  }

  // 5. lactato
  if (v.lactato !== undefined) {
    const alto = v.lactato > P.lactatoMax;
    passos.push({ titulo: '5. Lactato', texto: alto ? `Lactato ${n(v.lactato)} mmol/L: ELEVADO (> ${P.lactatoMax}).` : `Lactato ${n(v.lactato)} mmol/L: normal.` });
    if (alto) achados.push('hiperlactatemia');
  }

  const unicos = [...new Set(achados)];
  return { passos, primario, conclusao: `${unicos.join('; ')}. (Pontos de corte A VALIDAR.)` };
}
