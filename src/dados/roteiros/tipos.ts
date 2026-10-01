/**
 * Formato de um "roteiro passo a passo": uma lista de etapas que o aluno
 * percorre com as setas. Cada etapa diz o que explicar, que conta mostrar,
 * que animação exibir e o que acrescentar à folha de prescrição e ao rascunho.
 */

import type { SecaoPrescricao } from '../secoes';

/** Seções da folha (lista única em src/dados/secoes.ts) + as etapas extras 'revisao' e 'final'. */
export type { SecaoPrescricao };

/**
 * Uma conta mostrada em tempos, ligados por setas: fórmula → números → (passos) → resultado.
 * O aluno pode desfazer/refazer cada tempo com os botões da própria conta.
 */
export interface Conta {
  formula: string;
  substituicao: string;
  /** Tempos intermediários, para contas com mais de uma etapa (aparecem entre os números e o resultado). */
  passos?: string[];
  resultado: string;
  /** Versão curta que vai para o rascunho de cálculos. */
  rascunho: string;
}

/** Linha da folha de prescrição. Uma etapa posterior com o mesmo `id` reescreve a linha (ela "cresce" com as etapas). */
export interface LinhaPrescricao {
  id: string;
  secao: SecaoPrescricao;
  texto: string;
  /** Complemento menor, abaixo do texto (ex.: diluição, velocidade). */
  detalhe?: string;
}

// ---- Cenas (animações) -------------------------------------------------------

export type Icone =
  | 'pulmao'
  | 'saturacao'
  | 'mamadeira'
  | 'seio'
  | 'jejum'
  | 'tubo'
  | 'hemocultura'
  | 'glicemia'
  | 'termometro'
  | 'coracao'
  | 'relogio'
  | 'balanca'
  | 'alerta'
  | 'documento'
  | 'berco'
  | 'check'
  | 'seringa'
  | 'x'
  | 'lampada'
  | 'olho'
  | 'gota'
  | 'cerebro'
  | 'ecg';

export interface Cartao {
  icone: Icone;
  titulo: string;
  texto?: string;
  /** 'nao' = mostrado riscado/apagado (ex.: "não se aplica"). */
  estado?: 'sim' | 'nao' | 'atencao';
}

export interface CenaPaciente {
  tipo: 'paciente';
  perfil: 'rn' | 'crianca';
  pesoKg: number;
  rotulos: { rotulo: string; valor: string }[];
}

export interface CenaMultiplicacao {
  tipo: 'multiplicacao';
  /** Quanto vale cada bloco (ex.: 50). Ignorado quando há `faixas`. */
  valorPorKg: number;
  unidade: string;
  pesoKg: number;
  total: number;
  rotuloTotal: string;
  /**
   * Blocos com valores diferentes por faixa de peso (ex.: Holliday-Segar:
   * 10 kg × 100 mL + 2 kg × 50 mL). A soma dos kg deve dar o peso.
   */
  faixas?: { kg: number; valorPorKg: number }[];
}

export interface CenaCartoes {
  tipo: 'cartoes';
  titulo?: string;
  cartoes: Cartao[];
}

export interface CamadaSeringa {
  volumeMl: number;
  cor: CorLiquido;
  rotulo: string;
}

/** Cores só para ensino (na vida real a maioria das soluções é transparente). */
export type CorLiquido = 'medicacao' | 'medicacao2' | 'sf' | 'agua' | 'glicose' | 'adrenalina' | 'mistura';

export interface EstadoBancada {
  frasco?: {
    modelo: 'ampola' | 'frasco-po';
    rotulo: string;
    sublinha: string;
    /** 0 a 1 */
    nivel: number;
    cor: CorLiquido;
    /** Mostra o pó no fundo (antes de reconstituir). */
    po?: boolean;
  };
  seringa?: {
    capacidadeMl: number;
    camadas: CamadaSeringa[];
    rotulo: string;
  };
  bolsa?: {
    rotulo: string;
    cor: CorLiquido;
    gotejando: boolean;
  };
  bic?: {
    vazaoMlH: number;
    ligada: boolean;
    rotulo?: string;
  };
  /** Setas animadas de fluxo entre os objetos. */
  fluxos?: ('frasco-seringa' | 'seringa-frasco' | 'bolsa-seringa' | 'seringa-bic' | 'bolsa-bic' | 'bic-paciente' | 'seringa-paciente')[];
  /** Régua com faixa alvo (ex.: VIG). */
  medidor?: {
    rotulo: string;
    valor: number;
    unidade: string;
    minimo: number;
    maximo: number;
    faixaAlvo: [number, number];
  };
  /** Balão de texto curto sobre a bancada. */
  balao?: string;
}

