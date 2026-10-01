/**
 * Preparo da medicação no item da folha (sem tela): diluição e rediluição em etapas (C1 × V1 = C2 × V2),
 * seringa da BIC com o volume final do hospital (fator de correção) e infusão contínua (mL/h).
 * Fórmulas 3, 4 e 7 de docs/fase-0/formulas.md, conferidas pelo motor de cálculo (src/calculos/).
 *
 * Tudo aqui é MATEMÁTICA sobre números que estão na tela (concentração da apresentação, volumes
 * escolhidos pelo aluno, volume final do hospital): por isso é sempre conferido, mesmo com doses A VALIDAR.
 */

import { conferirValor, prepararSeringaBic, type Tolerancia, vazaoMlPorHora } from '../calculos';
import type { UnidadeDroga } from '../dados/medicacoes/tipos';
import { converterDroga, formatarNumero, lerNumero, type Verificacao } from './comum';

export const DILUENTES = ['SF 0,9%', 'AD', 'SG 5%'] as const;
export type Diluente = (typeof DILUENTES)[number];

export interface Concentracao {
  valor: number;
  unidade: UnidadeDroga;
}

/** Uma etapa: aspira V1 mL da solução anterior (ou da apresentação) e completa até V2 mL. */
export interface EtapaDiluicaoCampos {
  aspirarMl: string;
  completarAteMl: string;
  diluente: Diluente;
  /** Concentração resultante escrita pelo aluno (na unidade da apresentação, por mL). */
  concentracao: string;
}

/** Dose intermitente correndo na BIC: volume da dose + SF até o volume final do hospital. */
export interface SeringaBicCampos {
  soroMl: string;
  concentracao: string;
  /** Opcional: tempo para correr a seringa (min) e a vazão (mL/h). */
  tempoMin: string;
  vazaoMlH: string;
}

export type TempoInfusao = 'min' | 'h';

/** Infusão contínua: dose por kg por minuto/hora, seringa da BIC e vazão. */
export interface InfusaoCampos {
  dose: string;
  unidade: UnidadeDroga | '';
  por: TempoInfusao;
  /** Volume da solução de trabalho colocado na seringa (escolha do aluno). */
  volumeNaSeringaMl: string;
  soroMl: string;
  /** Concentração final da seringa, na unidade da dose por mL. */
  concentracao: string;
  vazaoMlH: string;
}

export function etapaVazia(): EtapaDiluicaoCampos {
  return { aspirarMl: '', completarAteMl: '', diluente: 'SF 0,9%', concentracao: '' };
}

export function seringaVazia(): SeringaBicCampos {
  return { soroMl: '', concentracao: '', tempoMin: '', vazaoMlH: '' };
}

export function infusaoVazia(): InfusaoCampos {
  return { dose: '', unidade: 'mcg', por: 'min', volumeNaSeringaMl: '', soroMl: '', concentracao: '', vazaoMlH: '' };
}

export interface ResultadoPreparo {
  verificacoes: Verificacao[];
  faltando: string[];
  /** Falso quando algum número digitado é inválido (o item não pode ser administrado). */
  numerosValidos: boolean;
  /** Concentração que entra na veia (calculada pelo programa), quando dá para saber. */
  concentracaoFinal?: Concentracao | null;
}

function novoResultado(): ResultadoPreparo {
  return { verificacoes: [], faltando: [], numerosValidos: true };
}

/** Lê um campo numérico obrigatório: vazio vai para "faltando"; texto que não é número vira erro. */
function lerObrigatorio(r: ResultadoPreparo, texto: string, nome: string, assunto: Verificacao['assunto']): number | null {
  if (texto.trim() === '') {
    r.faltando.push(nome);
    return null;
  }
  const valor = lerNumero(texto);
  if (valor === null || valor <= 0) {
    r.numerosValidos = false;
    r.verificacoes.push({ assunto, situacao: 'errado', texto: `${nome[0]?.toUpperCase()}${nome.slice(1)} "${texto}" não é um número maior que zero.` });
    return null;
  }
  return valor;
}

/** Compara o número do aluno com o certo e escreve a conta. */
function comparar(
  r: ResultadoPreparo,
  assunto: Verificacao['assunto'],
  resposta: number,
  esperado: number,
  conta: string,
  oQue: string,
  unidade: string,
  tolerancia: Tolerancia,
): boolean {
  const ok = conferirValor(resposta, esperado, tolerancia).correto;
  // "Concentração ... certa", "Vazão certa", "Volume de SF certo"
  const certo = /^(Concentração|Vazão)/.test(oQue) ? 'certa' : 'certo';
  r.verificacoes.push({
    assunto,
    situacao: ok ? 'certo' : 'errado',
    texto: ok
      ? `${oQue} ${certo}: ${conta}.`
      : `${oQue} não confere: ${conta} (você escreveu ${formatarNumero(resposta)} ${unidade}).`,
  });
  return ok;
}

