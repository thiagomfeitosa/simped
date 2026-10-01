/**
 * Equipos de soro: quantas gotas tem 1 mL. ⚠️ A VALIDAR com o equipo usado no hospital
 * (pendente com o usuário: conversão gotas ↔ mL).
 */

import type { StatusValidacao } from './medicacoes/tipos';

export const EQUIPOS = {
  macrogotas: { nome: 'Macrogotas', gotasPorMl: 20 },
  microgotas: { nome: 'Microgotas', gotasPorMl: 60 },
  status: 'A_VALIDAR' as StatusValidacao,
};
