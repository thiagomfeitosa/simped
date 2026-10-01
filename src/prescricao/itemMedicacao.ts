/**
 * Item de medicação estruturado na folha de prescrição (sem tela).
 * O aluno escolhe medicação → apresentação → indicação → dose → volume → via → intervalo;
 * este módulo monta a linha da folha e confere o item com o motor de cálculo.
 *
 * Regras de segurança (CLAUDE.md, docs/fase-1/item-de-medicacao.md):
 * - a CONTA do volume (dose ÷ concentração) é sempre conferida: é matemática sobre a apresentação mostrada;
 * - DOSE, VIA e INTERVALO só viram "certo/errado" quando a referência está CONFERIDA;
 *   referência "A VALIDAR" aparece só como informação, sem corrigir o aluno.
 */

import {
  concentracao as calcularConcentracao,
  conferirValor,
  doseTotal,
  TOLERANCIA_PADRAO,
  type Tolerancia,
  volumeAspirar,
} from '../calculos';
import {
  escolherRegras,
  FONTE_PADRAO,
  podeCorrigirAluno,
  regraValeParaPaciente,
  textoCondicoes,
} from '../dados/medicacoes/consulta';
import type {
  Apresentacao,
  CodigoFonte,
  FaixaEtaria,
  Medicacao,
  RegraDeDose,
  UnidadeDroga,
  VariaveisParaRegra,
  Via,
} from '../dados/medicacoes/tipos';
import {
  converterDroga,
  formatarNumero,
  lerNumero,
  RUIDO_NUMERICO,
  type Situacao,
  type Verificacao,
} from './comum';
import {
  conferirEtapas,
  conferirInfusao,
  conferirSeringaDose,
  type Concentracao,
  type EtapaDiluicaoCampos,
  type InfusaoCampos,
  infusaoVazia,
  type SeringaBicCampos,
  textoEtapas,
  textoInfusao,
  textoSeringa,
} from './preparo';
import { descreverFonte, type DocumentoFonte } from '../dados/fontes/fontes';
import { SECOES } from '../dados/secoes';

export { converterDroga, formatarNumero, lerNumero, type Situacao, type Verificacao } from './comum';

/**
 * '' = ainda não escolhido; 'dose-unica' = dose única (agora); 'continua' = infusão contínua na BIC;
 * número = intervalo em horas (6 = 6/6h).
 */
export type Intervalo = '' | 'dose-unica' | 'continua' | number;

/** Volume final da seringa da BIC quando ninguém informa outro (Santa Casa, src/dados/hospitais.ts). */
export const VOLUME_FINAL_BIC_PADRAO = 12;

/** O que o aluno preenche. Números ficam como texto, do jeito que foram digitados (aceita vírgula). */
export interface CamposMedicacao {
  medicacaoId: string;
  apresentacaoId: string;
  indicacao: string;
  /** Quantidade de droga por dose (ex.: "240"). */
  dose: string;
  unidadeDose: UnidadeDroga | '';
  /** Só para pó: mL de diluente usados para reconstituir o frasco. */
  reconstituicaoMl: string;
  /** Volume a aspirar, em mL. */
  volumeMl: string;
  via: Via | '';
  intervalo: Intervalo;
  /** Diluição/rediluição antes de aspirar a dose (vazio = usa a apresentação como está). */
  etapas: EtapaDiluicaoCampos[];
  /** Dose intermitente correndo na BIC com o volume final do hospital (null = sem BIC). */
  seringaBic: SeringaBicCampos | null;
  /** Só quando o intervalo é 'continua'. */
  infusao: InfusaoCampos | null;
}

export const INTERVALOS_HORAS = [4, 6, 8, 12, 24, 36, 48] as const;
export const UNIDADES_DOSE: readonly UnidadeDroga[] = ['mg', 'mcg', 'g', 'UI', 'mEq', 'mL'];
export const NOME_VIA: Record<Via, string> = {
  EV: 'EV',
  IM: 'IM',
  SC: 'SC',
  VO: 'VO',
  IO: 'IO',
  inalatoria: 'inalatória',
  endotraqueal: 'endotraqueal',
  retal: 'retal',
  intranasal: 'intranasal',
  ocular: 'ocular',
};
export const VIAS = Object.keys(NOME_VIA) as Via[];

export function camposVazios(medicacaoId = ''): CamposMedicacao {
  return {
    medicacaoId,
    apresentacaoId: '',
    indicacao: '',
    dose: '',
    unidadeDose: '',
    reconstituicaoMl: '',
    volumeMl: '',
    via: '',
    intervalo: '',
    etapas: [],
    seringaBic: null,
    infusao: null,
  };
}

