/**
 * Variáveis do paciente (docs/fase-0/variaveis-paciente.md), sem tela.
 * O caso guarda só os DADOS DE ORIGEM (nascimento, IG, pesos, estatura); aqui se CALCULA o resto:
 * idade em horas/dias/semanas/meses/anos, idade pós-menstrual, idade corrigida, superfície corporal,
 * classificação do RN e faixa etária. A idade avança com o relógio do caso.
 *
 * Datas são lidas no formato "AAAA-MM-DDTHH:MM" e tratadas sem fuso horário (UTC por dentro),
 * para que horário de verão ou o fuso do computador nunca mudem uma idade.
 */

import {
  CLASSIFICACAO_IG,
  CLASSIFICACAO_PESO_NASCER,
  FAIXAS_POR_FONTE,
  faixaDasDoses,
  type FonteDeFaixa,
  IDADE_CORRIGIDA_ATE_ANOS,
  PREMATURO_ABAIXO_DE_SEMANAS,
  TERMO_SEMANAS,
} from '../dados/faixas-etarias';
import type { FaixaEtaria } from '../dados/medicacoes/tipos';

/** Semanas + dias (ex.: 34s 3d). */
export interface SemanasEDias {
  semanas: number;
  dias: number;
}

/** Dados de origem do paciente: o que se digita no caso. */
export interface DadosDeOrigem {
  /** Data e hora do nascimento, "AAAA-MM-DDTHH:MM". */
  nascimento: string;
  /** Idade gestacional ao nascer. */
  igNascer: SemanasEDias;
  pesoNascerG: number;
  /** Peso atual (kg). */
  pesoKg: number;
  estaturaCm?: number;
  /** Puberdade (o PALS usa para separar criança de adulto). */
  puberdadeIniciada?: boolean;
}

export interface IdadeCronologica {
  /** Cada campo conta só unidades COMPLETAS (ex.: 47 h de vida = 1 dia). */
  horas: number;
  dias: number;
  semanas: number;
  meses: number;
  anos: number;
}

export interface VariaveisCalculadas {
  idade: IdadeCronologica;
  /** Texto curto para a tela: "36 h de vida", "5 dias de vida", "4 meses", "4 anos e 2 meses". */
  idadeTexto: string;
  idadePosMenstrual: SemanasEDias;
  /** Só para prematuro e até IDADE_CORRIGIDA_ATE_ANOS. */
  idadeCorrigida?: { dias: number; texto: string };
  superficieCorporal: { m2: number; formula: 'Mosteller' | 'Peso (sem estatura)' };
  classificacaoIG: string;
  classificacaoPesoNascer: string;
  prematuro: boolean;
  /** Faixa usada pelas regras de dose do banco. */
  faixa: FaixaEtaria;
  /** Nome da faixa segundo a fonte escolhida (padrão SBP). */
  nomeFaixa: string;
}

const MS_POR_HORA = 3_600_000;

/** Lê "AAAA-MM-DDTHH:MM" (ou só "AAAA-MM-DD") como instante em UTC. */
export function lerDataHora(texto: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(texto.trim());
  if (!m) throw new Error(`Data/hora inválida: "${texto}". Use AAAA-MM-DDTHH:MM.`);
  const [, ano, mes, dia, hora = '0', minuto = '0'] = m;
  const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia), Number(hora), Number(minuto)));
  if (data.getUTCMonth() !== Number(mes) - 1 || data.getUTCDate() !== Number(dia)) {
    throw new Error(`Data inexistente: "${texto}".`);
  }
  return data;
}

/** Instante → "AAAA-MM-DDTHH:MM" (UTC). */
export function escreverDataHora(data: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${data.getUTCFullYear()}-${p(data.getUTCMonth() + 1)}-${p(data.getUTCDate())}T${p(data.getUTCHours())}:${p(data.getUTCMinutes())}`;
}

/** Soma minutos a uma data/hora "AAAA-MM-DDTHH:MM". */
export function somarMinutos(texto: string, minutos: number): Date {
  return new Date(lerDataHora(texto).getTime() + minutos * 60_000);
}

/** "01/10/2026 08:30". */
export function formatarDataHora(data: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(data.getUTCDate())}/${p(data.getUTCMonth() + 1)}/${data.getUTCFullYear()} ${p(data.getUTCHours())}:${p(data.getUTCMinutes())}`;
}

