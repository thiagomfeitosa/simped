/**
 * Lista de casos do app e verificador de integridade (roda nos testes: um caso com erro de digitação
 * faz o teste ficar vermelho, como no banco de medicações).
 */

import { EXAMES } from '../dados/exames';
import type { Medicacao } from '../dados/medicacoes/tipos';
import { verificarDadosDeOrigem } from '../paciente/variaveis';
import { SECOES } from '../dados/secoes';
import { caso01 } from './clinicos/caso01-hipoglicemia-rn';
import { caso02 } from './clinicos/caso02-sepse-neonatal';
import { caso03 } from './clinicos/caso03-sifilis-congenita';
import { caso04 } from './clinicos/caso04-rn-exposto-hiv';
import { caso05 } from './clinicos/caso05-toxoplasmose-congenita';
import { caso06 } from './clinicos/caso06-asma-grave';
import { caso07 } from './clinicos/caso07-crupe';
import { caso08 } from './clinicos/caso08-meningite-choque';
import { caso09 } from './clinicos/caso09-anafilaxia';
import { caso10 } from './clinicos/caso10-cetoacidose';
import { caso11 } from './clinicos/caso11-tsv';
import { caso12 } from './clinicos/caso12-pcr-fv';
import { caso13 } from './clinicos/caso13-hipoglicemia-sem-acesso';
import { caso14 } from './clinicos/caso14-intoxicacao-bzd';
import { caso15 } from './clinicos/caso15-hiponatremia';
import { caso16 } from './clinicos/caso16-crise-adrenal';
import { casoDemonstracao } from './demonstracao';
import { type CasoClinico, NOME_PADRAO_RESPIRATORIO, NOME_RITMO, type NomeSinal } from './tipos';
import { verificarLimites } from './variacao';

export const CASOS: readonly CasoClinico[] = [
  casoDemonstracao,
  caso01,
  caso02,
  caso03,
  caso04,
  caso05,
  caso06,
  caso07,
  caso08,
  caso09,
  caso10,
  caso11,
  caso12,
  caso13,
  caso14,
  caso15,
  caso16,
];

const SINAIS: readonly NomeSinal[] = ['fc', 'fr', 'spo2', 'paSistolica', 'paDiastolica', 'temperaturaC', 'glicemiaMgDl', 'tecS', 'glasgow'];
const RITMOS = Object.keys(NOME_RITMO);
const PADROES = Object.keys(NOME_PADRAO_RESPIRATORIO);

/** Ids que não são medicações do banco mas podem receber resposta (itens especiais da folha). */
const IDS_ESPECIAIS = ['soro'];

/** Procura problemas num caso. Devolve a lista (vazia = tudo certo). */
export function verificarCaso(caso: CasoClinico, medicacoes: readonly Medicacao[]): string[] {
  const p: string[] = [];
  const onde = caso.id;
  p.push(...verificarDadosDeOrigem(caso.paciente, caso.inicio).map((x) => `${onde}: ${x}`));
  for (const sinal of SINAIS) {
    const v = caso.sinaisIniciais[sinal];
    if (v === undefined && (sinal === 'tecS' || sinal === 'glasgow')) continue; // entram os valores padrão
    if (v === undefined || !Number.isFinite(v) || v < 0) p.push(`${onde}: sinal ${sinal} inválido (${v}).`);
  }
  const g = caso.sinaisIniciais.glasgow;
  if (g !== undefined && (g < 3 || g > 15)) p.push(`${onde}: Glasgow fora de 3–15 (${g}).`);
  const trocas = [...(caso.evolucaoDoEstado ?? []), ...(caso.respostas ?? []).flatMap((r) => r.mudancasDeEstado ?? [])];
  if (caso.estadoInicial?.ritmo) trocas.push({ campo: 'ritmo', valor: caso.estadoInicial.ritmo, atrasoMin: 0 });
  if (caso.estadoInicial?.padraoRespiratorio) trocas.push({ campo: 'padraoRespiratorio', valor: caso.estadoInicial.padraoRespiratorio, atrasoMin: 0 });
  for (const t of trocas) {
    const validos = t.campo === 'ritmo' ? RITMOS : PADROES;
    if (!validos.includes(t.valor)) p.push(`${onde}: ${t.campo} desconhecido "${t.valor}".`);
    if (t.atrasoMin < 0) p.push(`${onde}: troca de ${t.campo} com tempo negativo.`);
  }
  for (const r of caso.respostas ?? []) {
    const f = r.faixaDose;
    if (f && !(f.min > 0 && f.max >= f.min)) p.push(`${onde}: faixa de dose de ${r.medicacaoId} inválida.`);
  }
  const idsMed = new Set([...medicacoes.map((m) => m.id), ...IDS_ESPECIAIS]);
  for (const r of caso.respostas ?? []) {
    if (!idsMed.has(r.medicacaoId)) p.push(`${onde}: resposta para medicação desconhecida "${r.medicacaoId}".`);
  }
  for (const m of [...(caso.evolucaoNatural ?? []), ...(caso.respostas ?? []).flatMap((r) => r.mudancas)]) {
    if (m.atrasoMin < 0 || m.duracaoMin < 0) p.push(`${onde}: mudança de ${m.sinal} com tempo negativo.`);
  }
  const idsExame = new Set(EXAMES.map((e) => e.id));
  for (const [id, resultado] of Object.entries(caso.resultadosExames ?? {})) {
    const exame = EXAMES.find((e) => e.id === id);
    if (!exame) {
      p.push(`${onde}: resultado de exame desconhecido "${id}".`);
      continue;
    }
    for (const analito of Object.keys(resultado.valores ?? {})) {
      if (!exame.analitos.some((a) => a.id === analito)) p.push(`${onde}: exame ${id} não tem o analito "${analito}".`);
    }
  }
  const idsSecao = new Set(SECOES.map((s) => s.id));
  const idsCondutas = new Set<string>();
  for (const c of caso.condutasEsperadas ?? []) {
    if (idsCondutas.has(c.id)) p.push(`${onde}: conduta repetida "${c.id}".`);
    idsCondutas.add(c.id);
    for (const alvo of c.alvos) {
      const existe =
        c.tipo === 'medicacao' ? idsMed.has(alvo) : c.tipo === 'exame' ? idsExame.has(alvo) : c.tipo === 'secao' ? idsSecao.has(alvo as never) : true;
      if (!existe) p.push(`${onde}: conduta "${c.id}" aponta para "${alvo}", que não existe.`);
    }
    if (c.tipo !== 'soro' && c.alvos.length === 0) p.push(`${onde}: conduta "${c.id}" sem alvo.`);
    if (c.antesDaMedicacao && !idsMed.has(c.antesDaMedicacao)) p.push(`${onde}: conduta "${c.id}" com medicação desconhecida.`);
  }
  // B16: limites da variação (peso e idade sorteados)
  p.push(...verificarLimites(caso));
  return p;
}

/** Casos agrupados para o menu. */
export function casosPorGrupo(casos: readonly CasoClinico[]): [string, CasoClinico[]][] {
  const grupos = new Map<string, CasoClinico[]>();
  for (const c of casos) {
    const g = c.grupo ?? 'Outros';
    grupos.set(g, [...(grupos.get(g) ?? []), c]);
  }
  return [...grupos.entries()];
}
