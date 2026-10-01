import { useMemo, useReducer, useState } from 'react';
import { casoDemonstracao } from '../casos/demonstracao';
import { MEDICACOES_EXEMPLO } from '../dados/medicacoes/exemplos-a-validar';
import { acrescentarEvento, type EventoPaciente, reproduzirEventos } from '../motor/paciente';
import { pacienteNoMinuto } from '../paciente/atual';
import { prescricaoVazia, reduzirPrescricao } from '../prescricao/estado';
import { ControlesCaso } from './ControlesCaso';
import { FolhaPrescricao } from './FolhaPrescricao';
import { PainelPaciente } from './PainelPaciente';
import { RascunhoCalculos } from './RascunhoCalculos';

/** Modo "Prescrever": folha de prescrição, rascunho e paciente que reage às medicações administradas. */
export function Prescrever() {
  const caso = casoDemonstracao;
  const [prescricao, despachar] = useReducer(reduzirPrescricao, undefined, prescricaoVazia);
  const [pacienteVisivel, setPacienteVisivel] = useState(true);
  const [rascunho, setRascunho] = useState('');
  // o paciente é sempre recalculado a partir da lista de eventos (motor estado + eventos)
  const [eventos, setEventos] = useState<EventoPaciente[]>([]);
  const paciente = useMemo(() => reproduzirEventos(caso, eventos), [caso, eventos]);
  // idade, faixa e superfície corporal no minuto atual do relógio do caso
  const pacienteAtual = useMemo(() => pacienteNoMinuto(caso, paciente.tempoMin), [caso, paciente.tempoMin]);
  const registrarEvento = (evento: EventoPaciente) => setEventos((lista) => acrescentarEvento(lista, evento));

  return (
    <div className="prescrever">
      <header className="cabecalho">
        <h1>Prescrever</h1>
        <span className="subtitulo">{caso.titulo}</span>
        <button type="button" onClick={() => setPacienteVisivel((v) => !v)}>
          {pacienteVisivel ? 'Ocultar paciente' : 'Mostrar paciente'}
        </button>
      </header>
      <p className="aviso-treino" role="note">
        ⚠️ Ferramenta de treinamento. Não substitui protocolos institucionais nem o julgamento clínico.
      </p>

      <main className={pacienteVisivel ? 'area com-paciente' : 'area'}>
        {pacienteVisivel && (
          <PainelPaciente caso={caso} paciente={pacienteAtual} sinais={paciente.sinais}>
            <ControlesCaso paciente={paciente} agora={pacienteAtual.agora} aoEvento={registrarEvento} />
          </PainelPaciente>
        )}
        <FolhaPrescricao
          paciente={pacienteAtual}
          estado={prescricao}
          despachar={despachar}
          medicacoes={MEDICACOES_EXEMPLO}
          aoAdministrar={(medicacaoId, descricao) =>
            registrarEvento({ tipo: 'medicacaoAdministrada', medicacaoId, descricao })
          }
        />
        <RascunhoCalculos texto={rascunho} aoMudar={setRascunho} />
      </main>
    </div>
  );
}
