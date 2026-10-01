/**
 * A folha de prescrição em texto, seção por seção (para "rever o caso" e para o professor ver a folha do aluno).
 */

import type { Medicacao } from '../dados/medicacoes/tipos';
import { type EstadoPrescricao, numerarItens, SECOES } from './estado';
import { textoDaFolha, VOLUME_FINAL_BIC_PADRAO } from './itemMedicacao';
import { textoDoSoro } from './soro';

export interface SecaoEmTexto {
  numero: number;
  titulo: string;
  itens: { numero: number; texto: string }[];
}

export function folhaEmTexto(
  estado: EstadoPrescricao,
  medicacoes: readonly Medicacao[],
  volumeFinalBicMl: number = VOLUME_FINAL_BIC_PADRAO,
): SecaoEmTexto[] {
  const numeros = numerarItens(estado);
  return SECOES.map((s) => ({
    numero: s.numero,
    titulo: s.titulo,
    itens: estado.itens[s.id].map((item) => ({
      numero: numeros.get(item.id) ?? 0,
      texto:
        item.tipo === 'texto'
          ? item.texto
          : item.tipo === 'soro'
            ? textoDoSoro(item.campos)
            : textoDaFolha(item.campos, medicacoes, volumeFinalBicMl) || '(medicação ainda incompleta)',
    })),
  }));
}
