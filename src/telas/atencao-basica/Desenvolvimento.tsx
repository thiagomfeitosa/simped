import { useState } from 'react';
import { classificarDesenvolvimento, faixaAnterior, faixaDaIdade, TEXTO_CLASSIFICACAO } from '../../atencao-basica/desenvolvimento';
import { FAIXAS_DNPM, FATORES_DE_RISCO_DNPM, FONTE_DNPM, type Marco, NOME_DOMINIO, REFLEXOS_PRIMITIVOS, SINAIS_DE_ALERTA_DNPM } from '../../dados/atencao-basica/desenvolvimento-a-validar';
import { DesenhoDnpm } from '../../ilustracoes/Desenvolvimento';
import type { TomDePele } from '../../neonatal/exame';
import { textoIdadeMeses } from '../../atencao-basica/vacinas';

function CartaoMarco({ marco, tom, presente, aoMarcar }: { marco: Marco; tom: TomDePele; presente?: boolean; aoMarcar?: () => void }) {
  return (
    <div className={`cartao-marco dominio-${marco.dominio}`}>
      {marco.desenho ? <DesenhoDnpm desenho={marco.desenho} tom={tom} /> : <div className="marco-sem-desenho" aria-hidden="true">{marco.dominio === 'social' ? '🤝' : marco.dominio === 'linguagem' ? '🗣️' : '✋'}</div>}
      <span className="selo">{NOME_DOMINIO[marco.dominio]}</span>
      <strong>{marco.texto}</strong>
      <small>{marco.comoTestar}</small>
      {aoMarcar && (
        <label className="marco-presente">
          <input type="checkbox" checked={!!presente} onChange={aoMarcar} /> Presente
        </label>
      )}
    </div>
  );
}

/**
 * Desenvolvimento neuropsicomotor: avaliação no formato da Caderneta (marcos da faixa e da faixa
 * anterior, fatores de risco → classificação e conduta), linha do tempo ilustrada, reflexos e alertas.
 */
export function Desenvolvimento({ tom }: { tom: TomDePele }) {
  const [modo, setModo] = useState<'avaliar' | 'linha'>('avaliar');
  const [idade, setIdade] = useState(7);
  const [presentes, setPresentes] = useState<Set<string>>(new Set());
  const [riscos, setRiscos] = useState<Set<string>>(new Set());
  const [pc, setPc] = useState(false);
  const faixa = faixaDaIdade(idade);
  const anterior = faixaAnterior(faixa);
  const r = classificarDesenvolvimento({ idadeMeses: idade, presentes, fatoresDeRisco: riscos.size, perimetroCefalicoAlterado: pc });
  const info = TEXTO_CLASSIFICACAO[r.classificacao];
  const alternar = (id: string) =>
    setPresentes((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="desenvolvimento-ab">
      <div className="painel barra-opcoes">
        <div className="subabas" role="group" aria-label="Parte do desenvolvimento">
          <button type="button" aria-pressed={modo === 'avaliar'} onClick={() => setModo('avaliar')}>
            🧸 Avaliar uma criança
          </button>
          <button type="button" aria-pressed={modo === 'linha'} onClick={() => setModo('linha')}>
            🗓️ Linha do tempo dos marcos
          </button>
        </div>
        <p className="nota">{FONTE_DNPM}</p>
      </div>

      {modo === 'avaliar' ? (
        <div className="avaliar-dnpm">
          <section className="painel" aria-label="Marcos da faixa">
            <label className="campo">
              Idade: <strong>{textoIdadeMeses(idade)}</strong> (faixa {faixa.rotulo})
              <input
                type="range"
                min={0}
                max={59}
                value={idade}
                aria-label="Idade da criança em meses"
                onChange={(e) => {
                  setIdade(Number(e.target.value));
                  setPresentes(new Set());
                }}
              />
            </label>
            <h3>Marcos da faixa {faixa.rotulo}</h3>
            <div className="grade-marcos">
              {faixa.marcos.map((m) => (
                <CartaoMarco key={m.id} marco={m} tom={tom} presente={presentes.has(m.id)} aoMarcar={() => alternar(m.id)} />
              ))}
            </div>
            {anterior && r.faltamDaFaixa.length > 0 && (
              <>
                <h3>Faltou marco: veja a faixa anterior ({anterior.rotulo})</h3>
                <div className="grade-marcos">
                  {anterior.marcos.map((m) => (
                    <CartaoMarco key={m.id} marco={m} tom={tom} presente={presentes.has(m.id)} aoMarcar={() => alternar(m.id)} />
                  ))}
                </div>
              </>
            )}
          </section>
          <section className="painel" aria-label="Classificação do desenvolvimento">
            <h3>Fatores de risco</h3>
            {FATORES_DE_RISCO_DNPM.map((f) => (
              <label key={f} className="linha-check">
                <input
                  type="checkbox"
                  checked={riscos.has(f)}
                  onChange={() =>
                    setRiscos((s) => {
                      const n = new Set(s);
                      if (n.has(f)) n.delete(f);
                      else n.add(f);
                      return n;
                    })
                  }
                />{' '}
                {f}
              </label>
            ))}
            <label className="linha-check">
              <input type="checkbox" checked={pc} onChange={() => setPc((v) => !v)} /> Perímetro cefálico abaixo de −2 ou acima de +2 escores z
            </label>
            <div className={`resultado-escore tom-${info.tom}`} role="status" aria-label="Resultado do desenvolvimento">
              <strong>{info.nome}</strong>
              <p>{info.conduta}</p>
              {r.faltamDaFaixa.length > 0 && <p>Faltam da faixa: {r.faltamDaFaixa.join('; ')}.</p>}
              {r.faltamDaAnterior.length > 0 && <p>Faltam da faixa anterior: {r.faltamDaAnterior.join('; ')}.</p>}
            </div>
            <p className="nota">Classificação no formato da Caderneta/AIDPI — A VALIDAR.</p>
          </section>
        </div>
      ) : (
        <div className="linha-marcos">
          {FAIXAS_DNPM.map((f) => (
            <section key={f.id} className="painel" aria-label={`Marcos ${f.rotulo}`}>
              <h3>{f.rotulo}</h3>
              <div className="grade-marcos">
                {f.marcos.map((m) => (
                  <CartaoMarco key={m.id} marco={m} tom={tom} />
                ))}
              </div>
            </section>
          ))}
          <div className="grade-duas sem-margem">
            <section className="painel" aria-label="Reflexos primitivos">
              <h3>⚡ Reflexos primitivos</h3>
              <table className="tabela-simples">
                <thead>
                  <tr>
                    <th>Reflexo</th>
                    <th>Como pesquisar</th>
                    <th>Até quando</th>
                    <th>Alerta</th>
                  </tr>
                </thead>
                <tbody>
                  {REFLEXOS_PRIMITIVOS.map((x) => (
                    <tr key={x.nome}>
                      <td>{x.nome}</td>
                      <td>{x.como}</td>
                      <td>{x.ateMeses}</td>
                      <td>{x.alerta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="painel" aria-label="Sinais de alerta">
              <h3>🚩 Sinais de alerta (encaminhar)</h3>
              <ul>
                {SINAIS_DE_ALERTA_DNPM.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
