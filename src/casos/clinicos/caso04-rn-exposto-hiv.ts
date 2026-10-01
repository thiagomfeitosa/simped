/** Caso 4 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso04: CasoClinico = {
  id: 'caso04-rn-exposto-hiv',
  titulo: 'RN exposto ao HIV (alto risco)',
  grupo: 'Neonatologia',
  cenario: 'Sala de parto → alojamento',
  status: 'A_VALIDAR',
  inicio: '2026-10-01T08:00',
  paciente: {
    nome: 'Pedro (RN)',
    sexo: 'M',
    leito: 'AC-03',
    nascimento: '2026-10-01T07:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3200,
    pesoKg: 3.2,
    estaturaCm: 50,
    alergias: [],
    dadosMaternos: 'Mãe vivendo com HIV, carga viral detectável no 3º trimestre, má adesão. Cesárea eletiva.',
  },
  queixa: 'RN de 1 h de vida, mãe vivendo com HIV.',
  historia: 'Mãe vivendo com HIV, carga viral detectável no 3º trimestre, má adesão ao tratamento. Cesárea eletiva.',
  exameFisico: 'Sem alterações.',
  hipotese: 'RN exposto ao HIV, alto risco de transmissão.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  sinaisIniciais: { fc: 138, fr: 46, spo2: 98, paSistolica: 66, paDiastolica: 38, temperaturaC: 36.7, glicemiaMgDl: 70, tecS: 2, glasgow: 15 },
  resultadosExames: {
    'carga-viral-hiv': { laudo: 'Resultado em 7 dias (exemplo).', status: 'A_VALIDAR' },
    hemograma: { valores: { hb: 17, ht: 50, leucocitos: 14000, neutrofilos: 55, bastoes: 3, plaquetas: 250000 }, status: 'A_VALIDAR' },
  },
  diureseMlKgH: 2,
  condutasEsperadas: [
    conduta('dieta', 'Dieta: fórmula infantil (aleitamento materno contraindicado)', 'secao', ['dieta']),
    conduta('azt', 'Zidovudina 4 mg/kg 12/12h (o quanto antes)', 'medicacao', ['zidovudina'], { prazoMin: 240 }),
    conduta('3tc', 'Lamivudina 2 mg/kg 12/12h', 'medicacao', ['lamivudina'], { prazoMin: 240 }),
    conduta('raltegravir', 'Raltegravir 1,5 mg/kg 1x/dia na 1ª semana', 'medicacao', ['raltegravir'], { prazoMin: 240 }),
    conduta('exames', 'Carga viral e hemograma', 'exame', ['carga-viral-hiv', 'hemograma']),
    conduta('sinan', 'Notificação SINAN: gestante HIV / criança exposta', 'secao', ['sinan']),
  ],
  pontosDeEnsino: ['Profilaxia em 3 drogas no alto risco.', 'Mudança de dose do raltegravir por semana de vida.'],
};