/** Meses de calendário completos entre duas datas (aniversário do mês já passou?). */
function mesesCompletos(de: Date, ate: Date): number {
  let meses = (ate.getUTCFullYear() - de.getUTCFullYear()) * 12 + (ate.getUTCMonth() - de.getUTCMonth());
  const aniversario = new Date(de.getTime());
  aniversario.setUTCMonth(de.getUTCMonth() + meses);
  // dia 31 em mês curto "transborda"; nesse caso o mês ainda não fechou
  if (aniversario.getUTCDate() !== de.getUTCDate() || aniversario.getTime() > ate.getTime()) meses -= 1;
  return Math.max(0, meses);
}

export function idadeCronologica(nascimento: Date, agora: Date): IdadeCronologica {
  const ms = agora.getTime() - nascimento.getTime();
  if (ms < 0) throw new Error('A data atual do caso é anterior ao nascimento.');
  const horas = Math.floor(ms / MS_POR_HORA);
  const dias = Math.floor(horas / 24);
  const meses = mesesCompletos(nascimento, agora);
  return { horas, dias, semanas: Math.floor(dias / 7), meses, anos: Math.floor(meses / 12) };
}

function plural(n: number, singular: string, pluralTexto: string): string {
  return `${n} ${n === 1 ? singular : pluralTexto}`;
}

/** Texto da idade como se escreve na pediatria. */
export function textoIdade(idade: IdadeCronologica): string {
  if (idade.horas < 72) return `${idade.horas} h de vida`;
  if (idade.dias < 28) return `${idade.dias} dias de vida`;
  if (idade.meses < 24) {
    const meses = Math.max(1, idade.meses);
    return plural(meses, 'mês', 'meses');
  }
  const mesesRestantes = idade.meses % 12;
  return mesesRestantes === 0
    ? plural(idade.anos, 'ano', 'anos')
    : `${plural(idade.anos, 'ano', 'anos')} e ${plural(mesesRestantes, 'mês', 'meses')}`;
}

export function emDias(sd: SemanasEDias): number {
  return sd.semanas * 7 + sd.dias;
}

export function deDias(totalDias: number): SemanasEDias {
  return { semanas: Math.floor(totalDias / 7), dias: totalDias % 7 };
}

export function textoSemanasEDias(sd: SemanasEDias): string {
  return `${sd.semanas}s ${sd.dias}d`;
}

/** Idade pós-menstrual = IG ao nascer + idade cronológica (em dias). */
export function idadePosMenstrual(igNascer: SemanasEDias, idadeDias: number): SemanasEDias {
  return deDias(emDias(igNascer) + idadeDias);
}

/**
 * Idade corrigida (dias) = idade cronológica − (40 semanas − IG ao nascer).
 * Negativa = ainda não chegou às 40 semanas de idade pós-menstrual.
 */
export function idadeCorrigidaDias(igNascer: SemanasEDias, idadeDias: number): number {
  return idadeDias - (TERMO_SEMANAS * 7 - emDias(igNascer));
}

function textoIdadeCorrigida(dias: number): string {
  if (dias < 0) return `ainda faltam ${textoSemanasEDias(deDias(-dias))} para 40 semanas`;
  if (dias < 28) return plural(dias, 'dia', 'dias');
  const meses = Math.floor(dias / 30.4375);
  if (meses < 24) return `${plural(Math.max(1, meses), 'mês', 'meses')} (aprox.)`;
  return `${plural(Math.floor(meses / 12), 'ano', 'anos')} (aprox.)`;
}

/**
 * Superfície corporal (m²):
 * - com estatura: Mosteller = √(peso × estatura ÷ 3600);
 * - sem estatura: (4 × peso + 7) ÷ (peso + 90).
 */
