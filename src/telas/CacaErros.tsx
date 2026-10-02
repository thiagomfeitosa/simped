import { useMemo, useState } from 'react';
import type { Assunto, Origem } from '../estudo/caderno';
import { ASSUNTO_DA_CATEGORIA } from '../estudo/caderno';
import {
  CATEGORIAS_ERRO,
  type CategoriaErro,
  conferirCaca,
  type ErroPlantado,
  type LinhaDaFolha,
  montarFolhaComErros,
  type ResultadoCaca,
  roteirosParaCacaErros,
} from '../estudo/cacaErros';
import { INFO_SECAO } from '../dados/secoes';

const CATEGORIAS = Object.keys(CATEGORIAS_ERRO) as CategoriaErro[];
const ROTEIROS_CACA = roteirosParaCacaErros();
const novaSemente = () => Math.floor(Math.random() * 1_000_000);

interface Props {
  anotar: (assunto: Assunto, acertou: boolean, origem: Origem) => void;
}

/**
 * Caça-erros: a folha de um colega (prescrição final de um roteiro) com 3 ou 4 erros de conta
 * ou de segurança. O aluno marca as linhas erradas (e o tipo do erro) e confere.
 */
export function CacaErros({ anotar }: Props) {
  const [roteiroId, setRoteiroId] = useState<string>('sortear');
  const [semente, setSemente] = useState(novaSemente);
  const [marcadas, setMarcadas] = useState<Record<string, CategoriaErro[]>>({});
  const [resultado, setResultado] = useState<ResultadoCaca | null>(null);

  const roteiro = useMemo(() => {
    if (roteiroId !== 'sortear') return ROTEIROS_CACA.find((r) => r.id === roteiroId) ?? ROTEIROS_CACA[0]!;
    return ROTEIROS_CACA[semente % ROTEIROS_CACA.length]!;
  }, [roteiroId, semente]);
  const folha = useMemo(() => montarFolhaComErros(roteiro, semente), [roteiro, semente]);

  const novaFolha = () => {
    setSemente(novaSemente());
    setMarcadas({});
    setResultado(null);
  };

  const conferir = () => {
    const r = conferirCaca(folha, marcadas);
    setResultado(r);
    for (const { erro } of r.encontrados) anotar(ASSUNTO_DA_CATEGORIA[erro.categoria], true, 'caca');
    for (const erro of r.perdidos) anotar(ASSUNTO_DA_CATEGORIA[erro.categoria], false, 'caca');
  };

  const alternarLinha = (id: string) =>
    setMarcadas((m) => {
      if (id in m) {
        const { [id]: _fora, ...resto } = m;
        return resto;
      }
      return { ...m, [id]: [] };
    });

  const alternarTipo = (id: string, tipo: CategoriaErro) =>
    setMarcadas((m) => ({ ...m, [id]: m[id]?.includes(tipo) ? m[id]!.filter((t) => t !== tipo) : [...(m[id] ?? []), tipo] }));

  // linhas agrupadas pela seção, na ordem da folha
  const grupos: { secao: LinhaDaFolha['secao']; linhas: LinhaDaFolha[] }[] = [];
  for (const l of folha.linhas) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.secao === l.secao) ultimo.linhas.push(l);
    else grupos.push({ secao: l.secao, linhas: [l] });
  }

  return (
    <div className="caca-erros">
      <section className="painel caca-instrucoes">
        <h2>🔎 Caça-erros</h2>
        <p>
          Um colega deixou esta folha pronta, mas errou <strong>{folha.erros.length}</strong> vezes. Todo erro dá para achar conferindo as
          contas da própria folha (peso da identificação, dose/kg, concentração, volume final, tempo) — ou com uma regra de segurança.
          Marque as linhas erradas com <strong>⚠ Tem erro</strong> e, se quiser, diga o tipo do erro. Depois clique em <strong>Conferir</strong>.
        </p>
        <div className="linha-botoes">
          <label>
            Folha:{' '}
            <select
              aria-label="Folha do caça-erros"
              value={roteiroId}
              onChange={(e) => {
                setRoteiroId(e.target.value);
                setMarcadas({});
                setResultado(null);
              }}
            >
              <option value="sortear">🎲 Sortear um caso</option>
              {ROTEIROS_CACA.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.titulo}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={novaFolha}>
            🎲 Outra folha (outros erros)
          </button>
        </div>
        <p className="nota">Doses e condutas dos roteiros: A VALIDAR. O erro é na conta ou na segurança, não na dose de referência.</p>
      </section>

      <section className="painel folha-caca" aria-label="Folha com erros">
        <h2 className="folha-titulo">Prescrição médica</h2>
        <p className="nota">
          Caso: {folha.titulo} — {folha.paciente}
        </p>
        {grupos.map((g) => {
          const info = INFO_SECAO[g.secao];
          return (
            <div key={g.secao} className="secao-caca">
              <h3>
                {info.numero}. {info.nome}
              </h3>
              <ul>
                {g.linhas.map((l) => (
                  <LinhaCaca
                    key={l.id}
                    linha={l}
                    marcavel={l.secao !== 'identificacao'}
                    tipos={marcadas[l.id]}
                    resultado={resultado}
                    errosDaLinha={folha.erros.filter((e) => e.linhaId === l.id)}
                    aoMarcar={() => alternarLinha(l.id)}
                    aoTipo={(t) => alternarTipo(l.id, t)}
                  />
                ))}
              </ul>
            </div>
          );
        })}
        <div className="linha-botoes caca-acoes">
          {resultado === null ? (
            <button type="button" className="botao-principal" onClick={conferir}>
              Conferir ({Object.keys(marcadas).length} linha(s) marcada(s))
            </button>
          ) : (
            <button type="button" className="botao-principal" onClick={novaFolha}>
              Próxima folha ▶
            </button>
          )}
        </div>
      </section>

      {resultado && (
        <section className="painel caca-resultado" aria-label="Resultado do caça-erros" role="status">
          <h2>Resultado</h2>
          <div className="relatorio-numeros">
            <div>
              <strong>{resultado.nota}</strong>
              <span>nota (0 a 100)</span>
            </div>
            <div>
              <strong>
                {resultado.encontrados.length}/{folha.erros.length}
              </strong>
              <span>erros achados</span>
            </div>
            <div>
              <strong>{resultado.falsosAlarmes.length}</strong>
              <span>falso(s) alarme(s)</span>
            </div>
          </div>
          <p className="nota">Cada erro achado (ou perdido) foi anotado no Caderno de erros, no assunto da conta.</p>
        </section>
      )}
    </div>
  );
}

