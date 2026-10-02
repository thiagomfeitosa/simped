/**
 * Treino de contas sem fim (sem tela): o programa sorteia exercícios com NÚMEROS INVENTADOS
 * (não são doses reais: só a matemática da prescrição) e confere a resposta.
 * As contas usam o mesmo motor de cálculo do app (src/calculos/).
 */

import {
  concentracao,
  converterMassa,
  diluir,
  gotasPorMinuto,
  hollidaySegarMlDia,
  misturarDuasSolucoes,
  prepararSeringaBic,
  vazaoMlPorHora,
  vig,
  vazaoDoVolume,
  volumeAspirar,
} from '../calculos';
import { formatarNumero } from '../prescricao/comum';

export const TIPOS_DE_EXERCICIO = {
  volume: 'Volume a aspirar',
  reconstituicao: 'Reconstituição de pó',
  dosePeso: 'Dose por peso',
  diluicao: 'Diluição (C1 × V1 = C2 × V2)',
  bic: 'Seringa da BIC (volume final)',
  infusao: 'Infusão contínua (mL/h)',
  vig: 'VIG',
  gotejamento: 'Gotejamento (gotas/min)',
  holliday: 'Holliday-Segar',
  mistura: 'Mistura de duas soluções',
  vazao: 'Vazão (volume ÷ tempo)',
  unidade: 'Unidades (g, mg, mcg)',
  rediluicao: 'Rediluição (volume a aspirar)',
} as const;

export type TipoExercicio = keyof typeof TIPOS_DE_EXERCICIO;

export interface Exercicio {
  tipo: TipoExercicio;
  enunciado: string;
  /** Unidade da resposta. */
  unidade: string;
  resposta: number;
  /** A conta certa, para mostrar no modo treino. */
  conta: string;
  dica: string;
}

/** Gerador de números pseudoaleatórios com semente (mulberry32): o mesmo número gera o mesmo exercício. */
export function criarSorteio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function escolher<T>(sorteio: () => number, lista: readonly T[]): T {
  return lista[Math.floor(sorteio() * lista.length)] as T;
}

const n = formatarNumero;
/** Arredonda para casas "de prescrição" (evita respostas como 1,3333333). */
const r2 = (v: number) => Math.round(v * 100) / 100;

