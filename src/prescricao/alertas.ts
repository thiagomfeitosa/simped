/**
 * Alertas de segurança da folha inteira (sem tela): alergia do paciente (inclusive reatividade cruzada),
 * medicação repetida e interações entre itens (ex.: ceftriaxona + cálcio no RN).
 * As regras vêm de src/dados/alertas.ts (A VALIDAR). Alertas não bloqueiam: avisam.
 */

import { INTERACOES, REATIVIDADE_CRUZADA } from '../dados/alertas';
import { condicoesValem } from '../dados/medicacoes/consulta';
import type { Medicacao, StatusValidacao, VariaveisParaRegra } from '../dados/medicacoes/tipos';
import { SOLUCOES } from '../dados/solucoes';
import { type EstadoPrescricao, SECOES } from './estado';

export interface AlertaFolha {
  tipo: 'alergia' | 'repetida' | 'interacao';
  gravidade: 'alta' | 'media';
  /** Itens envolvidos (ids da folha). */
  itemIds: number[];
  texto: string;
  status: StatusValidacao;
}

/** "Penicilinas" → "penicilina"; "Betalactâmicos" → "betalactamico". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/s$/, '')
    .replace(/s(?= )/g, '');
}

interface ItemComEtiquetas {
  itemId: number;
  nome: string;
  medicacaoId?: string;
  etiquetas: string[];
}

function etiquetasDaFolha(estado: EstadoPrescricao, medicacoes: readonly Medicacao[]): ItemComEtiquetas[] {
  const lista: ItemComEtiquetas[] = [];
  for (const secao of SECOES) {
    for (const item of estado.itens[secao.id]) {
      if (item.tipo === 'medicacao') {
        const med = medicacoes.find((m) => m.id === item.campos.medicacaoId);
        if (med) lista.push({ itemId: item.id, nome: med.nome, medicacaoId: med.id, etiquetas: [med.id, ...(med.classes ?? [])] });
      } else if (item.tipo === 'soro') {
        for (const c of item.campos.componentes) {
          const s = SOLUCOES.find((x) => x.id === c.solucaoId);
          if (s) lista.push({ itemId: item.id, nome: s.nome, etiquetas: [s.id, ...(s.classes ?? [])] });
        }
      }
    }
  }
  return lista;
}

export function alertasDaFolha(
  estado: EstadoPrescricao,
  medicacoes: readonly Medicacao[],
  paciente: { alergias?: string[]; paraRegra: VariaveisParaRegra },
): AlertaFolha[] {
  const itens = etiquetasDaFolha(estado, medicacoes);
  const alertas: AlertaFolha[] = [];

  // 1. alergia (nome, id ou classe) e reatividade cruzada
  for (const alergiaTexto of paciente.alergias ?? []) {
    const alergia = normalizar(alergiaTexto);
    if (!alergia) continue;
    for (const item of itens) {
      const etiquetas = [item.nome, ...item.etiquetas].map(normalizar);
      if (etiquetas.includes(alergia)) {
        alertas.push({
          tipo: 'alergia',
          gravidade: 'alta',
          itemIds: [item.itemId],
          texto: `ALERGIA: o paciente tem alergia registrada a “${alergiaTexto}” e ${item.nome} foi prescrito.`,
          status: 'CONFERIDO',
        });
        continue;
      }
      const cruzada = REATIVIDADE_CRUZADA.find(
        (r) => normalizar(r.alergia) === alergia && etiquetas.includes(normalizar(r.etiqueta)),
      );
      if (cruzada) {
        alertas.push({
          tipo: 'alergia',
          gravidade: 'media',
          itemIds: [item.itemId],
          texto: `${cruzada.texto} (${item.nome})`,
          status: cruzada.status,
        });
      }
    }
  }

  // 2. medicação repetida
  const porMedicacao = new Map<string, ItemComEtiquetas[]>();
  for (const item of itens) {
    if (!item.medicacaoId) continue;
    porMedicacao.set(item.medicacaoId, [...(porMedicacao.get(item.medicacaoId) ?? []), item]);
  }
  for (const repetidos of porMedicacao.values()) {
    if (repetidos.length > 1) {
      alertas.push({
        tipo: 'repetida',
        gravidade: 'media',
        itemIds: repetidos.map((i) => i.itemId),
        texto: `${repetidos[0]?.nome} aparece em ${repetidos.length} itens da folha. Foi de propósito?`,
        status: 'CONFERIDO',
      });
    }
  }

  // 3. interações entre itens diferentes
  for (const regra of INTERACOES) {
    if (!condicoesValem(regra.condicoes, paciente.paraRegra)) continue;
    const comA = itens.filter((i) => i.etiquetas.map(normalizar).includes(normalizar(regra.etiquetaA)));
    const comB = itens.filter((i) => i.etiquetas.map(normalizar).includes(normalizar(regra.etiquetaB)));
    if (comA.length > 0 && comB.length > 0) {
      alertas.push({
        tipo: 'interacao',
        gravidade: regra.gravidade,
        itemIds: [...new Set([...comA, ...comB].map((i) => i.itemId))],
        texto: regra.texto,
        status: regra.status,
      });
    }
  }
  return alertas;
}
