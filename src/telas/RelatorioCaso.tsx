import { useState } from 'react';
import { lerHistorico, NOME_TIPO_ERRO, type Relatorio, resumoParaHistorico, type ResumoHistorico } from '../relatorio/relatorio';
import { formatarTempo } from './ControlesCaso';

const CHAVE = 'simped.historico';

function lerGuardado(): ResumoHistorico[] {
  try {
    return lerHistorico(window.localStorage.getItem(CHAVE));
  } catch {
    return [];
  }
}

interface Props {
  relatorio: Relatorio;
  aoFechar: () => void;
}

/** Relatório final do caso, com histórico guardado no computador. */
export function RelatorioCaso({ relatorio: r, aoFechar }: Props) {
  const [historico, setHistorico] = useState<ResumoHistorico[]>(lerGuardado);
  const [salvo, setSalvo] = useState(false);
  const tipos = [...new Set([...Object.keys(r.errosPorTipo), ...Object.keys(r.acertosPorTipo)])] as (keyof typeof NOME_TIPO_ERRO)[];

  function salvar() {
    const novo = [resumoParaHistorico(r, new Date()), ...historico].slice(0, 50);
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(novo));
    } catch {
      // sem armazenamento: fica só na tela
    }
    setHistorico(novo);
    setSalvo(true);
  }

  return (
    <div className="relatorio-fundo" role="dialog" aria-modal="true" aria-label="Relatório do caso">
      <div className="relatorio painel">
        <header className="relatorio-cabecalho">
          <h2>Relatório — {r.caso.titulo}</h2>
          <div className="linha-botoes">
            <button type="button" onClick={() => window.print()}>
              🖨 Imprimir / PDF
            </button>
            <button type="button" onClick={salvar} disabled={salvo}>
              {salvo ? '✔ Salvo no histórico' : 'Salvar no histórico'}
            </button>
            <button type="button" onClick={aoFechar}>
              Fechar
            </button>
          </div>
        </header>
        <p className="nota">
          Condutas esperadas, prazos e reações do caso: A VALIDAR. Tempo de caso: {formatarTempo(r.duracaoMin)}.
        </p>
        <p className="nota banco-do-relatorio">
          Banco de medicações: {r.banco.texto}
          {r.banco.local && ' — com conferências ou apresentações deste computador que ainda não entraram no projeto'}.
        </p>

        <div className="relatorio-numeros">
          <div>
            <strong>{r.aproveitamento}%</strong>
            <span>das condutas esperadas</span>
          </div>
          <div>
            <strong>{r.primeiraDose ? formatarTempo(r.primeiraDose.minuto) : '—'}</strong>
            <span>até a 1ª dose</span>
          </div>
          <div>
            <strong>{r.itensDeMedicacao}</strong>
            <span>itens de medicação</span>
          </div>
          <div>
            <strong>{r.alertasDeSeguranca}</strong>
            <span>alertas de segurança na folha</span>
          </div>
        </div>

        {r.caso.hipotese && (
          <p>
            <strong>Hipótese esperada:</strong> {r.caso.hipotese}
          </p>
        )}

        <h3>Condutas esperadas</h3>
        {r.condutas.length === 0 ? (
          <p className="nota">Este caso ainda não tem condutas esperadas.</p>
        ) : (
          <ul className="conferencia condutas">
            {r.condutas.map((c) => (
              <li key={c.conduta.id} className={c.feita ? (c.noPrazo === false ? 'sit-atencao' : 'sit-certo') : 'sit-errado'}>
                <span className="selo">{c.feita ? (c.noPrazo === false ? '⚠ atrasou' : '✔ feito') : '✘ faltou'}</span>{' '}
                {c.conduta.descricao} — {c.texto}
              </li>
            ))}
          </ul>
        )}

        <h3>Conferência dos itens de medicação</h3>
        {tipos.length === 0 ? (
          <p className="nota">Nenhum item de medicação conferido.</p>
        ) : (
          <table className="tabela-resultado">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Certos</th>
                <th>Errados</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((t) => (
                <tr key={t} className={r.errosPorTipo[t] ? 'fora' : undefined}>
                  <td>{NOME_TIPO_ERRO[t] ?? t}</td>
                  <td className="valor">{r.acertosPorTipo[t] ?? 0}</td>
                  <td className="valor">{r.errosPorTipo[t] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="nota">Dose, via e intervalo só contam como certo/errado quando a referência estiver CONFERIDA.</p>

        {r.caso.pontosDeEnsino.length > 0 && (
          <>
            <h3>Pontos de ensino</h3>
            <ul>
              {r.caso.pontosDeEnsino.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </>
        )}

        {historico.length > 0 && (
          <details className="historico">
            <summary>Histórico neste computador ({historico.length})</summary>
            <table className="tabela-resultado">
              <tbody>
                {historico.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.quando).toLocaleString('pt-BR')}</td>
                    <td>{h.titulo}</td>
                    <td className="valor">{h.aproveitamento}%</td>
                    <td className="valor">{h.erros} erro(s)</td>
                    <td className="nota">{h.banco ? `banco ${h.banco}` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </div>
  );
}
