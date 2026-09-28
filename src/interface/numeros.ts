/** Aceita número digitado no jeito brasileiro ("0,3") ou com ponto ("0.3"). */
export function lerNumero(texto: string): number {
  const limpo = texto.trim().replace(',', '.');
  return limpo === '' ? NaN : Number(limpo);
}

/** Mostra número com vírgula e no máximo `casas` decimais. */
export function mostrarNumero(valor: number, casas = 2): string {
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: casas });
}
