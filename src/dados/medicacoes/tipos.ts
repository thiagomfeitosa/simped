/**
 * Molde do banco de medicações.
 * Cada remédio é um arquivo de dados que segue este formato.
 * Regras de segurança (CLAUDE.md):
 * - todo valor de dose aponta para uma fonte;
 * - valor não conferido fica com status 'A_VALIDAR' e NÃO é usado para corrigir o aluno.
 */

/** 'A_VALIDAR' = ainda não conferido pelo usuário na fonte; 'CONFERIDO' = conferido (com documento e página). */
export type StatusValidacao = 'A_VALIDAR' | 'CONFERIDO';

/** Códigos de fonte (docs/fase-0/fontes.md e referencias/catalogo.md). */
export type CodigoFonte =
  | 'SBP'
  | 'MS'
  | 'AAP'
  | 'PALS'
  | 'NRP'
  | 'GINA'
  | 'ISPAD'
  | 'ASBAI'
  | 'BULA'
  | 'HOSPITAL';

export interface Fonte {
  codigo: CodigoFonte;
  /** Documento, edição e ano (obrigatório para status CONFERIDO). */
  documento?: string;
  /** Página, tabela ou seção. */
  pagina?: string;
}

export type FaixaEtaria = 'RN' | 'crianca' | 'adolescente';

export type Via = 'EV' | 'IM' | 'SC' | 'VO' | 'IO' | 'inalatoria' | 'endotraqueal' | 'retal';

/** Unidade de quantidade de droga. */
export type UnidadeDroga = 'g' | 'mg' | 'mcg' | 'UI' | 'mEq' | 'mL';

/** Seção da folha de prescrição onde o item entra (ordem do CLAUDE.md). */
export type SecaoPrescricao = 4 | 5 | 6;

export interface Apresentacao {
  id: string;
  /** Texto como aparece para o aluno. Ex.: "Ampola 1 mg/mL, 1 mL". */
  descricao: string;
  forma:
    | 'ampola'
    | 'frasco-ampola-po'
    | 'frasco-ampola-solucao'
    | 'bolsa-soro'
    | 'comprimido'
    | 'solucao-oral'
    | 'gotas'
    | 'spray'
    | 'nebulizacao'
    | 'outro';
  vias: Via[];
  /** Quantidade de droga por unidade (ampola, frasco, comprimido). */
  quantidade?: { valor: number; unidade: UnidadeDroga };
  /** Volume da unidade em mL (vazio para pó ou comprimido). */
  volumeMl?: number;
  /** Concentração por mL (ex.: { valor: 1, unidade: 'mg' } = 1 mg/mL). */
  concentracaoPorMl?: { valor: number; unidade: UnidadeDroga };
  /** Gotas: quantas gotas tem 1 mL deste frasco (depende do conta-gotas; A VALIDAR com a bula). */
  gotasPorMl?: number;
  status: StatusValidacao;
  fonte?: Fonte;
}

/**
 * Como a dose está expressa:
 * - porKg: faixa por kg (ex.: 10–25 mg/kg/dose);
 * - porM2: faixa por m² de superfície corporal (ex.: 50–100 mg/m²/dia);
 * - fixa: faixa fixa (ex.: 500–1000 mg/dose);
 * - texto: regra ainda não estruturada (tabelas por IG, por superfície corporal...). Nunca corrige o aluno.
 */
export type ExpressaoDeDose =
  | { tipo: 'porKg'; min: number; max: number; unidade: UnidadeDroga; por: Periodo }
  | { tipo: 'porM2'; min: number; max: number; unidade: UnidadeDroga; por: Periodo }
  | { tipo: 'fixa'; min: number; max: number; unidade: UnidadeDroga; por: Periodo }
  | { tipo: 'texto'; descricao: string };

/** 'dose' = por dose; 'dia' = por dia (dividido nas tomadas); 'min'/'h' = infusão contínua. */
export type Periodo = 'dose' | 'dia' | 'min' | 'h';

/** Faixa numérica: `de` vale inclusive, `ate` é exclusive (ex.: idadeDias { ate: 7 } = 0 a 6 dias completos). */
export interface FaixaNumerica {
  de?: number;
  ate?: number;
}

/**
 * Condições da regra sobre as variáveis do paciente (docs/fase-0/variaveis-paciente.md).
 * Todas as informadas precisam valer. Ex.: penicilina cristalina 12/12h até 7 dias de vida, 8/8h depois.
 */
export interface CondicoesDaRegra {
  idadeHoras?: FaixaNumerica;
  idadeDias?: FaixaNumerica;
  idadeMeses?: FaixaNumerica;
  idadeAnos?: FaixaNumerica;
  igNascerSemanas?: FaixaNumerica;
  idadePosMenstrualSemanas?: FaixaNumerica;
  pesoKg?: FaixaNumerica;
}

/** Valores do paciente que as condições usam (calculados em src/paciente/). */
export type VariaveisParaRegra = Record<keyof CondicoesDaRegra, number>;

export interface RegraDeDose {
  id: string;
  /** Ex.: "Anafilaxia", "PCR", "Meningite". */
  indicacao: string;
  faixas: FaixaEtaria[];
  /** Condições numéricas extras (idade em dias, IG, peso...). Vazio = vale para toda a faixa. */
  condicoes?: CondicoesDaRegra;
  vias: Via[];
  dose: ExpressaoDeDose;
  doseMaxima?: { valor: number; unidade: UnidadeDroga; por: Periodo };
  /** Intervalos aceitos, em horas (ex.: [6] = 6/6h; [12, 24] = 12/12h ou 1x/dia). */
  intervalosHoras?: number[];
  observacoes?: string;
  fonte: Fonte;
  status: StatusValidacao;
}

/** Concentração máxima da solução que entra na veia (por mL). */
export interface ConcentracaoMaxima {
  valor: number;
  unidade: UnidadeDroga;
  fonte: Fonte;
  status: StatusValidacao;
  observacao?: string;
}

export interface Medicacao {
  id: string;
  nome: string;
  secao: SecaoPrescricao;
  /**
   * Classes/etiquetas para alergia e interações (ex.: ['betalactamicos', 'penicilinas']).
   * O id da medicação já conta como etiqueta.
   */
  classes?: string[];
  /** Concentração máxima EV (A VALIDAR até conferir); gera alerta na conferência do item. */
  concentracaoMaximaEV?: ConcentracaoMaxima;
  /**
   * Tipo de receituário na alta: 'simples'; 'antimicrobiano' (2 vias, retenção na farmácia);
   * 'controle-especial' (receita de controle especial). A VALIDAR com a legislação vigente.
   */
  receituario?: 'simples' | 'antimicrobiano' | 'controle-especial';
  apresentacoes: Apresentacao[];
  regras: RegraDeDose[];
  /** Alertas sempre mostrados (ex.: "NUNCA em bolus"). */
  alertas?: string[];
}
