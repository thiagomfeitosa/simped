import type { Etapa } from '../../dados/roteiros/tipos';
import { SECOES } from '../../dados/secoes';
import { ContaAnimada } from './ContaAnimada';
import type { Direcao } from './PassoAPasso';
import { useRitmo } from './ritmo';

interface Props {
  etapa: Etapa;
  direcao: Direcao;
  numero: number;
  total: number;
  /** Avisa quando o resultado da conta está na tela (o rascunho só escreve depois). */
  aoMudarConta?: (completa: boolean) => void;
}

/** Texto da etapa + conta em tempos (fórmula → números → resultado), com desfazer/refazer. */
export function CartaoExplicacao({ etapa, direcao, numero, total, aoMudarConta }: Props) {
  const fator = useRitmo();
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
        <p key={i} className="explicacao-paragrafo" style={{ animationDelay: `${(120 + i * 160) * fator}ms` }}>
          {p}
        </p>
      ))}

      {etapa.conta && <ContaAnimada conta={etapa.conta} comecarCompleta={direcao === 'voltar'} aoMudar={aoMudarConta} />}

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