interface PropsLinha {
  linha: LinhaDaFolha;
  marcavel: boolean;
  tipos: CategoriaErro[] | undefined;
  resultado: ResultadoCaca | null;
  errosDaLinha: ErroPlantado[];
  aoMarcar: () => void;
  aoTipo: (t: CategoriaErro) => void;
}

function LinhaCaca({ linha, marcavel, tipos, resultado, errosDaLinha, aoMarcar, aoTipo }: PropsLinha) {
  const marcada = tipos !== undefined;
  const conferida = resultado !== null;
  const classe = !conferida ? (marcada ? 'marcada' : '') : errosDaLinha.length > 0 ? (marcada ? 'achou' : 'perdeu') : marcada ? 'falso-alarme' : '';
  return (
    <li className={`linha-caca ${classe}`}>
      <div className="linha-caca-texto">
        <span>{linha.texto}</span>
        {linha.detalhe && <small>{linha.detalhe}</small>}
      </div>
      {marcavel && !conferida && (
        <button type="button" className="botao-marcar" aria-pressed={marcada} onClick={aoMarcar}>
          {marcada ? '⚠ Marcada' : '⚠ Tem erro'}
        </button>
      )}
      {marcada && !conferida && (
        <fieldset className="tipos-erro">
          <legend>Que tipo de erro? (opcional, pode ser mais de um)</legend>
          {CATEGORIAS.map((c) => (
            <label key={c} className="opcao-check">
              <input type="checkbox" checked={tipos.includes(c)} onChange={() => aoTipo(c)} />
              {CATEGORIAS_ERRO[c]}
            </label>
          ))}
        </fieldset>
      )}
      {conferida && errosDaLinha.length > 0 && (
        <ul className="explicacao-caca">
          {errosDaLinha.map((e, i) => (
            <li key={i}>
              <strong>{marcada ? '✔ Achou' : '✘ Passou batido'}</strong> — {CATEGORIAS_ERRO[e.categoria]}
              {marcada && tipos && tipos.length > 0 && (tipos.includes(e.categoria) ? ' (tipo certo)' : ' (você marcou outro tipo)')}: estava{' '}
              <del>{e.ficou}</del>, o certo é <ins>{e.era}</ins>. {e.explicacao}
            </li>
          ))}
        </ul>
      )}
      {conferida && marcada && errosDaLinha.length === 0 && <p className="explicacao-caca">Esta linha estava certa (falso alarme).</p>}
    </li>
  );
}
