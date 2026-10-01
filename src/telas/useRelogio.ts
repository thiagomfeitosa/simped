import { useEffect, useRef, useState } from 'react';

/** Velocidades do relógio do caso: minutos de caso por minuto real. */
export const VELOCIDADES = [
  { fator: 1, rotulo: '1× (tempo real)' },
  { fator: 10, rotulo: '10×' },
  { fator: 60, rotulo: '60× (1 min por segundo)' },
  { fator: 300, rotulo: '300× (5 min por segundo)' },
] as const;

const PASSO_MS = 250;

/**
 * Relógio do caso que anda sozinho. A cada minuto INTEIRO de caso, chama `aoPassar(minutos)`;
 * as frações ficam guardadas até completar o minuto (o motor do paciente anda de minuto em minuto).
 */
export function useRelogio(aoPassar: (minutos: number) => void) {
  const [rodando, setRodando] = useState(false);
  const [fator, setFator] = useState<number>(VELOCIDADES[2].fator);
  const acumulado = useRef(0);
  const callback = useRef(aoPassar);
  callback.current = aoPassar;

  useEffect(() => {
    if (!rodando) return;
    const id = window.setInterval(() => {
      acumulado.current += (fator * PASSO_MS) / 60_000;
      const inteiros = Math.floor(acumulado.current);
      if (inteiros > 0) {
        acumulado.current -= inteiros;
        callback.current(inteiros);
      }
    }, PASSO_MS);
    return () => window.clearInterval(id);
  }, [rodando, fator]);

  return { rodando, setRodando, fator, setFator };
}
