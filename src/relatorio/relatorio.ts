/**
 * Relatório final do caso (sem tela): condutas esperadas cumpridas (e no prazo), tempo até a primeira dose,
 * exame pedido antes do antibiótico, erros e acertos da conferência por tipo.
 * As condutas esperadas vêm do arquivo do caso (A VALIDAR).
 */

import type { Tolerancia } from '../calculos';
import type { CasoClinico, CondutaEsperada } from '../casos/tipos';
import type { CodigoFonte, Medicacao } from '../dados/medicacoes/tipos';
import { descreverBancoEmUso } from '../dados/medicacoes/versao';
import type { PedidoExame } from '../exames/exames';
import type { EventoPaciente } from '../motor/paciente';
import type { PacienteAtual } from '../paciente/atual';
import { alertasDaFolha } from '../prescricao/alertas';
import type { Verificacao } from '../prescricao/comum';
import { type EstadoPrescricao, SECOES } from '../prescricao/estado';
import { conferirItemMedicacao } from '../prescricao/itemMedicacao';
import type { CamposReceita } from '../prescricao/receita';

export interface Administracao {
  medicacaoId: string;
  minuto: number;
  descricao: string;
}

/** Quando cada medicação foi dada, a partir da lista de eventos do motor. */
export function administracoes(eventos: readonly EventoPaciente[]): Administracao[] {
  let minuto = 0;
  const lista: Administracao[] = [];
  for (const e of eventos) {
    if (e.tipo === 'tempoPassou') minuto += Math.max(0, Math.floor(e.minutos));
    else if (e.tipo === 'medicacaoAdministrada') lista.push({ medicacaoId: e.medicacaoId, minuto, descricao: e.descricao });
  }
  return lista;
}

export interface ResultadoConduta {
  conduta: CondutaEsperada;
  feita: boolean;
  /** Minuto em que foi feita (dose dada ou exame pedido), se houver. */
  minuto?: number;
  noPrazo?: boolean;
  texto: string;
}

export interface Relatorio {
  caso: { id: string; titulo: string; hipotese?: string; pontosDeEnsino: string[] };
  duracaoMin: number;
  condutas: ResultadoConduta[];
  /** % de condutas feitas (e no prazo, quando há prazo). */
  aproveitamento: number;
  primeiraDose?: Administracao;
  errosPorTipo: Partial<Record<Verificacao['assunto'], number>>;
  acertosPorTipo: Partial<Record<Verificacao['assunto'], number>>;
  itensDeMedicacao: number;
  alertasDeSeguranca: number;
  /** Com qual banco de medicações o aluno treinou (B7): "versão 2 de 01/10/2026" ou "+ mudanças deste computador". */
  banco: { texto: string; versao: number; codigo: string; local: boolean };
}

export const NOME_TIPO_ERRO: Partial<Record<Verificacao['assunto'], string>> = {
  secao: 'Seção da folha',
  via: 'Via',
  volume: 'Conta de volume',
  unidades: 'Unidades',
  dose: 'Dose',
  intervalo: 'Intervalo',
  preenchimento: 'Números digitados',
  diluicao: 'Diluição',
  bic: 'Seringa da BIC',
  infusao: 'Infusão contínua',
};

function formatarMinuto(minuto: number): string {
  return `${String(Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`;
}

