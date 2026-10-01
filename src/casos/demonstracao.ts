/**
 * Caso de DEMONSTRAÇÃO, só para montar as telas. Não é um caso clínico validado:
 * os casos de verdade serão escritos e revisados pelo usuário (Fase 0).
 */

import type { CasoClinico } from './tipos';

export const casoDemonstracao: CasoClinico = {
  id: 'demonstracao',
  titulo: 'Caso de demonstração',
  paciente: {
    nome: 'Paciente Demonstração',
    idadeTexto: '4 anos',
    faixa: 'crianca',
    pesoKg: 16,
    sexo: 'F',
    leito: 'PS-03',
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
};
