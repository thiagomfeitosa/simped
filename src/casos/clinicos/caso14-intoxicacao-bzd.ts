/** Caso 14 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso14: CasoClinico = {
  id: 'caso14-intoxicacao-bzd',
  titulo: 'Intoxicação por benzodiazepínico',
  grupo: 'Emergência',
  cenario: 'Pronto-socorro',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Tiago',
    sexo: 'M',
    leito: 'PS-06',
    nascimento: '2023-07-07T13:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3200,
    pesoKg: 14,
    estaturaCm: 95,
    alergias: [],
  },
  queixa: 'Encontrado com a cartela de clonazepam da avó há 1 h.',
  historia: 'Sem outros remédios em casa.',
  exameFisico: 'Sonolento, responde à dor. Pupilas normais.',
  hipotese: 'Intoxicação exógena por benzodiazepínico.',
  sinaisIniciais: { fc: 100, fr: 14, spo2: 92, paSistolica: 90, paDiastolica: 60, temperaturaC: 36.5, glicemiaMgDl: 95 },
  evolucaoNatural: [muda('fr', 12, 0, 120), muda('spo2', 90, 0, 120)],
  respostas: [
    // efeito do flumazenil é mais curto que o do clonazepam: a sedação volta
    resposta('flumazenil', [muda('fr', 22, 1, 2), muda('spo2', 97, 1, 3), muda('fr', 15, 60, 30), muda('spo2', 93, 60, 30)]),
  ],
  diureseMlKgH: 1.2,
  condutasEsperadas: [
    conduta('o2', 'Via aérea, O₂, monitorização', 'secao', ['oxigenoterapia']),
    conduta('flumazenil', 'Flumazenil 0,01 mg/kg', 'medicacao', ['flumazenil'], { prazoMin: 30 }),
    conduta('observar', 'Observar (efeito curto do flumazenil)', 'secao', ['cuidados']),
    conduta('sinan', 'SINAN: intoxicação exógena', 'secao', ['sinan']),
  ],
  pontosDeEnsino: ['Antídoto não substitui suporte.', 'Contraindicações do flumazenil.'],
};