function nomeEtapa(i: number): string {
  return i === 0 ? 'etapa 1 (diluição)' : `etapa ${i + 1} (rediluição)`;
}

/**
 * Diluição e rediluições: cada etapa parte da concentração CERTA da etapa anterior
 * (um erro numa etapa não contamina a correção das seguintes).
 * Devolve a concentração final (null se alguma etapa estiver incompleta ou impossível).
 */
export function conferirEtapas(
  etapas: readonly EtapaDiluicaoCampos[],
  inicial: Concentracao,
  tolerancia: Tolerancia,
): ResultadoPreparo & { concentracaoFinal: Concentracao | null } {
  const r = novoResultado();
  let atual: Concentracao | null = inicial;
  etapas.forEach((etapa, i) => {
    const nome = nomeEtapa(i);
    const v1 = lerObrigatorio(r, etapa.aspirarMl, `volume aspirado da ${nome}`, 'diluicao');
    const v2 = lerObrigatorio(r, etapa.completarAteMl, `volume final da ${nome}`, 'diluicao');
    if (atual === null || v1 === null || v2 === null) {
      atual = null;
      return;
    }
    if (v2 < v1) {
      r.numerosValidos = false;
      r.verificacoes.push({
        assunto: 'diluicao',
        situacao: 'errado',
        texto: `Na ${nome}, o volume final (${formatarNumero(v2)} mL) é menor que o aspirado (${formatarNumero(v1)} mL).`,
      });
      atual = null;
      return;
    }
    const c2 = (atual.valor * v1) / v2;
    const u = `${atual.unidade}/mL`;
    const conta =
      `${formatarNumero(atual.valor)} ${u} × ${formatarNumero(v1)} mL ÷ ${formatarNumero(v2)} mL = ${formatarNumero(c2)} ${u}` +
      ` (${formatarNumero(v1)} mL + ${formatarNumero(v2 - v1)} mL de ${etapa.diluente})`;
    const resposta = lerObrigatorio(r, etapa.concentracao, `concentração da ${nome}`, 'diluicao');
    if (resposta !== null) comparar(r, 'diluicao', resposta, c2, conta, `Concentração da ${nome}`, u, tolerancia);
    atual = { valor: c2, unidade: atual.unidade };
  });
  return { ...r, concentracaoFinal: atual };
}

/**
 * Dose intermitente na BIC (fórmula 7): o volume da dose sai do volume final do hospital
 * e o resto é SF. Confere SF, concentração final e, se o aluno informar o tempo, a vazão.
 */
export function conferirSeringaDose(entrada: {
  campos: SeringaBicCampos;
  /** Volume CERTO da dose (mL), calculado pela conta do volume. */
  volumeDoseMl: number;
  dose: number;
  unidade: UnidadeDroga;
  volumeFinalMl: number;
  tolerancia: Tolerancia;
}): ResultadoPreparo {
  const { campos, volumeDoseMl, dose, unidade, volumeFinalMl, tolerancia } = entrada;
  const r = novoResultado();
  const seringa = prepararSeringaBic({ volumeMedicacaoMl: volumeDoseMl, volumeFinalMl, quantidadeDeDroga: dose });
  if (!seringa.aplicavel) {
    r.verificacoes.push({ assunto: 'bic', situacao: 'atencao', texto: seringa.motivo });
    return r;
  }
  const soro = lerObrigatorio(r, campos.soroMl, 'volume de SF da seringa', 'bic');
  if (soro !== null) {
    comparar(
      r,
      'bic',
      soro,
      seringa.volumeSoroMl,
      `${formatarNumero(volumeFinalMl)} mL − ${formatarNumero(volumeDoseMl)} mL da dose = ${formatarNumero(seringa.volumeSoroMl)} mL de SF`,
      'Volume de SF',
      'mL',
      tolerancia,
    );
  }
  if (seringa.concentracaoFinal !== undefined) r.concentracaoFinal = { valor: seringa.concentracaoFinal, unidade };
  const concentracao = lerObrigatorio(r, campos.concentracao, 'concentração final da seringa', 'bic');
  if (concentracao !== null && seringa.concentracaoFinal !== undefined) {
    comparar(
      r,
      'bic',
      concentracao,
      seringa.concentracaoFinal,
      `${formatarNumero(dose)} ${unidade} ÷ ${formatarNumero(volumeFinalMl)} mL = ${formatarNumero(seringa.concentracaoFinal)} ${unidade}/mL`,
      'Concentração final',
      `${unidade}/mL`,
      tolerancia,
    );
  }
  conferirTempoEVazao(r, campos.tempoMin, campos.vazaoMlH, volumeFinalMl, tolerancia);
  return r;
}

