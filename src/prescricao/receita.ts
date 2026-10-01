/**
 * Receita de alta / ambulatorial (sem tela).
 * O aluno escolhe a apresentação oral, a dose, o intervalo e a duração; escreve quanto dar por vez
 * (mL, gotas ou comprimidos) e quantos frascos/caixas comprar. O programa confere as contas
 * (sempre) e mostra a referência de dose (só corrige com regra CONFERIDA, como na folha).
 */

import { conferirValor, type Tolerancia } from '../calculos';
import { escolherRegras, FONTE_PADRAO } from '../dados/medicacoes/consulta';
import type { Apresentacao, CodigoFonte, Medicacao, UnidadeDroga, VariaveisParaRegra } from '../dados/medicacoes/tipos';
import { converterDroga, formatarNumero, lerNumero, RUIDO_NUMERICO, type Verificacao } from './comum';
import { conferirItemMedicacao, camposVazios, indicacoesDisponiveis } from './itemMedicacao';

/** Um item da receita de alta (fica na sessão do caso e entra no relatório final). */
export interface ItemReceita {
  id: number;
  campos: CamposReceita;
}

export interface CamposReceita {
  medicacaoId: string;
  apresentacaoId: string;
  indicacao: string;
  dose: string;
  unidadeDose: UnidadeDroga | '';
  /** Quanto dar por vez, na unidade da apresentação (mL, gotas ou comprimidos). */
  quantidadePorVez: string;
  intervaloHoras: number | '';
  duracaoDias: string;
  /** Frascos/caixas a comprar. */
  frascos: string;
  /** Ex.: "se febre ou dor", "após as refeições". */
  orientacao: string;
}

export function receitaVazia(): CamposReceita {
  return {
    medicacaoId: '',
    apresentacaoId: '',
    indicacao: '',
    dose: '',
    unidadeDose: '',
    quantidadePorVez: '',
    intervaloHoras: '',
    duracaoDias: '',
    frascos: '',
    orientacao: '',
  };
}

export type UnidadeDaVez = 'mL' | 'gotas' | 'comprimidos';

/** Como se mede a dose desta apresentação. null = não é oral (não entra na receita). */
export function unidadeDaVez(ap: Apresentacao | undefined): UnidadeDaVez | null {
  if (!ap) return null;
  if (ap.forma === 'gotas') return 'gotas';
  if (ap.forma === 'solucao-oral') return 'mL';
  if (ap.forma === 'comprimido') return 'comprimidos';
  return null;
}

/** Medicações com alguma apresentação oral. */
export function medicacoesOrais(medicacoes: readonly Medicacao[]): Medicacao[] {
  return medicacoes.filter((m) => m.apresentacoes.some((a) => unidadeDaVez(a) !== null));
}

export function textoFrequencia(intervaloHoras: number | ''): string {
  if (intervaloHoras === '') return '';
  if (intervaloHoras === 24) return '1 vez ao dia';
  return `de ${intervaloHoras} em ${intervaloHoras} horas`;
}

export const TEXTO_RECEITUARIO: Record<NonNullable<Medicacao['receituario']>, string> = {
  simples: 'Receita simples.',
  antimicrobiano: 'Antimicrobiano: receita em 2 vias, a farmácia retém uma (A VALIDAR com a legislação vigente).',
  'controle-especial': 'Receita de controle especial (A VALIDAR com a legislação vigente).',
};

export interface ResultadoReceita {
  medicacao?: Medicacao;
  apresentacao?: Apresentacao;
  unidade: UnidadeDaVez | null;
  faltando: string[];
  verificacoes: Verificacao[];
  completo: boolean;
}

