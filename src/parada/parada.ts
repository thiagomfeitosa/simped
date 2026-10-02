/**
 * Código de parada (sem tela): estado + eventos, como o motor do paciente.
 * O tempo é o "relógio do código" em segundos (0 = início). A tela só registra eventos;
 * daqui saem o ritmo, o ciclo de RCP, o tempo desde a última adrenalina, a próxima ação
 * sugerida e, no fim, a avaliação do algoritmo (PALS — A VALIDAR).
 * Doses e tempos: src/dados/parada-a-validar.ts.
 */

import { arredondar, conferirValor, doseTotal, type Tolerancia, volumeAspirar } from '../calculos';
import type { Ritmo } from '../casos/tipos';
import {
  CHOQUE,
  type CenarioParada,
  type DrogaParada,
  DROGAS_PARADA,
  EXPANSAO_PARADA,
  TEMPOS_PARADA,
  TUBO,
} from '../dados/parada-a-validar';

export type EventoParada =
  | { tipo: 'iniciar'; tS: number }
  | { tipo: 'checarRitmo'; tS: number }
  | { tipo: 'choque'; tS: number; joules: number }
  /** Droga dada: o aluno informa quantos mL aspirou (a conta é conferida na avaliação). */
  | { tipo: 'droga'; tS: number; drogaId: string; volumeMl: number }
  | { tipo: 'fluido'; tS: number; volumeMl: number }
  | { tipo: 'viaAerea'; tS: number; descricao: string }
  | { tipo: 'acesso'; tS: number; descricao: string }
  | { tipo: 'encerrar'; tS: number };

/** Ritmos em que o choque está indicado. */
export function ritmoChocavel(ritmo: Ritmo): boolean {
  return ritmo === 'fv' || ritmo === 'tv';
}

/** Dose e volume de uma droga do carrinho para o peso (com a dose máxima). */
export function doseDaDroga(droga: DrogaParada, pesoKg: number): { dose: number; limitada: boolean; volumeMl: number } {
  const r = doseTotal({ dosePorKg: droga.dosePorKg, pesoKg, ...(droga.doseMaxima !== undefined && { doseMaxima: droga.doseMaxima }) });
  return { dose: r.dose, limitada: r.limitadaPelaMaxima, volumeMl: volumeAspirar({ dose: r.dose, concentracao: droga.concentracaoPorMl }) };
}

/** Energia do n-ésimo choque (1, 2, 3...): 2 J/kg, depois 4 J/kg (sem passar de 10 J/kg nem da dose de adulto). */
export function energiaDoChoque(numero: number, pesoKg: number): number {
  const porKg = numero <= 1 ? CHOQUE.primeiroJKg : CHOQUE.seguintesJKg;
  return Math.round(Math.min(porKg * pesoKg, CHOQUE.maximoJKg * pesoKg, CHOQUE.maximoAdultoJ));
}

/** Volume de SF do bolus (mL/kg × peso). */
export function volumeDoBolus(pesoKg: number): number {
  return EXPANSAO_PARADA.mlPorKg * pesoKg;
}

/** Tubo endotraqueal pela idade (≥ 1 ano: fórmula; < 1 ano: tamanho usual). A VALIDAR. */
export function tuboEndotraqueal(idadeAnos: number): { comCuff: number; semCuff: number; profundidadeCm: number } {
  const meio = (x: number) => Math.round(x * 2) / 2;
  const comCuff = idadeAnos < 1 ? TUBO.menorDeUmAnoComCuff : meio(idadeAnos / 4 + TUBO.comCuffSoma);
  const semCuff = idadeAnos < 1 ? TUBO.menorDeUmAnoSemCuff : meio(idadeAnos / 4 + TUBO.semCuffSoma);
  return { comCuff, semCuff, profundidadeCm: arredondar(comCuff * 3, 1) };
}

