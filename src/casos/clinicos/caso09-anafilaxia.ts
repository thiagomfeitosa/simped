/** Caso 9 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso09: CasoClinico = {
  id: 'caso09-anafilaxia',
  titulo: 'Anafilaxia',
  grupo: 'Emergência',
  cenario: 'Pronto-socorro',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Beatriz',
    sexo: 'F',
    leito: 'PS-01',
    nascimento: '2012-03-03T12:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3200,
    pesoKg: 50,
    estaturaCm: 160,
    puberdadeIniciada: true,
    alergias: ['Camarão'],
  },
  queixa: 'Comeu camarão há 20 min: manchas no corpo, inchaço nos lábios e falta de ar.',
  historia: 'Comeu camarão há 20 min.',
  exameFisico: 'Urticária generalizada, edema de lábios, sibilância, tontura.',
  hipotese: 'Anafilaxia.',
  sinaisIniciais: { fc: 130, fr: 30, spo2: 92, paSistolica: 80, paDiastolica: 50, temperaturaC: 36.9, glicemiaMgDl: 100 },
  evolucaoNatural: [muda('paSistolica', 65, 0, 20), muda('paDiastolica', 40, 0, 20), muda('spo2', 86, 0, 20)],
  respostas: [
    resposta('adrenalina', [muda('paSistolica', 105, 2, 8), muda('paDiastolica', 65, 2, 8), muda('spo2', 96, 2, 8), muda('fc', 115, 2, 8), muda('fr', 22, 2, 8)]),
    resposta('sf09', [muda('paSistolica', 90, 0, 15)]),
    resposta('salbutamol', [muda('spo2', 94, 5, 15)]),
    resposta('metilprednisolona', []),
  ],
  diureseMlKgH: 1,
  condutasEsperadas: [
    conduta('adrenalina', 'Adrenalina IM 0,01 mg/kg (máx 0,5 mg) — PRIMEIRO', 'medicacao', ['adrenalina'], { prazoMin: 5 }),
    conduta('o2', 'O₂ e deitar com as pernas elevadas', 'secao', ['oxigenoterapia']),
    conduta('sf', 'SF 0,9% 20 mL/kg rápido', 'medicacao', ['sf09'], { prazoMin: 20 }),
    conduta('corticoide', 'Metilprednisolona (depois da adrenalina)', 'medicacao', ['metilprednisolona']),
  ],
  pontosDeEnsino: ['Adrenalina IM primeiro.', 'Diferença entre 1:1.000 e 1:10.000.'],
};
