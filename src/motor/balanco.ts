/**
 * Balanço hídrico (sem tela): entradas − saídas num período do relógio do caso,
 * e diurese em mL/kg/h. Soros e infusões contínuas contam sozinhos pela vazão (correndo sem parar
 * desde que foram instalados); o resto (dieta, vômitos...) é registrado à mão.
 */

export interface Infusao {
  id: number;
  descricao: string;
  inicioMin: number;
  vazaoMlH: number;
}

export interface RegistroManual {
  id: number;
  minuto: number;
  tipo: 'entrada' | 'saida';
  descricao: string;
  volumeMl: number;
}

export interface LinhaBalanco {
  descricao: string;
  volumeMl: number;
}

export interface Balanco {
  horas: number;
  entradas: LinhaBalanco[];
  saidas: LinhaBalanco[];
  totalEntradasMl: number;
  totalSaidasMl: number;
  /** Entradas − saídas (positivo = balanço positivo). */
  balancoMl: number;
  diureseMl: number;
  diureseMlKgH: number;
}

/** Volume de uma infusão dentro do período [de, ate] (minutos do caso). */
export function volumeInfundido(infusao: Infusao, deMin: number, ateMin: number): number {
  const inicio = Math.max(infusao.inicioMin, deMin);
  const minutos = Math.max(0, ateMin - inicio);
  return (infusao.vazaoMlH * minutos) / 60;
}

export function calcularBalanco(entrada: {
  infusoes: readonly Infusao[];
  registros: readonly RegistroManual[];
  /** Diurese do paciente (mL/kg/h), do arquivo do caso. */
  diureseMlKgH: number;
  pesoKg: number;
  deMin: number;
  ateMin: number;
}): Balanco {
  const { infusoes, registros, diureseMlKgH, pesoKg, deMin, ateMin } = entrada;
  const horas = Math.max(0, ateMin - deMin) / 60;
  const entradas: LinhaBalanco[] = infusoes
    .map((i) => ({ descricao: i.descricao, volumeMl: volumeInfundido(i, deMin, ateMin) }))
    .filter((l) => l.volumeMl > 0);
  const saidas: LinhaBalanco[] = [];
  const diureseMl = diureseMlKgH * pesoKg * horas;
  if (diureseMl > 0) saidas.push({ descricao: 'Diurese', volumeMl: diureseMl });
  for (const r of registros) {
    if (r.minuto < deMin || r.minuto > ateMin) continue;
    (r.tipo === 'entrada' ? entradas : saidas).push({ descricao: r.descricao, volumeMl: r.volumeMl });
  }
  const soma = (l: LinhaBalanco[]) => l.reduce((s, x) => s + x.volumeMl, 0);
  const totalEntradasMl = soma(entradas);
  const totalSaidasMl = soma(saidas);
  return {
    horas,
    entradas,
    saidas,
    totalEntradasMl,
    totalSaidasMl,
    balancoMl: totalEntradasMl - totalSaidasMl,
    diureseMl,
    diureseMlKgH: horas > 0 && pesoKg > 0 ? diureseMl / pesoKg / horas : 0,
  };
}
