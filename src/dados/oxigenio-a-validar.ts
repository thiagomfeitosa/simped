/**
 * Oxigenoterapia: dispositivos e FiO₂ aproximada por fluxo.
 * ⚠️ TUDO "A VALIDAR": regras práticas de livro-texto escritas pelo assistente
 * (a FiO₂ real depende do tamanho da criança, da respiração e da vedação).
 */
import type { StatusValidacao } from './medicacoes/tipos';

export type DispositivoO2 = 'ar' | 'cateter' | 'mascara-simples' | 'mascara-reservatorio' | 'cpap' | 'bolsa' | 'ventilador';

export interface DefinicaoDispositivo {
  id: DispositivoO2;
  nome: string;
  /** Como se escolhe a FiO₂: pelo fluxo (L/min) ou ajustando a FiO₂ direto (CPAP, ventilador). */
  ajuste: 'nenhum' | 'fluxo' | 'fio2';
  fluxo?: { min: number; max: number; padrao: number };
  /** FiO₂ = base + porLitro × (fluxo − fluxo mínimo), sem passar do teto. */
  fio2?: { base: number; porLitro: number; teto: number };
  /** Ventila o paciente (resolve apneia/gasping). */
  ventila?: boolean;
  /** FiO₂ inicial quando se ajusta direto. */
  fio2Padrao?: number;
}

export const DISPOSITIVOS_O2: readonly DefinicaoDispositivo[] = [
  { id: 'ar', nome: 'Ar ambiente (sem O₂)', ajuste: 'nenhum', fio2: { base: 0.21, porLitro: 0, teto: 0.21 } },
  { id: 'cateter', nome: 'Cateter nasal', ajuste: 'fluxo', fluxo: { min: 1, max: 4, padrao: 2 }, fio2: { base: 0.25, porLitro: 0.04, teto: 0.37 } },
  { id: 'mascara-simples', nome: 'Máscara simples', ajuste: 'fluxo', fluxo: { min: 5, max: 10, padrao: 6 }, fio2: { base: 0.35, porLitro: 0.03, teto: 0.5 } },
  { id: 'mascara-reservatorio', nome: 'Máscara com reservatório', ajuste: 'fluxo', fluxo: { min: 10, max: 15, padrao: 10 }, fio2: { base: 0.6, porLitro: 0.06, teto: 0.9 } },
  { id: 'cpap', nome: 'CPAP / VNI', ajuste: 'fio2', fio2Padrao: 0.4 },
  { id: 'bolsa', nome: 'Bolsa-válvula-máscara (ventilando)', ajuste: 'fluxo', fluxo: { min: 10, max: 15, padrao: 15 }, fio2: { base: 0.9, porLitro: 0.02, teto: 1 }, ventila: true },
  { id: 'ventilador', nome: 'Intubação + ventilação mecânica', ajuste: 'fio2', fio2Padrao: 0.6, ventila: true },
];

/** Constantes do modelo (física, A VALIDAR como simplificação didática). */
export const MODELO_O2 = {
  pressaoBarometrica: 760,
  pressaoVaporAgua: 47,
  quocienteRespiratorio: 0.8,
  /** Gradiente alvéolo-arterial mínimo (mmHg) de um pulmão normal. */
  gradienteMinimo: 5,
  /** FR mínima quando o paciente é ventilado (bolsa/ventilador). */
  frVentilado: 20,
} as const;

export const STATUS_OXIGENIO: StatusValidacao = 'A_VALIDAR';
