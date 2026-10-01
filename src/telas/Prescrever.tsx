import { useEffect, useMemo, useReducer, useState } from 'react';
import { useCasos } from '../casos/ContextoCasos';
import { CASOS, casosPorGrupo } from '../casos/index';
import type { CasoClinico } from '../casos/tipos';
import { hospitalAtual, toleranciaDe } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { useBanco } from '../dados/medicacoes/ContextoBanco';
import { acrescentarEvento, type EventoPaciente, reproduzirEventos } from '../motor/paciente';
import { pacienteNoMinuto } from '../paciente/atual';
import { lerDataHora } from '../paciente/variaveis';
import { EXAMES } from '../dados/exames';
import type { PedidoExame } from '../exames/exames';
import type { Infusao, RegistroManual } from '../motor/balanco';
import { type Checagem, itensParaAprazar } from '../prescricao/aprazamento';
import { prescricaoVazia, reduzirPrescricao } from '../prescricao/estado';
import { gerarRelatorio } from '../relatorio/relatorio';
import { ControlesCaso } from './ControlesCaso';
import { FolhaPrescricao } from './FolhaPrescricao';
import { PainelBalanco } from './PainelBalanco';
import { PainelExames } from './PainelExames';
import { PainelPaciente } from './PainelPaciente';
import { QuadroHorarios } from './QuadroHorarios';
import { RascunhoCalculos } from './RascunhoCalculos';
import { type ItemReceita, ReceitaAlta } from './ReceitaAlta';
import { RelatorioCaso } from './RelatorioCaso';

const CHAVE_CASO = 'simped.caso-atual';

function casoGuardado(): string | null {
  try {
    return window.localStorage.getItem(CHAVE_CASO);
  } catch {
    return null;
  }
}

/**
 * Modo "Prescrever": escolhe o caso e abre uma sessão. Trocar de caso começa uma sessão nova
 * (folha, relógio, exames e balanço do zero).
 */
export function Prescrever() {
  const { personalizados } = useCasos();
  const casos = useMemo(() => [...CASOS, ...personalizados], [personalizados]);
  const [casoId, setCasoId] = useState<string>(() => casoGuardado() ?? CASOS[0]!.id);
  const caso = casos.find((c) => c.id === casoId) ?? CASOS[0]!;
  const trocar = (id: string) => {
    setCasoId(id);
    try {
      window.localStorage.setItem(CHAVE_CASO, id);
    } catch {
      // sem armazenamento: só não lembra o caso na próxima vez
    }
  };
  // o editor de casos pede para abrir um caso ("Jogar este caso")
  useEffect(() => {
    const abrir = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id === 'string') trocar(id);
    };
    window.addEventListener('simped:abrir-caso', abrir);
    return () => window.removeEventListener('simped:abrir-caso', abrir);
  });
  return <SessaoCaso key={caso.id} caso={caso} casos={casos} aoTrocarCaso={trocar} />;
}

interface PropsSessao {
  caso: CasoClinico;
  casos: readonly CasoClinico[];
  aoTrocarCaso: (id: string) => void;
}

