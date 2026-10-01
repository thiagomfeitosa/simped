/**
 * Aprazamento (horários das doses), sem tela.
 * Cada intervalo vira horários do dia pelo padrão do hospital (ex.: 8/8h → 06:00, 14:00, 22:00;
 * src/dados/hospitais.ts, A VALIDAR). A enfermagem "checa" cada dose; dose que passou da hora
 * sem checagem fica atrasada. Só a dose checada vai para o motor do paciente.
 */

import type { ConfiguracaoHospital } from '../dados/hospitais';
import type { Medicacao } from '../dados/medicacoes/tipos';
import { formatarNumero, lerNumero } from './comum';
import { type EstadoPrescricao, SECOES } from './estado';
import { NOME_VIA } from './itemMedicacao';

export interface ItemParaAprazar {
  itemId: number;
  medicacaoId: string;
  descricao: string;
  /** Intervalo em horas, 'dose-unica' (agora, no início) ou 'continua' (sem horários). */
  intervalo: number | 'dose-unica' | 'continua' | '';
}

export interface DoseAgendada {
  itemId: number;
  medicacaoId: string;
  descricao: string;
  /** Minuto do caso em que a dose está marcada (0 = início do caso). */
  minuto: number;
  /** "HH:MM" para a tela. */
  hora: string;
}

export interface Checagem {
  itemId: number;
  /** Minuto marcado da dose checada. */
  minutoMarcado: number;
  /** Minuto do caso em que foi dada. */
  feitaNoMinuto: number;
}

export type SituacaoDose = 'feita' | 'atrasada' | 'agora' | 'pendente';

/** Minutos de folga antes de uma dose ser considerada atrasada (A VALIDAR com a rotina do hospital). */
export const TOLERANCIA_ATRASO_MIN = 30;

function minutosDoDia(hora: string): number {
  const [h = 0, m = 0] = hora.split(':').map(Number);
  return (h * 60 + m) % (24 * 60); // "24:00" = meia-noite
}

function textoHora(minutoDoDia: number): string {
  const h = Math.floor(minutoDoDia / 60) % 24;
  const m = minutoDoDia % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Horários do dia para um intervalo: lista do hospital ou, se não houver, a partir da hora inicial. */
export function horariosDoIntervalo(intervaloHoras: number, hospital: ConfiguracaoHospital): string[] {
  const lista = hospital.aprazamento[intervaloHoras];
  if (lista && lista.length > 0) return lista;
  if (!(intervaloHoras > 0) || 24 % intervaloHoras !== 0) return [];
  const inicio = minutosDoDia(hospital.horaInicial);
  return Array.from({ length: 24 / intervaloHoras }, (_, i) => textoHora((inicio + i * intervaloHoras * 60) % (24 * 60)));
}

function dadosDoItem(item: ItemParaAprazar): Pick<DoseAgendada, 'itemId' | 'medicacaoId' | 'descricao'> {
  return { itemId: item.itemId, medicacaoId: item.medicacaoId, descricao: item.descricao };
}

/**
 * Doses marcadas do início do caso até `ateMinuto`.
 * `inicio` é a data/hora do início do caso (o relógio do caso parte dela).
 */
export function gerarAgenda(
  itens: readonly ItemParaAprazar[],
  inicio: Date,
  ateMinuto: number,
  hospital: ConfiguracaoHospital,
): DoseAgendada[] {
  const agenda: DoseAgendada[] = [];
  const minutoDoDiaNoInicio = inicio.getUTCHours() * 60 + inicio.getUTCMinutes();
  for (const item of itens) {
    if (item.intervalo === 'dose-unica') {
      agenda.push({ ...dadosDoItem(item), minuto: 0, hora: textoHora(minutoDoDiaNoInicio) });
      continue;
    }
    if (typeof item.intervalo !== 'number') continue;
    if (item.intervalo > 24) {
      // 36/36h, 48/48h: primeira dose na hora inicial do hospital, depois a cada N horas
      const inicioDoDia = minutosDoDia(hospital.horaInicial);
      let minuto = inicioDoDia - minutoDoDiaNoInicio;
      if (minuto < 0) minuto += 24 * 60;
      for (; minuto <= ateMinuto; minuto += item.intervalo * 60) {
        agenda.push({ ...dadosDoItem(item), minuto, hora: textoHora((minutoDoDiaNoInicio + minuto) % (24 * 60)) });
      }
      continue;
    }
    const horarios = horariosDoIntervalo(item.intervalo, hospital).map(minutosDoDia);
    // percorre os dias desde o início do caso
    for (let dia = 0; dia * 24 * 60 - minutoDoDiaNoInicio <= ateMinuto; dia++) {
      for (const h of horarios) {
        const minuto = dia * 24 * 60 + h - minutoDoDiaNoInicio;
        if (minuto >= 0 && minuto <= ateMinuto) {
          agenda.push({ ...dadosDoItem(item), minuto, hora: textoHora(h) });
        }
      }
    }
  }
  return agenda.sort((a, b) => a.minuto - b.minuto || a.itemId - b.itemId);
}

export function situacaoDaDose(dose: DoseAgendada, checagens: readonly Checagem[], agoraMin: number): SituacaoDose {
  if (checagens.some((c) => c.itemId === dose.itemId && c.minutoMarcado === dose.minuto)) return 'feita';
  if (agoraMin > dose.minuto + TOLERANCIA_ATRASO_MIN) return 'atrasada';
  if (agoraMin >= dose.minuto - TOLERANCIA_ATRASO_MIN) return 'agora';
  return 'pendente';
}

/** Pode checar: dose ainda não feita, na hora (com folga) ou atrasada. */
export function podeChecar(situacao: SituacaoDose): boolean {
  return situacao === 'agora' || situacao === 'atrasada';
}

/** Itens de medicação da folha que entram no quadro de horários, com uma descrição curta. */
export function itensParaAprazar(estado: EstadoPrescricao, medicacoes: readonly Medicacao[]): ItemParaAprazar[] {
  const itens: ItemParaAprazar[] = [];
  for (const secao of SECOES) {
    for (const item of estado.itens[secao.id]) {
      if (item.tipo !== 'medicacao' || item.campos.intervalo === '') continue;
      const med = medicacoes.find((m) => m.id === item.campos.medicacaoId);
      if (!med) continue;
      const dose = lerNumero(item.campos.dose);
      const partes = [
        med.nome,
        dose !== null ? `${formatarNumero(dose)} ${item.campos.unidadeDose}` : '',
        item.campos.via ? NOME_VIA[item.campos.via] : '',
      ];
      itens.push({
        itemId: item.id,
        medicacaoId: med.id,
        descricao: partes.filter(Boolean).join(' '),
        intervalo: item.campos.intervalo,
      });
    }
  }
  return itens;
}