/** Tempo e vazão são opcionais, mas andam juntos: vazão (mL/h) = volume ÷ tempo (min) × 60. */
function conferirTempoEVazao(
  r: ResultadoPreparo,
  tempoTexto: string,
  vazaoTexto: string,
  volumeMl: number,
  tolerancia: Tolerancia,
): void {
  if (tempoTexto.trim() === '' && vazaoTexto.trim() === '') return;
  const tempo = lerObrigatorio(r, tempoTexto, 'tempo de infusão (min)', 'bic');
  const vazao = lerObrigatorio(r, vazaoTexto, 'vazão da BIC (mL/h)', 'bic');
  if (tempo === null || vazao === null) return;
  const esperado = (volumeMl / tempo) * 60;
  comparar(
    r,
    'bic',
    vazao,
    esperado,
    `${formatarNumero(volumeMl)} mL ÷ ${formatarNumero(tempo)} min × 60 = ${formatarNumero(esperado)} mL/h`,
    'Vazão',
    'mL/h',
    tolerancia,
  );
}

/**
 * Infusão contínua (fórmulas 4 e 7): o aluno escolhe quanto da solução vai na seringa;
 * o programa confere o SF, a concentração final e a vazão para a dose por kg prescrita.
 */
export function conferirInfusao(entrada: {
  campos: InfusaoCampos;
  /** Concentração da solução de onde se aspira (apresentação, reconstituição ou última diluição). */
  concentracaoTrabalho: Concentracao;
  pesoKg: number;
  volumeFinalMl: number;
  tolerancia: Tolerancia;
}): ResultadoPreparo {
  const { campos, concentracaoTrabalho: c, pesoKg, volumeFinalMl, tolerancia } = entrada;
  const r = novoResultado();
  const dose = lerObrigatorio(r, campos.dose, 'dose da infusão', 'infusao');
  if (!campos.unidade) r.faltando.push('unidade da dose da infusão');
  const volume = lerObrigatorio(r, campos.volumeNaSeringaMl, 'volume da medicação na seringa', 'infusao');
  if (volume === null) {
    // sem o volume não dá para conferir o resto, mas os campos vazios ainda contam como "falta"
    if (campos.soroMl.trim() === '') r.faltando.push('volume de SF da seringa');
    if (campos.concentracao.trim() === '') r.faltando.push('concentração final da seringa');
    if (campos.vazaoMlH.trim() === '') r.faltando.push('vazão da BIC (mL/h)');
    return r;
  }

  const seringa = prepararSeringaBic({ volumeMedicacaoMl: volume, volumeFinalMl });
  if (!seringa.aplicavel) {
    r.numerosValidos = false;
    r.verificacoes.push({ assunto: 'infusao', situacao: 'errado', texto: seringa.motivo });
    return r;
  }
  const soro = lerObrigatorio(r, campos.soroMl, 'volume de SF da seringa', 'infusao');
  if (soro !== null) {
    comparar(
      r,
      'infusao',
      soro,
      seringa.volumeSoroMl,
      `${formatarNumero(volumeFinalMl)} mL − ${formatarNumero(volume)} mL = ${formatarNumero(seringa.volumeSoroMl)} mL de SF`,
      'Volume de SF',
      'mL',
      tolerancia,
    );
  }

  const unidade = campos.unidade || c.unidade;
  const quantidadeNaUnidadeDaApresentacao = volume * c.valor;
  const quantidade = converterDroga(quantidadeNaUnidadeDaApresentacao, c.unidade, unidade);
  if (quantidade === null) {
    r.numerosValidos = false;
    r.verificacoes.push({
      assunto: 'unidades',
      situacao: 'errado',
      texto: `A dose está em ${unidade} e a solução em ${c.unidade}/mL: não dá para converter.`,
    });
    return r;
  }
  const cFinal = quantidade / volumeFinalMl;
  r.concentracaoFinal = { valor: cFinal, unidade };
  const conversao = unidade !== c.unidade ? ` = ${formatarNumero(quantidade)} ${unidade}` : '';
  const concentracao = lerObrigatorio(r, campos.concentracao, 'concentração final da seringa', 'infusao');
  if (concentracao !== null) {
    comparar(
      r,
      'infusao',
      concentracao,
      cFinal,
      `${formatarNumero(volume)} mL × ${formatarNumero(c.valor)} ${c.unidade}/mL = ${formatarNumero(quantidadeNaUnidadeDaApresentacao)} ${c.unidade}${conversao}; ÷ ${formatarNumero(volumeFinalMl)} mL = ${formatarNumero(cFinal)} ${unidade}/mL`,
      'Concentração final',
      `${unidade}/mL`,
      tolerancia,
    );
  }

  const vazao = lerObrigatorio(r, campos.vazaoMlH, 'vazão da BIC (mL/h)', 'infusao');
  if (dose !== null && vazao !== null) {
    const esperado = vazaoMlPorHora({ dosePorKg: dose, pesoKg, concentracao: cFinal, por: campos.por });
    const fator = campos.por === 'min' ? ' × 60' : '';
    const ok = comparar(
      r,
      'infusao',
      vazao,
      esperado,
      `${formatarNumero(dose)} ${unidade}/kg/${campos.por} × ${formatarNumero(pesoKg)} kg${fator} ÷ ${formatarNumero(cFinal)} ${unidade}/mL = ${formatarNumero(esperado)} mL/h`,
      'Vazão',
      'mL/h',
      tolerancia,
    );
    if (ok) {
      r.verificacoes.push({
        assunto: 'infusao',
        situacao: 'atencao',
        texto: `Nesta vazão, a seringa de ${formatarNumero(volumeFinalMl)} mL dura ${formatarNumero(volumeFinalMl / esperado)} h.`,
      });
    }
  }
  return r;
}

