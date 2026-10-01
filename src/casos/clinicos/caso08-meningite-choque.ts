/** Caso 8 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso08: CasoClinico = {
  id: 'caso08-meningite-choque',
  titulo: 'Meningite / choque séptico',
  grupo: 'Emergência',
  cenario: 'Sala de emergência',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Gabriel',
    sexo: 'M',
    leito: 'SE-01',
    nascimento: '2022-06-20T03:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3300,
    pesoKg: 16,
    estaturaCm: 102,
    alergias: [],
  },
  queixa: 'Febre há 12 h, vômitos, sonolência e manchas na pele.',
  historia: 'Febre há 12 h, vômitos, sonolência, manchas na pele.',
  exameFisico: 'Petéquias e púrpura, rigidez de nuca, TEC 4 s, extremidades frias. Glasgow 12.',
  hipotese: 'Meningite / doença meningocócica com choque séptico.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  estadoInicial: { padraoRespiratorio: 'taquipneia' },
  sinaisIniciais: { fc: 170, fr: 36, spo2: 94, paSistolica: 80, paDiastolica: 40, temperaturaC: 39.5, glicemiaMgDl: 70, tecS: 4, glasgow: 12 },
  evolucaoNatural: [muda('paSistolica', 65, 0, 120), muda('paDiastolica', 32, 0, 120), muda('fc', 185, 0, 120), muda('spo2', 90, 30, 120), muda('glasgow', 10, 0, 120), muda('tecS', 5, 0, 120)],
  respostas: [
    resposta('sf09', [muda('paSistolica', 88, 0, 20), muda('paDiastolica', 48, 0, 20), muda('fc', 158, 0, 20), muda('tecS', 3, 0, 20)], 'Reavaliar após cada bolus.'),
    resposta('ceftriaxona', [muda('temperaturaC', 38.4, 60, 240), muda('fc', 135, 60, 240), muda('paSistolica', 95, 60, 180), muda('glasgow', 13, 120, 240)]),
    resposta('dipirona', [muda('temperaturaC', 38.2, 30, 60), muda('paSistolica', 78, 10, 20)], 'EV pode baixar a PA.'),
    resposta('adrenalina', [muda('paSistolica', 96, 5, 20), muda('paDiastolica', 55, 5, 20), muda('fc', 160, 5, 20)]),
    resposta('hidrocortisona', [muda('paSistolica', 95, 30, 90)]),
  ],
  resultadosExames: {
    hemograma: { valores: { hb: 10.8, ht: 32, leucocitos: 3200, neutrofilos: 70, bastoes: 22, plaquetas: 68000 }, status: 'A_VALIDAR' },
    pcr: { valores: { pcr: 186 }, status: 'A_VALIDAR' },
    procalcitonina: { valores: { pct: 28 }, status: 'A_VALIDAR' },
    'gasometria-venosa': { valores: { ph: 7.22, pco2: 30, hco3: 12, be: -14, lactato: 5.6 }, status: 'A_VALIDAR' },
    eletrolitos: { valores: { na: 134, k: 3.6, cl: 104, cai: 1.0, mg: 1.8 }, status: 'A_VALIDAR' },
    glicemia: { valores: { glicose: 68 }, status: 'A_VALIDAR' },
    coagulograma: { valores: { 'tp-inr': 1.8, ttpa: 1.5 }, status: 'A_VALIDAR' },
    hemocultura: { laudo: 'Diplococos Gram-negativos (exemplo fictício).', status: 'A_VALIDAR' },
    liquor: { laudo: 'Só colher depois de estabilizar.', status: 'A_VALIDAR' },
  },
  diureseMlKgH: 0.4,
  condutasEsperadas: [
    conduta('o2', 'O₂ em máscara', 'secao', ['oxigenoterapia']),
    conduta('sf', 'SF 0,9% 20 mL/kg em 5–20 min, reavaliando', 'medicacao', ['sf09'], { prazoMin: 20 }),
    conduta('hemocultura', 'Hemocultura antes do antibiótico', 'exame', ['hemocultura'], { antesDaMedicacao: 'ceftriaxona' }),
    conduta('ceftriaxona', 'Ceftriaxona 100 mg/kg/dia na 1ª hora', 'medicacao', ['ceftriaxona'], { prazoMin: 60 }),
    conduta('exames', 'Lactato/gasometria, hemograma, PCR', 'exame', ['gasometria-venosa', 'gasometria-arterial', 'hemograma', 'pcr']),
    conduta('sinan', 'SINAN: meningite / doença meningocócica (imediata)', 'secao', ['sinan']),
  ],
  pontosDeEnsino: ['Reavaliação após cada bolus.', 'Infusão contínua em mcg/kg/min → mL/h.', 'Superfície corporal.'],
};
