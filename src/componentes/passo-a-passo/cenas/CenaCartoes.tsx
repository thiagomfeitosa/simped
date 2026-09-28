import type { CenaCartoes as TipoCenaCartoes, CenaConclusao as TipoCenaConclusao } from '../../../dados/roteiros/tipos';
import { IconeSvg } from '../Icones';
import { useRitmo } from '../ritmo';

const SELO = { sim: '✓', nao: '✕', atencao: '!' } as const;

/** Cartões que entram um de cada vez (itens sem conta: O₂, dieta, exames, cuidados…). */
export function CenaCartoes({ cena }: { cena: TipoCenaCartoes }) {
  const fator = useRitmo();
  return (
    <div className="cena-cartoes">
      {cena.titulo && <p className="cartoes-titulo">{cena.titulo}</p>}
      <div className="cartoes-grade">
        {cena.cartoes.map((c, i) => {
          const estado = c.estado ?? 'sim';
          return (
            <div key={`${c.titulo}-${i}`} className={`cartao cartao-${estado}`} style={{ animationDelay: `${(150 + i * 300) * fator}ms` }}>
              <span className="cartao-selo" aria-hidden="true">
                {SELO[estado]}
              </span>
              <IconeSvg nome={c.icone} />
              <strong>{c.titulo}</strong>
              {c.texto && <span>{c.texto}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Revisão final: carimbo + lista que vai sendo "ticada". */
export function CenaConclusao({ cena }: { cena: TipoCenaConclusao }) {
  const fator = useRitmo();
  return (
    <div className="cena-conclusao">
      <div className="carimbo">Prescrição revisada</div>
      <ul className="checklist">
        {cena.itens.map((item, i) => (
          <li key={item} style={{ animationDelay: `${(700 + i * 420) * fator}ms` }}>
            <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M7 12.5l3.2 3.2L17 9" style={{ animationDelay: `${(900 + i * 420) * fator}ms` }} />
            </svg>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
