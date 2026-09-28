/**
 * Pacientes de DEMONSTRAÇÃO, só para montar a tela.
 * Os casos clínicos de verdade (com evolução e sinais vitais) serão escritos
 * numa próxima tarefa e conferidos pelo usuário.
 */
export type FaixaEtaria = 'RN' | 'Criança' | 'Adolescente';

export interface Paciente {
  id: string;
  nome: string;
  faixa: FaixaEtaria;
  idade: string;
  sexo: 'F' | 'M';
  pesoKg: number;
  /** Idade gestacional ao nascer (semanas), para RN. */
  idadeGestacionalSemanas?: number;
  leito: string;
  diagnosticos: string[];
}

export const PACIENTES_DEMO: Paciente[] = [
  {
    id: 'demo-rn',
    nome: 'RN de Maria (fictício)',
    faixa: 'RN',
    idade: '3 dias de vida',
    sexo: 'M',
    pesoKg: 3.2,
    idadeGestacionalSemanas: 39,
    leito: 'Alojamento conjunto — leito 4',
    diagnosticos: ['Caso de demonstração (sem conduta definida)'],
  },
];
