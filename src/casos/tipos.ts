import type { StatusValidacao } from '../dados/medicacoes/tipos';
import type { DadosDeOrigem } from '../paciente/variaveis';

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

/**
 * Paciente do caso: só DADOS DE ORIGEM (docs/fase-0/variaveis-paciente.md).
 * Idade, faixa etária, idade corrigida e superfície corporal são calculadas (src/paciente/).
 */
export interface Paciente extends DadosDeOrigem {
  nome: string;
  sexo: 'F' | 'M';
  leito: string;
  perimetroCefalicoCm?: number;
  alergias?: string[];
  condicoesDeBase?: string[];
  medicacoesEmUso?: string[];
  /** RN: tipo sanguíneo, sorologias, bolsa rota etc. (texto livre). */
  dadosMaternos?: string;
}

export interface CasoClinico {
  id: string;
  titulo: string;
  /** Data e hora em que o caso começa ("AAAA-MM-DDTHH:MM"): o relógio do caso parte daqui. */
  inicio: string;
  paciente: Paciente;
  queixa: string;
  historia: string;
  exameFisico: string;
  sinaisIniciais: SinaisVitais;
  /** Como o paciente evolui sozinho, desde o minuto 0 (ex.: febre subindo). */
  evolucaoNatural?: MudancaDeSinal[];
  /** Como o paciente responde a cada medicação neste caso. */
  respostas?: RespostaAMedicacao[];
  /**
   * Resultados dos exames deste paciente (id do exame em src/dados/exames.ts → valores por analito e/ou laudo).
   * Exame pedido sem resultado aqui aparece como "não disponível neste caso".
   */
  resultadosExames?: Record<string, ResultadoExame>;
  /** Diurese do paciente (mL/kg/h), usada no balanço hídrico. A VALIDAR. */
  diureseMlKgH?: number;
}

export interface ResultadoExame {
  valores?: Record<string, number>;
  laudo?: string;
  status: StatusValidacao;
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
