import { useMemo, useReducer, useState } from 'react';
import { casoDemonstracao } from '../casos/demonstracao';
import { hospitalAtual } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { MEDICACOES_EXEMPLO } from '../dados/medicacoes/exemplos-a-validar';
import { acrescentarEvento, type EventoPaciente, reproduzirEventos } from '../motor/paciente';
import { pacienteNoMinuto } from '../paciente/atual';
import { lerDataHora } from '../paciente/variaveis';
import { type Checagem, itensParaAprazar } from '../prescricao/aprazamento';
import { prescricaoVazia, reduzirPrescricao } from '../prescricao/estado';
import { ControlesCaso } from './ControlesCaso';
import { FolhaPrescricao } from './FolhaPrescricao';
import { PainelPaciente } from './PainelPaciente';
import { QuadroHorarios } from './QuadroHorarios';
import { RascunhoCalculos } from './RascunhoCalculos';
import { ReceitaAlta } from './ReceitaAlta';

/** Modo "Prescrever": folha de prescrição, rascunho e paciente que reage às medicações administradas. */
export function Prescrever() {
  const caso = casoDemonstracao;
  const { config } = useConfiguracoes();
  const [prescricao, despachar] = useReducer(reduzirPrescricao, undefined, prescricaoVazia);
  const [pacienteVisivel, setPacienteVisivel] = useState(true);
  // folha hospitalar ou receita de alta (as duas ficam abertas: trocar não apaga nada)
  const [documento, setDocumento] = useState<'folha' | 'receita'>('folha');
  const [rascunho, setRascunho] = useState('');
  // o paciente é sempre recalculado a partir da lista de eventos (motor estado + eventos)
  const [eventos, setEventos] = useState<EventoPaciente[]>([]);
  const paciente = useMemo(() => reproduzirEventos(caso, eventos), [caso, eventos]);
  // idade, faixa e superfície corporal no minuto atual do relógio do caso
  const pacienteAtual = useMemo(
    () => pacienteNoMinuto(caso, paciente.tempoMin, config.fonteFaixa),
    [caso, paciente.tempoMin, config.fonteFaixa],
  );
  const registrarEvento = (evento: EventoPaciente) => setEventos((lista) => acrescentarEvento(lista, evento));
  // doses checadas pela enfermagem no quadro de horários
  const [checagens, setChecagens] = useState<Checagem[]>([]);
  const aprazaveis = useMemo(() => itensParaAprazar(prescricao, MEDICACOES_EXEMPLO), [prescricao]);

  return (
    <div className="prescrever">
      <header className="cabecalho">
        <h1>Prescrever</h1>
        <span className="subtitulo">{caso.titulo}</span>
        <div className="alternar-documento" role="group" aria-label="Documento">
          <button type="button" aria-pressed={documento === 'folha'} onClick={() => setDocumento('folha')}>
            Folha de prescrição
          </button>
          <button type="button" aria-pressed={documento === 'receita'} onClick={() => setDocumento('receita')}>
            Receita de alta
          </button>
        </div>
        <button type="button" onClick={() => window.print()} title="Na janela de impressão, escolha “Salvar como PDF” para gerar o arquivo">
          🖨 Imprimir / PDF
        </button>
        <button type="button" onClick={() => setPacienteVisivel((v) => !v)}>
          {pacienteVisivel ? 'Ocultar paciente' : 'Mostrar paciente'}
        </button>
      </header>
      <p className="aviso-treino" role="note">
        ⚠️ Ferramenta de treinamento. Não substitui protocolos institucionais nem o julgamento clínico.
      </p>

      <main className={pacienteVisivel ? 'area com-paciente' : 'area'}>
        {pacienteVisivel && (
          <PainelPaciente caso={caso} paciente={pacienteAtual} sinais={paciente.sinais} fonteDaFaixa={config.fonteFaixa}>
            <ControlesCaso paciente={paciente} agora={pacienteAtual.agora} aoEvento={registrarEvento} />
          </PainelPaciente>
        )}
        <div className="coluna-documento">
          <div hidden={documento !== 'receita'}>
            <ReceitaAlta paciente={pacienteAtual} medicacoes={MEDICACOES_EXEMPLO} />
          </div>
          <div hidden={documento !== 'folha'}>
            <FolhaPrescricao
              paciente={pacienteAtual}
              estado={prescricao}
              despachar={despachar}
              medicacoes={MEDICACOES_EXEMPLO}
              aoAdministrar={(medicacaoId, descricao) =>
                registrarEvento({ tipo: 'medicacaoAdministrada', medicacaoId, descricao })
              }
            />
          </div>
        </div>
        <div className="coluna-direita">
          <QuadroHorarios
            itens={aprazaveis}
            inicio={lerDataHora(caso.inicio)}
            agoraMin={paciente.tempoMin}
            hospital={hospitalAtual(config)}
            checagens={checagens}
            aoChecar={(dose) => {
              setChecagens((lista) => [
                ...lista,
                { itemId: dose.itemId, minutoMarcado: dose.minuto, feitaNoMinuto: paciente.tempoMin },
              ]);
              registrarEvento({
                tipo: 'medicacaoAdministrada',
                medicacaoId: dose.medicacaoId,
                descricao: `${dose.descricao} (horário das ${dose.hora})`,
              });
            }}
          />
          <RascunhoCalculos texto={rascunho} aoMudar={setRascunho} />
        </div>
      </main>
    </div>
  );
}
