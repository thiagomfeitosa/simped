import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from 'react';
import { copiarTexto, relatoAtual } from './coletar';
import { guardarErro } from './relato';

interface Props {
  /** Nome da parte protegida (ex.: "Prescrever"), mostrado na mensagem. */
  onde: string;
  children: ReactNode;
}

interface Estado {
  erro: Error | null;
}

/**
 * Se uma tela der erro, mostra uma mensagem amigável no lugar dela (em vez de tela branca).
 * O resto do app continua funcionando. O erro entra no "Relatar problema".
 */
export class ProtecaoDeErro extends Component<Props, Estado> {
  override state: Estado = { erro: null };

  static getDerivedStateFromError(erro: Error): Estado {
    return { erro };
  }

  override componentDidCatch(erro: Error, info: ErrorInfo): void {
    guardarErro(erro, 'tela', info.componentStack ?? undefined);
  }

  override render() {
    if (!this.state.erro) return this.props.children;
    return (
      <TelaDeErro onde={this.props.onde} mensagem={this.state.erro.message} aoTentarDeNovo={() => this.setState({ erro: null })} />
    );
  }
}

function TelaDeErro({ onde, mensagem, aoTentarDeNovo }: { onde: string; mensagem: string; aoTentarDeNovo: () => void }) {
  // o relato é montado depois de a tela aparecer: só então o erro já foi guardado (componentDidCatch)
  const [relato, setRelato] = useState('');
  useEffect(() => setRelato(relatoAtual()), []);
  const [copiado, setCopiado] = useState<boolean | null>(null);
  return (
    <section className="tela-erro" role="alert">
      <h2>😕 Algo deu errado em “{onde}”</h2>
      <p>
        O resto do SimPed continua funcionando (use as abas do topo). Você pode tentar de novo ou copiar o relato e colar na
        conversa com o assistente — assim o conserto é mais rápido.
      </p>
      <p className="tela-erro-mensagem">
        Mensagem técnica: <code>{mensagem}</code>
      </p>
      <div className="tela-erro-botoes">
        <button type="button" onClick={aoTentarDeNovo}>
          ↻ Tentar de novo
        </button>
        <button type="button" onClick={async () => setCopiado(await copiarTexto(relatoAtual()))}>
          📋 Copiar relato do problema
        </button>
        <button type="button" onClick={() => window.location.reload()}>
          Recarregar o app
        </button>
      </div>
      {copiado === true && <p className="tela-erro-ok">✔ Copiado. Agora é só colar na conversa.</p>}
      {copiado === false && <p>Não deu para copiar sozinho: selecione o texto abaixo e copie (Ctrl+C / ⌘+C).</p>}
      <details>
        <summary>Ver o relato</summary>
        <textarea readOnly value={relato} rows={12} aria-label="Relato do problema" />
      </details>
    </section>
  );
}

/** Botão do topo: copia o relato mesmo sem erro (ex.: "a conta saiu estranha"). */
export function RelatarProblema() {
  const [aberto, setAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [copiado, setCopiado] = useState<boolean | null>(null);
  const relato = aberto ? relatoAtual({ descricao }) : '';
  return (
    <>
      <button type="button" className="botao-relatar" onClick={() => setAberto(true)} title="Copiar o que aconteceu para colar na conversa">
        🐞 Relatar problema
      </button>
      {aberto && (
        <div className="relatar-fundo" role="dialog" aria-modal="true" aria-label="Relatar problema">
          <div className="relatar-caixa">
            <h2>🐞 Relatar problema</h2>
            <label>
              O que você estava fazendo? O que esperava e o que aconteceu?
              <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} />
            </label>
            <details>
              <summary>Ver o que vai ser copiado</summary>
              <textarea readOnly value={relato} rows={12} aria-label="Relato do problema" />
            </details>
            <div className="tela-erro-botoes">
              <button type="button" onClick={async () => setCopiado(await copiarTexto(relato))}>
                📋 Copiar relato
              </button>
              <button
                type="button"
                onClick={() => {
                  setAberto(false);
                  setCopiado(null);
                }}
              >
                Fechar
              </button>
            </div>
            {copiado === true && <p className="tela-erro-ok">✔ Copiado. Agora é só colar na conversa.</p>}
            {copiado === false && <p>Não deu para copiar sozinho: abra “Ver o que vai ser copiado”, selecione e copie.</p>}
          </div>
        </div>
      )}
    </>
  );
}
