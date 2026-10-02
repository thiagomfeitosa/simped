import { useMemo, useState } from 'react';
import { type MetodoMaturidade, METODOS_MATURIDADE } from '../../dados/neonatal/maturidade-a-validar';
import { criarSorteio } from '../../estudo/treino';
import { IlustracaoCriterio, temDesenho } from '../../ilustracoes/Criterios';
import type { TomDePele } from '../../neonatal/exame';
import { calcularMaturidade, classificarIgDetalhada, criteriosDoMetodo, type ResultadoMaturidade, type Sexo, textoIg } from '../../neonatal/maturidade';

export interface ResultadoGuardado {
  metodo: string;
  resultado: ResultadoMaturidade;
}

type Modo = 'livre' | 'treino';

/**
 * Capurro somático, Capurro somático-neurológico e New Ballard: o aluno escolhe a opção de cada
 * critério (com desenho) e vê a soma e a conta da idade gestacional.
 * No modo treino, o app sorteia um RN e mostra só o desenho de cada achado: o aluno reconhece a opção.
 */
export function Maturidade({ tom, aoCalcular }: { tom: TomDePele; aoCalcular?: (r: ResultadoGuardado | null) => void }) {
  const [metodoId, setMetodoId] = useState<MetodoMaturidade['id']>('capurro-somatico');
  const [sexo, setSexo] = useState<Sexo>('masculino');
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [modo, setModo] = useState<Modo>('livre');
  const [sorteado, setSorteado] = useState<Record<string, number> | null>(null);
  const [conferido, setConferido] = useState(false);
  const metodo = METODOS_MATURIDADE.find((m) => m.id === metodoId)!;
  const criterios = criteriosDoMetodo(metodo, sexo);
  const resultado = useMemo(() => calcularMaturidade(metodo, respostas, sexo), [metodo, respostas, sexo]);
  const certo = sorteado ? calcularMaturidade(metodo, sorteado, sexo) : null;

  const trocarMetodo = (id: MetodoMaturidade['id']) => {
    setMetodoId(id);
    setRespostas({});
    setSorteado(null);
    setConferido(false);
    aoCalcular?.(null);
  };

  const escolher = (criterioId: string, pontos: number) => {
    const novas = { ...respostas, [criterioId]: pontos };
    setRespostas(novas);
    const r = calcularMaturidade(metodo, novas, sexo);
    aoCalcular?.(r.completo ? { metodo: metodo.nome, resultado: r } : null);
  };

  const sortear = () => {
    const sorteio = criarSorteio(Date.now() % 1_000_000);
    // um RN coerente: maturidade parecida em todos os critérios (com pequena variação)
    const alvo = 0.15 + sorteio() * 0.85;
    const s: Record<string, number> = {};
    for (const c of criteriosDoMetodo(metodo, sexo)) {
      const i = Math.max(0, Math.min(c.opcoes.length - 1, Math.round(alvo * (c.opcoes.length - 1) + (sorteio() - 0.5) * 1.6)));
      s[c.id] = c.opcoes[i]!.pontos;
    }
    setSorteado(s);
    setRespostas({});
    setConferido(false);
    aoCalcular?.(null);
  };

  const classificacao = resultado.completo ? classificarIgDetalhada(resultado.igDias) : null;

  return (
    <div className="maturidade">
      <div className="painel barra-opcoes">
        <div className="subabas" role="group" aria-label="Método">
          {METODOS_MATURIDADE.map((m) => (
            <button key={m.id} type="button" aria-pressed={m.id === metodoId} onClick={() => trocarMetodo(m.id)}>
              {m.nome}
            </button>
          ))}
        </div>
        {metodoId === 'new-ballard' && (
          <label>
            Sexo{' '}
            <select aria-label="Sexo do RN" value={sexo} onChange={(e) => setSexo(e.target.value as Sexo)}>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </label>
        )}
        <div className="subabas" role="group" aria-label="Modo">
          <button
            type="button"
            aria-pressed={modo === 'livre'}
            onClick={() => {
              setModo('livre');
              setSorteado(null);
              setConferido(false);
            }}
          >
            ✍ Calcular
          </button>
          <button
            type="button"
            aria-pressed={modo === 'treino'}
            onClick={() => {
              setModo('treino');
              sortear();
            }}
          >
            🎲 Treino: reconhecer
          </button>
        </div>
        <p className="nota">{metodo.quando}</p>
      </div>

      {modo === 'treino' && sorteado && (
        <p className="nota destaque-treino">
          Treino: cada cartão mostra o desenho do que foi encontrado neste RN. Marque a opção que corresponde e confira no fim.{' '}
          <button type="button" onClick={sortear}>
            🎲 Outro RN
          </button>
        </p>
      )}

      <div className="maturidade-grade">
        <div className="criterios">
          {criterios.map((c) => {
            const escolhida = respostas[c.id];
            const alvo = sorteado?.[c.id];
            const indiceAlvo = alvo === undefined ? -1 : c.opcoes.findIndex((o) => o.pontos === alvo);
            return (
              <section key={c.id} className="painel criterio" aria-label={c.nome}>
                <h3>
                  {c.nome} <span className="selo">{c.tipo === 'neurologico' ? 'neurológico' : 'físico'}</span>
                </h3>
                <p className="nota">{c.comoExaminar}</p>
                {modo === 'treino' && indiceAlvo >= 0 && (
                  <div className="achado-sorteado">
                    {temDesenho(c.id) ? (
                      <IlustracaoCriterio criterioId={c.id} indice={indiceAlvo} total={c.opcoes.length} tom={tom} />
                    ) : (
                      <p>
                        <strong>Achado:</strong> {c.opcoes[indiceAlvo]!.texto}
                      </p>
                    )}
                  </div>
                )}
                <div className="opcoes-criterio" role="radiogroup" aria-label={`Opções — ${c.nome}`}>
                  {c.opcoes.map((o, i) => {
                    const marcada = escolhida === o.pontos;
                    const situacao = conferido && alvo !== undefined ? (o.pontos === alvo ? 'certa' : marcada ? 'errada' : '') : '';
                    return (
                      <button key={o.pontos} type="button" role="radio" aria-checked={marcada} className={`opcao-criterio ${situacao}`} onClick={() => escolher(c.id, o.pontos)}>
                        {modo === 'livre' && temDesenho(c.id) && <IlustracaoCriterio criterioId={c.id} indice={i} total={c.opcoes.length} tom={tom} />}
                        <span className="opcao-texto">{o.texto}</span>
                        <span className="opcao-pontos">{o.pontos} pt</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <aside className="painel resultado-maturidade" aria-label="Resultado da idade gestacional" role="status">
          <h2>{metodo.nome}</h2>
          <p className="soma">
            <strong>{resultado.pontos}</strong> pontos
          </p>
          {resultado.completo ? (
            <>
              <p className="ig-grande">{textoIg(resultado.ig)}</p>
              <p className="conta">{resultado.conta}</p>
              {resultado.foraDaTabela && <p className="retorno-erro">Pontuação fora da tabela ({resultado.foraDaTabela === 'abaixo' ? 'menos de −10: abaixo de 20 semanas' : 'mais de 50: acima de 44 semanas'}).</p>}
              {classificacao && <p className={`selo-ig grupo-${classificacao.grupo}`}>{classificacao.nome}</p>}
            </>
          ) : (
            <p className="nota">Faltam: {resultado.faltam.join(', ')}.</p>
          )}
          {modo === 'treino' && sorteado && (
            <button type="button" className="botao-principal" onClick={() => setConferido(true)} disabled={!resultado.completo}>
              Conferir
            </button>
          )}
          {conferido && certo && (
            <div className={criterios.every((c) => respostas[c.id] === sorteado?.[c.id]) ? 'retorno-ok' : 'retorno-erro'}>
              <p>
                {criterios.filter((c) => respostas[c.id] === sorteado?.[c.id]).length} de {criterios.length} critérios certos.
              </p>
              <p>
                IG deste RN: <strong>{textoIg(certo.ig)}</strong> ({certo.pontos} pontos).
              </p>
            </div>
          )}
          <p className="nota fonte">Fonte: {metodo.fonte.referencia}. Tabela A VALIDAR.</p>
        </aside>
      </div>
    </div>
  );
}
