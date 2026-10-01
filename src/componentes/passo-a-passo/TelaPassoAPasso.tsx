import { useEffect, useState } from 'react';
import { PassoAPasso } from './PassoAPasso';
import { fatorDoRitmo, OPCOES_RITMO, RITMO_PADRAO, RitmoContexto, type Ritmo } from './ritmo';
import { ROTEIROS, TEMAS } from '../../dados/roteiros';
import { definirContexto } from '../../diagnostico/relato';

const CHAVE_RITMO = 'simped.ritmo';
// a lista de roteiros nunca é vazia: o primeiro é o que abre
const PRIMEIRO_ROTEIRO = ROTEIROS[0]!;

function lerRitmoSalvo(): Ritmo {
  try {
    const salvo = window.localStorage.getItem(CHAVE_RITMO);
    return OPCOES_RITMO.some((o) => o.id === salvo) ? (salvo as Ritmo) : RITMO_PADRAO;
  } catch {
    return RITMO_PADRAO;
  }
}

/** Modo "Passo a passo": escolha do caso, velocidade das animações e o passo a passo da prescrição. */
export function TelaPassoAPasso() {
  const [idRoteiro, setIdRoteiro] = useState(PRIMEIRO_ROTEIRO.id);
  const [ritmo, setRitmo] = useState<Ritmo>(lerRitmoSalvo);
  const roteiro = ROTEIROS.find((r) => r.id === idRoteiro) ?? PRIMEIRO_ROTEIRO;
  const fator = fatorDoRitmo(ritmo);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE_RITMO, ritmo);
    } catch {
      // sem armazenamento (janela privada etc.): só não lembra a escolha
    }
  }, [ritmo]);

  // o "Relatar problema" diz qual roteiro estava aberto
  useEffect(() => definirContexto('Roteiro do passo a passo', roteiro.titulo), [roteiro.titulo]);

  return (
    <RitmoContexto.Provider value={fator}>
      <div className="app" style={{ ['--ritmo' as string]: fator }}>
        <header className="topo">
          <h1 className="modo-titulo">Passo a passo da prescrição</h1>
          <div className="ritmo" role="group" aria-label="Velocidade das animações">
            <span className="ritmo-rotulo">Animações:</span>
            {OPCOES_RITMO.map((o) => (
              <button key={o.id} type="button" className={`ritmo-botao ${o.id === ritmo ? 'ativo' : ''}`} aria-pressed={o.id === ritmo} onClick={() => setRitmo(o.id)}>
                {o.rotulo}
              </button>
            ))}
          </div>
        </header>

        <nav className="escolha-roteiro" aria-label="Escolha o caso">
          {TEMAS.filter((tema) => ROTEIROS.some((r) => r.tema === tema)).map((tema) => (
            <div key={tema} className="tema-grupo">
              <span className="tema-titulo">{tema}</span>
              <div className="tema-botoes">
                {ROTEIROS.filter((r) => r.tema === tema).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={r.id === roteiro.id}
                    className={`roteiro-botao ${r.id === roteiro.id ? 'ativo' : ''}`}
                    onClick={() => setIdRoteiro(r.id)}
                  >
                    <strong>{r.titulo}</strong>
                    <span>
                      {r.paciente.nome} · {r.paciente.descricao}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <p className="aviso">
          <strong>Ferramenta de treinamento.</strong> Não substitui protocolos institucionais nem o julgamento clínico. Doses e condutas marcadas{' '}
          <span className="selo-a-validar">A VALIDAR</span> ainda não foram conferidas nas fontes. Cores dos líquidos são só didáticas.
        </p>

        <main>
          {/* key: ao trocar de caso, recomeça da etapa 1 */}
          <PassoAPasso key={roteiro.id} roteiro={roteiro} />
        </main>
      </div>
    </RitmoContexto.Provider>
  );
}
