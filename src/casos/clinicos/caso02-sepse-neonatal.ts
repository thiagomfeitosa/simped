/** Caso 2 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso02: CasoClinico = {
  id: 'caso02-sepse-neonatal',
  titulo: 'Sepse neonatal precoce',
  grupo: 'Neonatologia',
  cenario: 'UTI neonatal',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'João (RN)',
    sexo: 'M',
    leito: 'UTIN-04',
    nascimento: '2026-09-30T14:00',
    igNascer: { semanas: 37, dias: 0 },
    pesoNascerG: 3050,
    pesoKg: 3,
    estaturaCm: 49,
    alergias: [],
    dadosMaternos: 'Bolsa rota há 24 h, mãe febril no parto, pesquisa de estreptococo do grupo B desconhecida.',
  },
  queixa: 'Gemido e desconforto respiratório com 18 h de vida.',
  historia: 'Bolsa rota há 24 h, mãe febril no parto, pesquisa de estreptococo do grupo B desconhecida.',
  exameFisico: 'Gemido, tiragem, pele moteada, TEC 4 s. PA média 35 mmHg.',
  hipotese: 'Sepse neonatal precoce.',
  sinaisIniciais: { fc: 180, fr: 70, spo2: 91, paSistolica: 50, paDiastolica: 28, temperaturaC: 38.2, glicemiaMgDl: 60 },
  evolucaoNatural: [muda('paSistolica', 42, 30, 90), muda('fc', 190, 30, 90), muda('temperaturaC', 38.8, 0, 120)],
  respostas: [
    resposta('sf09', [muda('paSistolica', 58, 0, 20), muda('fc', 168, 0, 20)], 'Expansão: melhora parcial; reavaliar.'),
    resposta('ampicilina', [muda('temperaturaC', 37.6, 60, 180), muda('fc', 150, 60, 120)]),
    resposta('gentamicina', [muda('spo2', 95, 30, 60), muda('fr', 55, 60, 120)]),
  ],
  resultadosExames: {
    hemograma: { valores: { hb: 15, ht: 46, leucocitos: 4200, neutrofilos: 40, bastoes: 18, plaquetas: 95000 }, status: 'A_VALIDAR' },
    pcr: { valores: { pcr: 48 }, status: 'A_VALIDAR' },
    glicemia: { valores: { glicose: 62 }, status: 'A_VALIDAR' },
    'gasometria-arterial': { valores: { ph: 7.24, pco2: 38, po2: 60, hco3: 16, be: -10, sato2: 91, lactato: 4.2 }, status: 'A_VALIDAR' },
    eletrolitos: { valores: { na: 136, k: 4.6, cl: 106, cai: 1.1, mg: 1.9 }, status: 'A_VALIDAR' },
    hemocultura: { laudo: 'Parcial (48 h): crescimento de cocos Gram-positivos em cadeia (exemplo fictício).', status: 'A_VALIDAR' },
    'rx-torax': { laudo: 'Infiltrado reticulogranular difuso leve (exemplo fictício).', status: 'A_VALIDAR' },
  },
  diureseMlKgH: 0.8,
  condutasEsperadas: [
    conduta('o2', 'Oxigenoterapia (alvo de SpO₂ 91–95%)', 'secao', ['oxigenoterapia']),
    conduta('expansao', 'Expansão com SF 0,9% 10 mL/kg', 'medicacao', ['sf09'], { prazoMin: 30 }),
    conduta('hemocultura', 'Hemocultura ANTES do antibiótico', 'exame', ['hemocultura'], { antesDaMedicacao: 'ampicilina' }),
    conduta('ampicilina', 'Ampicilina na 1ª hora', 'medicacao', ['ampicilina'], { prazoMin: 60 }),
    conduta('gentamicina', 'Gentamicina na 1ª hora (seringa da BIC 12 mL)', 'medicacao', ['gentamicina'], { prazoMin: 60 }),
    conduta('exames', 'Hemograma e PCR', 'exame', ['hemograma', 'pcr']),
  ],
  pontosDeEnsino: ['Diluição e rediluição.', 'Fator da BIC de 12 mL.', 'Hemocultura antes do antibiótico.'],
};