export function conferirReceita(entrada: {
  campos: CamposReceita;
  medicacoes: readonly Medicacao[];
  paciente: {
    faixa: Parameters<typeof indicacoesDisponiveis>[1];
    pesoKg: number;
    variaveis?: VariaveisParaRegra;
    superficieM2?: number;
  };
  fontePreferida?: CodigoFonte;
  tolerancia: Tolerancia;
}): ResultadoReceita {
  const { campos, medicacoes, paciente, tolerancia } = entrada;
  const faltando: string[] = [];
  const verificacoes: Verificacao[] = [];
  let numerosValidos = true;
  const medicacao = medicacoes.find((m) => m.id === campos.medicacaoId);
  if (!medicacao) return { unidade: null, faltando: ['medicação'], verificacoes, completo: false };
  const apresentacao = medicacao.apresentacoes.find((a) => a.id === campos.apresentacaoId);
  const unidade = unidadeDaVez(apresentacao);
  if (!apresentacao) faltando.push('apresentação');

  const ler = (texto: string, nome: string): number | null => {
    if (texto.trim() === '') {
      faltando.push(nome);
      return null;
    }
    const v = lerNumero(texto);
    if (v === null || v <= 0) {
      numerosValidos = false;
      verificacoes.push({ assunto: 'preenchimento', situacao: 'errado', texto: `${nome} "${texto}" não é um número maior que zero.` });
      return null;
    }
    return v;
  };
  const dose = ler(campos.dose, 'dose');
  if (!campos.unidadeDose) faltando.push('unidade da dose');
  const porVez = ler(campos.quantidadePorVez, `quantidade por vez (${unidade ?? 'mL'})`);
  if (campos.intervaloHoras === '') faltando.push('intervalo');
  const dias = ler(campos.duracaoDias, 'duração (dias)');
  const frascos = ler(campos.frascos, 'quantidade a comprar');

  // 1. quanto dar por vez (matemática)
  let porVezCerto: number | null = null;
  if (apresentacao && unidade && dose !== null && campos.unidadeDose) {
    if (unidade === 'comprimidos' && apresentacao.quantidade) {
      const doseNaUnidade = converterDroga(dose, campos.unidadeDose, apresentacao.quantidade.unidade);
      if (doseNaUnidade !== null) {
        porVezCerto = doseNaUnidade / apresentacao.quantidade.valor;
        conferirConta(verificacoes, porVez, porVezCerto, 'comprimidos', `${formatarNumero(doseNaUnidade)} ${apresentacao.quantidade.unidade} ÷ ${formatarNumero(apresentacao.quantidade.valor)} ${apresentacao.quantidade.unidade} = ${formatarNumero(porVezCerto)} comprimido(s)`, tolerancia);
        if (Math.abs(porVezCerto * 2 - Math.round(porVezCerto * 2)) > RUIDO_NUMERICO) {
          verificacoes.push({ assunto: 'volume', situacao: 'atencao', texto: 'A dose não dá um número inteiro ou meio comprimido: considere outra apresentação.' });
        }
      }
    } else if (apresentacao.concentracaoPorMl) {
      const c = apresentacao.concentracaoPorMl;
      const doseNaUnidade = converterDroga(dose, campos.unidadeDose, c.unidade);
      if (doseNaUnidade !== null) {
        const ml = doseNaUnidade / c.valor;
        if (unidade === 'gotas') {
          const gotasPorMl = apresentacao.gotasPorMl;
          if (gotasPorMl) {
            porVezCerto = ml * gotasPorMl;
            conferirConta(verificacoes, porVez, porVezCerto, 'gotas', `${formatarNumero(doseNaUnidade)} ${c.unidade} ÷ ${formatarNumero(c.valor)} ${c.unidade}/mL = ${formatarNumero(ml)} mL × ${gotasPorMl} gotas/mL = ${formatarNumero(porVezCerto)} gotas (gotas/mL A VALIDAR)`, tolerancia);
          } else {
            verificacoes.push({ assunto: 'volume', situacao: 'atencao', texto: 'O banco ainda não tem quantas gotas há em 1 mL deste frasco (A VALIDAR).' });
          }
        } else {
          porVezCerto = ml;
          conferirConta(verificacoes, porVez, porVezCerto, 'mL', `${formatarNumero(doseNaUnidade)} ${c.unidade} ÷ ${formatarNumero(c.valor)} ${c.unidade}/mL = ${formatarNumero(ml)} mL`, tolerancia);
        }
      }
    }
  }

  // 2. quanto comprar (matemática): total do tratamento ÷ conteúdo do frasco/caixa
  if (apresentacao && porVezCerto !== null && dias !== null && typeof campos.intervaloHoras === 'number') {
    const vezesPorDia = 24 / campos.intervaloHoras;
    const total = porVezCerto * vezesPorDia * dias;
    const conteudo =
      unidade === 'gotas' && apresentacao.volumeMl && apresentacao.gotasPorMl
        ? apresentacao.volumeMl * apresentacao.gotasPorMl
        : unidade === 'mL'
          ? apresentacao.volumeMl
          : undefined;
    if (conteudo) {
      const frascosCerto = Math.ceil(total / conteudo - RUIDO_NUMERICO);
      const conta = `${formatarNumero(porVezCerto)} ${unidade} × ${formatarNumero(vezesPorDia)}×/dia × ${formatarNumero(dias)} dias = ${formatarNumero(total)} ${unidade}; ÷ ${formatarNumero(conteudo)} ${unidade} por frasco → ${frascosCerto} frasco(s)`;
      if (frascos !== null) {
        const ok = frascos === frascosCerto;
        verificacoes.push({
          assunto: 'volume',
          situacao: ok ? 'certo' : frascos > frascosCerto ? 'atencao' : 'errado',
          texto: ok
            ? `Quantidade certa: ${conta}.`
            : frascos > frascosCerto
              ? `Sobra remédio: ${conta} (você pediu ${formatarNumero(frascos)}).`
              : `Não dá para o tratamento todo: ${conta} (você pediu ${formatarNumero(frascos)}).`,
        });
      }
    } else if (unidade === 'comprimidos') {
      verificacoes.push({ assunto: 'volume', situacao: 'atencao', texto: `Total do tratamento: ${formatarNumero(total)} comprimidos (o tamanho da caixa ainda não está no banco).` });
    }
  }

  // 3. referência de dose e intervalo: a mesma conferência da folha (só corrige com regra CONFERIDA)
  const indicacoes = indicacoesDisponiveis(medicacao, paciente.faixa, paciente.variaveis);
  if (indicacoes.length > 0 && !campos.indicacao) faltando.push('indicação');
  if (campos.indicacao && apresentacao && dose !== null && campos.unidadeDose && campos.intervaloHoras !== '') {
    const naFolha = conferirItemMedicacao({
      campos: {
        ...camposVazios(medicacao.id),
        apresentacaoId: apresentacao.id,
        indicacao: campos.indicacao,
        dose: campos.dose,
        unidadeDose: campos.unidadeDose,
        via: 'VO',
        intervalo: campos.intervaloHoras,
      },
      medicacoes,
      paciente,
      secaoNumero: medicacao.secao,
      fontePreferida: entrada.fontePreferida ?? FONTE_PADRAO,
      tolerancia,
    });
    verificacoes.push(...naFolha.verificacoes.filter((v) => v.assunto === 'dose' || v.assunto === 'intervalo' || v.assunto === 'fonte'));
    const regra = escolherRegras(medicacao, campos.indicacao, paciente.faixa, entrada.fontePreferida, paciente.variaveis).regras[0];
    if (regra?.observacoes) verificacoes.push({ assunto: 'fonte', situacao: 'a-validar', texto: `Observação da referência: ${regra.observacoes}` });
  } else if (indicacoes.length === 0) {
    verificacoes.push({ assunto: 'fonte', situacao: 'atencao', texto: `O banco ainda não tem regra de dose de ${medicacao.nome} para esta faixa etária.` });
  }

  for (const alerta of medicacao.alertas ?? []) verificacoes.push({ assunto: 'alerta', situacao: 'atencao', texto: alerta });
  if (medicacao.receituario) verificacoes.push({ assunto: 'alerta', situacao: 'atencao', texto: TEXTO_RECEITUARIO[medicacao.receituario] });

  return {
    medicacao,
    ...(apresentacao && { apresentacao }),
    unidade,
    faltando,
    verificacoes,
    completo: faltando.length === 0 && numerosValidos,
  };
}

