/** Caso 13 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, respiracao, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

const glicoseEV = [muda('glicemiaMgDl', 110, 2, 5), muda('fc', 105, 5, 10)];

export const caso13: CasoClinico = {
  id: 'caso13-hipoglicemia-sem-acesso',
  titulo: 'Hipoglicemia grave sem acesso venoso',
  grupo: 'Emergência',
  cenario: 'Pronto-socorro',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Clara',
    sexo: 'F',
    leito: 'PS-03',
    nascimento: '2017-01-20T06:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3200,
    pesoKg: 30,
    estaturaCm: 133,
    alergias: [],
    condicoesDeBase: ['Diabetes tipo 1 em uso de insulina'],
  },
  queixa: 'Aplicou insulina e não almoçou; chegou convulsionando.',
  historia: 'Diabetes tipo 1 em uso de insulina; aplicou e não almoçou.',
  exameFisico: 'Convulsão. Sem acesso venoso após 2 tentativas.',
  hipotese: 'Hipoglicemia grave.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  estadoInicial: { padraoRespiratorio: 'taquipneia' },
  sinaisIniciais: { fc: 120, fr: 24, spo2: 95, paSistolica: 100, paDiastolica: 62, temperaturaC: 36.6, glicemiaMgDl: 32, tecS: 2, glasgow: 8 },
  evolucaoNatural: [muda('glicemiaMgDl', 25, 0, 60)],
  respostas: [
    resposta('glucagon', [muda('glicemiaMgDl', 70, 5, 10), muda('glasgow', 14, 10, 20)], 'A convulsão para quando a glicemia sobe.', { mudancasDeEstado: [respiracao('normal', 15)] }),
    resposta('sg10', [...glicoseEV, muda('glasgow', 14, 5, 15)], undefined, { mudancasDeEstado: [respiracao('normal', 10)] }),
    resposta('g25', [...glicoseEV, muda('glasgow', 14, 5, 15)], undefined, { mudancasDeEstado: [respiracao('normal', 10)] }),
    resposta('soro', [muda('glicemiaMgDl', 120, 30, 60)]),
  ],
  diureseMlKgH: 1.2,
  condutasEsperadas: [
    conduta('glucagon', 'Glucagon IM (≥ 25 kg: 1 mg)', 'medicacao', ['glucagon'], { prazoMin: 10 }),
    conduta('glicose', 'Glicose EV quando houver acesso', 'medicacao', ['sg10', 'g25']),
    conduta('soro', 'Soro com SG 10% depois', 'soro', []),
  ],
  pontosDeEnsino: ['Alternativa quando não há acesso.', 'Conversão entre g/kg e mL/kg pela concentração.'],
};
