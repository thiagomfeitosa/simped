import { useEffect, useState } from 'react';
import { PassoAPasso } from './componentes/passo-a-passo/PassoAPasso';
import { fatorDoRitmo, OPCOES_RITMO, RITMO_PADRAO, RitmoContexto, type Ritmo } from './componentes/passo-a-passo/ritmo';
import { ROTEIROS, TEMAS } from './dados/roteiros';

const CHAVE_RITMO = 'simped.ritmo';

function lerRitmoSalvo(): Ritmo {
  try {
    const salvo = window.localStorage.getItem(CHAVE_RITMO);
    return OPCOES_RITMO.some((o) => o.id === salvo) ? (salvo as Ritmo) : RITMO_PADRAO;
  } catch {
    return RITMO_PADRAO;
  }
}

export function App() {
  const [idRoteiro, setIdRoteiro] = useState(ROTEIROS[0].id);
  const [ritmo, setRitmo] = useState<Ritmo>(lerRitmoSalvo);
  const roteiro = ROTEIROS.find((r) => r.id === idRoteiro) ?? ROTEIROS[0];
  const fator = fatorDoRitmo(ritmo);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE_RITMO, ritmo);
    } catch {
      // sem armazenamento (janela privada etc.): só não lembra a escolha
    }
  }, [ritmo]);

  return (
    <RitmoContexto.Provider value={fator}>
      <div className="app" style={{ ['--ritmo' as string]: fator }}>
        <header className="topo">
          <div className="marca">
            <span className="marca-logo" aria-hidden="true">
              Sim<b>Ped</b>
            </span>
            <span className="marca-sub">Passo a passo da prescrição</span>
          </div>
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
          {TEMAS.map((tema) => (
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
