import { useState } from 'react';
import type { Medicacao } from '../dados/medicacoes/tipos';
import type { EstadoPaciente, EventoPaciente } from '../motor/paciente';

export function formatarTempo(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface Props {
  paciente: EstadoPaciente;
  medicacoes: readonly Medicacao[];
  aoEvento: (evento: EventoPaciente) => void;
}

/** Relógio do caso, avanço do tempo, administração (demonstração) e linha do tempo. */
export function ControlesCaso({ paciente, medicacoes, aoEvento }: Props) {
  const [medicacaoId, setMedicacaoId] = useState(medicacoes[0]?.id ?? '');

  function administrar() {
    const med = medicacoes.find((m) => m.id === medicacaoId);
    if (med) aoEvento({ tipo: 'medicacaoAdministrada', medicacaoId: med.id, descricao: med.nome });
  }

  return (
    <div className="controles-caso">
      <div className="relogio" aria-label="Tempo do caso">
        ⏱ {formatarTempo(paciente.tempoMin)}
      </div>
      <div className="linha-botoes">
        {[5, 15, 60].map((min) => (
          <button key={min} type="button" onClick={() => aoEvento({ tipo: 'tempoPassou', minutos: min })}>
            +{min} min
          </button>
        ))}
      </div>
      <div className="linha-botoes">
        <select aria-label="Medicação a administrar" value={medicacaoId} onChange={(e) => setMedicacaoId(e.target.value)}>
          {medicacoes.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
        <button type="button" onClick={administrar}>
          Administrar
        </button>
      </div>
      <p className="nota">Demonstração: os efeitos são fictícios (A VALIDAR).</p>

      <h3>Linha do tempo</h3>
      <ol className="linha-do-tempo">
        {paciente.registro.map((r, i) => (
          <li key={i}>
            <span className="hora">{formatarTempo(r.tempoMin)}</span> {r.descricao}
          </li>
        ))}
      </ol>
    </div>
  );
}
