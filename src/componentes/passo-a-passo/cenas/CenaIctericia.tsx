import { useEffect, useState } from 'react';
import type { CenaIctericia as TipoCenaIctericia } from '../../../dados/roteiros/tipos';
import { fmt } from '../../../logica/formatacao';
import { useRitmo } from '../ritmo';
import { prefereMenosMovimento, useNumeroAnimado } from '../useNumeroAnimado';

/** Nomes das zonas de Kramer (a icterícia desce da cabeça para os pés). */
export const ZONAS_KRAMER = [
  'Cabeça e pescoço',
  'Tronco até o umbigo',
  'Do umbigo até os joelhos',
  'Braços e pernas (abaixo dos joelhos)',
  'Mãos e pés (palmas e plantas)',
];

const PONTO_MEDIDA = { glabela: { x: 170, y: 46 }, esterno: { x: 170, y: 124 } };

/**
 * RN deitado visto de frente. O amarelo "desce" zona por zona (Kramer);
 * opcionalmente mostra o bilirrubinômetro transcutâneo e a fototerapia ligada.
 */
export function CenaIctericia({ cena }: { cena: TipoCenaIctericia }) {
  const fator = useRitmo();
  const [acesas, setAcesas] = useState<number>(prefereMenosMovimento() ? cena.zona : 0);
  useEffect(() => {
    if (acesas >= cena.zona) return;
    const t = window.setTimeout(() => setAcesas((n) => n + 1), (acesas === 0 ? 700 : 900) * fator);
    return () => window.clearTimeout(t);
  }, [acesas, cena.zona, fator]);

  const terminou = acesas >= cena.zona;
  const medidor = cena.bilirrubinometro;
  const leitura = useNumeroAnimado(medidor && terminou ? medidor.valor : 0, 1400 * fator, 0);
  const amarelo = (zona: number) => ({ opacity: acesas >= zona ? 0.78 : 0 });

  return (
    <div className="cena-ictericia">
      <svg className="ictericia-svg" viewBox="0 0 340 370" role="img" aria-label={`Recém-nascido com icterícia até a zona ${cena.zona} de Kramer`}>
        <defs>
          <linearGradient id="luz-fototerapia" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#5aa9ff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#5aa9ff" stopOpacity="0" />
          </linearGradient>
          <clipPath id="clip-tronco-alto">
            <rect x={100} y={100} width={140} height={72} />
          </clipPath>
          <clipPath id="clip-tronco-baixo">
            <rect x={100} y={172} width={140} height={70} />
          </clipPath>
        </defs>

        {cena.fototerapia && (
          <g className="fototerapia surgir">
            <polygon className="fototerapia-luz" points="70,34 270,34 318,360 22,360" fill="url(#luz-fototerapia)" />
            <rect className="fototerapia-aparelho" x={64} y={6} width={212} height={28} rx={8} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <circle key={i} className="fototerapia-led" cx={90 + i * 32} cy={20} r={6} style={{ animationDelay: `${i * 120}ms` }} />
            ))}
          </g>
        )}

        {/* pele (base) */}
        <g className="rn-pele">
          <Corpo />
        </g>
        {/* amarelo por zona */}
        <g className="rn-amarelo">
          <g style={amarelo(1)}>
            <circle cx={170} cy={62} r={36} />
            <rect x={158} y={92} width={24} height={16} />
          </g>
          <g style={amarelo(2)} clipPath="url(#clip-tronco-alto)">
            <rect x={124} y={104} width={92} height={134} rx={32} />
          </g>
          <g style={amarelo(3)}>
            <g clipPath="url(#clip-tronco-baixo)">
              <rect x={124} y={104} width={92} height={134} rx={32} />
            </g>
            <path className="rn-membro" d="M150 226 L140 286" />
            <path className="rn-membro" d="M190 226 L200 286" />
          </g>
          <g style={amarelo(4)}>
            <path className="rn-membro" d="M130 118 L100 198" />
            <path className="rn-membro" d="M210 118 L240 198" />
            <path className="rn-membro" d="M140 286 L136 330" />
            <path className="rn-membro" d="M200 286 L204 330" />
          </g>
          <g style={amarelo(5)}>
            <circle cx={96} cy={210} r={12} />
            <circle cx={244} cy={210} r={12} />
            <ellipse cx={132} cy={342} rx={15} ry={9} />
            <ellipse cx={208} cy={342} rx={15} ry={9} />
          </g>
        </g>

        {/* cabelo, rosto, fralda e umbigo por cima */}
        <path className="rn-cabelo" d="M146 36 q24 -20 48 0" />
        <path className="rn-traco" d="M154 60 q6 5 12 0" />
        <path className="rn-traco" d="M174 60 q6 5 12 0" />
        <path className="rn-traco" d="M164 78 q6 4 12 0" />
        <circle className="rn-umbigo" cx={170} cy={172} r={3} />
        <path className="rn-fralda" d="M126 204 H214 Q214 238 190 244 L170 250 L150 244 Q126 238 126 204 Z" />
        {cena.fototerapia && <rect className="rn-protetor" x={146} y={50} width={48} height={16} rx={8} />}

        {/* números das zonas */}
        {[
          { z: 1, x: 214, y: 40 },
          { z: 2, x: 146, y: 150 },
          { z: 3, x: 170, y: 270 },
          { z: 4, x: 112, y: 150 },
          { z: 5, x: 208, y: 342 },
        ].map(({ z, x, y }) => (
          <g key={z} className={`rn-zona-numero ${acesas >= z ? 'acesa' : ''}`}>
            <circle cx={x} cy={y} r={10} />
            <text x={x} y={y + 4} textAnchor="middle">
              {z}
            </text>
          </g>
        ))}

        {medidor && (
          <g className="bilirrubinometro surgir">
            <path className="bilirrubinometro-cabo" d={`M${PONTO_MEDIDA[medidor.local].x + 4} ${PONTO_MEDIDA[medidor.local].y} Q268 ${PONTO_MEDIDA[medidor.local].y - 10} 276 118`} />
            <circle className="bilirrubinometro-ponta" cx={PONTO_MEDIDA[medidor.local].x} cy={PONTO_MEDIDA[medidor.local].y} r={5} />
            <rect className="bilirrubinometro-corpo" x={256} y={118} width={70} height={92} rx={12} />
            <rect className="bilirrubinometro-tela" x={264} y={128} width={54} height={36} rx={4} />
            <text className="bilirrubinometro-numero" x={314} y={153} textAnchor="end">
              {fmt(leitura, 1)}
            </text>
            <text className="bilirrubinometro-texto" x={291} y={180} textAnchor="middle">
              mg/dL
            </text>
            <text className="bilirrubinometro-texto" x={291} y={198} textAnchor="middle">
              BTc
            </text>
            <text className="bilirrubinometro-local" x={291} y={228} textAnchor="middle">
              no {medidor.local}
            </text>
          </g>
        )}
      </svg>

      {cena.tabelaZonas && (
        <ol className="kramer-tabela" aria-label="Zonas de Kramer">
          {ZONAS_KRAMER.map((nome, i) => (
            <li key={nome} className={acesas >= i + 1 ? 'acesa' : ''}>
              <span className="kramer-numero">{i + 1}</span>
              <span className="kramer-nome">{nome}</span>
              <span className="kramer-faixa">{cena.tabelaZonas?.[i]}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Silhueta do bebê (cor de pele). */
function Corpo() {
  return (
    <>
      <path className="rn-membro" d="M130 118 L100 198" />
      <path className="rn-membro" d="M210 118 L240 198" />
      <circle cx={96} cy={210} r={12} />
      <circle cx={244} cy={210} r={12} />
      <path className="rn-membro" d="M150 226 L140 286 L136 330" />
      <path className="rn-membro" d="M190 226 L200 286 L204 330" />
      <ellipse cx={132} cy={342} rx={15} ry={9} />
      <ellipse cx={208} cy={342} rx={15} ry={9} />
      <rect x={124} y={104} width={92} height={134} rx={32} />
      <rect x={158} y={92} width={24} height={16} />
      <circle cx={170} cy={62} r={36} />
    </>
  );
}
