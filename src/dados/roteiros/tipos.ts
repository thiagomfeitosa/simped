/**
 * Formato de um "roteiro passo a passo": uma lista de etapas que o aluno
 * percorre com as setas. Cada etapa diz o que explicar, que conta mostrar,
 * que animação exibir e o que acrescentar à folha de prescrição e ao rascunho.
 */

/** Seções da folha de prescrição, na ordem oficial (ver CLAUDE.md). */
export type SecaoPrescricao =
  | 'identificacao'
  | 'oxigenoterapia'
  | 'dieta'
  | 'hidratacao'
  | 'antimicrobianos'
  | 'demais'
  | 'exames'
  | 'orientacoes'
  | 'sinan'
  | 'revisao';

/** Uma conta mostrada em três tempos: fórmula → números → resultado. */
export interface Conta {
  formula: string;
  substituicao: string;
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
  | 'x';

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
  /** Quanto vale cada bloco (ex.: 50). */
  valorPorKg: number;
  unidade: string;
  pesoKg: number;
  total: number;
  rotuloTotal: string;
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

export type Cena = CenaPaciente | CenaMultiplicacao | CenaCartoes | CenaBancada | CenaConclusao;

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
}

export interface Roteiro {
  id: string;
  titulo: string;
  resumo: string;
  paciente: {
    nome: string;
    descricao: string;
  };
  etapas: Etapa[];
}
