import { useMemo, useState } from 'react';
import { casosPorGrupo } from '../casos/index';
import { hospitalAtual, toleranciaDe } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { EXAMES } from '../dados/exames';
import { useBanco } from '../dados/medicacoes/ContextoBanco';
import { calcularBalanco, pesoPeloBalanco } from '../motor/balanco';
import { avaliarDose } from '../motor/avaliarDose';
import { reproduzirEventos } from '../motor/paciente';
import { pacienteNoMinuto } from '../paciente/atual';
import { lerDataHora } from '../paciente/variaveis';
import { itensParaAprazar } from '../prescricao/aprazamento';
import { lerNumero } from '../prescricao/comum';
import type { AcaoPrescricao } from '../prescricao/estado';
import type { CamposMedicacao } from '../prescricao/itemMedicacao';
import { gerarRelatorio } from '../relatorio/relatorio';
import { useSessao } from '../sessao/ContextoSessao';
import { temTrabalho } from '../sessao/sessao';
import { ControlesCaso, formatarTempo } from './ControlesCaso';
import { FolhaPrescricao } from './FolhaPrescricao';
import { PainelBalanco } from './PainelBalanco';
import { PainelExames } from './PainelExames';
import { PainelPaciente } from './PainelPaciente';
import { QuadroHorarios } from './QuadroHorarios';
import { RascunhoCalculos } from './RascunhoCalculos';
import { ReceitaAlta } from './ReceitaAlta';
import { RelatorioCaso } from './RelatorioCaso';
import { RevisaoSessao } from './RevisaoSessao';

/**
 * Modo "Prescrever": o caso e a sessão vêm do ProvedorSessao (src/sessao/ContextoSessao.tsx).
 * Tudo o que o aluno faz passa pelo registro da sessão (B12): dá para rever o caso, continuar depois (B13)
 * e o professor acompanhar (B14/B15). Trocar de caso começa uma sessão nova.
 */
export function Prescrever() {
  const { geracao } = useSessao();
  // sessão nova = tela nova (itens abertos, relatório etc. voltam ao início)
  return <SessaoCaso key={geracao} />;
}