export function superficieCorporal(pesoKg: number, estaturaCm?: number): VariaveisCalculadas['superficieCorporal'] {
  if (!(pesoKg > 0)) throw new Error('Peso deve ser maior que zero.');
  if (estaturaCm !== undefined && estaturaCm > 0) {
    return { m2: Math.sqrt((pesoKg * estaturaCm) / 3600), formula: 'Mosteller' };
  }
  return { m2: (4 * pesoKg + 7) / (pesoKg + 90), formula: 'Peso (sem estatura)' };
}

export function classificarIG(ig: SemanasEDias): string {
  return CLASSIFICACAO_IG.find((c) => ig.semanas < c.ateSemanas)?.nome ?? '';
}

export function classificarPesoNascer(pesoG: number): string {
  return CLASSIFICACAO_PESO_NASCER.find((c) => pesoG < c.abaixoDeG)?.nome ?? '';
}

/** Nome da faixa etária segundo a fonte (SBP por padrão). */
export function nomeDaFaixa(idadeDias: number, fonte: FonteDeFaixa = 'SBP', puberdadeIniciada = false): string {
  const tabela = FAIXAS_POR_FONTE[fonte];
  for (const f of tabela.faixas) {
    if (idadeDias < f.deDias) continue;
    if (f.ateAPuberdade) {
      if (!puberdadeIniciada) return f.nome;
      continue;
    }
    if (f.ateDias === undefined || idadeDias < f.ateDias) return f.nome;
  }
  return tabela.faixas[tabela.faixas.length - 1]?.nome ?? '';
}

/** Calcula todas as variáveis do paciente no instante `agora` do caso. */
export function calcularVariaveis(
  origem: DadosDeOrigem,
  agora: Date,
  fonteDaFaixa: FonteDeFaixa = 'SBP',
): VariaveisCalculadas {
  const idade = idadeCronologica(lerDataHora(origem.nascimento), agora);
  const prematuro = origem.igNascer.semanas < PREMATURO_ABAIXO_DE_SEMANAS;
  const corrigida = idadeCorrigidaDias(origem.igNascer, idade.dias);
  return {
    idade,
    idadeTexto: textoIdade(idade),
    idadePosMenstrual: idadePosMenstrual(origem.igNascer, idade.dias),
    ...(prematuro &&
      idade.anos < IDADE_CORRIGIDA_ATE_ANOS && {
        idadeCorrigida: { dias: corrigida, texto: textoIdadeCorrigida(corrigida) },
      }),
    superficieCorporal: superficieCorporal(origem.pesoKg, origem.estaturaCm),
    classificacaoIG: classificarIG(origem.igNascer),
    classificacaoPesoNascer: classificarPesoNascer(origem.pesoNascerG),
    prematuro,
    faixa: faixaDasDoses(idade.dias, idade.anos),
    nomeFaixa: nomeDaFaixa(idade.dias, fonteDaFaixa, origem.puberdadeIniciada ?? false),
  };
}

/** Confere os dados de origem; devolve a lista de problemas (vazia = tudo certo). */
export function verificarDadosDeOrigem(origem: DadosDeOrigem, inicioDoCaso?: string): string[] {
  const problemas: string[] = [];
  let nascimento: Date | undefined;
  try {
    nascimento = lerDataHora(origem.nascimento);
  } catch (e) {
    problemas.push((e as Error).message);
  }
  if (inicioDoCaso !== undefined) {
    try {
      const inicio = lerDataHora(inicioDoCaso);
      if (nascimento && inicio.getTime() < nascimento.getTime()) {
        problemas.push('O início do caso é anterior ao nascimento.');
      }
    } catch (e) {
      problemas.push((e as Error).message);
    }
  }
  const { semanas, dias } = origem.igNascer;
  if (!Number.isInteger(semanas) || semanas < 20 || semanas > 45) problemas.push('IG ao nascer fora de 20–45 semanas.');
  if (!Number.isInteger(dias) || dias < 0 || dias > 6) problemas.push('Dias da IG devem ser de 0 a 6.');
  if (!(origem.pesoNascerG > 0)) problemas.push('Peso ao nascer deve ser maior que zero.');
  if (!(origem.pesoKg > 0)) problemas.push('Peso atual deve ser maior que zero.');
  if (origem.estaturaCm !== undefined && !(origem.estaturaCm > 0)) problemas.push('Estatura deve ser maior que zero.');
  return problemas;
}
