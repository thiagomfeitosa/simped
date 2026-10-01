import type { EstadoPaciente, EventoPaciente } from '../motor/paciente';

export function formatarTempo(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface Props {
  paciente: EstadoPaciente;
  aoEvento: (evento: EventoPaciente) => void;
}

/** Relógio do caso, avanço do tempo e linha do tempo. A medicação é dada pelo botão "Administrar" da folha. */
export function ControlesCaso({ paciente, aoEvento }: Props) {
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
      <p className="nota">
        Para dar uma medicação, preencha o item na folha e clique em “Administrar”. Demonstração: os efeitos são
        fictícios (A VALIDAR).
      </p>

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
