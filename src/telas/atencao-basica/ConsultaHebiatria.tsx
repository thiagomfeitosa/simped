import { useState } from 'react';
import { classificarPaAdolescente } from '../../atencao-basica/quiz';
import { CONSULTAS_PUERICULTURA, HEEADSSS, PA_ADOLESCENTE, PUBERDADE, SIGILO_ADOLESCENTE, TANNER } from '../../dados/atencao-basica/puericultura-a-validar';
import { lerNumero } from '../../prescricao/comum';

/** Roteiro da consulta de puericultura por idade (o que verificar, orientar e suplementar). */
export function ConsultaPuericultura() {
  const [id, setId] = useState(CONSULTAS_PUERICULTURA[0]!.id);
  const [feitos, setFeitos] = useState<Set<string>>(new Set());
  const c = CONSULTAS_PUERICULTURA.find((x) => x.id === id)!;
  const item = (texto: string) => (
    <label key={texto} className="linha-check">
      <input
        type="checkbox"
        checked={feitos.has(`${id}:${texto}`)}
        onChange={() =>
          setFeitos((s) => {
            const n = new Set(s);
            const k = `${id}:${texto}`;
            if (n.has(k)) n.delete(k);
            else n.add(k);
            return n;
          })
        }
      />{' '}
      {texto}
    </label>
  );
  return (
    <div className="consulta-ab">
      <div className="painel barra-opcoes">
        <div className="subabas" role="group" aria-label="Consulta">
          {CONSULTAS_PUERICULTURA.map((x) => (
            <button key={x.id} type="button" aria-pressed={x.id === id} onClick={() => setId(x.id)}>
              {x.idade}
            </button>
          ))}
        </div>
        <p className="nota">Calendário mínimo do MS: 7 consultas no 1º ano, 2 no 2º ano e depois anuais (A VALIDAR).</p>
      </div>
      <div className="cartoes">
        <section className="painel" aria-label="Verificar">
          <h3>🔎 Verificar</h3>
          {c.verificar.map(item)}
        </section>
        <section className="painel" aria-label="Orientar">
          <h3>💬 Orientar</h3>
          {c.orientar.map(item)}
        </section>
        <section className="painel" aria-label="Suplementos">
          <h3>💊 Suplementos</h3>
          {c.suplementos.length ? c.suplementos.map(item) : <p className="nota">Nenhum de rotina nesta idade.</p>}
          <p className="nota">Doses na aba de receitas (ferro, vitamina D) — A VALIDAR.</p>
        </section>
      </div>
    </div>
  );
}

/** Consulta do adolescente: HEEADSSS, sigilo, Tanner (texto), puberdade e PA. */
export function Hebiatria() {
  const [notas, setNotas] = useState<Record<string, string>>({});
  const [pas, setPas] = useState('');
  const [pad, setPad] = useState('');
  const s = lerNumero(pas);
  const d = lerNumero(pad);
  return (
    <div className="grade-duas hebiatria">
      <section className="painel heeadsss" aria-label="Roteiro HEEADSSS">
        <h2>🧑 Entrevista HEEADSSS</h2>
        <p className="nota">Comece pelos temas leves (casa, escola) e vá para os sensíveis. Anote o que achar importante.</p>
        {HEEADSSS.map((h) => (
          <details key={h.tema} className="tema-heeadsss">
            <summary>
              <b className="letra">{h.letra}</b> {h.tema}
            </summary>
            <ul>
              {h.perguntas.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <textarea aria-label={`Anotações: ${h.tema}`} rows={2} value={notas[h.tema] ?? ''} onChange={(e) => setNotas((n) => ({ ...n, [h.tema]: e.target.value }))} />
          </details>
        ))}
      </section>
      <section className="painel" aria-label="Sigilo">
        <h2>🔒 Sigilo e confidencialidade</h2>
        <ul>
          {SIGILO_ADOLESCENTE.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <h2>🌱 Puberdade</h2>
        <ul>
          {PUBERDADE.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section className="painel" aria-label="Estadiamento de Tanner">
        <h2>📏 Estadiamento de Tanner</h2>
        <p className="nota">Descrição em texto (sem desenho, de propósito). Exame com acompanhante e consentimento.</p>
        <table className="tabela-simples">
          <thead>
            <tr>
              <th>Estágio</th>
              <th>Mamas (M)</th>
              <th>Pelos pubianos (P)</th>
              <th>Genitais (G)</th>
            </tr>
          </thead>
          <tbody>
            {TANNER.map((t) => (
              <tr key={t.estagio}>
                <td>{t.estagio}</td>
                <td>{t.mamas}</td>
                <td>{t.pelos}</td>
                <td>{t.genitais}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="painel" aria-label="Pressão arterial do adolescente">
        <h2>🩺 Pressão arterial (≥ 13 anos)</h2>
        <span className="linha-botoes">
          <label>
            PAS <input aria-label="PA sistólica" inputMode="numeric" size={4} value={pas} onChange={(e) => setPas(e.target.value)} />
          </label>
          <label>
            PAD <input aria-label="PA diastólica" inputMode="numeric" size={4} value={pad} onChange={(e) => setPad(e.target.value)} /> mmHg
          </label>
        </span>
        {s !== null && d !== null && (
          <p className="selo-ig" role="status" aria-label="Classificação da PA">
            {classificarPaAdolescente(s, d)}
          </p>
        )}
        <table className="tabela-simples">
          <tbody>
            {PA_ADOLESCENTE.map((x) => (
              <tr key={x.faixa}>
                <td>{x.faixa}</td>
                <td>{x.criterio}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="nota">AAP 2017 — A VALIDAR. Abaixo de 13 anos use as tabelas de percentil por sexo, idade e estatura.</p>
      </section>
    </div>
  );
}
