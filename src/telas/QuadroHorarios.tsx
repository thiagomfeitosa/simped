import type { ConfiguracaoHospital } from '../dados/hospitais';
import {
  type Checagem,
  type DoseAgendada,
  gerarAgenda,
  type ItemParaAprazar,
  podeChecar,
  situacaoDaDose,
  type SituacaoDose,
} from '../prescricao/aprazamento';

const NOME_SITUACAO: Record<SituacaoDose, string> = {
  feita: '✔ checada',
  atrasada: '⚠ atrasada',
  agora: '● na hora',
  pendente: 'aguardando',
};

interface Props {
  itens: readonly ItemParaAprazar[];
  inicio: Date;
  agoraMin: number;
  hospital: ConfiguracaoHospital;
  checagens: readonly Checagem[];
  aoChecar: (dose: DoseAgendada) => void;
}

/** Quadro de horários da enfermagem: doses das últimas 12 h e das próximas 24 h do relógio do caso. */
export function QuadroHorarios({ itens, inicio, agoraMin, hospital, checagens, aoChecar }: Props) {
  const agenda = gerarAgenda(itens, inicio, agoraMin + 24 * 60, hospital).filter((d) => d.minuto >= agoraMin - 12 * 60);

  return (
    <section className="painel quadro-horarios" aria-label="Quadro de horários">
      <h2>Horários (enfermagem)</h2>
      {agenda.length === 0 ? (
        <p className="nota">
          Prescreva medicações com intervalo (ex.: 8/8h) para aparecerem aqui. Infusão contínua e soro não têm horário.
        </p>
      ) : (
        <ol className="horarios">
          {agenda.map((d) => {
            const situacao = situacaoDaDose(d, checagens, agoraMin);
            const dia = Math.floor((d.minuto + inicio.getUTCHours() * 60 + inicio.getUTCMinutes()) / (24 * 60)) + 1;
            return (
              <li key={`${d.itemId}-${d.minuto}`} className={`dose dose-${situacao}`}>
                <span className="dose-hora">
                  {d.hora} <small>D{dia}</small>
                </span>
                <span className="dose-descricao">{d.descricao}</span>
                <span className="dose-situacao">{NOME_SITUACAO[situacao]}</span>
                {podeChecar(situacao) && (
                  <button type="button" onClick={() => aoChecar(d)}>
                    Checar
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      )}
      <p className="nota">
        Horários do hospital {hospital.nome}: {hospital.statusAprazamento === 'A_VALIDAR' ? 'A VALIDAR' : 'conferidos'}. Dose
        “na hora” = até 30 min antes ou depois; depois disso fica atrasada. Só a dose checada chega ao paciente.
      </p>
    </section>
  );
}
