import type { ReactElement } from 'react';
import type { Icone } from '../../dados/roteiros/tipos';

/** Ícones simples desenhados à mão (SVG), sem depender de internet. */
const DESENHOS: Record<Icone, ReactElement> = {
  pulmao: (
    <>
      <path d="M24 8v14" />
      <path d="M24 20c-3 0-5 2-7 4" />
      <path d="M24 20c3 0 5 2 7 4" />
      <path d="M17 14c-6 2-9 12-9 20 0 4 3 6 6 5 4-1 6-4 6-9V18c0-3-1-4-3-4z" />
      <path d="M31 14c6 2 9 12 9 20 0 4-3 6-6 5-4-1-6-4-6-9V18c0-3 1-4 3-4z" />
    </>
  ),
  saturacao: (
    <>
      <rect x="6" y="14" width="22" height="20" rx="6" />
      <path d="M28 20h8a4 4 0 0 1 0 8h-8" />
      <path d="M9 26h4l2-5 3 9 2-4h5" />
    </>
  ),
  mamadeira: (
    <>
      <path d="M20 6h8l1 6h-10z" />
      <rect x="16" y="12" width="16" height="4" rx="1" />
      <path d="M17 16h14v22a4 4 0 0 1-4 4h-6a4 4 0 0 1-4-4z" />
      <path d="M21 24h6M21 30h6" />
    </>
  ),
  seio: (
    <>
      <path d="M24 8c6 8 11 14 11 20a11 11 0 0 1-22 0c0-6 5-12 11-20z" />
      <path d="M19 30a5 5 0 0 0 5 5" />
    </>
  ),
  jejum: (
    <>
      <circle cx="24" cy="24" r="14" />
      <circle cx="24" cy="24" r="8" />
      <path d="M12 12l24 24" />
    </>
  ),
  tubo: (
    <>
      <path d="M18 6h12" />
      <path d="M20 6v30a4 4 0 0 0 8 0V6" />
      <path d="M20 24h8" />
      <path d="M20 24v12a4 4 0 0 0 8 0V24" fill="currentColor" fillOpacity="0.25" />
    </>
  ),
  hemocultura: (
    <>
      <rect x="19" y="5" width="10" height="6" rx="1" />
      <path d="M17 11h14l2 6v21a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4V17z" />
      <path d="M15 28h18v10a4 4 0 0 1-4 4H19a4 4 0 0 1-4-4z" fill="currentColor" fillOpacity="0.25" />
    </>
  ),
  glicemia: (
    <>
      <rect x="8" y="16" width="20" height="26" rx="3" />
      <rect x="11" y="20" width="14" height="8" rx="1" />
      <path d="M36 6c3 5 5 8 5 11a5 5 0 0 1-10 0c0-3 2-6 5-11z" />
    </>
  ),
  termometro: (
    <>
      <path d="M20 8a4 4 0 0 1 8 0v20a8 8 0 1 1-8 0z" />
      <circle cx="24" cy="34" r="3" fill="currentColor" />
      <path d="M24 31V16" />
    </>
  ),
  coracao: (
    <>
      <path d="M24 40S8 30 8 18a8 8 0 0 1 16-2 8 8 0 0 1 16 2c0 12-16 22-16 22z" />
      <path d="M11 24h7l3-5 4 9 3-4h9" />
    </>
  ),
  relogio: (
    <>
      <circle cx="24" cy="26" r="15" />
      <path d="M24 17v9l6 4" />
      <path d="M20 6h8" />
    </>
  ),
  balanca: (
    <>
      <rect x="8" y="30" width="32" height="10" rx="3" />
      <path d="M12 30c0-8 5-12 12-12s12 4 12 12" />
      <path d="M24 30l4-7" />
    </>
  ),
  alerta: (
    <>
      <path d="M24 6L4 40h40z" />
      <path d="M24 18v11" />
      <circle cx="24" cy="34" r="1.5" fill="currentColor" />
    </>
  ),
  documento: (
    <>
      <path d="M12 6h17l9 9v27H12z" />
      <path d="M29 6v9h9" />
      <path d="M17 22h14M17 28h14M17 34h9" />
    </>
  ),
  berco: (
    <>
      <path d="M8 18v22M40 18v22M8 26h32M8 40h32" />
      <path d="M14 26v14M20 26v14M26 26v14M32 26v14" />
    </>
  ),
  check: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M16 24l6 6 11-12" />
    </>
  ),
  seringa: (
    <>
      <path d="M34 8l6 6" />
      <path d="M37 11l-6 6" />
      <path d="M31 11L13 29l6 6 18-18" />
      <path d="M13 29l-5 5 6 6 5-5" />
      <path d="M8 40l-3 3" />
      <path d="M21 25l3 3M25 21l3 3" />
    </>
  ),
  x: (
    <>
      <circle cx="24" cy="24" r="16" />
      <path d="M17 17l14 14M31 17L17 31" />
    </>
  ),
  lampada: (
    <>
      <rect x="6" y="6" width="36" height="9" rx="3" />
      <path d="M12 20l-3 6M20 20l-1 6M28 20l1 6M36 20l3 6" />
      <path d="M10 38c4-4 24-4 28 0v4H10z" />
    </>
  ),
  olho: (
    <>
      <path d="M4 24s7-12 20-12 20 12 20 12-7 12-20 12S4 24 4 24z" />
      <circle cx="24" cy="24" r="5" />
      <path d="M8 40L40 8" />
    </>
  ),
  gota: (
    <>
      <path d="M24 6c7 10 12 16 12 23a12 12 0 0 1-24 0c0-7 5-13 12-23z" />
      <path d="M18 30a6 6 0 0 0 6 6" />
    </>
  ),
  cerebro: (
    <>
      <path d="M24 10c-3-4-11-3-12 3-5 1-6 7-3 10-3 3-1 9 4 9 1 5 8 7 11 3z" />
      <path d="M24 10c3-4 11-3 12 3 5 1 6 7 3 10 3 3 1 9-4 9-1 5-8 7-11 3z" />
      <path d="M24 10v25" />
      <path d="M26 16l4 3-4 3 4 3" />
    </>
  ),
  ecg: (
    <>
      <rect x="4" y="10" width="40" height="28" rx="4" />
      <path d="M8 26h8l3-7 4 13 3-9 2 3h12" />
    </>
  ),
};

export function IconeSvg({ nome, tamanho = 44 }: { nome: Icone; tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {DESENHOS[nome]}
    </svg>
  );
}
