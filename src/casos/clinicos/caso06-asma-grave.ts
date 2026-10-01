/** Caso 6 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, respiracao, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

const melhoraBeta2 = [muda('spo2', 93, 5, 20), muda('fr', 32, 5, 30), muda('fc', 150, 2, 10)];
const corticoide = [muda('fr', 28, 60, 120), muda('spo2', 95, 60, 120)];

export const caso06: CasoClinico = {
  id: 'caso06-asma-grave',
  titulo: 'Crise de asma grave',
  grupo: 'Emergência',
  cenario: 'Pronto-socorro',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Lucas',
    sexo: 'M',
    leito: 'PS-02',
    nascimento: '2019-05-10T10:00',
    // IG, peso ao nascer e estatura não constam no caso: fictícios (A VALIDAR)
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3300,
    pesoKg: 22,
    estaturaCm: 122,
    alergias: [],
    condicoesDeBase: ['Asma sem controle, sem medicação de manutenção'],
  },
  queixa: 'Tosse e chiado há 2 dias, piorando.',
  historia: 'Asma sem controle, sem medicação de manutenção.',
  exameFisico: 'Fala frases curtas, tiragem, sibilos difusos.',
  hipotese: 'Crise de asma grave.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  estadoInicial: { padraoRespiratorio: 'desconforto' },
  sinaisIniciais: { fc: 140, fr: 40, spo2: 89, paSistolica: 105, paDiastolica: 65, temperaturaC: 37.2, glicemiaMgDl: 110, tecS: 2, glasgow: 15 },
  evolucaoNatural: [muda('spo2', 86, 0, 90), muda('fr', 46, 0, 90)],
  respostas: [
    resposta('salbutamol', melhoraBeta2, undefined, { mudancasDeEstado: [respiracao('taquipneia', 20)] }),
    resposta('fenoterol', melhoraBeta2, undefined, { mudancasDeEstado: [respiracao('taquipneia', 20)] }),
    resposta('ipratropio', [muda('spo2', 94, 10, 30)]),
    resposta('prednisolona', corticoide),
    resposta('metilprednisolona', corticoide),
    resposta('hidrocortisona', corticoide),
  ],
  resultadosExames: {
    'gasometria-venosa': { valores: { ph: 7.31, pco2: 48, hco3: 23, be: -2, lactato: 2.1 }, status: 'A_VALIDAR' },
    eletrolitos: { valores: { na: 139, k: 3.4, cl: 104, cai: 1.2, mg: 2 }, status: 'A_VALIDAR' },
  },
  diureseMlKgH: 1.2,
  condutasEsperadas: [
    conduta('o2', 'O₂ para SpO₂ ≥ 94%', 'secao', ['oxigenoterapia']),
    conduta('beta2', 'Beta-2 inalatório (salbutamol ou fenoterol) 20/20 min', 'medicacao', ['salbutamol', 'fenoterol'], { prazoMin: 20 }),
    conduta('ipratropio', 'Ipratrópio junto com o beta-2', 'medicacao', ['ipratropio'], { prazoMin: 60 }),
    conduta('corticoide', 'Corticoide sistêmico na 1ª hora', 'medicacao', ['prednisolona', 'prednisona', 'metilprednisolona', 'hidrocortisona'], { prazoMin: 60 }),
  ],
  pontosDeEnsino: ['Jatos por peso e dose máxima.', 'Salmeterol não é resgate (alta: sempre com corticoide inalatório).'],
};
