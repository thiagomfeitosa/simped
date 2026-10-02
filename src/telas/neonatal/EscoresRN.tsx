import { useState } from 'react';
import { ESCORES_RN } from '../../dados/neonatal/escores-a-validar';
import { somarEscore } from '../../neonatal/exame';

/** Apgar e Boletim de Silverman-Andersen: marcar cada item e ver a soma com a faixa. */
export function EscoresRN() {
  const [respostas, setRespostas] = useState<Record<string, Record<string, number>>>({});
  return (
    <div className="grade-duas escores-rn">
      {ESCORES_RN.map((e) => {
        const r = respostas[e.id] ?? {};
        const soma = somarEscore(e, r);
        return (
          <section key={e.id} className="painel" aria-label={e.nome}>
            <h2>{e.nome}</h2>
            <p className="nota">{e.quando}</p>
            <table className="tabela-escore">
              <tbody>
                {e.criterios.map((c) => (
                  <tr key={c.id}>
                    <th scope="row" title={c.comoExaminar}>
                      {c.nome}
                    </th>
                    {c.opcoes.map((o) => (
                      <td key={o.pontos}>
                        <button
                          type="button"
                          aria-pressed={r[c.id] === o.pontos}
                          aria-label={`${c.nome}: ${o.texto} (${o.pontos})`}
                          onClick={() => setRespostas((t) => ({ ...t, [e.id]: { ...(t[e.id] ?? {}), [c.id]: o.pontos } }))}
                        >
                          <b>{o.pontos}</b> {o.texto}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={`resultado-escore tom-${soma.faixa?.tom ?? 'normal'}`} role="status" aria-label={`Resultado ${e.nome}`}>
              <strong>{soma.pontos}</strong> {soma.completo ? `— ${soma.faixa?.texto ?? ''}` : '(marque todos os itens)'}
            </p>
            <button type="button" onClick={() => setRespostas((t) => ({ ...t, [e.id]: {} }))}>
              Limpar
            </button>
            <p className="nota">Fonte: {e.fonte.referencia}.</p>
          </section>
        );
      })}
    </div>
  );
}