/** Texto das etapas para a folha: "diluir 1 mL + SF 0,9% até 10 mL (0,1 mg/mL)". */
export function textoEtapas(etapas: readonly EtapaDiluicaoCampos[], unidade: UnidadeDroga | undefined): string {
  return etapas
    .map((e, i) => {
      const v1 = lerNumero(e.aspirarMl);
      const v2 = lerNumero(e.completarAteMl);
      const c = lerNumero(e.concentracao);
      if (v1 === null || v2 === null) return '';
      const verbo = i === 0 ? 'diluir' : 'rediluir';
      const conc = c !== null && unidade ? ` (${formatarNumero(c)} ${unidade}/mL)` : '';
      return `${verbo} ${formatarNumero(v1)} mL + ${e.diluente} até ${formatarNumero(v2)} mL${conc}`;
    })
    .filter(Boolean)
    .join('; ');
}

/** Texto da seringa da BIC para a folha. */
export function textoSeringa(campos: SeringaBicCampos, volumeDose: number | null, volumeFinalMl: number): string {
  const soro = lerNumero(campos.soroMl);
  const tempo = lerNumero(campos.tempoMin);
  const vazao = lerNumero(campos.vazaoMlH);
  if (soro === null) return '';
  const dose = volumeDose !== null ? `${formatarNumero(volumeDose)} mL + ` : '';
  const correr = tempo !== null ? `, correr em ${formatarNumero(tempo)} min` : '';
  const bomba = vazao !== null ? ` (${formatarNumero(vazao)} mL/h)` : '';
  return `em BIC: ${dose}${formatarNumero(soro)} mL de SF 0,9% = ${formatarNumero(volumeFinalMl)} mL${correr}${bomba}`;
}

/** Texto da infusão contínua para a folha. */
export function textoInfusao(campos: InfusaoCampos, volumeFinalMl: number): string {
  const dose = lerNumero(campos.dose);
  const volume = lerNumero(campos.volumeNaSeringaMl);
  const soro = lerNumero(campos.soroMl);
  const c = lerNumero(campos.concentracao);
  const vazao = lerNumero(campos.vazaoMlH);
  const partes: string[] = [];
  if (dose !== null && campos.unidade) partes.push(`${formatarNumero(dose)} ${campos.unidade}/kg/${campos.por}`);
  if (volume !== null && soro !== null) {
    partes.push(`em BIC: ${formatarNumero(volume)} mL + ${formatarNumero(soro)} mL de SF 0,9% = ${formatarNumero(volumeFinalMl)} mL`);
  }
  if (c !== null && campos.unidade) partes.push(`(${formatarNumero(c)} ${campos.unidade}/mL)`);
  if (vazao !== null) partes.push(`a ${formatarNumero(vazao)} mL/h`);
  return partes.length > 0 ? `${partes.join(' ')} — infusão contínua` : 'infusão contínua';
}
