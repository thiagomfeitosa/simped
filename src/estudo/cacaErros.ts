/**
 * Caça-erros (sem tela): uma folha pronta "escrita por um colega", com erros plantados.
 *
 * A folha certa é a prescrição final de um roteiro do Passo a passo (contas feitas pelo motor).
 * Os erros são de CONTA ou de SEGURANÇA: dá para achar cada um conferindo a própria folha
 * (peso da identificação, dose/kg escrita, concentração, volume final, tempo) ou com uma regra
 * de segurança (potássio nunca em bolus). Não dependem de saber a dose de cor.
 * As doses dos roteiros continuam A VALIDAR.
 */

import { ROTEIROS } from '../dados/roteiros';
import type { LinhaPrescricao, Roteiro } from '../dados/roteiros/tipos';
import { INFO_SECAO } from '../dados/secoes';
import { montarFolha } from '../logica/progresso';
import { criarSorteio } from './treino';

export const CATEGORIAS_ERRO = {
  dose: 'Dose (não bate com dose/kg × peso)',
  aspirar: 'Volume a aspirar',
  bic: 'Volume final (SF/AD completando)',
  vazao: 'Vazão da bomba (mL/h)',
  vig: 'VIG (mg/kg/min)',
  unidade: 'Unidade trocada (mg × mcg)',
  diluicao: 'Concentração / diluição',
  seguranca: 'Regra de segurança',
} as const;

export type CategoriaErro = keyof typeof CATEGORIAS_ERRO;

export interface ErroPlantado {
  linhaId: string;
  categoria: CategoriaErro;
  campo: 'texto' | 'detalhe';
  /** Trecho certo e trecho errado (o que mudou na linha). */
  era: string;
  ficou: string;
  /** Como o aluno poderia ter achado. */
  explicacao: string;
}

export interface LinhaDaFolha extends LinhaPrescricao {
  /** Número da seção na folha (1 a 9), só para mostrar. */
  numeroSecao: number;
}

export interface FolhaComErros {
  roteiroId: string;
  titulo: string;
  paciente: string;
  linhas: LinhaDaFolha[];
  erros: ErroPlantado[];
}

// ---- Números no padrão brasileiro (1.400 · 0,3 · 70.000) -------------------------
const NUM = String.raw`\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?`;

