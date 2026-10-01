/** Caso 5 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso05: CasoClinico = {
  id: 'caso05-toxoplasmose-congenita',
  titulo: 'Toxoplasmose congênita (ambulatório)',
  grupo: 'Neonatologia',
  cenario: 'Ambulatório de seguimento (use a "Receita de alta")',
  status: 'A_VALIDAR',
  inicio: '2026-10-01T09:00',
  paciente: {
    nome: 'Lívia',
    sexo: 'F',
    leito: 'Ambulatório',
    nascimento: '2026-09-24T09:00',
    // IG e peso ao nascer não constam no caso: valores fictícios (A VALIDAR)
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3150,
    pesoKg: 3.1,
    estaturaCm: 49,
    alergias: [],
    dadosMaternos: 'Soroconversão para toxoplasmose no 3º trimestre.',
  },
  queixa: 'Consulta de seguimento: toxoplasmose congênita.',
  historia: 'Mãe com soroconversão para toxoplasmose no 3º trimestre. RN com IgM positiva.',
  exameFisico: 'Bom estado geral. Exames: coriorretinite no fundo de olho; calcificações na USG transfontanela.',
  hipotese: 'Toxoplasmose congênita sintomática.',
  // B10: TEC, Glasgow, ritmo e padrão respiratório PROVISÓRIOS (A VALIDAR), escritos pelo assistente.
  sinaisIniciais: { fc: 140, fr: 42, spo2: 98, paSistolica: 70, paDiastolica: 40, temperaturaC: 36.7, glicemiaMgDl: 85, tecS: 2, glasgow: 15 },
  resultadosExames: {
    'sorologia-toxo': { laudo: 'IgM positiva no RN.', status: 'A_VALIDAR' },
    'fundo-de-olho': { laudo: 'Coriorretinite.', status: 'A_VALIDAR' },
    'usg-transfontanela': { laudo: 'Calcificações.', status: 'A_VALIDAR' },
    hemograma: { valores: { hb: 14, ht: 42, leucocitos: 9000, neutrofilos: 35, bastoes: 2, plaquetas: 260000 }, status: 'A_VALIDAR' },
  },
  diureseMlKgH: 2,
  condutasEsperadas: [
    conduta('sulfadiazina', 'Sulfadiazina 100 mg/kg/dia 12/12h', 'medicacao', ['sulfadiazina']),
    conduta('pirimetamina', 'Pirimetamina (esquema escalonado)', 'medicacao', ['pirimetamina']),
    conduta('folinico', 'Ácido folínico (não fólico)', 'medicacao', ['acido-folinico']),
    conduta('hemograma', 'Hemograma periódico', 'exame', ['hemograma']),
    conduta('sinan', 'Notificação SINAN: toxoplasmose congênita', 'secao', ['sinan']),
  ],
  pontosDeEnsino: ['Esquema escalonado da pirimetamina.', 'Ácido folínico, e não ácido fólico.'],
};
