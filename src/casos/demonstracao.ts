/**
 * Caso de DEMONSTRAÇÃO, só para montar as telas. Não é um caso clínico validado:
 * os casos de verdade serão escritos e revisados pelo usuário (Fase 0).
 */

import type { CasoClinico } from './tipos';

export const casoDemonstracao: CasoClinico = {
  id: 'demonstracao',
  titulo: 'Caso de demonstração',
  inicio: '2026-10-01T08:00',
  paciente: {
    nome: 'Paciente Demonstração',
    nascimento: '2022-07-14T10:20',
    igNascer: { semanas: 39, dias: 2 },
    pesoNascerG: 3250,
    pesoKg: 16,
    estaturaCm: 102,
    sexo: 'F',
    leito: 'PS-03',
    alergias: ['Penicilinas'],
  },
  queixa: 'Febre há 1 dia.',
  historia: 'Texto de exemplo. O caso real será escrito na tarefa "Casos clínicos".',
  exameFisico: 'Texto de exemplo.',
  sinaisIniciais: {
    fc: 120,
    fr: 24,
    spo2: 97,
    paSistolica: 98,
    paDiastolica: 60,
    temperaturaC: 38.6,
    glicemiaMgDl: 92,
  },
  evolucaoNatural: [{ sinal: 'temperaturaC', alvo: 39.2, atrasoMin: 0, duracaoMin: 120 }],
  respostas: [
    {
      medicacaoId: 'dipirona',
      mudancas: [
        { sinal: 'temperaturaC', alvo: 37.3, atrasoMin: 30, duracaoMin: 60 },
        { sinal: 'fc', alvo: 105, atrasoMin: 30, duracaoMin: 60 },
      ],
      status: 'A_VALIDAR',
      observacao: 'Números de demonstração, só para testar o motor.',
    },
  ],
  // resultados fictícios, só para demonstrar a tela de exames (A VALIDAR)
  resultadosExames: {
    hemograma: {
      valores: { hb: 11.8, ht: 35, leucocitos: 18500, neutrofilos: 78, bastoes: 8, plaquetas: 310000 },
      status: 'A_VALIDAR',
    },
    pcr: { valores: { pcr: 64 }, status: 'A_VALIDAR' },
    eletrolitos: { valores: { na: 136, k: 4.1, cl: 104, cai: 1.2, mg: 2 }, status: 'A_VALIDAR' },
    'gasometria-venosa': { valores: { ph: 7.3, pco2: 33, hco3: 16, be: -8, lactato: 2.8 }, status: 'A_VALIDAR' },
    'rx-torax': { laudo: 'Exemplo: sem consolidações; seios costofrênicos livres.', status: 'A_VALIDAR' },
  },
  diureseMlKgH: 1.2,
};
