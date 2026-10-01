/** Caso 1 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso01: CasoClinico = {
  id: 'caso01-hipoglicemia-rn',
  titulo: 'Hipoglicemia no RN filho de mãe diabética',
  grupo: 'Neonatologia',
  cenario: 'Alojamento conjunto',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Maria (RN)',
    sexo: 'F',
    leito: 'AC-12',
    nascimento: '2026-10-01T06:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 4200,
    pesoKg: 4.2,
    estaturaCm: 52,
    alergias: [],
    dadosMaternos: 'Diabetes gestacional em uso de insulina, mal controlado.',
  },
  queixa: 'Tremores e hipoatividade com 2 h de vida.',
  historia: 'Mãe com diabetes gestacional em uso de insulina, mal controlado. RN grande para a idade gestacional (GIG).',
  exameFisico: 'Tremores, hipoatividade, sucção fraca.',
  hipotese: 'Hipoglicemia neonatal sintomática.',
  sinaisIniciais: { fc: 150, fr: 52, spo2: 97, paSistolica: 65, paDiastolica: 40, temperaturaC: 36.6, glicemiaMgDl: 28 },
  evolucaoNatural: [muda('glicemiaMgDl', 20, 0, 60), muda('fc', 165, 30, 60)],
  respostas: [
    resposta('sg10', [muda('glicemiaMgDl', 65, 5, 25), muda('fc', 145, 5, 25)], 'Bolus de SG 10%: 30 min depois, glicemia 60–70.'),
    resposta('soro', [muda('glicemiaMgDl', 70, 30, 60)], 'Soro com VIG adequada mantém a glicemia.'),
    resposta('g50', [muda('glicemiaMgDl', 90, 2, 10)], 'Sobe a glicemia, mas glicose 50% não é para bolus no RN (hiperosmolar).'),
  ],
  resultadosExames: {
    glicemia: { valores: { glicose: 26 }, status: 'A_VALIDAR' },
    eletrolitos: { valores: { na: 138, k: 4.8, cl: 104, cai: 1.05, mg: 1.8 }, status: 'A_VALIDAR' },
  },
  diureseMlKgH: 1,
  condutasEsperadas: [
    conduta('bolus', 'Bolus de SG 10% 2 mL/kg', 'medicacao', ['sg10'], { prazoMin: 15 }),
    conduta('soro', 'Soro de manutenção com VIG ~6 mg/kg/min', 'soro', []),
    conduta('glicemia', 'Controle de glicemia', 'exame', ['glicemia']),
    conduta('cuidados', 'Cuidados: manter aquecido, observar tremores e apneia', 'secao', ['cuidados']),
  ],
  pontosDeEnsino: ['Fórmula da VIG.', 'Como concentrar um soro misturando duas soluções.', 'Glicose 50% não é para bolus no RN.'],
};
