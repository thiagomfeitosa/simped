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
  converterMassa,
  doseTotal,
  TOLERANCIA_PADRAO,
  type Tolerancia,
  type UnidadeDeMassa,
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
import { SECOES } from './secoes';

/** '' = ainda não escolhido; 'dose-unica' = dose única (agora); número = intervalo em horas (6 = 6/6h). */
export type Intervalo = '' | 'dose-unica' | number;

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
}

export const INTERVALOS_HORAS = [4, 6, 8, 12, 24] as const;
export const UNIDADES_DOSE: readonly UnidadeDroga[] = ['mg', 'mcg', 'g', 'UI', 'mEq'];
export const NOME_VIA: Record<Via, string> = {
  EV: 'EV',
  IM: 'IM',
  SC: 'SC',
  VO: 'VO',
  IO: 'IO',
  inalatoria: 'inalatória',
  endotraqueal: 'endotraqueal',
  retal: 'retal',
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
  };
}

/**
 * Lê um número digitado em português: "0,48", "0.48", "1.000,5".
 * Com vírgula, os pontos são separadores de milhar; sem vírgula, o ponto é a casa decimal.
 * Devolve null se o texto estiver vazio ou não for um número.
 */
export function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, '');
  if (limpo === '') return null;
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo;
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(normalizado)) return null;
  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}