export function gerarRelatorio(entrada: {
  caso: CasoClinico;
  prescricao: EstadoPrescricao;
  receita: readonly CamposReceita[];
  eventos: readonly EventoPaciente[];
  pedidos: readonly PedidoExame[];
  medicacoes: readonly Medicacao[];
  paciente: PacienteAtual;
  agoraMin: number;
  fontePreferida?: CodigoFonte;
  tolerancia?: Tolerancia;
  volumeFinalBicMl?: number;
}): Relatorio {
  const { caso, prescricao, receita, eventos, pedidos, medicacoes, paciente } = entrada;
  const doses = administracoes(eventos);

  // o que está escrito na folha e na receita
  const naFolha = new Set<string>();
  let temSoro = false;
  const secoesEscritas = new Set<string>();
  const errosPorTipo: Relatorio['errosPorTipo'] = {};
  const acertosPorTipo: Relatorio['acertosPorTipo'] = {};
  let itensDeMedicacao = 0;
  for (const secao of SECOES) {
    for (const item of prescricao.itens[secao.id]) {
      if (item.tipo === 'texto' && item.texto.trim()) secoesEscritas.add(secao.id);
      if (item.tipo === 'soro') {
        temSoro = true;
        secoesEscritas.add(secao.id);
      }
      if (item.tipo === 'medicacao' && item.campos.medicacaoId) {
        naFolha.add(item.campos.medicacaoId);
        secoesEscritas.add(secao.id);
        itensDeMedicacao++;
        const r = conferirItemMedicacao({
          campos: item.campos,
          medicacoes,
          paciente: {
            faixa: paciente.faixa,
            pesoKg: paciente.pesoKg,
            variaveis: paciente.paraRegra,
            superficieM2: paciente.variaveis.superficieCorporal.m2,
          },
          secaoNumero: secao.numero,
          ...(entrada.fontePreferida && { fontePreferida: entrada.fontePreferida }),
          ...(entrada.tolerancia && { tolerancia: entrada.tolerancia }),
          ...(entrada.volumeFinalBicMl && { volumeFinalBicMl: entrada.volumeFinalBicMl }),
        });
        for (const v of r.verificacoes) {
          if (v.situacao === 'errado') errosPorTipo[v.assunto] = (errosPorTipo[v.assunto] ?? 0) + 1;
          if (v.situacao === 'certo') acertosPorTipo[v.assunto] = (acertosPorTipo[v.assunto] ?? 0) + 1;
        }
      }
    }
  }
  for (const r of receita) if (r.medicacaoId) naFolha.add(r.medicacaoId);

  const primeiraDoseDe = (ids: readonly string[]) => doses.find((d) => ids.includes(d.medicacaoId));
  const primeiroPedidoDe = (ids: readonly string[]) =>
    [...pedidos].sort((a, b) => a.pedidoNoMinuto - b.pedidoNoMinuto).find((p) => ids.includes(p.exameId));

  const condutas: ResultadoConduta[] = (caso.condutasEsperadas ?? []).map((c) => {
    switch (c.tipo) {
      case 'medicacao': {
        const prescrita = c.alvos.some((id) => naFolha.has(id));
        const dose = primeiraDoseDe(c.alvos);
        const noPrazo = c.prazoMin === undefined ? undefined : dose !== undefined && dose.minuto <= c.prazoMin;
        const feita = c.prazoMin === undefined ? prescrita || dose !== undefined : dose !== undefined;
        const texto = dose
          ? `Dada às ${formatarMinuto(dose.minuto)}${c.prazoMin !== undefined ? (noPrazo ? ' (no prazo)' : ` (prazo: ${formatarMinuto(c.prazoMin)})`) : ''}.`
          : prescrita
            ? c.prazoMin !== undefined
              ? 'Prescrita, mas não administrada.'
              : 'Prescrita.'
            : 'Não prescrita.';
        return { conduta: c, feita, ...(dose && { minuto: dose.minuto }), ...(noPrazo !== undefined && { noPrazo }), texto };
      }
      case 'soro':
        return { conduta: c, feita: temSoro, texto: temSoro ? 'Soro na folha.' : 'Sem soro na folha.' };
      case 'secao': {
        const feita = c.alvos.some((s) => secoesEscritas.has(s));
        return { conduta: c, feita, texto: feita ? 'Escrito na folha.' : 'Seção em branco.' };
      }
      case 'exame': {
        const pedido = primeiroPedidoDe(c.alvos);
        let texto = pedido ? `Pedido às ${formatarMinuto(pedido.pedidoNoMinuto)}.` : 'Não pedido.';
        let feita = pedido !== undefined;
        if (pedido && c.antesDaMedicacao) {
          const dose = primeiraDoseDe([c.antesDaMedicacao]);
          if (dose && dose.minuto < pedido.pedidoNoMinuto) {
            feita = false;
            texto += ` Mas DEPOIS da 1ª dose (${formatarMinuto(dose.minuto)}).`;
          } else {
            texto += ' Antes do antibiótico. ✔';
          }
        }
        const noPrazo = c.prazoMin === undefined ? undefined : pedido !== undefined && pedido.pedidoNoMinuto <= c.prazoMin;
        return { conduta: c, feita, ...(pedido && { minuto: pedido.pedidoNoMinuto }), ...(noPrazo !== undefined && { noPrazo }), texto };
      }
    }
  });

  const pontos = condutas.reduce((s, r) => s + (r.feita && r.noPrazo !== false ? 1 : r.feita ? 0.5 : 0), 0);
  const primeiraDose = doses[0];
  return {
    caso: { id: caso.id, titulo: caso.titulo, ...(caso.hipotese && { hipotese: caso.hipotese }), pontosDeEnsino: caso.pontosDeEnsino ?? [] },
    duracaoMin: entrada.agoraMin,
    condutas,
    aproveitamento: condutas.length > 0 ? Math.round((pontos / condutas.length) * 100) : 0,
    ...(primeiraDose && { primeiraDose }),
    errosPorTipo,
    acertosPorTipo,
    itensDeMedicacao,
    alertasDeSeguranca: alertasDaFolha(prescricao, medicacoes, paciente).length,
    banco: (({ texto, versao, codigo, local }) => ({ texto, versao: versao.versao, codigo, local }))(descreverBancoEmUso(medicacoes)),
  };
}

// ---------- histórico (guardado no computador) ----------

export interface ResumoHistorico {
  casoId: string;
  titulo: string;
  /** Data/hora real (do computador) em que o caso foi encerrado. */
  quando: string;
  aproveitamento: number;
  erros: number;
  /** Versão do banco de medicações usada (B7); vazio nos registros antigos. */
  banco?: string;
}

export function resumoParaHistorico(r: Relatorio, quando: Date): ResumoHistorico {
  return {
    casoId: r.caso.id,
    titulo: r.caso.titulo,
    quando: quando.toISOString(),
    aproveitamento: r.aproveitamento,
    erros: Object.values(r.errosPorTipo).reduce((s, n) => s + (n ?? 0), 0),
    banco: r.banco.texto,
  };
}

/** Lê o histórico guardado (texto JSON). Entradas estranhas são ignoradas. */
export function lerHistorico(texto: string | null): ResumoHistorico[] {
  if (!texto) return [];
  try {
    const lista = JSON.parse(texto) as unknown;
    if (!Array.isArray(lista)) return [];
    return lista.filter(
      (x): x is ResumoHistorico =>
        typeof x === 'object' && x !== null && typeof x.casoId === 'string' && typeof x.aproveitamento === 'number',
    );
  } catch {
    return [];
  }
}
