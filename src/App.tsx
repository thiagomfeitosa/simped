import { useState } from 'react';
import { PassoAPasso } from './componentes/passo-a-passo/PassoAPasso';
import { ROTEIROS } from './dados/roteiros';

export function App() {
  const [idRoteiro, setIdRoteiro] = useState(ROTEIROS[0].id);
  const roteiro = ROTEIROS.find((r) => r.id === idRoteiro) ?? ROTEIROS[0];

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          <span className="marca-logo" aria-hidden="true">
            Sim<b>Ped</b>
          </span>
          <span className="marca-sub">Passo a passo da prescrição</span>
        </div>
        <div className="escolha-roteiro" role="tablist" aria-label="Escolha o caso">
          {ROTEIROS.map((r) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={r.id === roteiro.id}
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
      </header>

      <p className="aviso">
        <strong>Ferramenta de treinamento.</strong> Não substitui protocolos institucionais nem o julgamento clínico. Doses e condutas marcadas{' '}
        <span className="selo-a-validar">A VALIDAR</span> ainda não foram conferidas nas fontes. Cores dos líquidos são só didáticas.
      </p>

      <main>
        {/* key: ao trocar de caso, recomeça da etapa 1 */}
        <PassoAPasso key={roteiro.id} roteiro={roteiro} />
      </main>
    </div>
  );
}
