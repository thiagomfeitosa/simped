/**
 * Apoio ao editor de casos (sem tela): caso em branco, id a partir do título,
 * leitura de um arquivo .json de caso com conferência.
 */

import type { Medicacao } from '../dados/medicacoes/tipos';
import { INICIO_PADRAO } from './ajuda';
import { verificarCaso } from './index';
import type { CasoClinico } from './tipos';
import { limitesDoCaso } from './variacao';

/** Prefixo dos casos criados pelo usuário (não colide com os casos do app). */
export const PREFIXO_PERSONALIZADO = 'meu-';

export function casoVazio(): CasoClinico {
  return {
    id: `${PREFIXO_PERSONALIZADO}novo-caso`,
    titulo: 'Novo caso',
    grupo: 'Meus casos',
    cenario: 'Pronto-socorro',
    status: 'A_VALIDAR',
    inicio: INICIO_PADRAO,
    paciente: {
      nome: 'Paciente',
      sexo: 'F',
      leito: '1',
      nascimento: '2022-10-01T08:00',
      igNascer: { semanas: 39, dias: 0 },
      pesoNascerG: 3200,
      pesoKg: 15,
      alergias: [],
    },
    queixa: '',
    historia: '',
    exameFisico: '',
    sinaisIniciais: { fc: 100, fr: 24, spo2: 98, paSistolica: 100, paDiastolica: 60, temperaturaC: 36.8, glicemiaMgDl: 90, tecS: 2, glasgow: 15 },
    evolucaoNatural: [],
    respostas: [],
    resultadosExames: {},
    condutasEsperadas: [],
    pontosDeEnsino: [],
    diureseMlKgH: 1,
  };
}

/** "Bronquiolite grave!" → "meu-bronquiolite-grave". */
export function idDoTitulo(titulo: string): string {
  const base = titulo
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  return `${PREFIXO_PERSONALIZADO}${base || 'caso'}`;
}

/** Cópia de um caso do app para virar caso do usuário (id e grupo próprios). */
export function copiarCaso(caso: CasoClinico): CasoClinico {
  const copia = JSON.parse(JSON.stringify(caso)) as CasoClinico;
  // B16: a cópia leva os limites da variação do caso original (o id muda, então não acharia no arquivo de limites)
  const variacao = JSON.parse(JSON.stringify(limitesDoCaso(caso))) as CasoClinico['variacao'];
  return { ...copia, id: idDoTitulo(`${caso.titulo} copia`), titulo: `${caso.titulo} (cópia)`, grupo: 'Meus casos', ...(variacao && { variacao }) };
}

/**
 * Lê um caso de um texto .json. Devolve o caso (com id de caso do usuário) e os problemas
 * encontrados; se o texto não for um caso, `caso` vem vazio.
 */
export function lerCasoDeJson(texto: string, medicacoes: readonly Medicacao[]): { caso?: CasoClinico; problemas: string[] } {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { problemas: ['O arquivo não é um .json válido.'] };
  }
  const c = bruto as Partial<CasoClinico> | null;
  const faltando: string[] = [];
  if (!c || typeof c !== 'object') return { problemas: ['O arquivo não contém um caso.'] };
  if (typeof c.titulo !== 'string') faltando.push('titulo');
  if (typeof c.inicio !== 'string') faltando.push('inicio');
  if (!c.paciente || typeof c.paciente !== 'object') faltando.push('paciente');
  if (!c.sinaisIniciais || typeof c.sinaisIniciais !== 'object') faltando.push('sinaisIniciais');
  if (faltando.length > 0) return { problemas: [`Faltam campos obrigatórios: ${faltando.join(', ')}.`] };
  const caso = { ...casoVazio(), ...c } as CasoClinico;
  if (!caso.id.startsWith(PREFIXO_PERSONALIZADO)) caso.id = idDoTitulo(caso.titulo);
  return { caso, problemas: verificarCaso(caso, medicacoes) };
}
