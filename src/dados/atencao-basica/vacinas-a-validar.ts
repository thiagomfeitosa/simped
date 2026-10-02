/**
 * Calendário de vacinação da criança e do adolescente — DADOS.
 *
 * ⚠️ TUDO "A VALIDAR": calendário do Programa Nacional de Imunizações (PNI/MS) como o
 * assistente se lembra da versão 2024–2025, SEM conferência. O calendário muda quase todo
 * ano (ex.: VIP no lugar da VOP, HPV em dose única, COVID-19, ACWY, dengue): o usuário confere
 * na versão vigente do MS e, se quiser, cadastra o calendário da SBP (mais amplo) à parte.
 */

import type { StatusValidacao } from '../medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';

export interface DoseVacina {
  id: string;
  /** Vacina (ex.: 'Pentavalente'). */
  vacina: string;
  /** Doses da mesma vacina formam uma série: só a próxima não tomada pode ser aplicada. */
  serie: string;
  dose: string;
  /** Idade recomendada, em meses (0 = ao nascer). */
  idadeMeses: number;
  /** Até quando pode ser aplicada (meses). Passou: não aplicar mais (ex.: rotavírus). */
  idadeMaximaMeses?: number;
  protege: string;
  via: 'IM' | 'SC' | 'ID' | 'VO';
  observacao?: string;
  status: StatusValidacao;
}

export const FONTE_CALENDARIO = 'Calendário Nacional de Vacinação — PNI/Ministério da Saúde (versão 2024–2025, lembrada pelo assistente) — A VALIDAR';

