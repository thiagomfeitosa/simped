import { useEffect, useState } from 'react';
import { conferirValor } from '../calculos';
import { toleranciaDe } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { type Assunto, type Caderno, lerCadernoDeTexto, type Origem, registrarNoCaderno, tiposParaTreinoDirigido } from '../estudo/caderno';
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
import { CacaErros } from './CacaErros';
import { CadernoErros } from './CadernoErros';

const TODOS = Object.keys(TIPOS_DE_EXERCICIO) as TipoExercicio[];
const CHAVE = 'simped.treino-placar';
const CHAVE_CADERNO = 'simped.caderno';

function lerPlacar(): Placar {
  try {
    const texto = window.localStorage.getItem(CHAVE);
    const p = texto ? (JSON.parse(texto) as Placar) : null;
    return p && typeof p.tentativas === 'number' ? p : PLACAR_VAZIO;
  } catch {
    return PLACAR_VAZIO;
  }
}

function lerCaderno(): Caderno {
  try {
    return lerCadernoDeTexto(window.localStorage.getItem(CHAVE_CADERNO));
  } catch {
    return lerCadernoDeTexto(null);
  }
}

// cada sessão começa de um ponto diferente; o sorteio continua daí
const sorteio = criarSorteio(Date.now() % 1_000_000);

function novo(tipos: readonly TipoExercicio[]): Exercicio {
  const tipo = tipos[Math.floor(sorteio() * tipos.length)] ?? 'volume';
  return gerarExercicio(tipo, sorteio);
}

type Parte = 'contas' | 'caca' | 'caderno';

const PARTES: readonly { id: Parte; rotulo: string }[] = [
  { id: 'contas', rotulo: '🧮 Contas' },
  { id: 'caca', rotulo: '🔎 Caça-erros' },
  { id: 'caderno', rotulo: '📒 Caderno de erros' },
];

/** Aba Treino: contas sem fim, caça-erros e o caderno de erros (que lembra onde o aluno erra). */
export function TreinoContas() {
  const [parte, setParte] = useState<Parte>('contas');
  const [caderno, setCaderno] = useState<Caderno>(lerCaderno);
  const [dirigido, setDirigido] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE_CADERNO, JSON.stringify(caderno));
    } catch {
      // sem armazenamento: o caderno vale até fechar
    }
  }, [caderno]);

  const anotar = (assunto: Assunto, acertou: boolean, origem: Origem) => setCaderno((c) => registrarNoCaderno(c, assunto, acertou, origem, new Date()));

  return (
    <div className="pagina-simples treino">
      <header className="cabecalho">
        <h1>Treino</h1>
        <div className="alternar-documento" role="group" aria-label="Parte do treino">
          {PARTES.map((p) => (
            <button key={p.id} type="button" aria-pressed={parte === p.id} onClick={() => setParte(p.id)}>
              {p.rotulo}
            </button>
          ))}
        </div>
        <span className="subtitulo">Números inventados ou folhas dos roteiros: treina a matemática e a conferência da prescrição.</span>
      </header>
      {/* as três partes ficam abertas: trocar de parte não perde o exercício nem a folha */}
      <div hidden={parte !== 'contas'}>
        <Contas caderno={caderno} anotar={anotar} dirigido={dirigido} setDirigido={setDirigido} />
      </div>
      <div hidden={parte !== 'caca'}>
        <CacaErros anotar={anotar} />
      </div>
      <div hidden={parte !== 'caderno'}>
        <CadernoErros
          caderno={caderno}
          aoZerar={() => setCaderno(lerCadernoDeTexto(null))}
          aoTreinar={() => {
            setDirigido(true);
            setParte('contas');
          }}
          aoCacar={() => setParte('caca')}
        />
      </div>
    </div>
  );
}

interface PropsContas {
  caderno: Caderno;
  anotar: (assunto: Assunto, acertou: boolean, origem: Origem) => void;
  dirigido: boolean;
  setDirigido: (v: boolean) => void;
}

/** Contas sem fim, com números inventados (não são doses reais). */
function Contas({ caderno, anotar, dirigido, setDirigido }: PropsContas) {
  const { config } = useConfiguracoes();
  const [tipos, setTipos] = useState<TipoExercicio[]>(TODOS);
  const [exercicio, setExercicio] = useState<Exercicio>(() => novo(TODOS));
  const [resposta, setResposta] = useState('');
  const [resultado, setResultado] = useState<null | boolean>(null);
  const [placar, setPlacar] = useState<Placar>(lerPlacar);
  const tiposDirigidos = tiposParaTreinoDirigido(caderno, new Date());

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(placar));
    } catch {
      // sem armazenamento: o placar vale até fechar
    }
  }, [placar]);

  // ao ligar o treino dirigido, o próximo exercício já vem dos pontos fracos
  useEffect(() => {
    if (dirigido && tiposDirigidos && !tiposDirigidos.includes(exercicio.tipo)) {
      setExercicio(novo(tiposDirigidos));
      setResposta('');
      setResultado(null);
    }
    // só quando liga/desliga o modo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirigido]);

  function conferir() {
    const valor = lerNumero(resposta);
    if (valor === null || resultado !== null) return;
    const ok = conferirValor(valor, exercicio.resposta, toleranciaDe(config)).correto;
    setResultado(ok);
    setPlacar((p) => registrarTentativa(p, exercicio.tipo, ok));
    anotar(exercicio.tipo, ok, 'treino');
  }

  function proximo() {
    const lista = dirigido && tiposDirigidos ? tiposDirigidos : tipos.length > 0 ? tipos : TODOS;
    setExercicio(novo(lista));
    setResposta('');
    setResultado(null);
  }

  const pct = placar.tentativas > 0 ? Math.round((placar.acertos / placar.tentativas) * 100) : 0;

  return (
    <div className="cartoes">
      <section className="painel exercicio">
        <h2>{TIPOS_DE_EXERCICIO[exercicio.tipo]}</h2>
        {dirigido && <p className="selo selo-ok">🎯 treino dirigido: pontos fracos do caderno</p>}
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
        <label className="opcao-check treino-dirigido">
          <input type="checkbox" checked={dirigido} disabled={!tiposDirigidos} onChange={(e) => setDirigido(e.target.checked)} />
          🎯 Treino dirigido — só os pontos fracos do caderno
          {tiposDirigidos ? ` (${tiposDirigidos.map((t) => TIPOS_DE_EXERCICIO[t]).join(', ')})` : ' (o caderno ainda está vazio)'}
        </label>
        <fieldset disabled={dirigido} className="tipos-de-conta">
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
        </fieldset>
      </section>
    </div>
  );
}
