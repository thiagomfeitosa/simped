/** Caso 16 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso16: CasoClinico = {
  id: 'caso16-crise-adrenal',
  titulo: 'Crise adrenal (hiperplasia adrenal congênita)',
  grupo: 'Emergência',
  cenario: 'Pronto-socorro',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Bruno',
    sexo: 'M',
    leito: 'PS-07',
    nascimento: '2021-09-09T04:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3250,
    pesoKg: 18,
    estaturaCm: 108,
    alergias: [],
    condicoesDeBase: ['Hiperplasia adrenal congênita em uso de hidrocortisona oral'],
  },
  queixa: 'Febre e vômitos há 1 dia; não conseguiu tomar os remédios.',
  historia: 'Hiperplasia adrenal congênita em uso de hidrocortisona oral.',
  exameFisico: 'Letárgico, desidratado. Na 124, K 6,2, glicemia 50.',
  hipotese: 'Crise adrenal.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  estadoInicial: { padraoRespiratorio: 'taquipneia' },
  sinaisIniciais: { fc: 150, fr: 30, spo2: 96, paSistolica: 70, paDiastolica: 40, temperaturaC: 38.5, glicemiaMgDl: 50, tecS: 4, glasgow: 13 },
  evolucaoNatural: [muda('paSistolica', 60, 0, 120), muda('glicemiaMgDl', 40, 0, 90)],
  respostas: [
    // só volume: melhora curta e volta a hipotensão
    resposta('sf09', [muda('paSistolica', 82, 0, 20), muda('paSistolica', 70, 90, 60), muda('tecS', 3, 0, 20)]),
    resposta('hidrocortisona', [muda('paSistolica', 95, 15, 90), muda('paDiastolica', 60, 15, 90), muda('fc', 120, 15, 90), muda('tecS', 2, 15, 90), muda('glasgow', 15, 15, 90)]),
    resposta('sg10', [muda('glicemiaMgDl', 90, 2, 10)]),
  ],
  resultadosExames: {
    eletrolitos: { valores: { na: 124, k: 6.2, cl: 95, cai: 1.1, mg: 2 }, status: 'A_VALIDAR' },
    glicemia: { valores: { glicose: 50 }, status: 'A_VALIDAR' },
    'gasometria-venosa': { valores: { ph: 7.28, pco2: 32, hco3: 15, be: -10, lactato: 2.4 }, status: 'A_VALIDAR' },
    ecg: { laudo: 'Ondas T apiculadas discretas (exemplo).', status: 'A_VALIDAR' },
  },
  diureseMlKgH: 0.5,
  condutasEsperadas: [
    conduta('hidrocortisona', 'Hidrocortisona EV em bolus (3–12 anos: 50 mg)', 'medicacao', ['hidrocortisona'], { prazoMin: 30 }),
    conduta('sf', 'SF 0,9% 20 mL/kg', 'medicacao', ['sf09'], { prazoMin: 30 }),
    conduta('glicose', 'Corrigir a hipoglicemia (SG 10%)', 'medicacao', ['sg10']),
    conduta('exames', 'Eletrólitos e glicemia', 'exame', ['eletrolitos', 'glicemia']),
  ],
  pontosDeEnsino: ['Reconhecer a crise adrenal.', 'Dose de estresse.', 'Superfície corporal.'],
};
