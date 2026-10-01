/**
 * B16 — Variações automáticas dos casos (sem tela).
 *
 * O mesmo caso é jogado com outro peso, outra idade e outra apresentação na farmácia, sorteados dentro
 * dos limites do caso (src/casos/variacoes-a-validar.ts). Assim o aluno treina as contas sem decorar o gabarito.
 *
 * - O sorteio usa uma semente: a mesma semente dá a mesma variação (testes, professor e "continuar").
 * - A variação guarda os VALORES sorteados (não só a semente): mudar o sorteador depois não muda
 *   uma sessão já guardada.
 * - Estatura acompanha o peso (proporção pela raiz cúbica); peso ao nascer acompanha o peso só no
 *   período neonatal (mantém a mesma % de perda de peso). Sinais, exames e reações do caso não mudam.
 */

import type { Apresentacao, Medicacao } from '../dados/medicacoes/tipos';
import { escreverDataHora, lerDataHora } from '../paciente/variaveis';
import { formatarNumero } from '../prescricao/comum';
import type { CasoClinico, LimitesVariacao } from './tipos';
import { LIMITES_VARIACAO, VARIACAO_PADRAO_PESO } from './variacoes-a-validar';

export interface VariacaoCaso {
  /** Número que gerou o sorteio. */
  semente: number;
  pesoKg: number;
  estaturaCm?: number;
  pesoNascerG: number;
  /** Quantos dias mais velho (+) ou mais novo (−) que no caso original. */
  idadeDias: number;
  /** Farmácia de hoje: id da medicação → ids das apresentações disponíveis (só as que mudaram). */
  apresentacoes: Record<string, string[]>;
}

const DIA_MS = 24 * 60 * 60 * 1000;

/** Formas em que a apresentação muda a conta do aluno (volume a aspirar, reconstituição). */
const FORMAS_SORTEAVEIS: readonly Apresentacao['forma'][] = ['ampola', 'frasco-ampola-po', 'frasco-ampola-solucao', 'solucao-oral', 'gotas'];

