import { useMemo, useState } from 'react';
import { ACHADOS_RN, type AchadoRN, REGIOES_EXAME_RN, ZONAS_KRAMER } from '../../dados/neonatal/exame-rn-a-validar';
import { BebeCorpo } from '../../ilustracoes/BebeCorpo';
import { DetalheRN } from '../../ilustracoes/detalhes/DetalheRN';
import type { TomDePele } from '../../neonatal/exame';
import { SeloCategoria } from '../comum/Pecas';

type Filtro = 'todos' | 'variacao' | 'alterado' | 'urgente';

/** Desenho do achado: o de perto, se houver; senão o corpo inteiro com o achado. */
function DesenhoDoAchado({ a, tom }: { a: AchadoRN; tom: TomDePele }) {
  const t = a.tomSugerido ?? tom;
  if (a.detalhe) return <DetalheRN detalhe={a.detalhe} tom={t} />;
  if (a.corpo) return <BebeCorpo tom={t} ajuste={a.corpo} titulo={`RN com ${a.nome}`} />;
  return (
    <div className="sem-desenho" aria-hidden="true">
      <span>{REGIOES_EXAME_RN.find((r) => r.id === a.regiao)?.icone}</span>
      <small>descrição em texto</small>
    </div>
  );
}

/**
 * Atlas de achados do RN: cada achado com desenho (no tom de pele escolhido), o que se vê,
 * o que é, como diferenciar e a conduta. Inclui as zonas de Kramer interativas.
 */
export function AtlasRN({ tom }: { tom: TomDePele }) {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [regiao, setRegiao] = useState('todas');
  const [busca, setBusca] = useState('');
  const [zona, setZona] = useState<0 | 1 | 2 | 3 | 4 | 5>(3);
  const [tomDoAchado, setTomDoAchado] = useState<'sugerido' | 'escolhido'>('sugerido');

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return ACHADOS_RN.filter(
      (a) =>
        (filtro === 'todos' || (filtro === 'urgente' ? a.urgente : a.categoria === filtro)) &&
        (regiao === 'todas' || a.regiao === regiao) &&
        (!termo || `${a.nome} ${a.oQueSeVe} ${a.explicacao}`.toLowerCase().includes(termo)),
    );
  }, [filtro, regiao, busca]);

  return (
    <div className="atlas-rn">
      <div className="painel barra-opcoes">
        <label>
          Buscar <input type="search" aria-label="Buscar no atlas" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="ex.: icterícia" />
        </label>
        <label>
          Região{' '}
          <select aria-label="Região do corpo" value={regiao} onChange={(e) => setRegiao(e.target.value)}>
            <option value="todas">Todas</option>
            {REGIOES_EXAME_RN.filter((r) => ACHADOS_RN.some((a) => a.regiao === r.id)).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="subabas" role="group" aria-label="Tipo de achado">
          {(
            [
              ['todos', 'Todos'],
              ['variacao', 'Variações do normal'],
              ['alterado', 'Alterados'],
              ['urgente', 'Urgentes'],
            ] as const
          ).map(([id, rotulo]) => (
            <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>
              {rotulo}
            </button>
          ))}
        </div>
        <label>
          <input type="checkbox" checked={tomDoAchado === 'escolhido'} onChange={(e) => setTomDoAchado(e.target.checked ? 'escolhido' : 'sugerido')} /> Usar sempre o tom de pele escolhido
        </label>
      </div>

      <section className="painel kramer" aria-label="Icterícia: zonas de Kramer">
        <div>
          <h2>🟡 Icterícia — zonas de Kramer</h2>
          <p className="nota">A icterícia avança da cabeça para os pés. Mova a barra e veja até onde vai o amarelo. Na pele negra o amarelo da pele quase não aparece: olhe a esclera, as palmas e a mucosa — e meça.</p>
          <label className="campo">
            Zona: {zona === 0 ? 'sem icterícia' : zona}
            <input type="range" min={0} max={5} step={1} value={zona} aria-label="Zona de Kramer" onChange={(e) => setZona(Number(e.target.value) as typeof zona)} />
          </label>
          <table className="tabela-simples">
            <thead>
              <tr>
                <th>Zona</th>
                <th>Até onde</th>
                <th>BT aproximada</th>
              </tr>
            </thead>
            <tbody>
              {ZONAS_KRAMER.map((z) => (
                <tr key={z.zona} className={z.zona === zona ? 'linha-ativa' : ''}>
                  <td>{z.zona}</td>
                  <td>{z.onde}</td>
                  <td>{z.bilirrubinaAprox}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="nota">Valores aproximados, A VALIDAR. A inspeção não substitui a bilirrubina (transcutânea ou sérica) no nomograma por horas de vida.</p>
        </div>
        <div className="kramer-desenho">
          <BebeCorpo tom={tom} ajuste={zona ? { ictericiaZona: zona } : {}} zonasKramer titulo={`RN com icterícia até a zona ${zona} de Kramer`} />
        </div>
      </section>

      <p className="nota contagem">{lista.length} achado(s)</p>
      <div className="atlas-grade">
        {lista.map((a) => (
          <article key={a.id} className="painel cartao-atlas" aria-label={a.nome}>
            <div className="atlas-desenho">
              <DesenhoDoAchado a={a} tom={tomDoAchado === 'escolhido' ? tom : (a.tomSugerido ?? tom)} />
            </div>
            <h3>{a.nome}</h3>
            <p>
              <SeloCategoria categoria={a.categoria} {...(a.urgente && { urgente: true })} /> <span className="selo">{REGIOES_EXAME_RN.find((r) => r.id === a.regiao)?.nome}</span>
            </p>
            <p>
              <strong>O que se vê:</strong> {a.oQueSeVe}
            </p>
            <details>
              <summary>O que é, diferencial e conduta</summary>
              <p>{a.explicacao}</p>
              {a.diferencial && (
                <p>
                  <strong>Diferencial:</strong> {a.diferencial}
                </p>
              )}
              <p>
                <strong>Conduta:</strong> {a.conduta}
              </p>
              <p className="nota">A VALIDAR.</p>
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}
