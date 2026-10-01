/**
 * ⚠️ TUDO "A VALIDAR". Valores copiados de docs/fase-0/doses-rascunho.md (rascunho feito de memória
 * pelo assistente, sem consulta às fontes). Servem só para desenvolver as telas e testar o programa.
 * O código da fonte é o PROVÁVEL; nenhum documento/página foi conferido.
 * Enquanto o status for 'A_VALIDAR', o programa não usa estes valores para corrigir o aluno.
 */

import type { Medicacao } from './tipos';

export const adrenalina: Medicacao = {
  id: 'adrenalina',
  nome: 'Adrenalina',
  secao: 6,
  apresentacoes: [
    {
      id: 'ampola-1mg-ml',
      descricao: 'Ampola 1 mg/mL (1:1.000), 1 mL',
      forma: 'ampola',
      vias: ['EV', 'IO', 'IM', 'endotraqueal', 'inalatoria'],
      quantidade: { valor: 1, unidade: 'mg' },
      volumeMl: 1,
      concentracaoPorMl: { valor: 1, unidade: 'mg' },
      status: 'A_VALIDAR',
    },
  ],
  regras: [
    {
      id: 'pcr-crianca',
      indicacao: 'PCR',
      faixas: ['crianca', 'adolescente'],
      vias: ['EV', 'IO'],
      dose: { tipo: 'porKg', min: 0.01, max: 0.01, unidade: 'mg', por: 'dose' },
      doseMaxima: { valor: 1, unidade: 'mg', por: 'dose' },
      observacoes: '0,1 mL/kg da 1:10.000 (1 mL + 9 mL de SF), a cada 3–5 min.',
      fonte: { codigo: 'PALS' },
      status: 'A_VALIDAR',
    },
    {
      id: 'anafilaxia-crianca',
      indicacao: 'Anafilaxia',
      faixas: ['crianca'],
      vias: ['IM'],
      dose: { tipo: 'porKg', min: 0.01, max: 0.01, unidade: 'mg', por: 'dose' },
      doseMaxima: { valor: 0.3, unidade: 'mg', por: 'dose' },
      observacoes: 'Da 1:1.000 = 0,01 mL/kg. Repetir em 5–15 min.',
      fonte: { codigo: 'ASBAI' },
      status: 'A_VALIDAR',
    },
    {
      id: 'anafilaxia-adolescente',
      indicacao: 'Anafilaxia',
      faixas: ['adolescente'],
      vias: ['IM'],
      dose: { tipo: 'porKg', min: 0.01, max: 0.01, unidade: 'mg', por: 'dose' },
      doseMaxima: { valor: 0.5, unidade: 'mg', por: 'dose' },
      observacoes: 'Da 1:1.000 = 0,01 mL/kg. Repetir em 5–15 min.',
      fonte: { codigo: 'ASBAI' },
      status: 'A_VALIDAR',
    },
    {
      id: 'choque-infusao',
      indicacao: 'Choque',
      faixas: ['crianca', 'adolescente'],
      vias: ['EV'],
      dose: { tipo: 'porKg', min: 0.05, max: 1, unidade: 'mcg', por: 'min' },
      fonte: { codigo: 'PALS' },
      status: 'A_VALIDAR',
    },
  ],
};

export const dipirona: Medicacao = {
  id: 'dipirona',
  nome: 'Dipirona',
  secao: 6,
  apresentacoes: [
    {
      id: 'ampola-500mg-ml',
      descricao: 'Ampola 500 mg/mL, 2 mL',
      forma: 'ampola',
      vias: ['EV', 'IM'],
      quantidade: { valor: 1000, unidade: 'mg' },
      volumeMl: 2,
      concentracaoPorMl: { valor: 500, unidade: 'mg' },
      status: 'A_VALIDAR',
    },
    {
      id: 'gotas-500mg-ml',
      descricao: 'Gotas 500 mg/mL',
      forma: 'gotas',
      vias: ['VO'],
      concentracaoPorMl: { valor: 500, unidade: 'mg' },
      status: 'A_VALIDAR',
    },
  ],
  regras: [
    {
      id: 'febre-dor-crianca',
      indicacao: 'Febre/dor',
      faixas: ['crianca'],
      vias: ['VO', 'EV', 'IM'],
      dose: { tipo: 'porKg', min: 10, max: 25, unidade: 'mg', por: 'dose' },
      intervalosHoras: [6],
      fonte: { codigo: 'SBP' },
      status: 'A_VALIDAR',
    },
    {
      id: 'febre-dor-adolescente',
      indicacao: 'Febre/dor',
      faixas: ['adolescente'],
      vias: ['VO', 'EV', 'IM'],
      dose: { tipo: 'fixa', min: 500, max: 1000, unidade: 'mg', por: 'dose' },
      doseMaxima: { valor: 4000, unidade: 'mg', por: 'dia' },
      intervalosHoras: [6],
      fonte: { codigo: 'SBP' },
      status: 'A_VALIDAR',
    },
  ],
  alertas: ['Bula: não usar em < 3 meses ou < 5 kg. EV com cautela (hipotensão).'],
};

export const ceftriaxona: Medicacao = {
  id: 'ceftriaxona',
  nome: 'Ceftriaxona',
  secao: 5,
  apresentacoes: [
    {
      id: 'fa-500mg',
      descricao: 'Frasco-ampola 500 mg (pó)',
      forma: 'frasco-ampola-po',
      vias: ['EV', 'IM'],
      quantidade: { valor: 500, unidade: 'mg' },
      status: 'A_VALIDAR',
    },
    {
      id: 'fa-1g',
      descricao: 'Frasco-ampola 1 g (pó)',
      forma: 'frasco-ampola-po',
      vias: ['EV', 'IM'],
      quantidade: { valor: 1000, unidade: 'mg' },
      status: 'A_VALIDAR',
    },
  ],
  regras: [
    {
      id: 'geral-crianca',
      indicacao: 'Infecção bacteriana',
      faixas: ['crianca', 'adolescente'],
      vias: ['EV', 'IM'],
      dose: { tipo: 'porKg', min: 50, max: 75, unidade: 'mg', por: 'dia' },
      doseMaxima: { valor: 2000, unidade: 'mg', por: 'dia' },
      intervalosHoras: [12, 24],
      fonte: { codigo: 'SBP' },
      status: 'A_VALIDAR',
    },
    {
      id: 'meningite-crianca',
      indicacao: 'Meningite',
      faixas: ['crianca', 'adolescente'],
      vias: ['EV'],
      dose: { tipo: 'porKg', min: 100, max: 100, unidade: 'mg', por: 'dia' },
      doseMaxima: { valor: 4000, unidade: 'mg', por: 'dia' },
      intervalosHoras: [12, 24],
      fonte: { codigo: 'SBP' },
      status: 'A_VALIDAR',
    },
  ],
  alertas: [
    'RN: evitar em hiperbilirrubinemia/prematuro e NUNCA com cálcio EV em ≤ 28 dias.',
  ],
};

export const MEDICACOES_EXEMPLO: readonly Medicacao[] = [adrenalina, dipirona, ceftriaxona];
