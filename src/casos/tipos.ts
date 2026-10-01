import type { FaixaEtaria, StatusValidacao } from '../dados/medicacoes/tipos';

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
  /** Como o paciente evolui sozinho, desde o minuto 0 (ex.: febre subindo). */
  evolucaoNatural?: MudancaDeSinal[];
  /** Como o paciente responde a cada medicação neste caso. */
  respostas?: RespostaAMedicacao[];
}

export type NomeSinal = keyof SinaisVitais;

/** Um sinal vai do valor atual até o alvo em linha reta, começando após o atraso. */
export interface MudancaDeSinal {
  sinal: NomeSinal;
  alvo: number;
  /** Minutos entre o evento e o início da mudança. */
  atrasoMin: number;
  /** Minutos para ir do valor atual até o alvo (0 = imediato). */
  duracaoMin: number;
}

export interface RespostaAMedicacao {
  medicacaoId: string;
  mudancas: MudancaDeSinal[];
  status: StatusValidacao;
  observacao?: string;
}