export function mmss(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export interface EstadoParada {
  iniciada: boolean;
  encerrada: boolean;
  /** Tempo do código agora (s desde o início). */
  tempoS: number;
  /** Ritmo atual (depois do retorno da circulação, 'sinusal'). */
  ritmo: Ritmo;
  rce: boolean;
  rceEmS?: number;
  /** Ciclo de RCP atual (recomeça a cada checagem de ritmo). */
  ciclo: { numero: number; inicioS: number; restanteS: number };
  choques: number;
  adrenalinas: number;
  ultimaAdrenalinaS?: number;
  /** Quantas vezes cada droga/fluido foi dado (ids; 'sf-bolus' para o SF). */
  dadas: Record<string, number>;
  /** O último evento foi uma checagem que mostrou ritmo chocável (o choque é agora). */
  chocarAgora: boolean;
  /** Próxima ação sugerida (o modo prova esconde). */
  proximaAcao: string;
}

function retornou(cenario: CenarioParada, antes: readonly EventoParada[]): boolean {
  const q = cenario.retornoQuando;
  const choques = antes.filter((e) => e.tipo === 'choque').length;
  const adrenalinas = antes.filter((e) => e.tipo === 'droga' && e.drogaId === 'adrenalina').length;
  const dados = new Set(antes.flatMap((e) => (e.tipo === 'droga' ? [e.drogaId] : e.tipo === 'fluido' && e.volumeMl > 0 ? [EXPANSAO_PARADA.id] : [])));
  return (q.choques ?? 0) <= choques && (q.adrenalinas ?? 0) <= adrenalinas && (q.exige ?? []).every((id) => dados.has(id));
}

/** Estado do código no tempo `agoraS` (só os eventos até agora contam). */
export function estadoDaParada(cenario: CenarioParada, eventos: readonly EventoParada[], agoraS: number): EstadoParada {
  const ate = eventos.filter((e) => e.tS <= agoraS);
  const inicio = ate.find((e) => e.tipo === 'iniciar');
  let ritmo: Ritmo = cenario.ritmoInicial;
  let rceEmS: number | undefined;
  let numero = 1;
  let inicioCiclo = inicio?.tS ?? 0;
  let chocarAgora = false;
  ate.forEach((e, i) => {
    if (e.tipo === 'checarRitmo' && rceEmS === undefined) {
      if (retornou(cenario, ate.slice(0, i))) {
        ritmo = 'sinusal';
        rceEmS = e.tS;
      }
      numero += 1;
      inicioCiclo = e.tS;
      chocarAgora = ritmoChocavel(ritmo);
    } else if (e.tipo === 'choque') {
      chocarAgora = false;
    }
  });
  if (rceEmS === undefined && !ate.some((e) => e.tipo === 'checarRitmo') && ritmoChocavel(ritmo) && !ate.some((e) => e.tipo === 'choque')) chocarAgora = true;

  const adrenalinas = ate.filter((e): e is Extract<EventoParada, { tipo: 'droga' }> => e.tipo === 'droga' && e.drogaId === 'adrenalina');
  const dadas: Record<string, number> = {};
  for (const e of ate) {
    if (e.tipo === 'droga') dadas[e.drogaId] = (dadas[e.drogaId] ?? 0) + 1;
    if (e.tipo === 'fluido' && e.volumeMl > 0) dadas[EXPANSAO_PARADA.id] = (dadas[EXPANSAO_PARADA.id] ?? 0) + 1;
  }
  const choques = ate.filter((e) => e.tipo === 'choque').length;
  const ultimaAdrenalinaS = adrenalinas[adrenalinas.length - 1]?.tS;
  const restanteS = TEMPOS_PARADA.cicloRcpS - (agoraS - inicioCiclo);
  const rce = rceEmS !== undefined;

  const estado: Omit<EstadoParada, 'proximaAcao'> = {
    iniciada: !!inicio,
    encerrada: ate.some((e) => e.tipo === 'encerrar'),
    tempoS: inicio ? agoraS - inicio.tS : 0,
    ritmo,
    rce,
    ...(rceEmS !== undefined && { rceEmS }),
    ciclo: { numero, inicioS: inicioCiclo, restanteS },
    choques,
    adrenalinas: adrenalinas.length,
    ...(ultimaAdrenalinaS !== undefined && { ultimaAdrenalinaS }),
    dadas,
    chocarAgora,
  };
  return { ...estado, proximaAcao: proximaAcao(cenario, estado, agoraS) };
}

function proximaAcao(cenario: CenarioParada, e: Omit<EstadoParada, 'proximaAcao'>, agoraS: number): string {
  if (!e.iniciada) return 'Começar: RCP de alta qualidade (compressões + ventilação), monitor e acesso EV/IO.';
  if (e.encerrada) return 'Código encerrado.';
  if (e.rce) return 'Retorno da circulação (RCE): cuidados pós-parada (via aérea, oxigenação, PA, glicemia). Pode encerrar o código.';
  const chocavel = ritmoChocavel(e.ritmo);
  if (e.chocarAgora) return `⚡ Chocar agora: ${energiaDoChoque(e.choques + 1, cenario.pesoKg)} J (${e.choques === 0 ? CHOQUE.primeiroJKg : CHOQUE.seguintesJKg} J/kg) e voltar à RCP.`;
  if (e.ciclo.restanteS <= 0) return '🔍 2 minutos de RCP: checar o ritmo agora (pausa curta).';
  const desdeAdrenalina = e.ultimaAdrenalinaS === undefined ? undefined : agoraS - e.ultimaAdrenalinaS;
  const adrenalinaPermitida = chocavel ? e.choques >= 2 : true;
  if (adrenalinaPermitida && (desdeAdrenalina === undefined || desdeAdrenalina >= TEMPOS_PARADA.adrenalinaMinS)) {
    return e.adrenalinas === 0 ? '💉 Adrenalina agora.' : `💉 Adrenalina: já passaram ${mmss(desdeAdrenalina ?? 0)} da última (repetir a cada 3–5 min).`;
  }
  if (chocavel && e.choques >= 3 && !e.dadas.amiodarona) return '💉 Amiodarona (FV/TV depois do 3º choque).';
  if (cenario.causa && !e.dadas[cenario.causa.id]) return 'Manter RCP e pensar nas causas reversíveis (Hs e Ts).';
  return `Manter RCP de alta qualidade; checar o ritmo em ${mmss(e.ciclo.restanteS)}.`;
}

// ---- Avaliação no fim -------------------------------------------------------------

export interface ItemAvaliacao {
  ok: boolean;
  texto: string;
}

export interface AvaliacaoParada {
  itens: ItemAvaliacao[];
  rce: boolean;
  tempoTotalS: number;
}

/** Confere o código inteiro contra o algoritmo (PALS — A VALIDAR) e as contas de cada droga. */
export function avaliarParada(cenario: CenarioParada, eventos: readonly EventoParada[], tolerancia: Tolerancia = { relativa: 0.05, absoluta: 0.05 }): AvaliacaoParada {
  const itens: ItemAvaliacao[] = [];
  const inicio = eventos.find((e) => e.tipo === 'iniciar')?.tS ?? 0;
  const fim = eventos.find((e) => e.tipo === 'encerrar')?.tS ?? eventos[eventos.length - 1]?.tS ?? inicio;
  const estadoFinal = estadoDaParada(cenario, eventos, fim);
  const chocavelInicial = ritmoChocavel(cenario.ritmoInicial);
  const t = (s: number) => mmss(s - inicio);

  // 1. checagens de ritmo a cada 2 min
  const marcos = [inicio, ...eventos.filter((e) => e.tipo === 'checarRitmo').map((e) => e.tS)];
  const limite = TEMPOS_PARADA.cicloRcpS + TEMPOS_PARADA.margemChecagemS;
  const atrasadas = marcos.slice(1).filter((s, i) => s - marcos[i]! > limite);
  itens.push(
    marcos.length < 2
      ? { ok: false, texto: 'Nenhuma checagem de ritmo: o ritmo é checado a cada 2 min de RCP.' }
      : { ok: atrasadas.length === 0, texto: atrasadas.length === 0 ? `Ritmo checado a cada ~2 min (${marcos.length - 1} checagem(ns)).` : `${atrasadas.length} checagem(ns) de ritmo depois de mais de 2 min de RCP.` },
  );

  // 2. primeira adrenalina / primeiro choque
  const adrenalinas = eventos.filter((e): e is Extract<EventoParada, { tipo: 'droga' }> => e.tipo === 'droga' && e.drogaId === 'adrenalina');
  const choques = eventos.filter((e): e is Extract<EventoParada, { tipo: 'choque' }> => e.tipo === 'choque');
  if (!chocavelInicial) {
    const primeira = adrenalinas[0];
    itens.push(
      primeira
        ? { ok: primeira.tS - inicio <= TEMPOS_PARADA.primeiraAdrenalinaNaoChocavelS, texto: `Ritmo não chocável: 1ª adrenalina em ${t(primeira.tS)} (o quanto antes; até 5 min).` }
        : { ok: false, texto: 'Ritmo não chocável: a adrenalina não foi dada.' },
    );
  } else {
    const primeiro = choques[0];
    itens.push(
      primeiro
        ? { ok: primeiro.tS - inicio <= TEMPOS_PARADA.cicloRcpS, texto: `Ritmo chocável: 1º choque em ${t(primeiro.tS)} (o quanto antes).` }
        : { ok: false, texto: 'Ritmo chocável: nenhum choque foi dado.' },
    );
    const segundo = choques[1];
    if (segundo) {
      const antes = adrenalinas.filter((a) => a.tS < segundo.tS).length;
      const depois = adrenalinas.some((a) => a.tS >= segundo.tS);
      itens.push({
        ok: antes === 0 && depois,
        texto: antes > 0 ? 'Adrenalina dada antes do 2º choque (no ritmo chocável ela vem depois do 2º).' : depois ? 'Adrenalina depois do 2º choque.' : 'Faltou a adrenalina depois do 2º choque.',
      });
    }
    if (choques.length >= 3) {
      const terceiro = choques[2]!;
      const amio = eventos.find((e) => e.tipo === 'droga' && e.drogaId === 'amiodarona');
      itens.push({
        ok: !!amio && amio.tS >= terceiro.tS,
        texto: amio ? (amio.tS >= terceiro.tS ? 'Amiodarona depois do 3º choque.' : 'Amiodarona antes do 3º choque (o algoritmo a coloca depois do 3º).') : 'Faltou a amiodarona depois do 3º choque.',
      });
    }
  }

  // 3. intervalo entre adrenalinas
  adrenalinas.slice(1).forEach((a, i) => {
    const intervalo = a.tS - adrenalinas[i]!.tS;
    const ok = intervalo >= TEMPOS_PARADA.adrenalinaMinS - 10 && intervalo <= TEMPOS_PARADA.adrenalinaMaxS + 10;
    itens.push({ ok, texto: `Intervalo entre adrenalinas: ${mmss(intervalo)} (alvo: 3 a 5 min).` });
  });

  // 4. energia de cada choque e choque em ritmo errado
  choques.forEach((c, i) => {
    const certo = energiaDoChoque(i + 1, cenario.pesoKg);
    const ritmoNaHora = estadoDaParada(cenario, eventos, c.tS - 0.001).ritmo;
    if (!ritmoChocavel(ritmoNaHora)) {
      itens.push({ ok: false, texto: `Choque em ${t(c.tS)} com ritmo NÃO chocável — não se choca assistolia, AESP nem ritmo com pulso.` });
      return;
    }
    const ok = conferirValor(c.joules, certo, { relativa: 0.1, absoluta: 1 }).correto;
    itens.push({ ok, texto: `${i + 1}º choque: ${c.joules} J (certo: ${certo} J = ${i === 0 ? CHOQUE.primeiroJKg : CHOQUE.seguintesJKg} J/kg).` });
  });

  // 5. conta de cada droga e do bolus
  for (const e of eventos) {
    if (e.tipo === 'droga') {
      const droga = DROGAS_PARADA.find((d) => d.id === e.drogaId);
      if (!droga) continue;
      const certo = doseDaDroga(droga, cenario.pesoKg);
      const ok = conferirValor(e.volumeMl, certo.volumeMl, tolerancia).correto;
      itens.push({ ok, texto: `${droga.nome} em ${t(e.tS)}: ${arredondar(e.volumeMl, 2)} mL (certo: ${arredondar(certo.volumeMl, 2)} mL = ${arredondar(certo.dose, 3)} ${droga.unidade}).` });
    }
    if (e.tipo === 'fluido') {
      const certo = volumeDoBolus(cenario.pesoKg);
      itens.push({ ok: conferirValor(e.volumeMl, certo, tolerancia).correto, texto: `SF 0,9% em bolus em ${t(e.tS)}: ${e.volumeMl} mL (certo: ${certo} mL = ${EXPANSAO_PARADA.mlPorKg} mL/kg).` });
    }
  }

  // 6. causa reversível
  if (cenario.causa) {
    const tratou = estadoFinal.dadas[cenario.causa.id];
    itens.push({ ok: !!tratou, texto: tratou ? `Causa reversível tratada: ${cenario.causa.nome}.` : `Causa reversível não tratada: ${cenario.causa.nome} → ${cenario.causa.tratamento}.` });
  }

  // 7. resultado
  itens.push({
    ok: estadoFinal.rce,
    texto: estadoFinal.rce ? `Retorno da circulação em ${t(estadoFinal.rceEmS!)}.` : 'Sem retorno da circulação até o fim do código.',
  });

  return { itens, rce: estadoFinal.rce, tempoTotalS: fim - inicio };
}