export function gerarExercicio(tipo: TipoExercicio, sorteio: () => number): Exercicio {
  switch (tipo) {
    case 'volume': {
      const c = escolher(sorteio, [2, 4, 10, 20, 40, 50, 100, 250, 500]);
      const dose = r2(c * escolher(sorteio, [0.2, 0.3, 0.4, 0.48, 0.5, 0.6, 0.8, 1.2, 1.5, 2.4]));
      const v = volumeAspirar({ dose, concentracao: c });
      return {
        tipo,
        enunciado: `Ampola de ${n(c)} mg/mL. Quantos mL aspirar para dar ${n(dose)} mg?`,
        unidade: 'mL',
        resposta: v,
        conta: `${n(dose)} mg ÷ ${n(c)} mg/mL = ${n(v)} mL`,
        dica: 'Volume = dose ÷ concentração.',
      };
    }
    case 'reconstituicao': {
      const frasco = escolher(sorteio, [500, 1000, 2000]);
      const ml = escolher(sorteio, [5, 10, 20]);
      const c = concentracao({ quantidade: frasco, volumeMl: ml });
      const dose = r2(c * escolher(sorteio, [0.5, 1.5, 2, 2.5, 3.2, 4, 6]));
      const v = dose / c;
      return {
        tipo,
        enunciado: `Frasco de ${n(frasco)} mg em pó reconstituído com ${n(ml)} mL. Quantos mL aspirar para ${n(dose)} mg?`,
        unidade: 'mL',
        resposta: v,
        conta: `${n(frasco)} mg ÷ ${n(ml)} mL = ${n(c)} mg/mL; ${n(dose)} mg ÷ ${n(c)} mg/mL = ${n(v)} mL`,
        dica: 'Primeiro a concentração (quantidade ÷ volume), depois o volume.',
      };
    }
    case 'dosePeso': {
      const peso = escolher(sorteio, [3, 4.2, 8, 12, 16, 22, 30, 45]);
      const porKg = escolher(sorteio, [0.1, 0.5, 2, 5, 10, 15, 20, 50]);
      const max = escolher(sorteio, [undefined, undefined, 500, 1000]);
      const calculada = porKg * peso;
      const dose = max !== undefined ? Math.min(calculada, max) : calculada;
      return {
        tipo,
        enunciado:
          `Paciente de ${n(peso)} kg, dose de ${n(porKg)} mg/kg/dose` +
          (max !== undefined ? ` (máximo ${n(max)} mg/dose)` : '') +
          '. Qual a dose em mg?',
        unidade: 'mg',
        resposta: dose,
        conta:
          `${n(porKg)} × ${n(peso)} = ${n(calculada)} mg` + (max !== undefined && calculada > max ? ` → passa do máximo, então dose = ${n(max)} mg` : ''),
        dica: 'Dose = mg/kg × peso, sem passar da dose máxima.',
      };
    }
    case 'diluicao': {
      const c1 = escolher(sorteio, [1, 3, 10, 40, 100]);
      const v1 = escolher(sorteio, [0.5, 1, 2, 3, 5]);
      const v2 = escolher(sorteio, [10, 20, 50, 100]);
      const { concentracaoFinal } = diluir({ concentracaoInicial: c1, volumeAspiradoMl: v1, volumeFinalMl: v2 });
      return {
        tipo,
        enunciado: `Aspira ${n(v1)} mL de uma solução de ${n(c1)} mg/mL e completa com SF até ${n(v2)} mL. Qual a concentração final (mg/mL)?`,
        unidade: 'mg/mL',
        resposta: concentracaoFinal,
        conta: `${n(c1)} × ${n(v1)} ÷ ${n(v2)} = ${n(concentracaoFinal)} mg/mL`,
        dica: 'C1 × V1 = C2 × V2.',
      };
    }
    case 'bic': {
      const final = escolher(sorteio, [12, 12, 20, 24]);
      const dose = escolher(sorteio, [0.3, 0.6, 1.2, 2.5, 3, 5, 7.5]);
      const s = prepararSeringaBic({ volumeMedicacaoMl: dose, volumeFinalMl: final });
      const soro = s.aplicavel ? s.volumeSoroMl : 0;
      return {
        tipo,
        enunciado: `Seringa da BIC com volume final de ${n(final)} mL. A dose ocupa ${n(dose)} mL. Quantos mL de SF completar?`,
        unidade: 'mL',
        resposta: soro,
        conta: `${n(final)} − ${n(dose)} = ${n(soro)} mL de SF`,
        dica: 'SF = volume final − volume da medicação.',
      };
    }
    case 'infusao': {
      const peso = escolher(sorteio, [4, 10, 16, 20, 30]);
      const dose = escolher(sorteio, [0.05, 0.1, 0.2, 0.3, 0.5, 1]);
      const c = escolher(sorteio, [10, 20, 40, 50, 80, 100]);
      const v = vazaoMlPorHora({ dosePorKg: dose, pesoKg: peso, concentracao: c, por: 'min' });
      return {
        tipo,
        enunciado: `Infusão de ${n(dose)} mcg/kg/min para ${n(peso)} kg, solução de ${n(c)} mcg/mL. Qual a vazão da bomba (mL/h)?`,
        unidade: 'mL/h',
        resposta: v,
        conta: `${n(dose)} × ${n(peso)} × 60 ÷ ${n(c)} = ${n(v)} mL/h`,
        dica: 'mL/h = mcg/kg/min × kg × 60 ÷ mcg/mL.',
      };
    }
    case 'vig': {
      const peso = escolher(sorteio, [2.5, 3, 4, 8, 12]);
      const pct = escolher(sorteio, [5, 7.5, 10, 12.5]);
      const vazao = escolher(sorteio, [5, 7.5, 10, 12, 14, 20, 30]);
      const resultado = vig({ vazaoMlPorHora: vazao, concentracaoGlicosePct: pct, pesoKg: peso });
      return {
        tipo,
        enunciado: `Soro com glicose a ${n(pct)}% correndo a ${n(vazao)} mL/h, paciente de ${n(peso)} kg. Qual a VIG (mg/kg/min)?`,
        unidade: 'mg/kg/min',
        resposta: resultado,
        conta: `${n(vazao)} × ${n(pct)} ÷ (6 × ${n(peso)}) = ${n(resultado)} mg/kg/min`,
        dica: 'VIG = mL/h × % ÷ (6 × peso).',
      };
    }
    case 'gotejamento': {
      const volume = escolher(sorteio, [240, 360, 480, 500, 720, 1000]);
      const horas = escolher(sorteio, [4, 6, 8, 12, 24]);
      const macro = sorteio() < 0.6;
      const gotasPorMl = macro ? 20 : 60;
      const vazao = volume / horas;
      const gotas = gotasPorMinuto(vazao, gotasPorMl);
      return {
        tipo,
        enunciado: `Correr ${n(volume)} mL em ${n(horas)} h no equipo de ${macro ? 'macrogotas (20 gotas/mL)' : 'microgotas (60/mL)'}. Quantas ${macro ? 'gotas' : 'microgotas'}/min?`,
        unidade: macro ? 'gotas/min' : 'microgotas/min',
        resposta: gotas,
        conta: `${n(volume)} ÷ ${n(horas)} = ${n(vazao)} mL/h; × ${gotasPorMl} ÷ 60 = ${n(gotas)}/min`,
        dica: macro ? 'Macrogotas: gotas/min = mL/h ÷ 3.' : 'Microgotas: microgotas/min = mL/h.',
      };
    }
    case 'holliday': {
      const peso = escolher(sorteio, [6, 9, 12, 15, 18, 24, 32, 40]);
      const v = hollidaySegarMlDia(peso);
      const conta =
        peso <= 10 ? `100 × ${n(peso)} = ${n(v)} mL/dia` : peso <= 20 ? `1000 + 50 × (${n(peso)} − 10) = ${n(v)} mL/dia` : `1500 + 20 × (${n(peso)} − 20) = ${n(v)} mL/dia`;
      return {
        tipo,
        enunciado: `Pela regra de Holliday-Segar, qual o volume de manutenção (mL/dia) para ${n(peso)} kg?`,
        unidade: 'mL/dia',
        resposta: v,
        conta,
        dica: '100 mL/kg até 10 kg; +50 mL/kg de 10 a 20; +20 mL/kg acima de 20.',
      };
    }
    case 'mistura': {
      const final = escolher(sorteio, [100, 250, 500]);
      const desejada = escolher(sorteio, [7.5, 10, 12.5]);
      const menor = 5;
      const maior = 50;
      const { volumeMaiorMl } = misturarDuasSolucoes({ concentracaoMenor: menor, concentracaoMaior: maior, concentracaoDesejada: desejada, volumeFinalMl: final });
      return {
        tipo,
        enunciado: `Quantos mL de glicose 50% para fazer ${n(final)} mL de soro a ${n(desejada)}% com SG 5%?`,
        unidade: 'mL',
        resposta: volumeMaiorMl,
        conta: `${n(final)} × (${n(desejada)} − 5) ÷ (50 − 5) = ${n(volumeMaiorMl)} mL de glicose 50% (o resto, ${n(final - volumeMaiorMl)} mL, de SG 5%)`,
        dica: 'Volume da mais concentrada = final × (desejada − menor) ÷ (maior − menor).',
      };
    }
    case 'vazao':
    case 'unidade':
    case 'rediluicao':
      return exercicioNovo(tipo, sorteio);
  }
}

