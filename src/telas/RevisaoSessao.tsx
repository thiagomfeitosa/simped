import { useEffect, useMemo, useState } from 'react';
import type { CasoClinico } from '../casos/tipos';
import { hospitalAtual } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { useBanco } from '../dados/medicacoes/ContextoBanco';
import { reproduzirEventos, sinaisVistos } from '../motor/paciente';
import { descreverRegistro, guardarSessao, type RegistroSessao, reproduzirSessao } from '../sessao/sessao';
import { formatarTempo } from './ControlesCaso';
import { FolhaSomenteLeitura } from './FolhaSomenteLeitura';

interface Props {
  caso: CasoClinico;
  registros: readonly RegistroSessao[];
  aoFechar: () => void;
}

function baixarJson(nome: string, conteudo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * "Rever o caso" (B12): a lista de tudo o que aconteceu, e o caso exatamente como estava em cada ponto
 * (folha, sinais vitais, rascunho). Dá para avançar um a um ou deixar passar sozinho.
 */
export function RevisaoSessao({ caso, registros, aoFechar }: Props) {
  const { banco } = useBanco();
  const { config } = useConfiguracoes();
  const [ate, setAte] = useState(registros.length);
  const [tocando, setTocando] = useState(false);
  const estado = useMemo(() => reproduzirSessao(registros, ate), [registros, ate]);
  const paciente = useMemo(() => reproduzirEventos(caso, estado.eventosPaciente), [caso, estado.eventosPaciente]);
  const atual = registros[ate - 1];

  useEffect(() => {
    if (!tocando) return;
    if (ate >= registros.length) {
      setTocando(false);
      return;
    }
    const id = window.setTimeout(() => setAte((n) => n + 1), 900);
    return () => window.clearTimeout(id);
  }, [tocando, ate, registros.length]);

  // SpO₂ como o monitor mostrava (com o O₂ instalado)
  const s = sinaisVistos(paciente);
  const r1 = (n: number) => Math.round(n * 10) / 10;

  return (
    <div className="relatorio-fundo" role="dialog" aria-modal="true" aria-label="Rever o caso">
      <div className="relatorio painel revisao">
        <header className="relatorio-cabecalho">
          <h2>⏪ Rever o caso — {caso.titulo}</h2>
          <div className="linha-botoes">
            <button
              type="button"
              onClick={() => baixarJson(`simped-sessao-${caso.id}.json`, JSON.stringify(guardarSessao(caso.id, caso.titulo, registros, new Date()), null, 2))}
              title="Guarda a lista de tudo o que foi feito (para o professor ou para continuar em outro computador)"
            >
              ⬇ Baixar registro (.json)
            </button>
            <button type="button" onClick={aoFechar}>
              Fechar
            </button>
          </div>
        </header>

        {registros.length === 0 ? (
          <p className="nota">Nada foi feito ainda neste caso.</p>
        ) : (
          <>
            <div className="revisao-controles">
              <button type="button" onClick={() => setAte(0)} disabled={ate === 0} aria-label="Voltar ao início">
                ⏮
              </button>
              <button type="button" onClick={() => setAte((n) => Math.max(0, n - 1))} disabled={ate === 0} aria-label="Passo anterior">
                ◀
              </button>
              <button
                type="button"
                onClick={() => {
                  if (ate >= registros.length) setAte(0);
                  setTocando((t) => !t);
                }}
              >
                {tocando ? '⏸ Pausar' : '▶ Reproduzir'}
              </button>
              <button
                type="button"
                onClick={() => setAte((n) => Math.min(registros.length, n + 1))}
                disabled={ate >= registros.length}
                aria-label="Próximo passo"
              >
                ▶
              </button>
              <input
                type="range"
                min={0}
                max={registros.length}
                value={ate}
                onChange={(e) => setAte(Number(e.target.value))}
                aria-label="Ponto do caso"
              />
              <span className="nota">
                passo {ate} de {registros.length}
              </span>
            </div>
            <p className="revisao-atual" aria-live="polite">
              {atual ? (
                <>
                  <strong>⏱ {formatarTempo(atual.minutoCaso)}</strong> {atual.autor === 'professor' ? '👩‍🏫 ' : ''}
                  {descreverRegistro(atual)}
                </>
              ) : (
                'Início do caso'
              )}
            </p>

            <div className="revisao-colunas">
              <ol className="revisao-lista" aria-label="Tudo o que aconteceu">
                {registros.map((r, i) => (
                  <li key={r.n} className={i === ate - 1 ? 'atual' : i >= ate ? 'futuro' : undefined}>
                    <button type="button" onClick={() => setAte(i + 1)}>
                      <span className="hora">{formatarTempo(r.minutoCaso)}</span>
                      <span className="hora-real">{new Date(r.horaReal).toLocaleTimeString('pt-BR')}</span>
                      {r.autor === 'professor' ? '👩‍🏫 ' : ''}
                      {descreverRegistro(r)}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="revisao-momento">
                <h3>Paciente às {formatarTempo(estado.minutoCaso)}</h3>
                <p className="revisao-sinais">
                  FC {Math.round(s.fc)} · FR {Math.round(s.fr)} · SpO₂ {Math.round(s.spo2)}% · PA {Math.round(s.paSistolica)}/
                  {Math.round(s.paDiastolica)} · T {r1(s.temperaturaC)} °C · Glic. {Math.round(s.glicemiaMgDl)}
                </p>
                <h3>Folha neste momento</h3>
                <FolhaSomenteLeitura estado={estado.prescricao} medicacoes={banco} volumeFinalBicMl={hospitalAtual(config).volumeFinalBicMl} />
                {estado.rascunho && (
                  <>
                    <h3>Rascunho</h3>
                    <pre className="revisao-rascunho">{estado.rascunho}</pre>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
