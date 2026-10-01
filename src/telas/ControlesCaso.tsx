import type { EstadoPaciente } from '../motor/paciente';
import { formatarDataHora } from '../paciente/variaveis';
import { useRelogio, VELOCIDADES } from './useRelogio';

export function formatarTempo(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface Props {
  paciente: EstadoPaciente;
  /** Data e hora atuais do caso (início + relógio). */
  agora: Date;
  aoPassarTempo: (minutos: number) => void;
}

/** Relógio do caso (anda sozinho ou aos saltos) e linha do tempo. A medicação é dada pelo botão "Administrar" da folha. */
export function ControlesCaso({ paciente, agora, aoPassarTempo }: Props) {
  const relogio = useRelogio(aoPassarTempo);

  return (
    <div className="controles-caso">
      <div className="relogio" aria-label="Tempo do caso">
        ⏱ {formatarTempo(paciente.tempoMin)}
        <span className="relogio-data">{formatarDataHora(agora)}</span>
      </div>
      <div className="linha-botoes">
        <button
          type="button"
          className={relogio.rodando ? 'pausar' : 'iniciar'}
          onClick={() => relogio.setRodando((v) => !v)}
        >
          {relogio.rodando ? '⏸ Pausar' : '▶ Iniciar'}
        </button>
        <select
          aria-label="Velocidade do relógio"
          value={relogio.fator}
          onChange={(e) => relogio.setFator(Number(e.target.value))}
        >
          {VELOCIDADES.map((v) => (
            <option key={v.fator} value={v.fator}>
              {v.rotulo}
            </option>
          ))}
        </select>
      </div>
      <div className="linha-botoes">
        {[5, 15, 60].map((min) => (
          <button key={min} type="button" onClick={() => aoPassarTempo(min)}>
            +{min} min
          </button>
        ))}
        <button type="button" onClick={() => aoPassarTempo(24 * 60)}>
          +1 dia
        </button>
      </div>
      <p className="nota">
        A idade do paciente avança com o relógio. Para dar uma medicação, preencha o item na folha e clique em
        “Administrar”. Os efeitos são fictícios (A VALIDAR).
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
