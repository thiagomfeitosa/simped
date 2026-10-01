import { useEffect, useState } from 'react';
import { conferirValor } from '../calculos';
import { toleranciaDe } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import {
  criarSorteio,
  type Exercicio,
  gerarExercicio,
  type Placar,
  PLACAR_VAZIO,
  registrarTentativa,
  TIPOS_DE_EXERCICIO,
  type TipoExercicio,
} from '../estudo/treino';
import { formatarNumero, lerNumero } from '../prescricao/comum';

const TODOS = Object.keys(TIPOS_DE_EXERCICIO) as TipoExercicio[];
const CHAVE = 'simped.treino-placar';

function lerPlacar(): Placar {
  try {
    const texto = window.localStorage.getItem(CHAVE);
    const p = texto ? (JSON.parse(texto) as Placar) : null;
    return p && typeof p.tentativas === 'number' ? p : PLACAR_VAZIO;
  } catch {
    return PLACAR_VAZIO;
  }
}

// cada sessão começa de um ponto diferente; o sorteio continua daí
const sorteio = criarSorteio(Date.now() % 1_000_000);

function novo(tipos: readonly TipoExercicio[]): Exercicio {
  const tipo = tipos[Math.floor(sorteio() * tipos.length)] ?? 'volume';
  return gerarExercicio(tipo, sorteio);
}

/** Treino de contas sem fim, com números inventados (não são doses reais). */
export function TreinoContas() {
  const { config } = useConfiguracoes();
  const [tipos, setTipos] = useState<TipoExercicio[]>(TODOS);
  const [exercicio, setExercicio] = useState<Exercicio>(() => novo(TODOS));
  const [resposta, setResposta] = useState('');
  const [resultado, setResultado] = useState<null | boolean>(null);
  const [placar, setPlacar] = useState<Placar>(lerPlacar);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(placar));
    } catch {
      // sem armazenamento: o placar vale até fechar
    }
  }, [placar]);

  function conferir() {
    const valor = lerNumero(resposta);
    if (valor === null || resultado !== null) return;
    const ok = conferirValor(valor, exercicio.resposta, toleranciaDe(config)).correto;
    setResultado(ok);
    setPlacar((p) => registrarTentativa(p, exercicio.tipo, ok));
  }

  function proximo() {
    setExercicio(novo(tipos.length > 0 ? tipos : TODOS));
    setResposta('');
    setResultado(null);
  }

  const pct = placar.tentativas > 0 ? Math.round((placar.acertos / placar.tentativas) * 100) : 0;

  return (
    <div className="pagina-simples">
      <header className="cabecalho">
        <h1>Treino de contas</h1>
        <span className="subtitulo">Números inventados, só para treinar a matemática da prescrição (não são doses reais).</span>
      </header>
      <div className="cartoes">
        <section className="painel exercicio">
          <h2>{TIPOS_DE_EXERCICIO[exercicio.tipo]}</h2>
          <p className="enunciado">{exercicio.enunciado}</p>
          <form
            className="linha-botoes"
            onSubmit={(e) => {
              e.preventDefault();
              if (resultado === null) conferir();
              else proximo();
            }}
          >
            <input
              aria-label="Sua resposta"
              inputMode="decimal"
              autoFocus
              size={8}
              value={resposta}
              disabled={resultado !== null}
              onChange={(e) => setResposta(e.target.value)}
            />
            <span>{exercicio.unidade}</span>
            {resultado === null ? (
              <button type="submit" className="administrar">
                Conferir
              </button>
            ) : (
              <button type="submit" className="administrar">
                Próximo ▶
              </button>
            )}
            <button type="button" onClick={proximo}>
              Pular
            </button>
          </form>
          {resultado === null ? (
            <details className="dica">
              <summary>Dica</summary>
              {exercicio.dica}
            </details>
          ) : (
            <ul className="conferencia">
              <li className={resultado ? 'sit-certo' : 'sit-errado'}>
                <span className="selo">{resultado ? '✔ certo' : '✘ errado'}</span>{' '}
                {config.modo === 'prova' ? (resultado ? 'Certo.' : 'Não confere.') : exercicio.conta}
              </li>
            </ul>
          )}
          <p className="nota">Margem de arredondamento: {formatarNumero(config.margemPct)}% (Configurações). Enter confere e passa para o próximo.</p>
        </section>

        <section className="painel">
          <h2>Placar</h2>
          <div className="relatorio-numeros">
            <div>
              <strong>{pct}%</strong>
              <span>
                {placar.acertos} de {placar.tentativas}
              </span>
            </div>
            <div>
              <strong>{placar.sequencia}</strong>
              <span>seguidos (recorde {placar.melhorSequencia})</span>
            </div>
          </div>
          <table className="tabela-resultado">
            <tbody>
              {TODOS.filter((t) => placar.porTipo[t]).map((t) => {
                const x = placar.porTipo[t]!;
                return (
                  <tr key={t} className={x.acertos / x.tentativas < 0.7 ? 'fora' : undefined}>
                    <td>{TIPOS_DE_EXERCICIO[t]}</td>
                    <td className="valor">
                      {x.acertos}/{x.tentativas}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="button" onClick={() => setPlacar(PLACAR_VAZIO)}>
            Zerar placar
          </button>
        </section>

        <section className="painel">
          <h2>Que contas treinar</h2>
          {TODOS.map((t) => (
            <label key={t} className="opcao-check">
              <input
                type="checkbox"
                checked={tipos.includes(t)}
                onChange={(e) => setTipos((l) => (e.target.checked ? [...l, t] : l.filter((x) => x !== t)))}
              />
              {TIPOS_DE_EXERCICIO[t]}
            </label>
          ))}
        </section>
      </div>
    </div>
  );
}