export interface CenaBancada {
  tipo: 'bancada';
  /**
   * Como a bancada aparece ao CHEGAR nesta etapa avançando (antes de animar).
   * Ao voltar de uma etapa seguinte, a animação parte do estado dela e anda ao contrário.
   */
  estadoInicial?: EstadoBancada;
  estado: EstadoBancada;
}

export interface CenaConclusao {
  tipo: 'conclusao';
  itens: string[];
}

/** Tom de uma faixa da régua (cor). */
export type TomFaixa = 'normal' | 'atencao' | 'perigo' | 'info';

/** Régua de um exame/valor com faixas coloridas e um ponteiro (ex.: sódio 118 na faixa vermelha). */
export interface Regua {
  titulo: string;
  unidade: string;
  minimo: number;
  maximo: number;
  /** Faixas em sequência, a partir do mínimo: cada uma vai até `ate`. */
  faixas: { ate: number; rotulo: string; tom: TomFaixa }[];
  /** Valor do paciente (onde o ponteiro para). */
  valor: number;
  /** Se presente, o ponteiro sai daqui e anda até `valor` (ex.: antes → depois da correção). */
  valorInicial?: number;
  rotuloValor?: string;
  /** Linhas tracejadas de referência (ex.: limiar de fototerapia, teto de 24 h). */
  marcos?: { valor: number; rotulo: string }[];
  casas?: number;
}

export interface CenaRegua {
  tipo: 'regua';
  reguas: Regua[];
  legenda?: string;
}

/** Barras horizontais que crescem uma a uma (comparar concentrações etc.). */
export interface CenaBarras {
  tipo: 'barras';
  titulo: string;
  unidade: string;
  barras: { rotulo: string; valor: number; tom: TomFaixa; detalhe?: string }[];
  /** Linha vertical de limite (ex.: máximo em veia periférica). */
  limite?: { valor: number; rotulo: string };
  casas?: number;
}

/** Recipiente graduado que vai recebendo os componentes de uma mistura (soro, NaCl 3%…). */
export interface CenaMistura {
  tipo: 'mistura';
  recipiente: string;
  componentes: { rotulo: string; volumeMl: number; cor: CorLiquido }[];
  /** Quantos componentes já estão no recipiente ao chegar (os demais entram animados). */
  jaPresentes?: number;
  /** Composição final (ex.: "K⁺ ≈ 26 mEq/L"). */
  resumo?: { rotulo: string; valor: string; tom?: TomFaixa }[];
}

/** RN deitado com as zonas de Kramer, bilirrubinômetro e fototerapia. */
export interface CenaIctericia {
  tipo: 'ictericia';
  /** Até que zona de Kramer vai o amarelo (0 = sem icterícia, 5 = mãos e pés). */
  zona: 0 | 1 | 2 | 3 | 4 | 5;
  /** Faixas de bilirrubina de cada zona (texto), na ordem 1 a 5. Se ausente, não mostra a tabela. */
  tabelaZonas?: string[];
  bilirrubinometro?: { local: 'glabela' | 'esterno'; valor: number };
  fototerapia?: boolean;
}

/** Etapa final: a folha inteira com os cálculos de cada item (tela larga). */
export interface CenaPrescricaoFinal {
  tipo: 'prescricao-final';
}

export type Cena =
  | CenaPaciente
  | CenaMultiplicacao
  | CenaCartoes
  | CenaBancada
  | CenaConclusao
  | CenaRegua
  | CenaBarras
  | CenaMistura
  | CenaIctericia
  | CenaPrescricaoFinal;

// ---- Etapa e roteiro ---------------------------------------------------------

export interface Etapa {
  id: string;
  secao: SecaoPrescricao;
  /** Nome curto que aparece na trilha de setas. */
  curto: string;
  titulo: string;
  /** Parágrafos de explicação, em linguagem simples. */
  explicacao: string[];
  conta?: Conta;
  /** "Por que isso importa?" / pegadinha comum. */
  dica?: string;
  /** Se presente, a etapa mostra o selo "A VALIDAR" com este texto. */
  aValidar?: string;
  /** Fonte de referência do valor usado nesta etapa. */
  fonte?: string;
  cena: Cena;
  linha?: LinhaPrescricao;
  /**
   * Linha da folha a que a conta desta etapa pertence, na prescrição final com os cálculos.
   * Padrão: a linha que a etapa escreve (ou, se não escreve, a última escrita antes dela).
   */
  linhaDaConta?: string;
}

/** Tema do roteiro (agrupa os botões do menu). */
export type TemaRoteiro = 'Neonatologia' | 'Distúrbios hidroeletrolíticos' | 'Emergência';

export interface Roteiro {
  id: string;
  tema: TemaRoteiro;
  titulo: string;
  resumo: string;
  paciente: {
    nome: string;
    descricao: string;
  };
  etapas: Etapa[];
}
