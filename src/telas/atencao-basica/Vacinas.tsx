import { useMemo, useState } from 'react';
import { conferirDosesDeHoje, NOME_SITUACAO, situacaoDasDoses, sortearCarteira, textoIdadeMeses } from '../../atencao-basica/vacinas';
import { CALENDARIO_PNI, FONTE_CALENDARIO } from '../../dados/atencao-basica/vacinas-a-validar';
import { criarSorteio } from '../../estudo/treino';

const sorteio = criarSorteio(Date.now() % 1_000_000);
const IDADES = [...new Set(CALENDARIO_PNI.map((d) => d.idadeMeses))].sort((a, b) => a - b);

/**
 * Vacinas: calendário por idade, carteira interativa (marca o que já tomou → o que aplicar hoje)
 * e treino (criança sorteada: o aluno marca as vacinas de hoje e confere).
 */
export function Vacinas() {
  const [modo, setModo] = useState<'calendario' | 'carteira' | 'treino'>('calendario');
  const [idadeMeses, setIdadeMeses] = useState(4);
  const [tomadas, setTomadas] = useState<Set<string>>(() => new Set(['bcg', 'hepb-0', 'penta-1', 'vip-1', 'pneumo-1', 'rota-1', 'menc-1']));
  const [treino, setTreino] = useState(() => sortearCarteira(sorteio));
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [conferido, setConferido] = useState(false);

  const linhas = useMemo(() => situacaoDasDoses(idadeMeses, tomadas), [idadeMeses, tomadas]);
  const linhasTreino = useMemo(() => situacaoDasDoses(treino.idadeMeses, treino.tomadas), [treino]);
  const resultado = conferido ? conferirDosesDeHoje(treino.idadeMeses, treino.tomadas, marcadas) : null;
  const nome = (id: string) => {
    const d = CALENDARIO_PNI.find((x) => x.id === id)!;
    return `${d.vacina} (${d.dose})`;
  };
  const alternar = (conjunto: Set<string>, id: string) => {
    const novo = new Set(conjunto);
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    return novo;
  };

  return (
    <div className="vacinas-ab">
      <div className="painel barra-opcoes">
        <div className="subabas" role="group" aria-label="Parte das vacinas">
          <button type="button" aria-pressed={modo === 'calendario'} onClick={() => setModo('calendario')}>
            📅 Calendário
          </button>
          <button type="button" aria-pressed={modo === 'carteira'} onClick={() => setModo('carteira')}>
            📒 Carteira da criança
          </button>
          <button type="button" aria-pressed={modo === 'treino'} onClick={() => setModo('treino')}>
            🎲 Treino: o que aplicar hoje?
          </button>
        </div>
        <p className="nota">{FONTE_CALENDARIO}</p>
      </div>

      {modo === 'calendario' && (
        <div className="calendario-vacinal">
          {IDADES.map((idade) => (
            <section key={idade} className="painel idade-vacina" aria-label={`Vacinas: ${textoIdadeMeses(idade)}`}>
              <h3>💉 {textoIdadeMeses(idade)}</h3>
              <ul>
                {CALENDARIO_PNI.filter((d) => d.idadeMeses === idade).map((d) => (
                  <li key={d.id}>
                    <strong>{d.vacina}</strong> — {d.dose} <span className="selo">{d.via}</span>
                    <br />
                    <small>
                      Protege contra: {d.protege}.{d.observacao ? ` ${d.observacao}` : ''}
                    </small>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {modo === 'carteira' && (
        <section className="painel carteira" aria-label="Carteira de vacinação">
          <label className="campo">
            Idade da criança: <strong>{textoIdadeMeses(idadeMeses)}</strong>
            <input type="range" min={0} max={180} value={idadeMeses} aria-label="Idade em meses" onChange={(e) => setIdadeMeses(Number(e.target.value))} />
          </label>
          <table className="tabela-simples tabela-carteira">
            <thead>
              <tr>
                <th>Tomou?</th>
                <th>Vacina</th>
                <th>Idade</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.dose.id} className={`sit-vacina sit-${l.situacao}`}>
                  <td>
                    <input type="checkbox" aria-label={`Tomou ${nome(l.dose.id)}`} checked={tomadas.has(l.dose.id)} onChange={() => setTomadas((t) => alternar(t, l.dose.id))} />
                  </td>
                  <td>
                    {l.dose.vacina} — {l.dose.dose}
                  </td>
                  <td>{textoIdadeMeses(l.dose.idadeMeses)}</td>
                  <td>{NOME_SITUACAO[l.situacao]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="nota">Regra simples do app: numa série só a próxima dose pode ser dada; intervalos mínimos entre doses não são calculados. A VALIDAR.</p>
        </section>
      )}

      {modo === 'treino' && (
        <section className="painel" aria-label="Treino de vacinas">
          <h2>
            Criança de {textoIdadeMeses(treino.idadeMeses)} — quais vacinas aplicar hoje?
          </h2>
          <p className="nota">A carteira mostra o que já foi tomado. Marque o que você aplicaria hoje (influenza e COVID-19 ficam fora da conferência).</p>
          <table className="tabela-simples tabela-carteira">
            <thead>
              <tr>
                <th>Aplicar hoje</th>
                <th>Vacina</th>
                <th>Idade</th>
                <th>Carteira</th>
              </tr>
            </thead>
            <tbody>
              {linhasTreino
                .filter((l) => l.dose.idadeMeses <= treino.idadeMeses && l.dose.id !== 'gripe' && !l.dose.id.startsWith('covid'))
                .map((l) => (
                  <tr key={l.dose.id} className={conferido ? `sit-vacina sit-${l.situacao}` : ''}>
                    <td>
                      <input type="checkbox" aria-label={`Aplicar ${nome(l.dose.id)}`} disabled={l.situacao === 'tomada'} checked={marcadas.has(l.dose.id)} onChange={() => setMarcadas((m) => alternar(m, l.dose.id))} />
                    </td>
                    <td>
                      {l.dose.vacina} — {l.dose.dose}
                    </td>
                    <td>{textoIdadeMeses(l.dose.idadeMeses)}</td>
                    <td>{l.situacao === 'tomada' ? '✔ tomada' : conferido ? NOME_SITUACAO[l.situacao] : '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="linha-botoes">
            <button type="button" className="botao-principal" onClick={() => setConferido(true)}>
              Conferir
            </button>
            <button
              type="button"
              onClick={() => {
                setTreino(sortearCarteira(sorteio));
                setMarcadas(new Set());
                setConferido(false);
              }}
            >
              🎲 Outra criança
            </button>
          </div>
          {resultado && (
            <div className={resultado.faltaram.length === 0 && resultado.aMais.length === 0 ? 'retorno-ok' : 'retorno-erro'} role="status" aria-label="Resultado do treino de vacinas">
              <p>✔ Certas: {resultado.certas.length ? resultado.certas.map(nome).join(', ') : 'nenhuma'}</p>
              {resultado.faltaram.length > 0 && <p>✘ Faltou aplicar: {resultado.faltaram.map(nome).join(', ')}</p>}
              {resultado.aMais.length > 0 && <p>✘ Não era para hoje: {resultado.aMais.map(nome).join(', ')}</p>}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
