/** Caso 12 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, resposta, ritmo } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso12: CasoClinico = {
  id: 'caso12-pcr-fv',
  titulo: 'PCR em fibrilação ventricular',
  grupo: 'Emergência',
  cenario: 'Sala de emergência (SAMU em RCP)',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Igor',
    sexo: 'M',
    leito: 'SE-03',
    nascimento: '2018-02-14T09:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3300,
    pesoKg: 25,
    estaturaCm: 128,
    alergias: [],
  },
  queixa: 'Caiu de repente na aula de educação física.',
  historia: 'Trazido pelo SAMU em RCP.',
  exameFisico:
    'Sem pulso. Monitor: FIBRILAÇÃO VENTRICULAR. Desfibrilação 2 J/kg → 4 J/kg.',
  hipotese: 'PCR em ritmo chocável.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  estadoInicial: { ritmo: 'fv', padraoRespiratorio: 'assistida' },
  evolucaoDoEstado: [ritmo('assistolia', 30)],
  sinaisIniciais: { fc: 0, fr: 0, spo2: 0, paSistolica: 0, paDiastolica: 0, temperaturaC: 36.5, glicemiaMgDl: 110, tecS: 6, glasgow: 3 },
  respostas: [
    resposta('adrenalina', []),
    resposta('amiodarona', [muda('fc', 120, 2, 1), muda('paSistolica', 90, 2, 3), muda('paDiastolica', 50, 2, 3), muda('spo2', 95, 3, 3), muda('fr', 20, 3, 3), muda('tecS', 3, 2, 5), muda('glasgow', 6, 5, 30)], 'Com choques e adrenalina: retorno da circulação após o 3º–4º ciclo (simplificado).', { mudancasDeEstado: [ritmo('sinusal', 2)] }),
  ],
  diureseMlKgH: 0.5,
  condutasEsperadas: [
    conduta('adrenalina', 'Adrenalina 0,01 mg/kg da 1:10.000 a cada 3–5 min', 'medicacao', ['adrenalina'], { prazoMin: 5 }),
    conduta('amiodarona', 'Amiodarona 5 mg/kg após o 3º choque', 'medicacao', ['amiodarona'], { prazoMin: 15 }),
  ],
  pontosDeEnsino: ['Preparo da 1:10.000.', 'Energia por kg.', 'Ordem dos fármacos.'],
};
