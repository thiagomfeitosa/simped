/** Caso 7 de docs/fase-0/casos-clinicos.md. TUDO A VALIDAR. */
import { conduta, INICIO_PADRAO, muda, resposta } from '../ajuda';
import type { CasoClinico } from '../tipos';

export const caso07: CasoClinico = {
  id: 'caso07-crupe',
  titulo: 'Laringite (crupe) moderada/grave',
  grupo: 'Emergência',
  cenario: 'Pronto-socorro',
  status: 'A_VALIDAR',
  inicio: INICIO_PADRAO,
  paciente: {
    nome: 'Sofia',
    sexo: 'F',
    leito: 'PS-05',
    nascimento: '2024-08-15T15:00',
    igNascer: { semanas: 39, dias: 0 },
    pesoNascerG: 3100,
    pesoKg: 12,
    estaturaCm: 86,
    alergias: [],
  },
  queixa: 'Tosse ladrante e rouquidão desde a noite anterior, piorando.',
  historia: 'Quadro viral, tosse ladrante e rouquidão desde a noite anterior.',
  exameFisico: 'Estridor em repouso, tiragem.',
  hipotese: 'Laringotraqueíte viral (crupe) moderada a grave.',
  sinaisIniciais: { fc: 150, fr: 44, spo2: 94, paSistolica: 95, paDiastolica: 60, temperaturaC: 37.8, glicemiaMgDl: 95 },
  evolucaoNatural: [muda('spo2', 92, 0, 120), muda('fr', 48, 0, 120)],
  respostas: [
    // adrenalina inalatória: melhora em 30 min e rebote depois de 2 h
    resposta('adrenalina', [muda('fr', 30, 5, 25), muda('fc', 165, 2, 10), muda('fr', 40, 120, 30)], 'Rebote após 2 h se não houver corticoide.'),
    resposta('dexametasona', [muda('fr', 30, 60, 120), muda('spo2', 97, 60, 120)]),
  ],
  diureseMlKgH: 1.5,
  condutasEsperadas: [
    conduta('dexametasona', 'Dexametasona 0,6 mg/kg (dose única)', 'medicacao', ['dexametasona'], { prazoMin: 30 }),
    conduta('adrenalina', 'Adrenalina inalatória (máx 5 mL)', 'medicacao', ['adrenalina'], { prazoMin: 30 }),
    conduta('observacao', 'Observar 2–4 h depois da adrenalina', 'secao', ['cuidados']),
  ],
  pontosDeEnsino: ['Dose máxima da adrenalina inalatória.', 'Tempo de observação (rebote).'],
};
