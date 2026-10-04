import { useCallback, useEffect, useMemo, useState } from 'react';
import { NOME_RITMO } from '../../casos/tipos';
import { toleranciaDe } from '../../configuracoes/configuracoes';
import { useConfiguracoes } from '../../configuracoes/ContextoConfiguracoes';
import { CENARIOS_PARADA } from '../../dados/parada-a-validar';
import { relacaoDoCenario } from '../../parada/debriefing';
import { estadoDaParada } from '../../parada/parada';
import { CHAVES, cenarioDaSala, compressorDaVez, marcaDeAssistir, membrosDaSala, observadoresDaSala, papeisDaTela, rcpPelasTeclas, relogioDaSala, tempoDoRelogio } from '../../parada/sala';
import { FolhaEmergencia } from '../FolhaEmergencia';
import { AntesDoCodigo } from './AntesDoCodigo';
import { Contexto, type ContextoCodigo, rcpNoTempo } from './contexto';
import { DepoisDoCodigo } from './Debriefing';
import { DuranteCodigo } from './DuranteCodigo';
import { TelaObservador } from './TelaObservador';
import { type SalaNaTela, useSalaParada } from './useSalaParada';

/** Janela aberta para só assistir (professor, telão): ?assistir=parada no endereço. */
function assistirPeloEndereco(): boolean {
  try {
    return new URLSearchParams(window.location.search).get('assistir') === 'parada';
  } catch {
    return false;
  }
}

/** Guarda (ou tira) o "só assistir" no endereço: recarregar a página mantém o modo. */
function marcarNoEndereco(assistir: boolean) {
  try {
    const url = new URL(window.location.href);
    if (assistir) url.searchParams.set('assistir', 'parada');
    else url.searchParams.delete('assistir');
    window.history.replaceState(window.history.state, '', url.toString());
  } catch {
    // endereço que não muda (ex.: arquivo aberto com dois cliques em alguns navegadores): vale só nesta tela
  }
}

/**
 * Modo "só assistir" desta tela, avisado à sala (as telas que só assistem não recebem papéis).
 * A tela que acabou de abrir espera a sala das outras chegar antes de escrever: senão a sala vazia
 * dela (uma rodada nova) venceria a da equipe.
 */
function useAssistir(s: SalaNaTela) {
  const [assistindo, setAssistindo] = useState(assistirPeloEndereco);
  const [esperou, setEsperou] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setEsperou(true), 1000);
    return () => window.clearTimeout(id);
  }, []);
  const naSala = observadoresDaSala(s.sala).has(s.tela);
  const pronta = s.sala.criadaEm !== 0 || esperou;
  const { mudar, tela, sala } = s;
  useEffect(() => {
    // ao deixar de assistir durante o código, grava a hora: a tela volta no fim da fila (não toma os papéis de ninguém);
    // antes de começar, volta ao lugar de entrada
    if (assistindo !== naSala && pronta) mudar(CHAVES.observador(tela), marcaDeAssistir(sala, assistindo, Date.now()));
  }, [assistindo, naSala, pronta, mudar, tela, sala]);
  const trocar = useCallback((assistir: boolean) => {
    marcarNoEndereco(assistir);
    setAssistindo(assistir);
  }, []);
  return [assistindo, trocar] as const;
}

/**
 * Código de parada (PCR pediátrica) em três telas: ANTES (cenário, equipe, teclas, briefing),
 * DURANTE (a cena da RCP para todos; cada membro vê o painel do seu papel e o que a equipe fez) e
 * DEPOIS (avaliação, qualidade da RCP, equipe, debriefing e "rever o código"). A equipe pode dividir
 * uma tela ou abrir várias janelas; o professor ou o telão podem só assistir (?assistir=parada).
 * Doses, tempos e alvos: A VALIDAR.
 */