export function lerNumeroBr(texto: string): number {
  return Number(texto.replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'));
}

function escreverBr(valor: number): string {
  const casas = Math.abs(valor) < 1 ? 3 : 2;
  return (Math.round(valor * 10 ** casas) / 10 ** casas).toLocaleString('pt-BR', { maximumFractionDigits: casas });
}

// ---- Os tipos de erro ------------------------------------------------------------
interface Mutacao {
  categoria: CategoriaErro;
  /** Só tenta nesta linha se o teste passar (ex.: só linhas com KCl). */
  vale?: (linha: LinhaPrescricao) => boolean;
  regex: RegExp;
  trocar: (m: RegExpExecArray) => { ficou: string; explicacao: string };
}

const MUTACOES: readonly Mutacao[] = [
  {
    categoria: 'dose',
    // "8 mEq (0,5 mEq/kg)" · "20 mL (2 mL/kg)"
    regex: new RegExp(`(${NUM}) (mg|UI|mEq|g|mL) \\((${NUM}) \\2/kg\\)`),
    trocar: (m) => ({
      ficou: `${escreverBr(lerNumeroBr(m[1]!) * 10)} ${m[2]} (${m[3]} ${m[2]}/kg)`,
      explicacao: `${m[3]} ${m[2]}/kg × o peso da identificação dá ${m[1]} ${m[2]}, não ${escreverBr(lerNumeroBr(m[1]!) * 10)}: a dose ficou 10 vezes maior (vírgula no lugar errado).`,
    }),
  },
  {
    categoria: 'dose',
    // "1.400 mg = 100 mg/kg"
    regex: new RegExp(`(${NUM}) (mg|UI|mEq|g) = (${NUM}) \\2/kg`),
    trocar: (m) => ({
      ficou: `${escreverBr(lerNumeroBr(m[1]!) * 10)} ${m[2]} = ${m[3]} ${m[2]}/kg`,
      explicacao: `${m[3]} ${m[2]}/kg × o peso da identificação dá ${m[1]} ${m[2]}: a dose escrita ficou 10 vezes maior.`,
    }),
  },
  {
    categoria: 'aspirar',
    regex: new RegExp(`aspirar (${NUM}) mL`),
    trocar: (m) => ({
      ficou: `aspirar ${escreverBr(lerNumeroBr(m[1]!) * 10)} mL`,
      explicacao: `Dose ÷ concentração dá ${m[1]} mL. Aspirar ${escreverBr(lerNumeroBr(m[1]!) * 10)} mL seria 10 vezes a dose.`,
    }),
  },
  {
    categoria: 'bic',
    // "+ SF 0,9% 11,7 mL = 12 mL" · "+ AD 9 mL = 10 mL" (a medicação vem antes, na mesma linha)
    regex: new RegExp(`\\+ (SF 0,9%|AD) (${NUM}) mL = (${NUM}) mL`),
    trocar: (m) => ({
      ficou: `+ ${m[1]} ${m[3]} mL = ${m[3]} mL`,
      explicacao: `O diluente completa ATÉ o volume final: volume final − volume da medicação = ${m[2]} mL. Colocar ${m[3]} mL esqueceu de descontar a medicação (a soma passa de ${m[3]} mL).`,
    }),
  },
  {
    categoria: 'vazao',
    regex: new RegExp(`BIC (a )?(${NUM}) mL/h`),
    trocar: (m) => ({
      ficou: `BIC ${m[1] ?? ''}${escreverBr(lerNumeroBr(m[2]!) * 2)} mL/h`,
      explicacao: `Vazão = volume ÷ tempo em horas = ${m[2]} mL/h. Com ${escreverBr(lerNumeroBr(m[2]!) * 2)} mL/h, a infusão termina na metade do tempo prescrito.`,
    }),
  },
  {
    categoria: 'vig',
    regex: new RegExp(`VIG ≈ (${NUM}) mg/kg/min`),
    trocar: (m) => ({
      ficou: `VIG ≈ ${escreverBr(lerNumeroBr(m[1]!) * 2)} mg/kg/min`,
      explicacao: `VIG = mL/h × % de glicose ÷ (6 × peso) = ${m[1]} mg/kg/min, não ${escreverBr(lerNumeroBr(m[1]!) * 2)}.`,
    }),
  },
  {
    categoria: 'unidade',
    regex: new RegExp(`(${NUM}) mcg/kg/min`),
    trocar: (m) => ({
      ficou: `${m[1]} mg/kg/min`,
      explicacao: `A dose de infusão contínua é em MICROgramas (mcg/kg/min). Em mg/kg/min seria 1.000 vezes maior.`,
    }),
  },
  {
    categoria: 'unidade',
    // "1 mL (0,1 mg)"
    regex: new RegExp(`\\((${NUM}) mg\\)`),
    trocar: (m) => ({
      ficou: `(${m[1]} mcg)`,
      explicacao: `O volume prescrito tem ${m[1]} mg (= ${escreverBr(lerNumeroBr(m[1]!) * 1000)} mcg). Escrever "${m[1]} mcg" troca a unidade: 1.000 vezes menos.`,
    }),
  },
  {
    categoria: 'diluicao',
    // "(500.000 UI/mL)" · "(30 mg/mL)" · "(20 mcg/mL)" · "(1 UI/mL)"
    regex: new RegExp(`\\((${NUM}) (mg|UI|mcg|mEq)/mL\\)`),
    trocar: (m) => ({
      ficou: `(${escreverBr(lerNumeroBr(m[1]!) * 10)} ${m[2]}/mL)`,
      explicacao: `Concentração = quantidade ÷ volume = ${m[1]} ${m[2]}/mL, não ${escreverBr(lerNumeroBr(m[1]!) * 10)}. Quem usar a concentração errada na próxima conta erra a dose em 10 vezes.`,
    }),
  },
  {
    categoria: 'seguranca',
    vale: (l) => /KCl/.test(l.texto) && /Correção/i.test(l.texto),
    regex: new RegExp(`EV em (${NUM}) h`),
    trocar: (m) => ({
      ficou: 'EV em bolus',
      explicacao: `Potássio EV NUNCA em bolus (pode parar o coração): corre em bomba, em ${m[1]} h, com monitor.`,
    }),
  },
];

/** Linhas da folha final de um roteiro, na ordem da folha. */
export function linhasDaFolhaFinal(roteiro: Roteiro): LinhaDaFolha[] {
  const folha = montarFolha(roteiro, roteiro.etapas.length - 1);
  return folha.secoes.flatMap((s) => s.linhas.map((l) => ({ ...l, numeroSecao: INFO_SECAO[l.secao].numero ?? 0 })));
}

interface Candidato {
  linhaId: string;
  campo: 'texto' | 'detalhe';
  mutacao: Mutacao;
  m: RegExpExecArray;
}

/** Todos os erros que dá para plantar nesta folha (um por tipo de erro em cada linha). */
export function candidatosDeErro(linhas: readonly LinhaDaFolha[]): Candidato[] {
  const lista: Candidato[] = [];
  for (const linha of linhas) {
    if (linha.secao === 'identificacao') continue;
    for (const mutacao of MUTACOES) {
      if (mutacao.vale && !mutacao.vale(linha)) continue;
      for (const campo of ['texto', 'detalhe'] as const) {
        const valor = linha[campo];
        const m = valor ? mutacao.regex.exec(valor) : null;
        if (m) {
          lista.push({ linhaId: linha.id, campo, mutacao, m });
          break;
        }
      }
    }
  }
  return lista;
}

/** Dois trechos do mesmo campo não podem se encostar (cada erro troca um pedaço diferente). */
function seSobrepoem(a: Candidato, b: Candidato): boolean {
  if (a.linhaId !== b.linhaId || a.campo !== b.campo) return false;
  return a.m.index < b.m.index + b.m[0].length && b.m.index < a.m.index + a.m[0].length;
}

/**
 * No máximo 3 erros na mesma linha (só acontece nas folhas de uma medicação só, como a da
 * penicilina, em que o preparo inteiro está numa linha); o sorteio prefere espalhar.
 */
const MAXIMO_POR_LINHA = 3;

/**
 * Monta a folha com erros: sorteia de 3 a `maximo` erros, em linhas diferentes e,
 * sempre que possível, de tipos diferentes. A mesma semente gera a mesma folha.
 */
export function montarFolhaComErros(roteiro: Roteiro, semente: number, maximo = 4): FolhaComErros {
  const sorteio = criarSorteio(semente);
  const linhas = linhasDaFolhaFinal(roteiro);
  const candidatos = candidatosDeErro(linhas);
  // embaralha (Fisher-Yates com o sorteio)
  for (let i = candidatos.length - 1; i > 0; i--) {
    const j = Math.floor(sorteio() * (i + 1));
    [candidatos[i], candidatos[j]] = [candidatos[j]!, candidatos[i]!];
  }
  const total = Math.min(maximo, 3 + Math.floor(sorteio() * 2));
  const escolhidos: Candidato[] = [];
  // 1ª passada: linhas e tipos diferentes; 2ª: tipos diferentes (até 2 por linha); 3ª: o que couber
  for (const passada of [1, 2, 3]) {
    for (const c of candidatos) {
      if (escolhidos.length >= total) break;
      if (escolhidos.includes(c) || escolhidos.some((e) => seSobrepoem(e, c))) continue;
      const naLinha = escolhidos.filter((e) => e.linhaId === c.linhaId).length;
      if (naLinha >= MAXIMO_POR_LINHA || (passada === 1 && naLinha > 0) || (passada === 2 && naLinha > 1)) continue;
      if (passada < 3 && escolhidos.some((e) => e.mutacao.categoria === c.mutacao.categoria)) continue;
      escolhidos.push(c);
    }
  }

  const erros: ErroPlantado[] = [];
  const comErros = linhas.map((linha) => {
    const daLinha = escolhidos.filter((e) => e.linhaId === linha.id);
    if (daLinha.length === 0) return linha;
    const nova = { ...linha };
    // troca de trás para a frente, para as posições dos outros trechos continuarem certas
    for (const c of [...daLinha].sort((a, b) => b.m.index - a.m.index)) {
      const { ficou, explicacao } = c.mutacao.trocar(c.m);
      const atual = nova[c.campo]!;
      nova[c.campo] = atual.slice(0, c.m.index) + ficou + atual.slice(c.m.index + c.m[0].length);
      erros.push({ linhaId: linha.id, categoria: c.mutacao.categoria, campo: c.campo, era: c.m[0], ficou, explicacao });
    }
    return nova;
  });
  const ordem = (e: ErroPlantado) => linhas.findIndex((l) => l.id === e.linhaId);

  return {
    roteiroId: roteiro.id,
    titulo: roteiro.titulo,
    paciente: `${roteiro.paciente.nome} · ${roteiro.paciente.descricao}`,
    linhas: comErros,
    erros: erros.sort((a, b) => ordem(a) - ordem(b)),
  };
}

/** Roteiros que rendem uma folha de caça-erros (pelo menos 3 erros possíveis). */
export function roteirosParaCacaErros(): Roteiro[] {
  return ROTEIROS.filter((r) => candidatosDeErro(linhasDaFolhaFinal(r)).length >= 3);
}

export interface ResultadoCaca {
  /** Erros em linhas que o aluno marcou (e se ele escolheu o tipo certo). */
  encontrados: { erro: ErroPlantado; tipoCerto: boolean }[];
  perdidos: ErroPlantado[];
  /** Linhas marcadas que estavam certas. */
  falsosAlarmes: string[];
  /** 0 a 100: cada erro achado vale; cada falso alarme desconta metade. */
  nota: number;
}

/** Confere as marcações do aluno: linha marcada → tipos de erro que ele escolheu (pode ser vazio). */
export function conferirCaca(folha: FolhaComErros, marcadas: Readonly<Record<string, readonly CategoriaErro[]>>): ResultadoCaca {
  const encontrados: ResultadoCaca['encontrados'] = [];
  const perdidos: ErroPlantado[] = [];
  for (const erro of folha.erros) {
    const tipos = marcadas[erro.linhaId];
    if (tipos) encontrados.push({ erro, tipoCerto: tipos.includes(erro.categoria) });
    else perdidos.push(erro);
  }
  const falsosAlarmes = Object.keys(marcadas).filter((id) => !folha.erros.some((e) => e.linhaId === id));
  const total = folha.erros.length || 1;
  const nota = Math.max(0, Math.round(((encontrados.length - falsosAlarmes.length * 0.5) / total) * 100));
  return { encontrados, perdidos, falsosAlarmes, nota };
}
