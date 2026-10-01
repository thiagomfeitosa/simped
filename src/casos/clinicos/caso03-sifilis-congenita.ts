/** Caso 3 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso03: CasoClinico = {
  id: 'caso03-sifilis-congenita',
  titulo: 'Sífilis congênita com neurossífilis',
  grupo: 'Neonatologia',
  cenario: 'Alojamento conjunto',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Ana (RN)',
    sexo: 'F',
    leito: 'AC-07',
    nascimento: '2026-09-29T08:00',
    igNascer: { semanas: 38, dias: 0 },
    pesoNascerG: 3000,
    pesoKg: 2.9,
    estaturaCm: 48,
    alergias: [],
    dadosMaternos: 'VDRL 1:32 no parto; tratamento inadequado na gestação.',
  },
  queixa: 'RN assintomática de mãe com sífilis tratada de forma inadequada.',
  historia: 'Mãe com VDRL 1:32 no parto e tratamento inadequado na gestação. Exames do RN já colhidos.',
  exameFisico: 'Assintomática.',
  hipotese: 'Sífilis congênita com neurossífilis.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  sinaisIniciais: { fc: 140, fr: 44, spo2: 98, paSistolica: 68, paDiastolica: 40, temperaturaC: 36.8, glicemiaMgDl: 80, tecS: 2, glasgow: 15 },
  resultadosExames: {
    vdrl: { laudo: 'VDRL do RN 1:128 (maior que o materno).', status: 'A_VALIDAR' },
    liquor: { laudo: 'VDRL no líquor REAGENTE.', status: 'A_VALIDAR' },
    hemograma: { valores: { hb: 16, ht: 48, leucocitos: 12000, neutrofilos: 50, bastoes: 2, plaquetas: 220000 }, status: 'A_VALIDAR' },
  },
  diureseMlKgH: 2,
  condutasEsperadas: [
    conduta('penicilina', 'Penicilina G cristalina 50.000 UI/kg 12/12h (até 7 dias de vida)', 'medicacao', ['penicilina-cristalina']),
    conduta('exames', 'Hemograma e VDRL de seguimento', 'exame', ['hemograma', 'vdrl']),
    conduta('sinan', 'Notificação SINAN: sífilis congênita', 'secao', ['sinan']),
  ],
  pontosDeEnsino: ['Qual penicilina usar em cada situação.', 'Reconstituição de frasco em UI.', 'Notificação.'],
};
