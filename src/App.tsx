import { useReducer, useState } from 'react';
import { casoDemonstracao } from './casos/demonstracao';
import { prescricaoVazia, reduzirPrescricao } from './prescricao/estado';
import { FolhaPrescricao } from './telas/FolhaPrescricao';
import { PainelPaciente } from './telas/PainelPaciente';
import { RascunhoCalculos } from './telas/RascunhoCalculos';

export function App() {
  const caso = casoDemonstracao;
  const [prescricao, despachar] = useReducer(reduzirPrescricao, undefined, prescricaoVazia);
  const [pacienteVisivel, setPacienteVisivel] = useState(true);
  const [rascunho, setRascunho] = useState('');

  return (
    <div className="app">
      <header className="cabecalho">
        <h1>SimPed</h1>
        <span className="subtitulo">Simulador de Prescrição em Emergências Pediátricas</span>
        <button type="button" onClick={() => setPacienteVisivel((v) => !v)}>
          {pacienteVisivel ? 'Ocultar paciente' : 'Mostrar paciente'}
        </button>
      </header>
      <p className="aviso" role="note">
        ⚠️ Ferramenta de treinamento. Não substitui protocolos institucionais nem o julgamento clínico.
      </p>

      <main className={pacienteVisivel ? 'area com-paciente' : 'area'}>
        {pacienteVisivel && <PainelPaciente caso={caso} sinais={caso.sinaisIniciais} />}
        <FolhaPrescricao paciente={caso.paciente} estado={prescricao} despachar={despachar} />
        <RascunhoCalculos texto={rascunho} aoMudar={setRascunho} />
      </main>
    </div>
  );
}
