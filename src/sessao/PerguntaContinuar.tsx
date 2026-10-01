import { useState } from 'react';
import { formatarTempo } from '../telas/ControlesCaso';
import { apagarSessaoGuardada, sessaoGuardada, useSessao } from './ContextoSessao';
import { reproduzirSessao, type SessaoGuardada, temTrabalho } from './sessao';

/**
 * B13: ao abrir o app, se havia um caso no meio, pergunta se quer continuar de onde parou.
 * "Continuar" abre a aba Prescrever com tudo como estava (folha, relógio, exames, rascunho).
 */
export function PerguntaContinuar() {
  const { casos, continuar } = useSessao();
  // lido uma vez só, ao abrir o app (antes de qualquer ação nova sobrescrever o que estava guardado)
  const [guardada, setGuardada] = useState<SessaoGuardada | null>(() => {
    const g = sessaoGuardada();
    return g && temTrabalho(g.registros) && casos.some((c) => c.id === g.casoId) ? g : null;
  });
  if (!guardada) return null;
  const minuto = reproduzirSessao(guardada.registros).minutoCaso;

  return (
    <div className="relatar-fundo" role="dialog" aria-modal="true" aria-label="Continuar o caso">
      <div className="relatar-caixa">
        <h2>▶ Continuar de onde parou?</h2>
        <p>
          Você estava no caso <strong>{guardada.casoTitulo}</strong>
          {guardada.variacao && ' (🎲 variado)'}, com o relógio do caso em <strong>{formatarTempo(minuto)}</strong> e{' '}
          {guardada.registros.length} ação(ões) registrada(s). Salvo em {new Date(guardada.salvaEm).toLocaleString('pt-BR')}.
        </p>
        <div className="tela-erro-botoes">
          <button
            type="button"
            className="botao-principal"
            onClick={() => {
              continuar(guardada);
              setGuardada(null);
              window.location.hash = 'prescrever';
            }}
          >
            ▶ Continuar o caso
          </button>
          <button
            type="button"
            onClick={() => {
              apagarSessaoGuardada();
              setGuardada(null);
            }}
          >
            Começar do zero
          </button>
        </div>
      </div>
    </div>
  );
}
