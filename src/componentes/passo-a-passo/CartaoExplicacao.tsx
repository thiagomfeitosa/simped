import type { Etapa } from '../../dados/roteiros/tipos';
import { SECOES } from '../../dados/secoes';
import type { Direcao } from './PassoAPasso';

/** Texto da etapa + conta em três tempos (fórmula → números → resultado). */
export function CartaoExplicacao({ etapa, direcao, numero, total }: { etapa: Etapa; direcao: Direcao; numero: number; total: number }) {
  const secao = SECOES[etapa.secao];
  return (
    <article key={etapa.id} className={`explicacao entrar-${direcao}`} style={{ ['--cor-secao' as string]: secao.cor }}>
      <header className="explicacao-topo">
        <span className="chip-secao">
          {secao.numero ? `${secao.numero}. ` : ''}
          {secao.nome}
        </span>
        <span className="explicacao-contador">
          Etapa {numero} de {total}
        </span>
      </header>

      <h2>{etapa.titulo}</h2>
      {etapa.explicacao.map((p, i) => (
        <p key={i} className="explicacao-paragrafo" style={{ animationDelay: `${120 + i * 140}ms` }}>
          {p}
        </p>
      ))}

      {etapa.conta && (
        <div className="conta" aria-label="Cálculo">
          <div className="conta-linha conta-formula" style={{ animationDelay: '350ms' }}>
            <span className="conta-rotulo">Fórmula</span>
            <span>{etapa.conta.formula}</span>
          </div>
          <SetaConta atraso={650} />
          <div className="conta-linha conta-substituicao" style={{ animationDelay: '850ms' }}>
            <span className="conta-rotulo">Com os números</span>
            <span>{etapa.conta.substituicao}</span>
          </div>
          <SetaConta atraso={1150} />
          <div className="conta-linha conta-resultado" style={{ animationDelay: '1350ms' }}>
            <span className="conta-rotulo">Resultado</span>
            <span>{etapa.conta.resultado}</span>
          </div>
        </div>
      )}

      {etapa.dica && (
        <div className="dica">
          <strong>Dica</strong>
          <span>{etapa.dica}</span>
        </div>
      )}

      {etapa.aValidar && (
        <div className="a-validar" role="note">
          <strong className="selo-a-validar">A VALIDAR</strong>
          <span>
            {etapa.aValidar}
            {etapa.fonte && <em> Fonte prevista: {etapa.fonte}.</em>}
          </span>
        </div>
      )}
      {!etapa.aValidar && etapa.fonte && <p className="fonte">Fonte: {etapa.fonte}</p>}
    </article>
  );
}

function SetaConta({ atraso }: { atraso: number }) {
  return (
    <svg className="conta-seta" viewBox="0 0 24 22" width="22" height="20" style={{ animationDelay: `${atraso}ms` }} aria-hidden="true">
      <path d="M12 2 V17 M5 11 L12 18 L19 11" />
    </svg>
  );
}
