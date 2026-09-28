import { useEffect, useState } from 'react';
import type { CenaPaciente as TipoCenaPaciente } from '../../../dados/roteiros/tipos';
import { fmt } from '../../../logica/formatacao';
import { useNumeroAnimado } from '../useNumeroAnimado';

/** O paciente "desce" na balança e o visor conta até o peso. */
export function CenaPaciente({ cena }: { cena: TipoCenaPaciente }) {
  const [naBalanca, setNaBalanca] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setNaBalanca(true), 500);
    return () => window.clearTimeout(t);
  }, []);
  const ehRn = cena.perfil === 'rn';
  const alvo = ehRn ? cena.pesoKg * 1000 : cena.pesoKg;
  const peso = useNumeroAnimado(naBalanca ? alvo : 0, 1200, 0);

  return (
    <div className="cena-paciente">
      <svg viewBox="0 0 320 300" className="paciente-svg" role="img" aria-label={`Paciente na balança: ${fmt(cena.pesoKg)} kg`}>
        {/* balança */}
        <rect className="balanca-base" x={40} y={224} width={240} height={50} rx={12} />
        <rect className="balanca-visor" x={110} y={236} width={100} height={28} rx={5} />
        <text className="balanca-numero" x={200} y={256} textAnchor="end">
          {ehRn ? fmt(Math.round(peso)) : fmt(peso, 1)} {ehRn ? 'g' : 'kg'}
        </text>
        <path className="balanca-prato" d="M52 222 Q160 238 268 222 L262 212 Q160 226 58 212 Z" />

        <g className={`paciente-figura ${naBalanca ? 'pousado' : ''}`}>{ehRn ? <Bebe /> : <Crianca />}</g>
      </svg>

      <dl className="paciente-dados">
        {cena.rotulos.map((r, i) => (
          <div key={r.rotulo} className="paciente-dado" style={{ animationDelay: `${300 + i * 220}ms` }}>
            <dt>{r.rotulo}</dt>
            <dd>{r.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Bebe() {
  return (
    <g>
      {/* manta */}
      <ellipse cx={170} cy={186} rx={78} ry={30} className="manta" />
      <path d="M108 176 Q160 150 240 180" className="manta-dobra" />
      {/* cabeça */}
      <circle cx={100} cy={172} r={30} className="pele" />
      <path d="M86 168 q5 4 10 0" className="traco" />
      <path d="M104 168 q5 4 10 0" className="traco" />
      <path d="M95 184 q5 4 10 0" className="traco" />
      <circle cx={84} cy={180} r={5} className="bochecha" />
      <circle cx={117} cy={180} r={5} className="bochecha" />
      <path d="M86 146 q14 -12 30 0" className="cabelo" />
      {/* pulseira de identificação */}
      <rect x={196} y={196} width={30} height={10} rx={3} className="pulseira" />
    </g>
  );
}

function Crianca() {
  return (
    <g>
      <rect x={132} y={126} width={60} height={84} rx={22} className="roupa" />
      <rect x={118} y={134} width={18} height={56} rx={9} className="pele" />
      <rect x={188} y={134} width={18} height={56} rx={9} className="pele" />
      <rect x={138} y={196} width={20} height={20} rx={8} className="pele" />
      <rect x={166} y={196} width={20} height={20} rx={8} className="pele" />
      <circle cx={162} cy={96} r={34} className="pele" />
      <path d="M130 86 q32 -34 64 0" className="cabelo-cheio" />
      <circle cx={150} cy={98} r={3.5} className="olho" />
      <circle cx={174} cy={98} r={3.5} className="olho" />
      <path d="M154 112 q8 5 16 0" className="traco" />
      <circle cx={142} cy={110} r={5} className="bochecha" />
      <circle cx={182} cy={110} r={5} className="bochecha" />
    </g>
  );
}
