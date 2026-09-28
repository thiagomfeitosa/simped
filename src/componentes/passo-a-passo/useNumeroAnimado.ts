import { useEffect, useRef, useState } from 'react';

/**
 * Faz um número "correr" suavemente até o valor novo (para frente ou para trás).
 * Ex.: visor da BIC indo de 0 a 24 mL/h.
 */
export function useNumeroAnimado(alvo: number, duracaoMs = 900, inicial?: number): number {
  const [valor, setValor] = useState(inicial ?? alvo);
  const valorRef = useRef(valor);
  valorRef.current = valor;

  useEffect(() => {
    const de = valorRef.current;
    if (de === alvo) return;
    if (prefereMenosMovimento()) {
      setValor(alvo);
      return;
    }
    let quadro = 0;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / duracaoMs);
      const suave = 1 - (1 - t) ** 3;
      setValor(de + (alvo - de) * suave);
      if (t < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, duracaoMs]);

  return valor;
}

export function prefereMenosMovimento(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}