/** Uma sessão de um caso: folha de prescrição, rascunho e paciente que reage às medicações administradas. */
function SessaoCaso() {
  const { caso, casos, sessao, fazer, trocarCaso, recomecar } = useSessao();
  const { estado, registros } = sessao;
  const { config } = useConfiguracoes();
  // banco do projeto + apresentações do hospital importadas (aba Banco)
  const { banco: BANCO_MEDICACOES } = useBanco();
  const [relatorioAberto, setRelatorioAberto] = useState(false);
  const [revendo, setRevendo] = useState(false);
  const [pacienteVisivel, setPacienteVisivel] = useState(true);
  // folha hospitalar ou receita de alta (as duas ficam abertas: trocar não apaga nada)
  const [documento, setDocumento] = useState<'folha' | 'receita'>('folha');
  const { prescricao, receita: itensReceita, rascunho, checagens, infusoes, registrosBalanco, pedidos } = estado;
  const despachar = (acao: AcaoPrescricao) => fazer({ tipo: 'prescricao', acao });
  // o paciente é sempre recalculado a partir da lista de eventos (motor estado + eventos)
  const paciente = useMemo(() => reproduzirEventos(caso, estado.eventosPaciente), [caso, estado.eventosPaciente]);
  // idade, faixa e superfície corporal no minuto atual do relógio do caso
  const pacienteAtual = useMemo(
    () => pacienteNoMinuto(caso, paciente.tempoMin, config.fonteFaixa),
    [caso, paciente.tempoMin, config.fonteFaixa],
  );
  const aprazaveis = useMemo(() => itensParaAprazar(prescricao, BANCO_MEDICACOES), [prescricao, BANCO_MEDICACOES]);
  const pedirExame = (exameId: string) => {
    const exame = EXAMES.find((e) => e.id === exameId);
    if (exame) fazer({ tipo: 'pedirExame', exameId, nome: exame.nome });
  };
  const ultimaMensagem = estado.mensagens[estado.mensagens.length - 1];
  // B9: a reação do paciente depende da dose escrita no item (subdose, na faixa, sobredose)
  const avaliar = (campos: CamposMedicacao | undefined) => {
    if (!campos || campos.intervalo === 'continua' || !campos.unidadeDose) return undefined;
    const dose = lerNumero(campos.dose);
    if (dose === null) return undefined;
    return avaliarDose({
      medicacao: BANCO_MEDICACOES.find((m) => m.id === campos.medicacaoId),
      resposta: caso.respostas?.find((r) => r.medicacaoId === campos.medicacaoId),
      ...(campos.indicacao && { indicacao: campos.indicacao }),
      faixa: pacienteAtual.faixa,
      variaveis: pacienteAtual.paraRegra,
      ...(campos.via && { via: campos.via }),
      pesoKg: pacienteAtual.pesoKg,
      dose,
      unidade: campos.unidadeDose,
      fontePreferida: config.fonteDose,
    });
  };
  const camposDoItem = (itemId: number) => {
    for (const lista of Object.values(prescricao.itens)) {
      const item = lista.find((i) => i.id === itemId);
      if (item?.tipo === 'medicacao') return item.campos;
    }
    return undefined;
  };
  // B10: peso estimado pelo balanço desde o início do caso
  const pesoEstimadoKg = useMemo(() => {
    const b = calcularBalanco({
      infusoes,
      registros: registrosBalanco,
      diureseMlKgH: caso.diureseMlKgH ?? 1,
      pesoKg: caso.paciente.pesoKg,
      deMin: 0,
      ateMin: paciente.tempoMin,
    });
    return pesoPeloBalanco(caso.paciente.pesoKg, b.balancoMl);
  }, [infusoes, registrosBalanco, caso, paciente.tempoMin]);

  const houveTrabalho = temTrabalho(registros);
  const relatorio = relatorioAberto
    ? gerarRelatorio({
        caso,
        prescricao,
        receita: itensReceita.map((i) => i.campos),
        eventos: estado.eventosPaciente,
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
              if (houveTrabalho && !window.confirm('Trocar de caso começa do zero (folha, relógio, exames). Continuar?')) return;
              trocarCaso(e.target.value);
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
        <button
          type="button"
          className="botao-relatorio"
          onClick={() => {
            fazer({ tipo: 'relatorio' });
            setRelatorioAberto(true);
          }}
        >
          📋 Relatório
        </button>
        <button type="button" onClick={() => setRevendo(true)} title="Ver tudo o que foi feito, passo a passo">
          ⏪ Rever o caso
        </button>
        <button
          type="button"
          onClick={() => {
            if (!houveTrabalho || window.confirm('Recomeçar este caso do zero? (folha, relógio, exames)')) recomecar();
          }}
        >
          ↺ Recomeçar
        </button>
        <button type="button" onClick={() => setPacienteVisivel((v) => !v)}>
          {pacienteVisivel ? 'Ocultar paciente' : 'Mostrar paciente'}
        </button>
      </header>
      <p className="aviso-treino" role="note">
        ⚠️ Ferramenta de treinamento. Não substitui protocolos institucionais nem o julgamento clínico.
      </p>
      {ultimaMensagem && (
        <p className="mensagem-professor" role="status" aria-label="Mensagem do professor">
          👩‍🏫 <strong>Professor ({formatarTempo(ultimaMensagem.minutoCaso)}):</strong> {ultimaMensagem.texto}
        </p>
      )}

      <main className={pacienteVisivel ? 'area com-paciente' : 'area'}>
        {pacienteVisivel && (
          <PainelPaciente
            caso={caso}
            paciente={pacienteAtual}
            sinais={paciente.sinais}
            clinico={paciente.clinico}
            pesoEstimadoKg={pesoEstimadoKg}
            fonteDaFaixa={config.fonteFaixa}
          >
            <ControlesCaso paciente={paciente} agora={pacienteAtual.agora} aoPassarTempo={(minutos) => fazer({ tipo: 'tempo', minutos })} />
          </PainelPaciente>
        )}
        <div className="coluna-documento">
          <div hidden={documento !== 'receita'}>
            <ReceitaAlta
              paciente={pacienteAtual}
              medicacoes={BANCO_MEDICACOES}
              itens={itensReceita}
              aoAdicionar={() => fazer({ tipo: 'receitaAdicionar' })}
              aoMudar={(id, campos) => fazer({ tipo: 'receitaEditar', id, campos })}
              aoRemover={(id) => fazer({ tipo: 'receitaRemover', id })}
            />
          </div>
          <div hidden={documento !== 'folha'}>
            <FolhaPrescricao
              paciente={pacienteAtual}
              estado={prescricao}
              despachar={despachar}
              medicacoes={BANCO_MEDICACOES}
              aoAdministrar={(medicacaoId, descricao, vazaoMlH, campos) => {
                const avaliacao = avaliar(campos);
                fazer({
                  tipo: 'administrar',
                  medicacaoId,
                  descricao,
                  ...(vazaoMlH !== undefined && { vazaoMlH }),
                  ...(avaliacao && { avaliacao }),
                });
              }}
              aoConferir={(itemId, descricao) => fazer({ tipo: 'conferir', itemId, descricao })}
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
              const avaliacao = avaliar(camposDoItem(dose.itemId));
              fazer({
                tipo: 'checarDose',
                itemId: dose.itemId,
                minutoMarcado: dose.minuto,
                medicacaoId: dose.medicacaoId,
                descricao: `${dose.descricao} (horário das ${dose.hora})`,
                ...(avaliacao && { avaliacao }),
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
            aoRegistrar={(registro) => fazer({ tipo: 'balanco', registro })}
          />
          <RascunhoCalculos texto={rascunho} aoMudar={(texto) => fazer({ tipo: 'rascunho', texto })} />
        </div>
      </main>
      {relatorio && <RelatorioCaso relatorio={relatorio} aoFechar={() => setRelatorioAberto(false)} />}
      {revendo && <RevisaoSessao caso={caso} registros={registros} aoFechar={() => setRevendo(false)} />}
    </div>
  );
}
