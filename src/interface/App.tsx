import { useState } from 'react';
import { HOSPITAIS } from '../dados/hospitais';
import { PACIENTES_DEMO } from '../dados/pacientes';
import { CalculadoraBic } from './CalculadoraBic';
import { FolhaPrescricao } from './FolhaPrescricao';
import { PainelPaciente } from './PainelPaciente';
import { Rascunho } from './Rascunho';

export function App() {
  const paciente = PACIENTES_DEMO[0];
  const hospital = HOSPITAIS[0];
  const [mostrarPaciente, setMostrarPaciente] = useState(true);

  return (
    <div className="app">
      <header className="topo">
        <h1>SimPed</h1>
        <span className="subtitulo">Simulador de Prescrição em Emergências Pediátricas</span>
        <button onClick={() => setMostrarPaciente(!mostrarPaciente)}>
          {mostrarPaciente ? 'Ocultar paciente' : 'Mostrar paciente'}
        </button>
      </header>
      <div className="aviso">
        ⚠️ Ferramenta de <strong>treinamento</strong>. Não substitui protocolos institucionais nem julgamento clínico.
      </div>
      <main className={mostrarPaciente ? 'grade' : 'grade sem-paciente'}>
        {mostrarPaciente && <PainelPaciente paciente={paciente} />}
        <FolhaPrescricao paciente={paciente} hospital={hospital} />
        <aside className="coluna">
          <Rascunho />
          <CalculadoraBic hospital={hospital} />
        </aside>
      </main>
    </div>
  );
}
