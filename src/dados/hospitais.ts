/** Configurações por hospital. Cada hospital pode ter a sua regra de BIC. */
export interface ConfiguracaoHospital {
  id: string;
  nome: string;
  /** Volume final (mL) da regra do fator de correção da BIC. */
  volumeFinalBicMl: number;
}

export const HOSPITAIS: ConfiguracaoHospital[] = [
  // Regra informada pelo usuário (alojamento conjunto). Ver docs/fase-0/formulas.md, item 7.
  { id: 'santa-casa', nome: 'Santa Casa', volumeFinalBicMl: 12 },
];
