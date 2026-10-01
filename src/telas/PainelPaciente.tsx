import type { ReactNode } from 'react';
import type { CasoClinico, SinaisVitais } from '../casos/tipos';

const NOME_FAIXA = { RN: 'Recém-nascido', crianca: 'Criança', adolescente: 'Adolescente' } as const;

function formatar(valor: number, casas = 0): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

interface Props {
  caso: CasoClinico;
  sinais: SinaisVitais;
  children?: ReactNode;
}

export function PainelPaciente({ caso, sinais, children }: Props) {
  const { paciente } = caso;
  const vitais: [string, string, string][] = [
    ['FC', formatar(sinais.fc), 'bpm'],
    ['FR', formatar(sinais.fr), 'irpm'],
    ['SpO₂', formatar(sinais.spo2), '%'],
    ['PA', `${formatar(sinais.paSistolica)} × ${formatar(sinais.paDiastolica)}`, 'mmHg'],
    ['Temp. axilar', formatar(sinais.temperaturaC, 1), '°C'],
    ['Glicemia capilar', formatar(sinais.glicemiaMgDl), 'mg/dL'],
  ];

  return (
    <aside className="painel painel-paciente" aria-label="Paciente">
      <h2>{caso.titulo}</h2>
      <dl className="ficha">
        <dt>Nome</dt>
        <dd>{paciente.nome}</dd>
        <dt>Idade</dt>
        <dd>
          {paciente.idadeTexto} ({NOME_FAIXA[paciente.faixa]})
        </dd>
        <dt>Peso</dt>
        <dd>{formatar(paciente.pesoKg, 1)} kg</dd>
        <dt>Leito</dt>
        <dd>{paciente.leito}</dd>
      </dl>

      <h3>Sinais vitais</h3>
      <div className="vitais">
        {vitais.map(([rotulo, valor, unidade]) => (
          <div className="vital" key={rotulo}>
            <span className="vital-rotulo">{rotulo}</span>
            <span className="vital-valor">{valor}</span>
            <span className="vital-unidade">{unidade}</span>
          </div>
        ))}
      </div>

      {children}

      <h3>Queixa</h3>
      <p>{caso.queixa}</p>
      <h3>História</h3>
      <p>{caso.historia}</p>
      <h3>Exame físico</h3>
      <p>{caso.exameFisico}</p>
    </aside>
  );
}
