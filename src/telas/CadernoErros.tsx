import { type Caderno, diaDe, evolucaoDoAssunto, NOME_ASSUNTO, type SituacaoAssunto, situacaoDoCaderno } from '../estudo/caderno';

interface Props {
  caderno: Caderno;
  aoZerar: () => void;
  aoTreinar: () => void;
  aoCacar: () => void;
}

function dataCurta(dia: string): string {
  const [, mes, d] = dia.split('-');
  return `${d}/${mes}`;
}

/** Caderno de erros: onde o aluno mais erra, quando revisar e como foi a evolução por dia. */
export function CadernoErros({ caderno, aoZerar, aoTreinar, aoCacar }: Props) {
  const agora = new Date();
  const situacao = situacaoDoCaderno(caderno, agora);
  const vencidos = situacao.filter((s) => s.revisarHoje);

  if (situacao.length === 0) {
    return (
      <div className="cartoes">
        <section className="painel">
          <h2>📒 Caderno de erros</h2>
          <p>
            Ainda vazio. Faça algumas contas ou um caça-erros: cada acerto e cada erro é anotado aqui, por assunto (rediluição, VIG, vazão,
            unidade…). O caderno fica guardado neste computador e entra no backup.
          </p>
          <div className="linha-botoes">
            <button type="button" className="botao-principal" onClick={aoTreinar}>
              🧮 Fazer contas
            </button>
            <button type="button" onClick={aoCacar}>
              🔎 Caça-erros
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="caderno">
      <section className="painel caderno-resumo">
        <h2>📒 Caderno de erros</h2>
        <p>
          {vencidos.length > 0 ? (
            <>
              <strong>{vencidos.length}</strong> assunto(s) para revisar hoje: {vencidos.map((s) => s.nome).join(', ')}.
            </>
          ) : (
            'Nenhum assunto vencido hoje. O treino dirigido usa os de menor acerto.'
          )}
        </p>
        <div className="linha-botoes">
          <button type="button" className="botao-principal" onClick={aoTreinar}>
            🎯 Treinar meus pontos fracos
          </button>
          <button type="button" onClick={aoCacar}>
            🔎 Caça-erros
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Apagar o caderno de erros deste computador?')) aoZerar();
            }}
          >
            Zerar caderno
          </button>
        </div>
        <p className="nota">
          Revisão espaçada: errou → revisar hoje; acertando, a próxima revisão vai para 1, 3, 7 e 14 dias (caixas 1 a 5). Os erros do
          caça-erros entram no assunto da conta; os de segurança, em “Regras de segurança”.
        </p>
      </section>

      <section className="painel">
        <h2>Do mais fraco para o mais forte</h2>
        <div className="tabela-rola">
          <table className="tabela-resultado tabela-caderno" aria-label="Situação por assunto">
            <thead>
              <tr>
                <th>Assunto</th>
                <th>Últimos resultados</th>
                <th>Acerto recente</th>
                <th>Caixa</th>
                <th>Revisar</th>
                <th>Evolução por dia</th>
              </tr>
            </thead>
            <tbody>
              {situacao.map((s) => (
                <LinhaAssunto key={s.assunto} s={s} caderno={caderno} hoje={diaDe(agora)} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LinhaAssunto({ s, caderno, hoje }: { s: SituacaoAssunto; caderno: Caderno; hoje: string }) {
  const evolucao = evolucaoDoAssunto(caderno, s.assunto).slice(-14);
  const pct = Math.round(s.taxaRecente * 100);
  return (
    <tr className={s.taxaRecente < 0.7 ? 'fora' : undefined}>
      <td>{NOME_ASSUNTO[s.assunto]}</td>
      <td className="ultimos" aria-label={`${s.ultimos.filter(Boolean).length} acertos nas últimas ${s.ultimos.length}`}>
        {s.ultimos.map((ok, i) => (
          <span key={i} className={ok ? 'ok' : 'erro'}>
            {ok ? '✔' : '✘'}
          </span>
        ))}
      </td>
      <td className="valor">
        {pct}% <small>({s.tentativas} no total)</small>
      </td>
      <td aria-label={`caixa ${s.caixa} de 5`}>
        <span className="caixas">
          {[1, 2, 3, 4, 5].map((c) => (
            <span key={c} className={c <= s.caixa ? 'cheia' : ''} />
          ))}
        </span>
      </td>
      <td>{s.revisarHoje ? <span className="selo selo-perigo">hoje</span> : s.proxima === hoje ? 'hoje' : dataCurta(s.proxima)}</td>
      <td>
        <MiniEvolucao dias={evolucao} />
      </td>
    </tr>
  );
}

/** Colunas finas (uma por dia de treino, até 14): % de acerto do dia. Uma cor só; o valor do último dia escrito ao lado. */
function MiniEvolucao({ dias }: { dias: { dia: string; taxa: number; tentativas: number }[] }) {
  const largura = 8;
  const vao = 2;
  const altura = 28;
  const ultimo = dias[dias.length - 1];
  return (
    <span className="mini-evolucao">
      <svg width={dias.length * (largura + vao)} height={altura + 1} role="img" aria-label={dias.map((d) => `${dataCurta(d.dia)}: ${Math.round(d.taxa * 100)}%`).join('; ')}>
        <line x1={0} x2={dias.length * (largura + vao)} y1={altura + 0.5} y2={altura + 0.5} className="base" />
        {dias.map((d, i) => {
          const h = Math.max(2, d.taxa * altura);
          return (
            <path
              key={d.dia}
              className="coluna"
              // canto arredondado em cima, reto na linha de base
              d={`M${i * (largura + vao)} ${altura} V${altura - h + 2} Q${i * (largura + vao)} ${altura - h} ${i * (largura + vao) + 2} ${altura - h} H${i * (largura + vao) + largura - 2} Q${i * (largura + vao) + largura} ${altura - h} ${i * (largura + vao) + largura} ${altura - h + 2} V${altura} Z`}
            >
              <title>{`${dataCurta(d.dia)}: ${Math.round(d.taxa * 100)}% de acerto (${d.tentativas} tentativa(s))`}</title>
            </path>
          );
        })}
      </svg>
      {ultimo && <small>{Math.round(ultimo.taxa * 100)}%</small>}
    </span>
  );
}