/** Sorteador com semente (mulberry32): número de 0 a 1, sempre a mesma sequência para a mesma semente. */
export function criarSorteio(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semente nova (para o botão "variar"). */
export function novaSemente(): number {
  return Math.floor(Math.random() * 2 ** 31);
}

/** Limites do caso: os do próprio caso (editor), os do arquivo de dados ou o padrão (peso ±10%, idade fixa). */
export function limitesDoCaso(caso: CasoClinico): LimitesVariacao {
  if (caso.variacao && limitesBemFormados(caso.variacao)) return caso.variacao;
  const doArquivo = LIMITES_VARIACAO[caso.id];
  if (doArquivo) return doArquivo;
  const p = caso.paciente.pesoKg;
  return {
    pesoKg: { min: arredondarPeso(p * (1 - VARIACAO_PADRAO_PESO)), max: arredondarPeso(p * (1 + VARIACAO_PADRAO_PESO)) },
    status: 'A_VALIDAR',
    observacao: 'Padrão para casos sem limites próprios: peso ±10%, idade fixa.',
  };
}

/** Limites com o formato certo (um caso lido de arquivo .json pode vir estragado). */
function limitesBemFormados(l: LimitesVariacao): boolean {
  const idade = l.idadeDias;
  return (
    !!l.pesoKg &&
    typeof l.pesoKg.min === 'number' &&
    typeof l.pesoKg.max === 'number' &&
    (idade === undefined || (typeof idade === 'object' && typeof idade.maisNovo === 'number' && typeof idade.maisVelho === 'number'))
  );
}

/** Peso como na balança: abaixo de 10 kg, de 10 em 10 g; acima, de 100 em 100 g. */
export function arredondarPeso(kg: number): number {
  return kg < 10 ? Math.round(kg * 100) / 100 : Math.round(kg * 10) / 10;
}

function idadeEmDias(caso: CasoClinico, deslocamentoDias = 0): number {
  return (lerDataHora(caso.inicio).getTime() - lerDataHora(caso.paciente.nascimento).getTime()) / DIA_MS + deslocamentoDias;
}

/** Medicações que o caso usa (respostas e condutas esperadas). */
export function medicacoesDoCaso(caso: CasoClinico): string[] {
  const ids = new Set<string>();
  for (const r of caso.respostas ?? []) ids.add(r.medicacaoId);
  for (const c of caso.condutasEsperadas ?? []) if (c.tipo === 'medicacao') c.alvos.forEach((a) => ids.add(a));
  return [...ids];
}

/**
 * Para cada medicação do caso, sorteia UMA apresentação entre as que têm a mesma forma e as mesmas vias
 * (ex.: gentamicina 10 ou 40 mg/mL). Comprimidos, soros, sprays e nebulização não entram no sorteio.
 */
function sortearApresentacoes(caso: CasoClinico, medicacoes: readonly Medicacao[], sorteio: () => number): Record<string, string[]> {
  const resultado: Record<string, string[]> = {};
  for (const id of medicacoesDoCaso(caso)) {
    const med = medicacoes.find((m) => m.id === id);
    if (!med) continue;
    const grupos = new Map<string, Apresentacao[]>();
    for (const a of med.apresentacoes) {
      if (!FORMAS_SORTEAVEIS.includes(a.forma)) continue;
      const chave = `${a.forma}|${[...a.vias].sort().join(',')}`;
      grupos.set(chave, [...(grupos.get(chave) ?? []), a]);
    }
    const fora = new Set<string>();
    for (const lista of grupos.values()) {
      if (lista.length < 2) continue;
      const escolhida = lista[Math.floor(sorteio() * lista.length)]!;
      for (const a of lista) if (a.id !== escolhida.id) fora.add(a.id);
    }
    if (fora.size > 0) resultado[id] = med.apresentacoes.filter((a) => !fora.has(a.id)).map((a) => a.id);
  }
  return resultado;
}

/** Sorteia uma variação do caso dentro dos limites. A mesma semente dá sempre a mesma variação. */
export function sortearVariacao(caso: CasoClinico, medicacoes: readonly Medicacao[], semente: number): VariacaoCaso {
  const limites = limitesDoCaso(caso);
  const sorteio = criarSorteio(semente);
  const original = caso.paciente.pesoKg;
  const { min, max } = limites.pesoKg;
  // peso diferente do original (para a conta mudar de verdade), quando os limites deixam
  let pesoKg = original;
  for (let i = 0; i < 20 && pesoKg === original; i++) pesoKg = arredondarPeso(min + sorteio() * (max - min));

  const idade = limites.idadeDias ?? { maisNovo: 0, maisVelho: 0 };
  const idadeDias = Math.round(-idade.maisNovo + sorteio() * (idade.maisNovo + idade.maisVelho));

  const razao = pesoKg / original;
  const { estaturaCm } = caso.paciente;
  const neonatal = idadeEmDias(caso, idadeDias) < 28;
  return {
    semente,
    pesoKg,
    ...(estaturaCm !== undefined && { estaturaCm: Math.round(estaturaCm * Math.cbrt(razao)) }),
    pesoNascerG: neonatal ? Math.round((caso.paciente.pesoNascerG * razao) / 5) * 5 : caso.paciente.pesoNascerG,
    idadeDias,
    apresentacoes: limites.apresentacoes === false ? {} : sortearApresentacoes(caso, medicacoes, sorteio),
  };
}

/** O caso com o paciente da variação (peso, estatura, peso ao nascer e nascimento). O resto do caso não muda. */
export function aplicarVariacao(caso: CasoClinico, v: VariacaoCaso | null | undefined): CasoClinico {
  if (!v) return caso;
  const nascimento = escreverDataHora(new Date(lerDataHora(caso.paciente.nascimento).getTime() - v.idadeDias * DIA_MS));
  const { estaturaCm: _, ...semEstatura } = caso.paciente;
  return {
    ...caso,
    paciente: {
      ...semEstatura,
      ...(v.estaturaCm !== undefined && { estaturaCm: v.estaturaCm }),
      nascimento,
      pesoKg: v.pesoKg,
      pesoNascerG: v.pesoNascerG,
    },
  };
}

/** Banco com só as apresentações que a farmácia tem hoje (se o banco mudou e nada sobrar, fica tudo). */
export function bancoComVariacao(medicacoes: readonly Medicacao[], v: VariacaoCaso | null | undefined): readonly Medicacao[] {
  if (!v || Object.keys(v.apresentacoes).length === 0) return medicacoes;
  return medicacoes.map((m) => {
    const disponiveis = v.apresentacoes[m.id];
    if (!disponiveis) return m;
    const lista = m.apresentacoes.filter((a) => disponiveis.includes(a.id));
    return lista.length > 0 ? { ...m, apresentacoes: lista } : m;
  });
}

function textoDias(dias: number): string {
  const d = Math.abs(dias);
  if (d >= 60) return `${formatarNumero(Math.round(d / 30.4375))} meses`;
  return d === 1 ? '1 dia' : `${d} dias`;
}

/** Frases curtas para mostrar ao aluno (faixa da variação e relatório). */
export function descreverVariacao(casoBase: CasoClinico, v: VariacaoCaso, medicacoes: readonly Medicacao[]): string[] {
  const partes = [`Peso ${formatarNumero(v.pesoKg)} kg (no caso original: ${formatarNumero(casoBase.paciente.pesoKg)} kg)`];
  if (v.idadeDias !== 0) partes.push(`${textoDias(v.idadeDias)} ${v.idadeDias > 0 ? 'mais velho(a)' : 'mais novo(a)'} que no original`);
  for (const [id, ids] of Object.entries(v.apresentacoes)) {
    const med = medicacoes.find((m) => m.id === id);
    if (!med) continue;
    const nomes = med.apresentacoes.filter((a) => ids.includes(a.id) && FORMAS_SORTEAVEIS.includes(a.forma)).map((a) => a.descricao);
    if (nomes.length > 0) partes.push(`Farmácia hoje — ${med.nome}: ${nomes.join('; ')}`);
  }
  return partes;
}

/** Confere uma variação lida de um arquivo (sessão guardada, outra janela). */
export function ehVariacao(x: unknown): x is VariacaoCaso {
  if (!x || typeof x !== 'object') return false;
  const v = x as VariacaoCaso;
  return (
    typeof v.semente === 'number' &&
    typeof v.pesoKg === 'number' &&
    v.pesoKg > 0 &&
    typeof v.pesoNascerG === 'number' &&
    v.pesoNascerG > 0 &&
    typeof v.idadeDias === 'number' &&
    Number.isFinite(v.idadeDias) &&
    (v.estaturaCm === undefined || (typeof v.estaturaCm === 'number' && v.estaturaCm > 0)) &&
    !!v.apresentacoes &&
    typeof v.apresentacoes === 'object' &&
    Object.values(v.apresentacoes).every((l) => Array.isArray(l) && l.every((i) => typeof i === 'string'))
  );
}

/** Procura problemas nos limites de um caso (vazia = tudo certo). Roda nos testes, como o verificador de casos. */
export function verificarLimites(caso: CasoClinico, limites: LimitesVariacao = caso.variacao ?? limitesDoCaso(caso)): string[] {
  const p: string[] = [];
  const onde = `${caso.id} (variação)`;
  if (!limitesBemFormados(limites)) return [`${onde}: limites da variação com formato errado (peso mínimo/máximo, dias de idade).`];
  const { min, max } = limites.pesoKg;
  if (!(min > 0 && max >= min)) p.push(`${onde}: peso mínimo/máximo inválido (${min}–${max}).`);
  else if (caso.paciente.pesoKg < min || caso.paciente.pesoKg > max) p.push(`${onde}: o peso do caso (${caso.paciente.pesoKg} kg) está fora de ${min}–${max} kg.`);
  const idade = limites.idadeDias;
  if (idade) {
    if (!(Number.isInteger(idade.maisNovo) && idade.maisNovo >= 0 && Number.isInteger(idade.maisVelho) && idade.maisVelho >= 0)) {
      p.push(`${onde}: dias de idade devem ser números inteiros, 0 ou mais.`);
    } else {
      try {
        if (idadeEmDias(caso, -idade.maisNovo) <= 0) p.push(`${onde}: mais novo ${idade.maisNovo} dias faria o paciente nascer depois do início do caso.`);
      } catch {
        // datas inválidas já aparecem no verificador do caso
      }
    }
  }
  return p;
}
