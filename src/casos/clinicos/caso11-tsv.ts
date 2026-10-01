/** Caso 11 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, respiracao, resposta, ritmo } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso11: CasoClinico = {
  id: 'caso11-tsv',
  titulo: 'Taquicardia supraventricular (TSV)',
  grupo: 'Emergência',
  cenario: 'Pronto-socorro',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Davi',
    sexo: 'M',
    leito: 'PS-04',
    nascimento: '2026-05-25T11:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3300,
    pesoKg: 6,
    estaturaCm: 62,
    alergias: [],
  },
  queixa: 'Irritado, recusando mamadas, pálido há algumas horas.',
  historia: 'Irritabilidade, recusa alimentar e palidez há algumas horas.',
  exameFisico: 'QRS estreito, sem onda P visível. TEC 3 s. Estável hemodinamicamente.',
  hipotese: 'TSV com estabilidade hemodinâmica.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  estadoInicial: { ritmo: 'tsv', padraoRespiratorio: 'taquipneia' },
  sinaisIniciais: { fc: 260, fr: 50, spo2: 96, paSistolica: 80, paDiastolica: 50, temperaturaC: 36.8, glicemiaMgDl: 90, tecS: 3, glasgow: 15 },
  evolucaoNatural: [muda('paSistolica', 68, 60, 240), muda('fr', 60, 60, 240), muda('tecS', 4, 60, 240)],
  respostas: [resposta('adenosina', [muda('fc', 140, 0, 1), muda('tecS', 2, 1, 10)], 'Bolus rápido com flush: breve pausa e ritmo sinusal.', { mudancasDeEstado: [ritmo('sinusal', 0), respiracao('normal', 15)] })],
  resultadosExames: { ecg: { laudo: 'Taquicardia regular de QRS estreito, FC 260, sem onda P visível (exemplo).', status: 'A_VALIDAR' } },
  diureseMlKgH: 1.5,
  condutasEsperadas: [
    conduta('adenosina', 'Adenosina 0,1 mg/kg em bolus rápido + flush', 'medicacao', ['adenosina'], { prazoMin: 15 }),
    conduta('ecg', 'ECG', 'exame', ['ecg']),
  ],
  pontosDeEnsino: ['Rediluição para medir volumes muito pequenos.', 'A adenosina age em segundos.'],
};