export function textoIntervalo(intervalo: Intervalo): string {
  if (intervalo === '') return '';
  if (intervalo === 'dose-unica') return 'dose única';
  if (intervalo === 'continua') return 'infusão contínua';
  return `${intervalo}/${intervalo}h`;
}

function listaOu(itens: readonly string[]): string {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} ou ${itens[itens.length - 1]}`;
}

/** Indicações do banco com regra para a faixa etária (e, se informadas, as variáveis) do paciente. */
export function indicacoesDisponiveis(
  medicacao: Medicacao,
  faixa: FaixaEtaria,
  variaveis?: VariaveisParaRegra,
): string[] {
  return [
    ...new Set(medicacao.regras.filter((r) => regraValeParaPaciente(r, faixa, variaveis)).map((r) => r.indicacao)),
  ];
}

function unidadePadrao(ap: Apresentacao | undefined): UnidadeDroga | '' {
  return ap?.concentracaoPorMl?.unidade ?? ap?.quantidade?.unidade ?? '';
}

/**
 * Aplica uma mudança feita pelo aluno e arruma o que depende dela:
 * - trocar a medicação limpa o item;
 * - trocar a apresentação volta a unidade da dose para a da apresentação;
 * - quando só existe uma apresentação ou uma indicação, ela já vem escolhida.
 */
export function atualizarCampos(
  anterior: CamposMedicacao,
  mudanca: Partial<CamposMedicacao>,
  medicacoes: readonly Medicacao[],
  faixa: FaixaEtaria,
  variaveis?: VariaveisParaRegra,
): CamposMedicacao {
  let campos: CamposMedicacao = { ...anterior, ...mudanca };
  if (mudanca.medicacaoId !== undefined && mudanca.medicacaoId !== anterior.medicacaoId) {
    campos = camposVazios(mudanca.medicacaoId);
  } else if (mudanca.apresentacaoId !== undefined && mudanca.apresentacaoId !== anterior.apresentacaoId) {
    campos.unidadeDose = mudanca.unidadeDose ?? '';
  }

  const med = medicacoes.find((m) => m.id === campos.medicacaoId);
  if (!med) return { ...campos, apresentacaoId: '', indicacao: '' };

  const apresentacaoValida = med.apresentacoes.some((a) => a.id === campos.apresentacaoId);
  const apresentacaoId = apresentacaoValida
    ? campos.apresentacaoId
    : med.apresentacoes.length === 1
      ? (med.apresentacoes[0]?.id ?? '')
      : '';
  const indicacoes = indicacoesDisponiveis(med, faixa, variaveis);
  const indicacao = indicacoes.includes(campos.indicacao)
    ? campos.indicacao
    : indicacoes.length === 1
      ? (indicacoes[0] ?? '')
      : '';
  const ap = med.apresentacoes.find((a) => a.id === apresentacaoId);
  // infusão contínua tem campos próprios (dose/kg/min, seringa, vazão); a seringa de dose intermitente não se aplica
  const continua = campos.intervalo === 'continua';
  const infusao = continua ? (campos.infusao ?? infusaoVazia()) : null;
  const seringaBic = continua ? null : campos.seringaBic;
  return {
    ...campos,
    apresentacaoId,
    indicacao,
    unidadeDose: campos.unidadeDose || unidadePadrao(ap),
    infusao,
    seringaBic,
  };
}

/** Linha da folha, ex.: "Dipirona — Ampola 500 mg/mL, 2 mL — 240 mg (0,48 mL) EV 6/6h". */
export function textoDaFolha(
  campos: CamposMedicacao,
  medicacoes: readonly Medicacao[],
  volumeFinalBicMl: number = VOLUME_FINAL_BIC_PADRAO,
): string {
  const med = medicacoes.find((m) => m.id === campos.medicacaoId);
  if (!med) return '';
  const ap = med.apresentacoes.find((a) => a.id === campos.apresentacaoId);
  const partes = [med.nome];
  if (ap) {
    const reconstituicao = lerNumero(campos.reconstituicaoMl);
    partes.push(
      ap.forma === 'frasco-ampola-po' && reconstituicao !== null
        ? `${ap.descricao}, reconstituído em ${formatarNumero(reconstituicao)} mL`
        : ap.descricao,
    );
  }
  const diluicao = textoEtapas(campos.etapas, unidadeDaConcentracao(ap));
  if (diluicao) partes.push(diluicao);
  if (campos.intervalo === 'continua') {
    partes.push(
      [textoInfusao(campos.infusao ?? infusaoVazia(), volumeFinalBicMl), campos.via ? NOME_VIA[campos.via] : '']
        .filter(Boolean)
        .join(' '),
    );
    return partes.join(' — ');
  }
  const dose = lerNumero(campos.dose);
  const volume = lerNumero(campos.volumeMl);
  const posologia = [
    dose !== null ? `${formatarNumero(dose)} ${campos.unidadeDose}`.trim() : '',
    volume !== null ? `(${formatarNumero(volume)} mL)` : '',
    campos.via ? NOME_VIA[campos.via] : '',
    textoIntervalo(campos.intervalo),
  ]
    .filter(Boolean)
    .join(' ');
  if (posologia) partes.push(posologia);
  if (campos.seringaBic) {
    const seringa = textoSeringa(campos.seringaBic, volume, volumeFinalBicMl);
    if (seringa) partes.push(seringa);
  }
  return partes.join(' — ');
}

/** Unidade da concentração da apresentação (ou do pó reconstituído), para os textos da diluição. */
export function unidadeDaConcentracao(ap: Apresentacao | undefined): UnidadeDroga | undefined {
  return ap?.concentracaoPorMl?.unidade ?? (ap?.forma === 'frasco-ampola-po' ? ap.quantidade?.unidade : undefined);
}

export interface ResultadoItem {
  medicacao?: Medicacao;
  apresentacao?: Apresentacao;
  regra?: RegraDeDose;
  /** Campos obrigatórios ainda vazios, na ordem da tela. */
  faltando: string[];
  verificacoes: Verificacao[];
  /** Tudo preenchido com números válidos: pode ir para a folha e ser administrado. */
  completo: boolean;
}

/**
 * Campos que a apresentação pede:
 * - reconstituição: pó sem concentração pronta (o aluno diz em quantos mL reconstitui);
 * - volume: há concentração por mL para calcular o volume a aspirar (não vale para comprimido).
 */
export function camposDaApresentacao(ap: Apresentacao | undefined): { reconstituicao: boolean; volume: boolean } {
  if (!ap) return { reconstituicao: false, volume: true };
  const reconstituicao = ap.forma === 'frasco-ampola-po' && !ap.concentracaoPorMl && ap.quantidade !== undefined;
  return { reconstituicao, volume: ap.concentracaoPorMl !== undefined || reconstituicao };
}

/** Concentração por mL da apresentação (ou do pó reconstituído). null = a forma não tem volume (ex.: comprimido). */
function concentracaoUsada(
  ap: Apresentacao,
  reconstituicaoMl: number | null,
): { valor: number; unidade: UnidadeDroga } | 'falta-reconstituicao' | null {
  if (ap.concentracaoPorMl) return ap.concentracaoPorMl;
  if (ap.forma === 'frasco-ampola-po' && ap.quantidade) {
    if (reconstituicaoMl === null || reconstituicaoMl <= 0) return 'falta-reconstituicao';
    return {
      valor: calcularConcentracao({ quantidade: ap.quantidade.valor, volumeMl: reconstituicaoMl }),
      unidade: ap.quantidade.unidade,
    };
  }
  return null;
}

const NOME_UNIDADES: Partial<Record<Apresentacao['forma'], string>> = {
  ampola: 'ampolas',
  'frasco-ampola-po': 'frascos-ampola',
  'frasco-ampola-solucao': 'frascos-ampola',
  comprimido: 'comprimidos',
};

function textoFaixaDeDose(regra: RegraDeDose): string {
  const d = regra.dose;
  if (d.tipo === 'texto') return d.descricao;
  const valores = d.min === d.max ? formatarNumero(d.min) : `${formatarNumero(d.min)}–${formatarNumero(d.max)}`;
  return `${valores} ${d.unidade}${d.tipo === 'porKg' ? '/kg' : d.tipo === 'porM2' ? '/m²' : ''}/${d.por}`;
}

/** Compara a dose do aluno com a regra do banco. */
function conferirDose(
  regra: RegraDeDose,
  dose: number,
  unidadeDose: UnidadeDroga,
  intervalo: Intervalo,
  pesoKg: number,
  tolerancia: Tolerancia,
  superficieM2?: number,
): Verificacao[] {
  const corrige = podeCorrigirAluno(regra);
  const julgar = (ok: boolean): Situacao => (corrige ? (ok ? 'certo' : 'errado') : 'a-validar');
  const fonte = regra.fonte.codigo;
  const d = regra.dose;

  if (d.tipo === 'texto') {
    return [{ assunto: 'dose', situacao: 'a-validar', texto: `Referência ${fonte} ainda em texto: ${d.descricao}` }];
  }
  if (d.por === 'min' || d.por === 'h') {
    return [
      {
        assunto: 'dose',
        situacao: 'atencao',
        texto:
          `Pela referência ${fonte}, esta indicação é infusão contínua (${textoFaixaDeDose(regra)}): ` +
          'escolha "infusão contínua" no intervalo.',
      },
    ];
  }

  if (d.tipo === 'porM2' && !(superficieM2 !== undefined && superficieM2 > 0)) {
    return [{ assunto: 'dose', situacao: 'atencao', texto: `A referência ${fonte} é por m² (${textoFaixaDeDose(regra)}), mas a superfície corporal não foi informada.` }];
  }
  const doseNaUnidade = converterDroga(dose, unidadeDose, d.unidade);
  if (doseNaUnidade === null) {
    return [
      {
        assunto: 'dose',
        situacao: julgar(false),
        texto: `A referência ${fonte} está em ${d.unidade} e a dose foi escrita em ${unidadeDose}: não dá para comparar.`,
      },
    ];
  }

  const dosesPorDia = intervalo === 'dose-unica' ? 1 : typeof intervalo === 'number' ? 24 / intervalo : null;
  // dose por dia sem intervalo escolhido: ainda não dá para conferir (o campo aparece em "faltando")
  if (d.por === 'dia' && dosesPorDia === null) return [];
  const doseNoPeriodo = d.por === 'dia' ? doseNaUnidade * (dosesPorDia ?? 1) : doseNaUnidade;

  // a dose máxima do mesmo período limita a faixa (fórmula 1 de formulas.md)
  const maxima = regra.doseMaxima;
  const maximaMesmoPeriodo =
    maxima && maxima.por === d.por ? (converterDroga(maxima.valor, maxima.unidade, d.unidade) ?? undefined) : undefined;
  // por kg multiplica pelo peso; por m², pela superfície corporal (a mesma conta)
  const base = d.tipo === 'porKg' ? pesoKg : d.tipo === 'porM2' ? (superficieM2 as number) : null;
  const [minimo, maximo] =
    base !== null
      ? [
          doseTotal({ dosePorKg: d.min, pesoKg: base, doseMaxima: maximaMesmoPeriodo }).dose,
          doseTotal({ dosePorKg: d.max, pesoKg: base, doseMaxima: maximaMesmoPeriodo }).dose,
        ]
      : [Math.min(d.min, maximaMesmoPeriodo ?? Infinity), Math.min(d.max, maximaMesmoPeriodo ?? Infinity)];
  const dentro =
    doseNoPeriodo >= minimo * (1 - tolerancia.relativa) - RUIDO_NUMERICO &&
    doseNoPeriodo <= maximo * (1 + tolerancia.relativa) + RUIDO_NUMERICO;

  const u = d.unidade;
  const prescrito =
    d.por === 'dia'
      ? `Prescrito: ${formatarNumero(doseNaUnidade)} ${u} × ${formatarNumero(dosesPorDia ?? 1)} ` +
        `${dosesPorDia === 1 ? 'dose' : 'doses'}/dia = ${formatarNumero(doseNoPeriodo)} ${u}/dia`
      : `Prescrito: ${formatarNumero(doseNoPeriodo)} ${u}/dose`;
  const porKg =
    d.tipo === 'porKg'
      ? ` = ${formatarNumero(doseNoPeriodo / pesoKg)} ${u}/kg/${d.por}`
      : d.tipo === 'porM2' && base
        ? ` = ${formatarNumero(doseNoPeriodo / base)} ${u}/m²/${d.por}`
        : '';
  const textoMaxima = maxima ? ` (máx. ${formatarNumero(maxima.valor)} ${maxima.unidade}/${maxima.por})` : '';
  const faixaTexto = `${minimo === maximo ? formatarNumero(minimo) : `${formatarNumero(minimo)}–${formatarNumero(maximo)}`} ${u}/${d.por}`;
  const faixaPaciente =
    d.tipo === 'porKg'
      ? ` → para ${formatarNumero(pesoKg)} kg: ${faixaTexto}`
      : d.tipo === 'porM2' && base
        ? ` → para ${formatarNumero(base)} m²: ${faixaTexto}`
        : '';
  const veredito = !corrige ? '' : dentro ? 'Dose dentro da faixa. ' : doseNoPeriodo < minimo ? 'Dose abaixo da faixa. ' : 'Dose acima da faixa. ';

  const verificacoes: Verificacao[] = [
    {
      assunto: 'dose',
      situacao: julgar(dentro),
      texto: `${veredito}${prescrito}${porKg}. Referência ${fonte}: ${textoFaixaDeDose(regra)}${textoMaxima}${faixaPaciente}.`,
    },
  ];

  // dose máxima de outro período (ex.: regra por dose, máximo por dia)
  if (maxima && maxima.por !== d.por && (maxima.por === 'dose' || maxima.por === 'dia')) {
    const maximaConvertida = converterDroga(maxima.valor, maxima.unidade, u);
    const noPeriodoDaMaxima =
      maxima.por === 'dose' ? doseNaUnidade : dosesPorDia === null ? null : doseNaUnidade * dosesPorDia;
    if (maximaConvertida !== null && noPeriodoDaMaxima !== null) {
      const passou = noPeriodoDaMaxima > maximaConvertida * (1 + tolerancia.relativa) + RUIDO_NUMERICO;
      if (passou || corrige) {
        verificacoes.push({
          assunto: 'dose',
          situacao: julgar(!passou),
          texto: `${passou ? 'Passa da' : 'Dentro da'} dose máxima de ${formatarNumero(maxima.valor)} ${maxima.unidade}/${maxima.por}: prescrito ${formatarNumero(noPeriodoDaMaxima)} ${u}/${maxima.por}.`,
        });
      }
    }
  }
  return verificacoes;
}

/** Dose da infusão contínua (por kg por min/h) comparada com a regra do banco. */
function conferirDoseInfusao(regra: RegraDeDose, infusao: InfusaoCampos, tolerancia: Tolerancia): Verificacao[] {
  const d = regra.dose;
  const fonte = regra.fonte.codigo;
  const valor = lerNumero(infusao.dose);
  if (valor === null || valor <= 0 || !infusao.unidade) return [];
  if (d.tipo === 'texto') {
    return [{ assunto: 'dose', situacao: 'a-validar', texto: `Referência ${fonte} ainda em texto: ${d.descricao}` }];
  }
  if (d.por !== 'min' && d.por !== 'h') {
    return [
      {
        assunto: 'dose',
        situacao: 'atencao',
        texto: `Pela referência ${fonte}, esta indicação é ${textoFaixaDeDose(regra)}, não infusão contínua.`,
      },
    ];
  }
  if (d.tipo !== 'porKg') {
    return [{ assunto: 'dose', situacao: 'a-validar', texto: `Referência ${fonte}: ${textoFaixaDeDose(regra)}.` }];
  }
  const convertida = converterDroga(valor, infusao.unidade, d.unidade);
  const corrige = podeCorrigirAluno(regra);
  if (convertida === null) {
    return [
      {
        assunto: 'dose',
        situacao: corrige ? 'errado' : 'a-validar',
        texto: `A referência ${fonte} está em ${d.unidade} e a infusão em ${infusao.unidade}: não dá para comparar.`,
      },
    ];
  }
  // mesma base de tempo da referência (por min × 60 = por h)
  const naBaseDaRegra = infusao.por === d.por ? convertida : infusao.por === 'min' ? convertida * 60 : convertida / 60;
  const dentro =
    naBaseDaRegra >= d.min * (1 - tolerancia.relativa) - RUIDO_NUMERICO &&
    naBaseDaRegra <= d.max * (1 + tolerancia.relativa) + RUIDO_NUMERICO;
  const veredito = !corrige ? '' : dentro ? 'Dose da infusão dentro da faixa. ' : 'Dose da infusão fora da faixa. ';
  return [
    {
      assunto: 'dose',
      situacao: corrige ? (dentro ? 'certo' : 'errado') : 'a-validar',
      texto: `${veredito}Prescrito: ${formatarNumero(naBaseDaRegra)} ${d.unidade}/kg/${d.por}. Referência ${fonte}: ${textoFaixaDeDose(regra)}.`,
    },
  ];
}

/**
 * Confere um item de medicação da folha.
 * Devolve o que falta preencher e a lista de verificações (seção, via, conta do volume, dose, intervalo).
 */
export function conferirItemMedicacao(entrada: {
  campos: CamposMedicacao;
  medicacoes: readonly Medicacao[];
  paciente: { faixa: FaixaEtaria; pesoKg: number; variaveis?: VariaveisParaRegra; superficieM2?: number };
  /** Número da seção da folha onde o item foi escrito (4, 5 ou 6). */
  secaoNumero: number;
  fontePreferida?: CodigoFonte;
  tolerancia?: Tolerancia;
  /** Volume final da seringa da BIC do hospital (padrão: Santa Casa, 12 mL). */
  volumeFinalBicMl?: number;
  /** Catálogo de fontes (com os documentos cadastrados no app); padrão: o do projeto. */
  catalogo?: readonly DocumentoFonte[];
}): ResultadoItem {
  const { campos, medicacoes, paciente, secaoNumero } = entrada;
  const tolerancia = entrada.tolerancia ?? TOLERANCIA_PADRAO;
  const faltando: string[] = [];
  const verificacoes: Verificacao[] = [];
  let numerosValidos = true;

  const medicacao = medicacoes.find((m) => m.id === campos.medicacaoId);
  if (!medicacao) {
    return { faltando: ['medicação'], verificacoes, completo: false };
  }

  // 1. seção da folha
  if (medicacao.secao !== secaoNumero) {
    const certa = SECOES.find((s) => s.numero === medicacao.secao);
    verificacoes.push({
      assunto: 'secao',
      situacao: 'errado',
      texto: `Na folha, ${medicacao.nome} entra na seção ${medicacao.secao}${certa ? ` — ${certa.titulo}` : ''}.`,
    });
  }

  const apresentacao = medicacao.apresentacoes.find((a) => a.id === campos.apresentacaoId);
  if (!apresentacao) faltando.push('apresentação');

  const indicacoes = indicacoesDisponiveis(medicacao, paciente.faixa, paciente.variaveis);
  if (indicacoes.length === 0) {
    verificacoes.push({
      assunto: 'fonte',
      situacao: 'atencao',
      texto: `O banco ainda não tem regra de dose de ${medicacao.nome} para esta faixa etária: a dose não será conferida.`,
    });
  } else if (!campos.indicacao) {
    faltando.push('indicação');
  }

  // números digitados
  const lerCampo = (texto: string, nome: string): number | null => {
    if (texto.trim() === '') {
      faltando.push(nome);
      return null;
    }
    const valor = lerNumero(texto);
    if (valor === null || valor <= 0) {
      numerosValidos = false;
      verificacoes.push({
        assunto: 'preenchimento',
        situacao: 'errado',
        texto: `${nome[0]?.toUpperCase()}${nome.slice(1)} "${texto}" não é um número maior que zero.`,
      });
      return null;
    }
    return valor;
  };

  const continua = campos.intervalo === 'continua';
  // na infusão contínua a dose é por kg por minuto/hora (campos da infusão), não "por dose"
  const dose = continua ? null : lerCampo(campos.dose, 'dose');
  if (!continua && !campos.unidadeDose) faltando.push('unidade da dose');

  let concentracaoBase: ReturnType<typeof concentracaoUsada> = null;
  if (apresentacao) {
    const reconstituicao = camposDaApresentacao(apresentacao).reconstituicao
      ? lerCampo(campos.reconstituicaoMl, 'volume de reconstituição')
      : null;
    concentracaoBase = concentracaoUsada(apresentacao, reconstituicao);
  }

  // diluição/rediluição: a solução de trabalho passa a ser a da última etapa
  let concentracaoTrabalho: Concentracao | null =
    concentracaoBase !== null && concentracaoBase !== 'falta-reconstituicao' ? concentracaoBase : null;
  // concentração que entra na veia (para o alerta de concentração máxima)
  let concentracaoNaVeia: Concentracao | null = concentracaoTrabalho;
  const juntar = (r: {
    verificacoes: Verificacao[];
    faltando: string[];
    numerosValidos: boolean;
    concentracaoFinal?: Concentracao | null;
  }) => {
    verificacoes.push(...r.verificacoes);
    faltando.push(...r.faltando);
    if (!r.numerosValidos) numerosValidos = false;
    if (r.concentracaoFinal !== undefined) concentracaoNaVeia = r.concentracaoFinal;
  };
  if (campos.etapas.length > 0 && concentracaoTrabalho !== null) {
    const etapas = conferirEtapas(campos.etapas, concentracaoTrabalho, tolerancia);
    juntar(etapas);
    concentracaoTrabalho = etapas.concentracaoFinal;
  } else if (campos.etapas.length > 0 && apresentacao && concentracaoBase === null) {
    verificacoes.push({
      assunto: 'diluicao',
      situacao: 'atencao',
      texto: `Esta apresentação (${apresentacao.forma}) não tem concentração por mL para diluir.`,
    });
  }

  const temVolume = concentracaoBase !== null;
  const nomeVolume = campos.etapas.length > 0 ? 'volume a administrar (mL)' : 'volume (mL)';
  const volume = temVolume && !continua ? lerCampo(campos.volumeMl, nomeVolume) : null;
  if (!campos.via) faltando.push('via');
  if (campos.intervalo === '') faltando.push('intervalo');

  // 2. via
  if (apresentacao && campos.via && !apresentacao.vias.includes(campos.via)) {
    verificacoes.push({
      assunto: 'via',
      situacao: apresentacao.status === 'CONFERIDO' ? 'errado' : 'a-validar',
      texto: `A apresentação "${apresentacao.descricao}" é para via ${listaOu(apresentacao.vias.map((v) => NOME_VIA[v]))}.`,
    });
  }

  // 3. conta do volume (matemática: sempre conferida), sobre a solução de trabalho
  const c = concentracaoTrabalho;
  if (!continua && apresentacao && c !== null && dose !== null && campos.unidadeDose) {
    const doseNaUnidade = converterDroga(dose, campos.unidadeDose, c.unidade);
    if (doseNaUnidade === null) {
      verificacoes.push({
        assunto: 'unidades',
        situacao: 'errado',
        texto: `A dose está em ${campos.unidadeDose} e a apresentação em ${c.unidade}/mL: não dá para converter.`,
      });
    } else {
      const esperado = volumeAspirar({ dose: doseNaUnidade, concentracao: c.valor });
      const conta =
        `${formatarNumero(dose)} ${campos.unidadeDose}` +
        (campos.unidadeDose !== c.unidade ? ` (= ${formatarNumero(doseNaUnidade)} ${c.unidade})` : '') +
        ` ÷ ${formatarNumero(c.valor)} ${c.unidade}/mL = ${formatarNumero(esperado)} mL`;
      if (volume !== null) {
        const resultado = conferirValor(volume, esperado, tolerancia);
        verificacoes.push({
          assunto: 'volume',
          situacao: resultado.correto ? 'certo' : 'errado',
          texto: resultado.correto
            ? `Volume certo: ${conta}.`
            : `Volume não confere: ${conta} (você escreveu ${formatarNumero(volume)} mL).`,
        });
      }

      // quantas unidades (ampolas, frascos) serão abertas (pela concentração da apresentação, sem diluição)
      const base = concentracaoBase !== null && concentracaoBase !== 'falta-reconstituicao' ? concentracaoBase : c;
      const doseNaUnidadeBase = converterDroga(dose, campos.unidadeDose, base.unidade) ?? doseNaUnidade;
      const porUnidade = apresentacao.quantidade
        ? converterDroga(apresentacao.quantidade.valor, apresentacao.quantidade.unidade, base.unidade)
        : apresentacao.volumeMl !== undefined
          ? apresentacao.volumeMl * base.valor
          : null;
      if (porUnidade !== null && porUnidade > 0) {
        const unidades = Math.ceil(doseNaUnidadeBase / porUnidade - RUIDO_NUMERICO);
        if (unidades > 1) {
          verificacoes.push({
            assunto: 'volume',
            situacao: 'atencao',
            texto: `Esta dose usa ${unidades} ${NOME_UNIDADES[apresentacao.forma] ?? 'unidades'} de "${apresentacao.descricao}".`,
          });
        }
      }

      // seringa da BIC com o volume final do hospital (dose intermitente)
      if (campos.seringaBic) {
        juntar(
          conferirSeringaDose({
            campos: campos.seringaBic,
            volumeDoseMl: esperado,
            dose,
            unidade: campos.unidadeDose,
            volumeFinalMl: entrada.volumeFinalBicMl ?? VOLUME_FINAL_BIC_PADRAO,
            tolerancia,
          }),
        );
      }
    }
  } else if (apresentacao && !temVolume) {
    verificacoes.push({
      assunto: 'volume',
      situacao: 'atencao',
      texto: `A conferência de volume ainda não está pronta para esta forma (${apresentacao.forma}).`,
    });
  }

  // 3b. infusão contínua: seringa da BIC e vazão
  if (continua) {
    const infusao = campos.infusao ?? infusaoVazia();
    if (c !== null) {
      juntar(
        conferirInfusao({
          campos: infusao,
          concentracaoTrabalho: c,
          pesoKg: paciente.pesoKg,
          volumeFinalMl: entrada.volumeFinalBicMl ?? VOLUME_FINAL_BIC_PADRAO,
          tolerancia,
        }),
      );
    } else if (apresentacao) {
      faltando.push('solução de trabalho (concentração) para a infusão');
    }
  }

  // 4. dose, via e intervalo pela regra do banco
  let regra: RegraDeDose | undefined;
  if (campos.indicacao && indicacoes.includes(campos.indicacao)) {
    const escolha = escolherRegras(
      medicacao,
      campos.indicacao,
      paciente.faixa,
      entrada.fontePreferida ?? FONTE_PADRAO,
      paciente.variaveis,
    );
    regra = escolha.regras.find((r) => campos.via !== '' && r.vias.includes(campos.via)) ?? escolha.regras[0];
    for (const aviso of escolha.avisos) verificacoes.push({ assunto: 'fonte', situacao: 'atencao', texto: aviso });
    if (regra) {
      verificacoes.push({
        assunto: 'fonte',
        situacao: regra.status === 'CONFERIDO' ? 'certo' : 'a-validar',
        texto: `De onde vem a dose de referência: ${descreverFonte(regra.fonte, entrada.catalogo)}.`,
      });
    }
    if (regra?.condicoes) {
      verificacoes.push({
        assunto: 'fonte',
        situacao: 'atencao',
        texto: `Regra usada para este paciente: ${textoCondicoes(regra.condicoes)} (muda sozinha com o relógio do caso).`,
      });
    }

    if (regra) {
      const conferida = regra.status === 'CONFERIDO';
      const fonte = regra.fonte.codigo;
      if (campos.via) {
        if (!regra.vias.includes(campos.via)) {
          verificacoes.push({
            assunto: 'via',
            situacao: conferida ? 'errado' : 'a-validar',
            texto: `Pela referência ${fonte}, ${regra.indicacao} é por via ${listaOu(regra.vias.map((v) => NOME_VIA[v]))}.`,
          });
        } else if (conferida) {
          verificacoes.push({ assunto: 'via', situacao: 'certo', texto: `Via ${NOME_VIA[campos.via]} de acordo com a referência ${fonte}.` });
        }
      }
      if (dose !== null && campos.unidadeDose) {
        verificacoes.push(
          ...conferirDose(regra, dose, campos.unidadeDose, campos.intervalo, paciente.pesoKg, tolerancia, paciente.superficieM2),
        );
      }
      if (continua && campos.infusao) {
        verificacoes.push(...conferirDoseInfusao(regra, campos.infusao, tolerancia));
      }
      // dose única não é comparada com o intervalo da referência (ex.: antitérmico "agora")
      const intervalos = regra.intervalosHoras;
      if (intervalos && intervalos.length > 0 && typeof campos.intervalo === 'number') {
        const ok = intervalos.includes(campos.intervalo);
        if (!ok || conferida) {
          verificacoes.push({
            assunto: 'intervalo',
            situacao: conferida ? (ok ? 'certo' : 'errado') : 'a-validar',
            texto: ok
              ? `Intervalo ${textoIntervalo(campos.intervalo)} de acordo com a referência ${fonte}.`
              : `Pela referência ${fonte}, o intervalo é ${listaOu(intervalos.map(textoIntervalo))}.`,
          });
        }
      }
    }
  }

  // concentração máxima EV (alerta; só vira erro com valor CONFERIDO)
  const maxima = medicacao.concentracaoMaximaEV;
  const naVeia = concentracaoNaVeia as Concentracao | null;
  if (maxima && naVeia && (campos.via === 'EV' || campos.via === 'IO')) {
    const naUnidade = converterDroga(naVeia.valor, naVeia.unidade, maxima.unidade);
    if (naUnidade !== null && naUnidade > maxima.valor * (1 + tolerancia.relativa) + RUIDO_NUMERICO) {
      verificacoes.push({
        assunto: 'alerta',
        situacao: maxima.status === 'CONFERIDO' ? 'errado' : 'atencao',
        texto:
          `Concentração na veia ${formatarNumero(naUnidade)} ${maxima.unidade}/mL acima da máxima de ` +
          `${formatarNumero(maxima.valor)} ${maxima.unidade}/mL (${maxima.fonte.codigo}${maxima.status === 'A_VALIDAR' ? ', A VALIDAR' : ''}): diluir mais.`,
      });
    }
  }

  for (const alerta of medicacao.alertas ?? []) {
    verificacoes.push({ assunto: 'alerta', situacao: 'atencao', texto: alerta });
  }

  return {
    medicacao,
    ...(apresentacao && { apresentacao }),
    ...(regra && { regra }),
    faltando,
    verificacoes,
    completo: faltando.length === 0 && numerosValidos,
  };
}

const RESUMO_PROVA: Partial<Record<Verificacao['assunto'], Partial<Record<Situacao, string>>>> = {
  secao: { errado: 'Seção da folha errada.' },
  via: { certo: 'Via certa.', errado: 'Via não confere.', 'a-validar': 'Via: referência A VALIDAR (não corrige).' },
  volume: { certo: 'Volume certo.', errado: 'Volume não confere.' },
  dose: {
    certo: 'Dose dentro da faixa.',
    errado: 'Dose fora da faixa.',
    'a-validar': 'Dose: referência A VALIDAR (não corrige).',
    atencao: 'Infusão contínua: confira na seção de diluição/BIC.',
  },
  intervalo: {
    certo: 'Intervalo certo.',
    errado: 'Intervalo não confere.',
    'a-validar': 'Intervalo: referência A VALIDAR (não corrige).',
  },
};

/**
 * Modo prova: esconde o gabarito (a conta certa, a faixa de dose, o intervalo da referência)
 * e deixa só o veredito. No modo treino o texto vai inteiro.
 */
export function textoParaModo(v: Verificacao, modo: 'treino' | 'prova'): string {
  if (modo === 'treino') return v.texto;
  return RESUMO_PROVA[v.assunto]?.[v.situacao] ?? v.texto;
}
