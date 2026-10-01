import type { FaixaEtaria } from '../dados/medicacoes/tipos';

export interface SinaisVitais {
  /** Frequência cardíaca (bpm). */
  fc: number;
  /** Frequência respiratória (irpm). */
  fr: number;
  /** Saturação de O2 (%). */
  spo2: number;
  /** Pressão arterial (mmHg). */
  paSistolica: number;
  paDiastolica: number;
  /** Temperatura axilar (°C). */
  temperaturaC: number;
  /** Glicemia capilar (mg/dL). */
  glicemiaMgDl: number;
}

export interface Paciente {
  nome: string;
  idadeTexto: string;
  faixa: FaixaEtaria;
  pesoKg: number;
  sexo: 'F' | 'M';
  leito: string;
}

export interface CasoClinico {
  id: string;
  titulo: string;
  paciente: Paciente;
  queixa: string;
  historia: string;
  exameFisico: string;
  sinaisIniciais: SinaisVitais;
}
