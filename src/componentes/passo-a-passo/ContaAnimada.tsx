import { Fragment, useEffect, useState } from 'react';
import type { Conta } from '../../dados/roteiros/tipos';
import { desfazerTempo, MINIMO_VISIVEIS, refazerTempo, temposDaConta } from '../../logica/passosConta';
import { useRitmo } from './ritmo';
import { prefereMenosMovimento } from './useNumeroAnimado';

/** Espera antes da fórmula aparecer (o texto da etapa entra primeiro). */
const INICIO_MS = 1100;
/** Tempo entre um tempo da conta e o seguinte (a seta desenha, depois a linha aparece). */
const INTERVALO_MS = 2000;

interface Props {
  conta: Conta;
  /** Ao chegar VOLTANDO, a conta já aparece pronta (o aluno pode desfazer com o botão). */
  comecarCompleta: boolean;
  /** Avisa quando o resultado está (ou deixa de estar) na tela. */
  aoMudar?: (completa: boolean) => void;
}

/**
 * Conta em tempos ligados por setas: fórmula → números → (passos) → resultado.
 * Aparece sozinha, devagar; os botões desfazem/refazem um tempo de cada vez,
 * só nesta conta (não mexem no passo a passo geral).
 */
export function ContaAnimada({ conta, comecarCompleta, aoMudar }: Props) {
  const fator = useRitmo();
  const tempos = temposDaConta(conta);
  const total = tempos.length;
  const pronta = comecarCompleta || prefereMenosMovimento();
  const [visiveis, setVisiveis] = useState(pronta ? total : 0);
  const [automatico, setAutomatico] = useState(!pronta);

  // Mostra o próximo tempo sozinho enquanto o aluno não mexer nos botões.
  useEffect(() => {
    if (!automatico) return;
    if (visiveis >= total) {
      setAutomatico(false);
      return;
    }
    const espera = (visiveis === 0 ? INICIO_MS : INTERVALO_MS) * fator;
    const t = window.setTimeout(() => setVisiveis((v) => refazerTempo(v, total)), espera);
    return () => window.clearTimeout(t);
  }, [automatico, visiveis, total, fator]);

  useEffect(() => {
    aoMudar?.(visiveis >= total);
  }, [visiveis, total, aoMudar]);

  const desfazer = () => {
    setAutomatico(false);
    setVisiveis((v) => desfazerTempo(v));
  };
  const refazer = () => {
    setAutomatico(false);
    setVisiveis((v) => refazerTempo(v, total));
  };
  const rever = () => {
    setVisiveis(0);
    setAutomatico(true);
  };

  return (
    <div className="conta" aria-label="Cálculo">
      {tempos.map((t, i) => {
        const visivel = i < visiveis;
        return (
          <Fragment key={i}>
            {i > 0 && <SetaConta visivel={visivel} />}
            <div
              className={`conta-linha conta-${t.tipo} ${visivel ? 'visivel' : 'oculta'}`}
              aria-hidden={!visivel}
              onClick={!visivel && i === visiveis ? refazer : undefined}
              title={!visivel && i === visiveis ? 'Mostrar este passo' : undefined}
            >
              <span className="conta-rotulo">{t.rotulo}</span>
              <span className="conta-texto">{t.texto}</span>
            </div>
          </Fragment>
        );
      })}

      <div className="conta-controles">
        <button type="button" className="conta-botao" onClick={desfazer} disabled={visiveis <= MINIMO_VISIVEIS} title="Esconde o último passo da conta">
          <span aria-hidden="true">↶</span> Desfazer
        </button>
        <span className="conta-pontos" aria-label={`Passo ${Math.max(visiveis, 1)} de ${total}`}>
          {tempos.map((_, i) => (
            <span key={i} className={`conta-ponto ${i < visiveis ? 'aceso' : ''}`} />
          ))}
        </span>
        <button type="button" className="conta-botao" onClick={refazer} disabled={visiveis >= total} title="Mostra o próximo passo da conta">
          Refazer <span aria-hidden="true">↷</span>
        </button>
        <button type="button" className="conta-botao conta-rever" onClick={rever} title="Rever a conta desde o começo">
          <span aria-hidden="true">↻</span>
        </button>
      </div>
    </div>
  );
}

/** Seta que se desenha (e se apaga ao desfazer). */
function SetaConta({ visivel }: { visivel: boolean }) {
  return (
    <svg className={`conta-seta ${visivel ? 'visivel' : ''}`} viewBox="0 0 24 22" width="22" height="20" aria-hidden="true">
      <path className="conta-seta-fundo" d="M12 2 V17 M5 11 L12 18 L19 11" />
      <path className="conta-seta-haste" pathLength={1} d="M12 2 V17" />
      <path className="conta-seta-ponta" pathLength={1} d="M5 11 L12 18 L19 11" />
    </svg>
  );
}
