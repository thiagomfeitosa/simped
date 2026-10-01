/** Formata números no padrão brasileiro (vírgula decimal, ponto de milhar). */
export function fmt(valor: number, casasMaximas = 2): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: casasMaximas,
  });
}