/** Número para mostrar ao aluno (0,48 · 15,5 · 4.000). */
export function formatarNumero(valor: number): string {
  const abs = Math.abs(valor);
  const casas = abs < 1 ? 4 : abs < 100 ? 2 : 1;
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

export function textoIntervalo(intervalo: Intervalo): string {
  if (intervalo === '') return '';
  if (intervalo === 'dose-unica') return 'dose única';
  return `${intervalo}/${intervalo}h`;
}

function listaOu(itens: readonly string[]): string {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} ou ${itens[itens.length - 1]}`;
}

const MASSAS: readonly string[] = ['g', 'mg', 'mcg'];

/** Converte entre unidades de droga quando possível (mesma unidade ou g/mg/mcg). Senão, null. */
function converterDroga(valor: number, de: UnidadeDroga, para: UnidadeDroga): number | null {
  if (de === para) return valor;
  if (MASSAS.includes(de) && MASSAS.includes(para)) {
    return converterMassa(valor, de as UnidadeDeMassa, para as UnidadeDeMassa);
  }
  return null;
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
  const unidade = ap?.concentracaoPorMl?.unidade ?? ap?.quantidade?.unidade;
  return unidade && unidade !== 'mL' ? unidade : '';
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
  return { ...campos, apresentacaoId, indicacao, unidadeDose: campos.unidadeDose || unidadePadrao(ap) };
}

/** Linha da folha, ex.: "Dipirona — Ampola 500 mg/mL, 2 mL — 240 mg (0,48 mL) EV 6/6h". */
export function textoDaFolha(campos: CamposMedicacao, medicacoes: readonly Medicacao[]): string {
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
  return partes.join(' — ');
}

/** 'atencao' = aviso que não é erro; 'a-validar' = referência ainda não conferida (não corrige). */
export type Situacao = 'certo' | 'errado' | 'atencao' | 'a-validar';

export interface Verificacao {
  assunto: 'secao' | 'via' | 'volume' | 'unidades' | 'dose' | 'intervalo' | 'fonte' | 'alerta' | 'preenchimento';
  situacao: Situacao;
  texto: string;
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

const RUIDO_NUMERICO = 1e-9;

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
  return `${valores} ${d.unidade}${d.tipo === 'porKg' ? '/kg' : ''}/${d.por}`;
}

/** Compara a dose do aluno com a regra do banco. */
function conferirDose(
  regra: RegraDeDose,
  dose: number,
  unidadeDose: UnidadeDroga,
  intervalo: Intervalo,
  pesoKg: number,
  tolerancia: Tolerancia,
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
          `Pela referência ${fonte}, esta indicação é infusão contínua (${textoFaixaDeDose(regra)}). ` +
          'A conferência de infusão na BIC ainda não está pronta.',
      },
    ];
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
  const [minimo, maximo] =
    d.tipo === 'porKg'
      ? [
          doseTotal({ dosePorKg: d.min, pesoKg, doseMaxima: maximaMesmoPeriodo }).dose,
          doseTotal({ dosePorKg: d.max, pesoKg, doseMaxima: maximaMesmoPeriodo }).dose,
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
  const porKg = d.tipo === 'porKg' ? ` = ${formatarNumero(doseNoPeriodo / pesoKg)} ${u}/kg/${d.por}` : '';
  const textoMaxima = maxima ? ` (máx. ${formatarNumero(maxima.valor)} ${maxima.unidade}/${maxima.por})` : '';
  const faixaPaciente =
    d.tipo === 'porKg'
      ? ` → para ${formatarNumero(pesoKg)} kg: ${minimo === maximo ? formatarNumero(minimo) : `${formatarNumero(minimo)}–${formatarNumero(maximo)}`} ${u}/${d.por}`
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

/**
 * Confere um item de medicação da folha.
 * Devolve o que falta preencher e a lista de verificações (seção, via, conta do volume, dose, intervalo).
 */
export function conferirItemMedicacao(entrada: {
  campos: CamposMedicacao;
  medicacoes: readonly Medicacao[];
  paciente: { faixa: FaixaEtaria; pesoKg: number; variaveis?: VariaveisParaRegra };
  /** Número da seção da folha onde o item foi escrito (4, 5 ou 6). */
  secaoNumero: number;
  fontePreferida?: CodigoFonte;
  tolerancia?: Tolerancia;
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

  const dose = lerCampo(campos.dose, 'dose');
  if (!campos.unidadeDose) faltando.push('unidade da dose');

  let concentracao: ReturnType<typeof concentracaoUsada> = null;
  if (apresentacao) {
    const reconstituicao = camposDaApresentacao(apresentacao).reconstituicao
      ? lerCampo(campos.reconstituicaoMl, 'volume de reconstituição')
      : null;
    concentracao = concentracaoUsada(apresentacao, reconstituicao);
  }
  const temVolume = concentracao !== null;
  const volume = temVolume ? lerCampo(campos.volumeMl, 'volume (mL)') : null;
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

  // 3. conta do volume (matemática: sempre conferida)
  if (apresentacao && concentracao !== null && concentracao !== 'falta-reconstituicao' && dose !== null && campos.unidadeDose) {
    const doseNaUnidade = converterDroga(dose, campos.unidadeDose, concentracao.unidade);
    if (doseNaUnidade === null) {
      verificacoes.push({
        assunto: 'unidades',
        situacao: 'errado',
        texto: `A dose está em ${campos.unidadeDose} e a apresentação em ${concentracao.unidade}/mL: não dá para converter.`,
      });
    } else {
      const esperado = volumeAspirar({ dose: doseNaUnidade, concentracao: concentracao.valor });
      const conta =
        `${formatarNumero(dose)} ${campos.unidadeDose}` +
        (campos.unidadeDose !== concentracao.unidade ? ` (= ${formatarNumero(doseNaUnidade)} ${concentracao.unidade})` : '') +
        ` ÷ ${formatarNumero(concentracao.valor)} ${concentracao.unidade}/mL = ${formatarNumero(esperado)} mL`;
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

      // quantas unidades (ampolas, frascos) serão abertas
      const porUnidade = apresentacao.quantidade
        ? converterDroga(apresentacao.quantidade.valor, apresentacao.quantidade.unidade, concentracao.unidade)
        : apresentacao.volumeMl !== undefined
          ? apresentacao.volumeMl * concentracao.valor
          : null;
      if (porUnidade !== null && porUnidade > 0) {
        const unidades = Math.ceil(doseNaUnidade / porUnidade - RUIDO_NUMERICO);
        if (unidades > 1) {
          verificacoes.push({
            assunto: 'volume',
            situacao: 'atencao',
            texto: `Esta dose usa ${unidades} ${NOME_UNIDADES[apresentacao.forma] ?? 'unidades'} de "${apresentacao.descricao}".`,
          });
        }
      }
    }
  } else if (apresentacao && !temVolume) {
    verificacoes.push({
      assunto: 'volume',
      situacao: 'atencao',
      texto: `A conferência de volume ainda não está pronta para esta forma (${apresentacao.forma}).`,
    });
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
        verificacoes.push(...conferirDose(regra, dose, campos.unidadeDose, campos.intervalo, paciente.pesoKg, tolerancia));
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
