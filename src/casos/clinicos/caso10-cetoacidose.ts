/** Caso 10 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, respiracao, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso10: CasoClinico = {
  id: 'caso10-cetoacidose',
  titulo: 'Cetoacidose diabética (CAD)',
  grupo: 'Emergência',
  cenario: 'Sala de emergência',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Rafael',
    sexo: 'M',
    leito: 'SE-02',
    nascimento: '2014-04-12T20:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3400,
    pesoKg: 38,
    estaturaCm: 150,
    puberdadeIniciada: true,
    alergias: [],
  },
  queixa: 'Poliúria, polidipsia e emagrecimento há 3 semanas; vômitos hoje.',
  historia: 'Poliúria, polidipsia e emagrecimento há 3 semanas; vômitos hoje.',
  exameFisico: 'Desidratado (~10%), respiração de Kussmaul, hálito cetônico. Glasgow 15.',
  hipotese: 'Cetoacidose diabética grave (abertura de diabetes tipo 1).',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  estadoInicial: { padraoRespiratorio: 'kussmaul' },
  sinaisIniciais: { fc: 128, fr: 34, spo2: 98, paSistolica: 104, paDiastolica: 64, temperaturaC: 36.8, glicemiaMgDl: 480, tecS: 3, glasgow: 15 },
  evolucaoNatural: [muda('fc', 135, 0, 120)],
  respostas: [
    resposta('sf09', [muda('fc', 118, 0, 60), muda('tecS', 2, 0, 60)]),
    resposta('insulina-regular', [muda('glicemiaMgDl', 250, 60, 300), muda('fr', 26, 120, 300)], 'Glicemia não deve cair rápido demais (edema cerebral).', { mudancasDeEstado: [respiracao('taquipneia', 180), respiracao('normal', 360)] }),
    resposta('soro', [muda('fc', 110, 60, 240)]),
  ],
  resultadosExames: {
    glicemia: { valores: { glicose: 480 }, status: 'A_VALIDAR' },
    'gasometria-venosa': { valores: { ph: 7.05, pco2: 17, hco3: 6, be: -24, lactato: 1.8 }, status: 'A_VALIDAR' },
    eletrolitos: { valores: { na: 131, k: 5.2, cl: 100, cai: 1.15, mg: 1.9 }, status: 'A_VALIDAR' },
    cetonemia: { valores: { bhb: 6.5 }, status: 'A_VALIDAR' },
    'funcao-renal': { valores: { ureia: 48, creatinina: 0.9 }, status: 'A_VALIDAR' },
  },
  diureseMlKgH: 3,
  condutasEsperadas: [
    conduta('jejum', 'Dieta: jejum', 'secao', ['dieta']),
    conduta('sf', 'SF 0,9% 10–20 mL/kg em 1 h', 'medicacao', ['sf09'], { prazoMin: 60 }),
    conduta('insulina', 'Insulina regular contínua 0,05–0,1 UI/kg/h, SEM bolus', 'medicacao', ['insulina-regular']),
    conduta('potassio', 'KCl no soro', 'medicacao', ['kcl']),
    conduta('exames', 'Gasometria e eletrólitos seriados', 'exame', ['gasometria-venosa', 'eletrolitos']),
  ],
  pontosDeEnsino: ['Sódio corrigido = Na + 1,6 × (glicemia − 100) ÷ 100.', 'O potássio cai com a insulina.'],
};