function exercicioNovo(tipo: 'vazao' | 'unidade' | 'rediluicao', sorteio: () => number): Exercicio {
  switch (tipo) {
    case 'vazao': {
      const volume = escolher(sorteio, [12, 20, 24, 28, 50, 100, 240, 500]);
      const minutos = escolher(sorteio, [10, 15, 20, 30, 60, 120, 240]);
      const v = vazaoDoVolume(volume, minutos);
      return {
        tipo,
        enunciado: `Correr ${n(volume)} mL em ${minutos >= 60 ? `${n(minutos / 60)} h` : `${n(minutos)} min`} na bomba. Qual a vazão (mL/h)?`,
        unidade: 'mL/h',
        resposta: v,
        conta: `${n(volume)} mL ÷ ${n(minutos / 60)} h = ${n(v)} mL/h`,
        dica: 'Vazão = volume ÷ tempo em HORAS (30 min = 0,5 h).',
      };
    }
    case 'unidade': {
      const opcoes = [
        { valor: escolher(sorteio, [0.05, 0.1, 0.25, 0.5, 1.5]), de: 'mg', para: 'mcg' },
        { valor: escolher(sorteio, [50, 100, 250, 400, 1000]), de: 'mcg', para: 'mg' },
        { valor: escolher(sorteio, [0.5, 1, 2.5, 7]), de: 'g', para: 'mg' },
        { valor: escolher(sorteio, [250, 500, 1500, 7000]), de: 'mg', para: 'g' },
      ] as const;
      const o = escolher(sorteio, opcoes);
      const r = converterMassa(o.valor, o.de, o.para);
      return {
        tipo,
        enunciado: `Quanto é ${n(o.valor)} ${o.de} em ${o.para}?`,
        unidade: o.para,
        resposta: r,
        conta: `1 g → 1.000 mg → 1.000.000 mcg: ${n(o.valor)} ${o.de} = ${n(r)} ${o.para}`,
        dica: 'Cada degrau (g → mg → mcg) multiplica por 1.000; voltando, divide por 1.000.',
      };
    }
    case 'rediluicao': {
      const c1 = escolher(sorteio, [100, 200, 500, 1000]);
      const final = escolher(sorteio, [5, 10, 20]);
      const c2 = diluir({ concentracaoInicial: c1, volumeAspiradoMl: 1, volumeFinalMl: final }).concentracaoFinal;
      const dose = r2(c2 * escolher(sorteio, [0.4, 0.6, 0.8, 1.2, 1.5, 2.5]));
      const v = volumeAspirar({ dose, concentracao: c2 });
      return {
        tipo,
        enunciado: `Solução com ${n(c1)} mg/mL. Você aspira 1 mL e completa com AD até ${n(final)} mL (rediluição). Quantos mL DA REDILUIÇÃO aspirar para dar ${n(dose)} mg?`,
        unidade: 'mL',
        resposta: v,
        conta: `Rediluição: ${n(c1)} × 1 ÷ ${n(final)} = ${n(c2)} mg/mL; ${n(dose)} ÷ ${n(c2)} = ${n(v)} mL`,
        dica: 'Primeiro a concentração NOVA (C1 × V1 ÷ V2); a dose divide por ela, não pela antiga.',
      };
    }
  }
}

export interface Placar {
  tentativas: number;
  acertos: number;
  sequencia: number;
  melhorSequencia: number;
  porTipo: Partial<Record<TipoExercicio, { tentativas: number; acertos: number }>>;
}

export const PLACAR_VAZIO: Placar = { tentativas: 0, acertos: 0, sequencia: 0, melhorSequencia: 0, porTipo: {} };

export function registrarTentativa(placar: Placar, tipo: TipoExercicio, acertou: boolean): Placar {
  const t = placar.porTipo[tipo] ?? { tentativas: 0, acertos: 0 };
  const sequencia = acertou ? placar.sequencia + 1 : 0;
  return {
    tentativas: placar.tentativas + 1,
    acertos: placar.acertos + (acertou ? 1 : 0),
    sequencia,
    melhorSequencia: Math.max(placar.melhorSequencia, sequencia),
    porTipo: { ...placar.porTipo, [tipo]: { tentativas: t.tentativas + 1, acertos: t.acertos + (acertou ? 1 : 0) } },
  };
}