export const CALENDARIO_PNI: readonly DoseVacina[] = [
  { id: 'bcg', vacina: 'BCG', serie: 'bcg', dose: 'dose única', idadeMeses: 0, protege: 'formas graves de tuberculose (miliar e meníngea)', via: 'ID', observacao: 'De preferência na maternidade; RN ≥ 2 kg.', status: AV },
  { id: 'hepb-0', vacina: 'Hepatite B', serie: 'hepb', dose: 'dose ao nascer', idadeMeses: 0, idadeMaximaMeses: 1, protege: 'hepatite B (transmissão vertical)', via: 'IM', observacao: 'Nas primeiras 24 h (até 30 dias de vida).', status: AV },
  { id: 'penta-1', vacina: 'Pentavalente (DTP + Hib + Hepatite B)', serie: 'penta', dose: '1ª dose', idadeMeses: 2, protege: 'difteria, tétano, coqueluche, Haemophilus b, hepatite B', via: 'IM', status: AV },
  { id: 'vip-1', vacina: 'VIP (poliomielite inativada)', serie: 'vip', dose: '1ª dose', idadeMeses: 2, protege: 'poliomielite', via: 'IM', status: AV },
  { id: 'pneumo-1', vacina: 'Pneumocócica 10-valente', serie: 'pneumo', dose: '1ª dose', idadeMeses: 2, protege: 'pneumonia, otite, meningite pneumocócicas', via: 'IM', status: AV },
  { id: 'rota-1', vacina: 'Rotavírus humano', serie: 'rota', dose: '1ª dose', idadeMeses: 2, idadeMaximaMeses: 3.5, protege: 'diarreia grave por rotavírus', via: 'VO', observacao: '1ª dose até 3 meses e 15 dias.', status: AV },
  { id: 'menc-1', vacina: 'Meningocócica C', serie: 'menc', dose: '1ª dose', idadeMeses: 3, protege: 'meningite e doença meningocócica C', via: 'IM', status: AV },
  { id: 'penta-2', vacina: 'Pentavalente (DTP + Hib + Hepatite B)', serie: 'penta', dose: '2ª dose', idadeMeses: 4, protege: 'difteria, tétano, coqueluche, Haemophilus b, hepatite B', via: 'IM', status: AV },
  { id: 'vip-2', vacina: 'VIP (poliomielite inativada)', serie: 'vip', dose: '2ª dose', idadeMeses: 4, protege: 'poliomielite', via: 'IM', status: AV },
  { id: 'pneumo-2', vacina: 'Pneumocócica 10-valente', serie: 'pneumo', dose: '2ª dose', idadeMeses: 4, protege: 'pneumonia, otite, meningite pneumocócicas', via: 'IM', status: AV },
  { id: 'rota-2', vacina: 'Rotavírus humano', serie: 'rota', dose: '2ª dose', idadeMeses: 4, idadeMaximaMeses: 8, protege: 'diarreia grave por rotavírus', via: 'VO', observacao: '2ª dose até 7 meses e 29 dias.', status: AV },
  { id: 'menc-2', vacina: 'Meningocócica C', serie: 'menc', dose: '2ª dose', idadeMeses: 5, protege: 'meningite e doença meningocócica C', via: 'IM', status: AV },
  { id: 'penta-3', vacina: 'Pentavalente (DTP + Hib + Hepatite B)', serie: 'penta', dose: '3ª dose', idadeMeses: 6, protege: 'difteria, tétano, coqueluche, Haemophilus b, hepatite B', via: 'IM', status: AV },
  { id: 'vip-3', vacina: 'VIP (poliomielite inativada)', serie: 'vip', dose: '3ª dose', idadeMeses: 6, protege: 'poliomielite', via: 'IM', status: AV },
  { id: 'gripe', vacina: 'Influenza', serie: 'gripe', dose: 'anual (2 doses na 1ª vez)', idadeMeses: 6, idadeMaximaMeses: 72, protege: 'gripe', via: 'IM', observacao: 'Todo ano, na campanha, dos 6 meses aos 5 anos.', status: AV },
  { id: 'covid-1', vacina: 'COVID-19', serie: 'covid', dose: '1ª dose', idadeMeses: 6, protege: 'COVID-19 grave', via: 'IM', observacao: 'Esquema e idades conforme a vacina disponível (A VALIDAR).', status: AV },
  { id: 'fa-1', vacina: 'Febre amarela', serie: 'fa', dose: '1ª dose', idadeMeses: 9, protege: 'febre amarela', via: 'SC', status: AV },
  { id: 'scr-1', vacina: 'Tríplice viral (SCR)', serie: 'scr', dose: '1ª dose', idadeMeses: 12, protege: 'sarampo, caxumba, rubéola', via: 'SC', status: AV },
  { id: 'pneumo-r', vacina: 'Pneumocócica 10-valente', serie: 'pneumo', dose: 'reforço', idadeMeses: 12, protege: 'pneumonia, otite, meningite pneumocócicas', via: 'IM', status: AV },
  { id: 'menc-r', vacina: 'Meningocócica C (ou ACWY, conforme a atualização do PNI)', serie: 'menc', dose: 'reforço', idadeMeses: 12, protege: 'doença meningocócica', via: 'IM', status: AV },
  { id: 'dtp-r1', vacina: 'DTP (tríplice bacteriana)', serie: 'dtp', dose: '1º reforço', idadeMeses: 15, protege: 'difteria, tétano, coqueluche', via: 'IM', status: AV },
  { id: 'vip-r', vacina: 'VIP (poliomielite inativada)', serie: 'vip', dose: 'reforço', idadeMeses: 15, protege: 'poliomielite', via: 'IM', observacao: 'Substituiu a VOP (gotinha) no reforço (A VALIDAR).', status: AV },
  { id: 'hepa', vacina: 'Hepatite A', serie: 'hepa', dose: 'dose única', idadeMeses: 15, protege: 'hepatite A', via: 'IM', status: AV },
  { id: 'scrv', vacina: 'Tetraviral (SCR + varicela)', serie: 'scr', dose: '2ª dose de SCR + 1ª de varicela', idadeMeses: 15, protege: 'sarampo, caxumba, rubéola, varicela', via: 'SC', status: AV },
  { id: 'dtp-r2', vacina: 'DTP (tríplice bacteriana)', serie: 'dtp', dose: '2º reforço', idadeMeses: 48, protege: 'difteria, tétano, coqueluche', via: 'IM', status: AV },
  { id: 'varicela-2', vacina: 'Varicela', serie: 'scr', dose: '2ª dose', idadeMeses: 48, protege: 'varicela (catapora)', via: 'SC', status: AV },
  { id: 'fa-r', vacina: 'Febre amarela', serie: 'fa', dose: 'reforço', idadeMeses: 48, protege: 'febre amarela', via: 'SC', status: AV },
  { id: 'hpv', vacina: 'HPV quadrivalente', serie: 'hpv', dose: 'dose única', idadeMeses: 108, idadeMaximaMeses: 180, protege: 'câncer de colo do útero, ânus, orofaringe; verrugas genitais', via: 'IM', observacao: '9 a 14 anos, meninas e meninos (dose única desde 2024 — A VALIDAR).', status: AV },
  { id: 'acwy', vacina: 'Meningocócica ACWY', serie: 'acwy', dose: 'dose única/reforço', idadeMeses: 132, idadeMaximaMeses: 180, protege: 'doença meningocócica A, C, W e Y', via: 'IM', observacao: '11 a 14 anos.', status: AV },
  { id: 'dt', vacina: 'dT (dupla adulto)', serie: 'dt', dose: 'reforço a cada 10 anos', idadeMeses: 168, protege: 'difteria e tétano', via: 'IM', observacao: 'A partir de 14 anos, 10 anos depois do último reforço.', status: AV },
];
