import { useState } from 'react';
import type { CasoClinico } from '../casos/tipos';
import { EXAMES } from '../dados/exames';
import { type PedidoExame, type ResultadoPedido, resultadoDoPedido, valoresDoResultado } from '../exames/exames';
import { interpretarGasometria } from '../exames/gasometria';
import { formatarNumero } from '../prescricao/comum';
import { formatarTempo } from './ControlesCaso';

interface Props {
  caso: CasoClinico;
  agoraMin: number;
  pedidos: readonly PedidoExame[];
  aoPedir: (exameId: string) => void;
}

const GRUPOS = [...new Set(EXAMES.map((e) => e.grupo))];

/** Pedido de exames e resultados que chegam com o relógio do caso. */
export function PainelExames({ caso, agoraMin, pedidos, aoPedir }: Props) {
  const [escolhido, setEscolhido] = useState(EXAMES[0]?.id ?? '');
  const resultados = pedidos
    .map((p) => ({ pedido: p, resultado: resultadoDoPedido(p, caso, agoraMin) }))
    .filter((r): r is { pedido: PedidoExame; resultado: ResultadoPedido } => r.resultado !== null)
    .reverse();
  // eletrólitos mais recentes prontos (para o ânion gap da gasometria)
  const eletrolitos = resultados.find((r) => r.resultado.exame.id === 'eletrolitos' && r.resultado.situacao === 'pronto');

  return (
    <section className="painel painel-exames" aria-label="Exames">
      <h2>Exames</h2>
      <div className="linha-botoes">
        <select aria-label="Exame a pedir" value={escolhido} onChange={(e) => setEscolhido(e.target.value)}>
          {GRUPOS.map((g) => (
            <optgroup key={g} label={g}>
              {EXAMES.filter((e) => e.grupo === g).map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button type="button" onClick={() => aoPedir(escolhido)}>
          Pedir
        </button>
      </div>
      <p className="nota">O pedido entra na seção 7 da folha. Tempos e valores de referência: A VALIDAR.</p>

      <ul className="lista-exames">
        {resultados.map(({ pedido, resultado }) => (
          <li key={pedido.id}>
            <div className="exame-titulo">
              <strong>{resultado.exame.nome}</strong>{' '}
              <small>pedido às {formatarTempo(pedido.pedidoNoMinuto)}</small>
            </div>
            {resultado.situacao === 'aguardando' ? (
              <p className="nota">⏳ Aguardando — resultado às {formatarTempo(resultado.prontoNoMinuto)} do caso.</p>
            ) : resultado.semResultadoNoCaso ? (
              <p className="nota">Resultado não disponível neste caso.</p>
            ) : (
              <>
                {resultado.linhas.length > 0 && (
                  <table className="tabela-resultado">
                    <tbody>
                      {resultado.linhas.map((l) => (
                        <tr key={l.analito.id} className={l.marca ? 'fora' : undefined}>
                          <td>{l.analito.nome}</td>
                          <td className="valor">
                            {formatarNumero(l.valor)} {l.marca}
                          </td>
                          <td className="unidade">{l.analito.unidade}</td>
                          <td className="ref">
                            {l.analito.referencia
                              ? `${l.analito.referencia.min !== undefined ? formatarNumero(l.analito.referencia.min) : ''}–${l.analito.referencia.max !== undefined ? formatarNumero(l.analito.referencia.max) : ''}`
                              : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {resultado.laudo && <p className="laudo">{resultado.laudo}</p>}
                {resultado.exame.grupo === 'Gasometria' && (
                  <LeituraGuiada
                    resultado={resultado}
                    eletrolitos={eletrolitos ? valoresDoResultado(eletrolitos.resultado) : undefined}
                  />
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Passo a passo da gasometria: um passo por clique. */
function LeituraGuiada({ resultado, eletrolitos }: { resultado: ResultadoPedido; eletrolitos?: Record<string, number> }) {
  const [passos, setPassos] = useState(0);
  const v = valoresDoResultado(resultado);
  if (v.ph === undefined || v.pco2 === undefined || v.hco3 === undefined) return null;
  const leitura = interpretarGasometria(
    {
      ph: v.ph,
      pco2: v.pco2,
      hco3: v.hco3,
      ...(eletrolitos?.na !== undefined && { na: eletrolitos.na }),
      ...(eletrolitos?.cl !== undefined && { cl: eletrolitos.cl }),
      ...(v.lactato !== undefined && { lactato: v.lactato }),
    },
    resultado.exame.id === 'gasometria-venosa' ? 'venosa' : 'arterial',
  );
  const total = leitura.passos.length;
  return (
    <div className="leitura-guiada">
      {passos === 0 ? (
        <button type="button" onClick={() => setPassos(1)}>
          Leitura guiada
        </button>
      ) : (
        <>
          <ol>
            {leitura.passos.slice(0, passos).map((p, i) => (
              <li key={i}>
                <strong>{p.titulo}:</strong> {p.texto}
                {p.conta && <div className="conta-gaso">{p.conta}</div>}
              </li>
            ))}
          </ol>
          {passos < total ? (
            <button type="button" onClick={() => setPassos((x) => x + 1)}>
              Próximo passo ({passos}/{total})
            </button>
          ) : (
            <p className="conclusao-gaso">
              <strong>Conclusão:</strong> {leitura.conclusao}
            </p>
          )}
          {!eletrolitos && <p className="nota">Dica: peça eletrólitos para calcular o ânion gap.</p>}
        </>
      )}
    </div>
  );
}
