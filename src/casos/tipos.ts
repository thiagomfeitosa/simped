import type { StatusValidacao, UnidadeDroga } from '../dados/medicacoes/tipos';
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
  /** Tempo de enchimento capilar (segundos). */
  tecS: number;
  /** Escala de coma de Glasgow (3 a 15; adaptada à idade no lactente). */
  glasgow: number;
}

/** Valores de TEC e Glasgow quando o caso não informa (A VALIDAR). */
export const SINAIS_PADRAO: Pick<SinaisVitais, 'tecS' | 'glasgow'> = { tecS: 2, glasgow: 15 };

/** Sinais do início do caso: TEC e Glasgow podem faltar (entram os valores padrão). */
export type SinaisIniciais = Omit<SinaisVitais, 'tecS' | 'glasgow'> & Partial<Pick<SinaisVitais, 'tecS' | 'glasgow'>>;

/**
 * Ritmo cardíaco do monitor (B10/B11). Bradicardia e taquicardia sinusais são o ritmo 'sinusal'
 * com FC baixa/alta (o monitor diz qual, pelos limites da idade).
 */
export type Ritmo = 'sinusal' | 'tsv' | 'tv' | 'fv' | 'assistolia' | 'aesp' | 'bav-total';

/** Ritmos sem pulso (PCR): sem pletismografia, sem PA e sem SpO₂ confiável. */
export const RITMOS_SEM_PULSO: readonly Ritmo[] = ['fv', 'assistolia', 'aesp'];

export const NOME_RITMO: Record<Ritmo, string> = {
  sinusal: 'Ritmo sinusal',
  tsv: 'Taquicardia supraventricular (TSV)',
  tv: 'Taquicardia ventricular (TV)',
  fv: 'Fibrilação ventricular (FV)',
  assistolia: 'Assistolia',
  aesp: 'Atividade elétrica sem pulso (AESP)',
  'bav-total': 'Bloqueio AV total',
};

export type PadraoRespiratorio =
  | 'normal'
  | 'taquipneia'
  | 'desconforto'
  | 'kussmaul'
  | 'bradipneia'
  | 'gasping'
  | 'apneia'
  | 'assistida';

export const NOME_PADRAO_RESPIRATORIO: Record<PadraoRespiratorio, string> = {
  normal: 'Eupneico',
  taquipneia: 'Taquipneia',
  desconforto: 'Desconforto respiratório (tiragem, batimento de asa)',
  kussmaul: 'Respiração de Kussmaul',
  bradipneia: 'Bradipneia',
  gasping: 'Gasping',
  apneia: 'Apneia',
  assistida: 'Ventilação assistida (bolsa/ventilador)',
};

/** O que muda "por degraus" (não em linha reta): ritmo e padrão respiratório. */
export interface EstadoClinico {
  ritmo: Ritmo;
  padraoRespiratorio: PadraoRespiratorio;
}

export const ESTADO_CLINICO_PADRAO: EstadoClinico = { ritmo: 'sinusal', padraoRespiratorio: 'normal' };

/** Troca de ritmo ou de padrão respiratório, depois de `atrasoMin` minutos. */
export type MudancaDeEstado =
  | { campo: 'ritmo'; valor: Ritmo; atrasoMin: number }
  | { campo: 'padraoRespiratorio'; valor: PadraoRespiratorio; atrasoMin: number };

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

/**
 * Conduta que o caso espera do aluno (para o relatório final).
 * - medicacao: algum item da folha (ou da receita) com uma das medicações de `alvos`;
 * - soro: um item de soro na seção 4;
 * - exame: um dos exames de `alvos` pedido;
 * - secao: algum item escrito na seção (ex.: 'sinan', 'oxigenoterapia').
 */
export interface CondutaEsperada {
  id: string;
  descricao: string;
  tipo: 'medicacao' | 'soro' | 'exame' | 'secao';
  alvos: string[];
  /** Medicação dada (ou exame pedido) até este minuto do caso. */
  prazoMin?: number;
  /** Exame que precisa ser pedido ANTES da 1ª dose desta medicação (ex.: hemocultura antes do antibiótico). */
  antesDaMedicacao?: string;
  status: StatusValidacao;
}

export interface CasoClinico {
  id: string;
  titulo: string;
  /** Grupo no menu de casos (ex.: "Neonatologia"). */
  grupo?: string;
  /** Onde o caso acontece (PS, UTI neonatal, ambulatório...). */
  cenario?: string;
  /** Hipótese diagnóstica esperada (mostrada só no relatório final). */
  hipotese?: string;
  pontosDeEnsino?: string[];
  condutasEsperadas?: CondutaEsperada[];
  /** Situação do caso inteiro (história, sinais, reações): A VALIDAR até o usuário conferir. */
  status?: StatusValidacao;
  /** Data e hora em que o caso começa ("AAAA-MM-DDTHH:MM"): o relógio do caso parte daqui. */
  inicio: string;
  paciente: Paciente;
  queixa: string;
  historia: string;
  exameFisico: string;
  sinaisIniciais: SinaisIniciais;
  /** Ritmo e padrão respiratório no início (sem isso: sinusal e eupneico). A VALIDAR. */
  estadoInicial?: Partial<EstadoClinico>;
  /** Como o paciente evolui sozinho, desde o minuto 0 (ex.: febre subindo). */
  evolucaoNatural?: MudancaDeSinal[];
  /** Trocas de ritmo/padrão respiratório que acontecem sozinhas. */
  evolucaoDoEstado?: MudancaDeEstado[];
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
  /** 'soma': o alvo é uma variação (ex.: +40 na FC), somada ao valor do momento. Padrão: alvo absoluto. */
  modo?: 'alvo' | 'soma';
}

export interface RespostaAMedicacao {
  medicacaoId: string;
  mudancas: MudancaDeSinal[];
  /** Trocas de ritmo/padrão respiratório (ex.: adenosina → ritmo sinusal). */
  mudancasDeEstado?: MudancaDeEstado[];
  /**
   * B9: faixa de dose "certa" NESTE caso (por kg ou por dose). Sem isso, vale a regra do banco.
   * Abaixo: efeito parcial; acima: efeito do caso + efeito adverso.
   */
  faixaDose?: { min: number; max: number; unidade: UnidadeDroga; por: 'kg' | 'dose' };
  /** B9: efeito adverso de dose alta neste caso (sem isso, vale src/dados/efeitos-sobredose.ts). */
  sobredose?: MudancaDeSinal[];
  status: StatusValidacao;
  observacao?: string;
}
