/** Caso 15 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, respiracao, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso15: CasoClinico = {
  id: 'caso15-hiponatremia',
  titulo: 'Hiponatremia com convulsão',
  grupo: 'Distúrbios hidroeletrolíticos',
  cenario: 'Sala de emergência',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Helena',
    sexo: 'F',
    leito: 'SE-04',
    nascimento: '2025-11-20T17:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3100,
    pesoKg: 8,
    estaturaCm: 70,
    alergias: [],
  },
  queixa: 'Convulsão generalizada há 5 min.',
  historia: 'Diarreia há 3 dias; a mãe ofereceu muita água e chá.',
  exameFisico: 'Convulsão generalizada. Na 118 mEq/L, glicemia 90.',
  hipotese: 'Hiponatremia hipotônica sintomática grave.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  estadoInicial: { padraoRespiratorio: 'taquipneia' },
  sinaisIniciais: { fc: 150, fr: 40, spo2: 94, paSistolica: 90, paDiastolica: 55, temperaturaC: 36.9, glicemiaMgDl: 90, tecS: 2, glasgow: 8 },
  evolucaoNatural: [muda('spo2', 90, 0, 30), muda('fc', 165, 0, 30)],
  respostas: [resposta('nacl3', [muda('fc', 135, 5, 10), muda('spo2', 96, 5, 10), muda('fr', 34, 5, 10), muda('glasgow', 13, 5, 15)], 'A convulsão para; Na 122 após o bolus.', { mudancasDeEstado: [respiracao('normal', 20)] })],
  resultadosExames: {
    eletrolitos: { valores: { na: 118, k: 3.6, cl: 88, cai: 1.15, mg: 1.9 }, status: 'A_VALIDAR' },
    glicemia: { valores: { glicose: 90 }, status: 'A_VALIDAR' },
    'gasometria-venosa': { valores: { ph: 7.33, pco2: 36, hco3: 19, be: -5, lactato: 1.5 }, status: 'A_VALIDAR' },
  },
  diureseMlKgH: 1,
  condutasEsperadas: [
    conduta('o2', 'O₂, posição lateral, via aérea', 'secao', ['oxigenoterapia']),
    conduta('nacl3', 'NaCl 3% 2–5 mL/kg em 10–20 min', 'medicacao', ['nacl3'], { prazoMin: 15 }),
    conduta('soro', 'Soro de manutenção isotônico depois', 'soro', []),
    conduta('sodio', 'Sódio seriado', 'exame', ['eletrolitos']),
  ],
  pontosDeEnsino: ['Diferença entre SF, NaCl 20% e NaCl 3%.', 'Preparo do 3%.', 'Limite de correção em 24 h.'],
};
