import type { Paciente } from '../dados/pacientes';
import { mostrarNumero } from './numeros';

export function PainelPaciente({ paciente }: { paciente: Paciente }) {
  return (
    <section className="painel">
      <h2>Paciente</h2>
      <span className={`faixa faixa-${paciente.faixa}`}>{paciente.faixa}</span>
      <dl>
        <dt>Nome</dt>
        <dd>{paciente.nome}</dd>
        <dt>Idade</dt>
        <dd>{paciente.idade}</dd>
        <dt>Sexo</dt>
        <dd>{paciente.sexo === 'F' ? 'Feminino' : 'Masculino'}</dd>
        <dt>Peso</dt>
        <dd>{mostrarNumero(paciente.pesoKg, 3)} kg</dd>
        {paciente.idadeGestacionalSemanas !== undefined && (
          <>
            <dt>IG ao nascer</dt>
            <dd>{paciente.idadeGestacionalSemanas} semanas</dd>
          </>
        )}
        <dt>Leito</dt>
        <dd>{paciente.leito}</dd>
        <dt>Diagnósticos</dt>
        <dd>
          <ul>
            {paciente.diagnosticos.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </dd>
      </dl>
      <p className="nota">Sinais vitais e evolução do caso entram nos próximos passos.</p>
    </section>
  );
}