function conferirConta(
  verificacoes: Verificacao[],
  resposta: number | null,
  esperado: number,
  unidade: string,
  conta: string,
  tolerancia: Tolerancia,
): void {
  if (resposta === null) return;
  const ok = conferirValor(resposta, esperado, tolerancia).correto;
  verificacoes.push({
    assunto: 'volume',
    situacao: ok ? 'certo' : 'errado',
    texto: ok ? `Quantidade por vez certa: ${conta}.` : `Quantidade por vez não confere: ${conta} (você escreveu ${formatarNumero(resposta)} ${unidade}).`,
  });
}

/**
 * Texto da receita, como se escreve à mão:
 * "Prednisolona solução oral 3 mg/mL, frasco 60 mL ——— 1 frasco
 *  Tomar 5 mL por via oral, 1 vez ao dia, por 5 dias."
 */
export function textoDaReceita(campos: CamposReceita, medicacoes: readonly Medicacao[]): { cabecalho: string; instrucao: string } {
  const med = medicacoes.find((m) => m.id === campos.medicacaoId);
  const ap = med?.apresentacoes.find((a) => a.id === campos.apresentacaoId);
  if (!med) return { cabecalho: '', instrucao: '' };
  const frascos = lerNumero(campos.frascos);
  const unidade = unidadeDaVez(ap);
  const embalagem = unidade === 'comprimidos' ? 'caixa' : 'frasco';
  const quantidade = frascos !== null ? ` ——— ${formatarNumero(frascos)} ${embalagem}${frascos > 1 ? 's' : ''}` : '';
  const cabecalho = `${med.nome}${ap ? ` — ${ap.descricao}` : ''}${quantidade}`;
  const porVez = lerNumero(campos.quantidadePorVez);
  const dias = lerNumero(campos.duracaoDias);
  const partes = [
    porVez !== null && unidade ? `Dar ${formatarNumero(porVez)} ${unidade === 'comprimidos' && porVez <= 1 ? 'comprimido' : unidade} por via oral` : '',
    textoFrequencia(campos.intervaloHoras),
    campos.orientacao.trim(),
    dias !== null ? `por ${formatarNumero(dias)} dia${dias > 1 ? 's' : ''}` : '',
  ].filter(Boolean);
  return { cabecalho, instrucao: partes.length > 0 ? `${partes.join(', ')}.` : '' };
}