export function CodigoParada() {
  const { config } = useConfiguracoes();
  const s = useSalaParada();
  const [assistindo, setAssistindo] = useAssistir(s);
  const [, setTique] = useState(0);
  const [folhaAberta, setFolhaAberta] = useState(false);
  const cenarioId = cenarioDaSala(s.sala, CENARIOS_PARADA[0]!.id);
  const cenario = CENARIOS_PARADA.find((c) => c.id === cenarioId) ?? CENARIOS_PARADA[0]!;
  const relogio = relogioDaSala(s.sala);
  const pausado = relogio.desdeMs === null;

  // o relógio anda: redesenha 5 vezes por segundo
  useEffect(() => {
    if (pausado) return;
    const id = window.setInterval(() => setTique((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, [pausado]);

  const tS = tempoDoRelogio(relogio, Date.now());
  const eventos = s.sala.eventos;
  const estado = estadoDaParada(cenario, eventos, tS);
  const prova = config.modo === 'prova';
  const relacao = relacaoDoCenario(cenario);
  const teclas = rcpPelasTeclas(s.sala);
  const rcp = teclas ? rcpNoTempo(s.sala, estado, relacao, tS) : null;
  const ritmos = useMemo(
    () =>
      eventos.map((e, i) => {
        if (e.tipo !== 'checarRitmo') return undefined;
        const st = estadoDaParada(cenario, eventos.slice(0, i + 1), e.tS);
        return st.rce ? 'retorno da circulação (com pulso)' : prova ? 'sem pulso' : NOME_RITMO[st.ritmo];
      }),
    [eventos, cenario, prova],
  );
  const fase = !estado.iniciada ? 'antes' : estado.encerrada ? 'depois' : 'durante';

  const ctx: ContextoCodigo = {
    s,
    cenario,
    estado,
    tS,
    membros: membrosDaSala(s.sala),
    meusPapeis: assistindo ? [] : papeisDaTela(s.sala, s.tela, s.vivas),
    rcp,
    relacao,
    compressorDaVez: compressorDaVez(s.sala, estado.ciclo.numero, s.vivas),
    prova,
    tolerancia: toleranciaDe(config),
    pausado,
    assistindo,
    ritmoNaChecagem: (i) => ritmos[i],
    abrirFolha: () => setFolhaAberta(true),
  };

  return (
    <Contexto.Provider value={ctx}>
      <div className={`pagina-simples codigo-parada fase-${fase}`}>
        <header className="cabecalho">
          <h1>🚨 Código de parada</h1>
          <ol className="etapas-codigo" aria-label="Etapas do código">
            <li className={fase === 'antes' ? 'atual' : 'feita'}>1. Preparar</li>
            <li className={fase === 'durante' ? 'atual' : fase === 'depois' ? 'feita' : ''}>2. Código</li>
            <li className={fase === 'depois' ? 'atual' : ''}>3. Debriefing</li>
          </ol>
        </header>
        <p className="aviso-treino" role="note">
          ⚠️ Treinamento. Doses, energias, tempos e alvos da RCP: A VALIDAR (PALS). Não substitui protocolos institucionais.
        </p>
        {assistindo ? (
          <TelaObservador fase={fase} aoSair={() => setAssistindo(false)} />
        ) : (
          <>
            {fase === 'antes' && (
              <AntesDoCodigo
                s={s}
                cenario={cenario}
                aoAbrirFolha={() => setFolhaAberta(true)}
                aoIniciar={() => s.iniciar(ctx.meusPapeis.includes('lider') ? 'lider' : ctx.meusPapeis[0])}
                aoAssistir={() => setAssistindo(true)}
              />
            )}
            {fase === 'durante' && <DuranteCodigo />}
            {fase === 'depois' && <DepoisDoCodigo aoRecomecar={s.recomecar} />}
          </>
        )}
        {folhaAberta && <FolhaEmergencia pesoKg={cenario.pesoKg} idadeAnos={cenario.idadeAnos} titulo={`${cenario.titulo} (${cenario.idadeTexto})`} aoFechar={() => setFolhaAberta(false)} />}
      </div>
    </Contexto.Provider>
  );
}