/** Uma sessão de um caso: folha de prescrição, rascunho e paciente que reage às medicações administradas. */
function SessaoCaso({ caso, casos, aoTrocarCaso }: PropsSessao) {
  const { config } = useConfiguracoes();
  // banco do projeto + apresentações do hospital importadas (aba Banco)
  const { banco: BANCO_MEDICACOES } = useBanco();
  const [itensReceita, setItensReceita] = useState<ItemReceita[]>([]);
  const [relatorioAberto, setRelatorioAberto] = useState(false);
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
  const aprazaveis = useMemo(() => itensParaAprazar(prescricao, BANCO_MEDICACOES), [prescricao, BANCO_MEDICACOES]);
  // balanço hídrico: soros/infusões instalados e registros manuais
  const [infusoes, setInfusoes] = useState<Infusao[]>([]);
  const [registrosBalanco, setRegistrosBalanco] = useState<RegistroManual[]>([]);
  // exames pedidos (o resultado sai depois, pelo relógio do caso)
  const [pedidos, setPedidos] = useState<PedidoExame[]>([]);
  const pedirExame = (exameId: string) => {
    const exame = EXAMES.find((e) => e.id === exameId);
    if (!exame) return;
    setPedidos((lista) => [...lista, { id: lista.length + 1, exameId, pedidoNoMinuto: paciente.tempoMin }]);
    despachar({ tipo: 'adicionar', secao: 'exames', texto: exame.nome });
    registrarEvento({ tipo: 'anotacao', descricao: `Exame pedido: ${exame.nome}` });
  };

  const temTrabalho = eventos.length > 0 || Object.values(prescricao.itens).some((l) => l.length > 0) || itensReceita.length > 0;
  const relatorio = relatorioAberto
    ? gerarRelatorio({
        caso,
        prescricao,
        receita: itensReceita.map((i) => i.campos),
        eventos,
        pedidos,
        medicacoes: BANCO_MEDICACOES,
        paciente: pacienteAtual,
        agoraMin: paciente.tempoMin,
        fontePreferida: config.fonteDose,
        tolerancia: toleranciaDe(config),
        volumeFinalBicMl: hospitalAtual(config).volumeFinalBicMl,
      })
    : null;

  return (
    <div className={relatorioAberto ? 'prescrever relatorio-aberto' : 'prescrever'}>
      <header className="cabecalho">
        <h1>Prescrever</h1>
        <label className="escolha-caso">
          Caso:
          <select
            aria-label="Caso clínico"
            value={caso.id}
            onChange={(e) => {
              if (temTrabalho && !window.confirm('Trocar de caso começa do zero (folha, relógio, exames). Continuar?')) return;
              aoTrocarCaso(e.target.value);
            }}
          >
            {casosPorGrupo(casos).map(([grupo, lista]) => (
              <optgroup key={grupo} label={grupo}>
                {lista.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <small className="subtitulo">
            {caso.cenario ?? ''}
            {caso.status === 'A_VALIDAR' ? ' · caso A VALIDAR' : ''}
          </small>
        </label>
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
        <button type="button" className="botao-relatorio" onClick={() => setRelatorioAberto(true)}>
          📋 Relatório
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
            <ReceitaAlta
              paciente={pacienteAtual}
              medicacoes={BANCO_MEDICACOES}
              itens={itensReceita}
              aoMudarItens={setItensReceita}
            />
          </div>
          <div hidden={documento !== 'folha'}>
            <FolhaPrescricao
              paciente={pacienteAtual}
              estado={prescricao}
              despachar={despachar}
              medicacoes={BANCO_MEDICACOES}
              aoAdministrar={(medicacaoId, descricao, vazaoMlH) => {
                registrarEvento({ tipo: 'medicacaoAdministrada', medicacaoId, descricao });
                if (vazaoMlH !== undefined && vazaoMlH > 0) {
                  setInfusoes((lista) => [
                    ...lista,
                    { id: lista.length + 1, descricao: descricao.slice(0, 60), inicioMin: paciente.tempoMin, vazaoMlH },
                  ]);
                }
              }}
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
          <PainelExames caso={caso} agoraMin={paciente.tempoMin} pedidos={pedidos} aoPedir={pedirExame} />
          <PainelBalanco
            agoraMin={paciente.tempoMin}
            pesoKg={pacienteAtual.pesoKg}
            diureseMlKgH={caso.diureseMlKgH ?? 1}
            infusoes={infusoes}
            registros={registrosBalanco}
            aoRegistrar={(r) =>
              setRegistrosBalanco((lista) => [...lista, { ...r, id: lista.length + 1, minuto: paciente.tempoMin }])
            }
          />
          <RascunhoCalculos texto={rascunho} aoMudar={setRascunho} />
        </div>
      </main>
      {relatorio && <RelatorioCaso relatorio={relatorio} aoFechar={() => setRelatorioAberto(false)} />}
    </div>
  );
}
