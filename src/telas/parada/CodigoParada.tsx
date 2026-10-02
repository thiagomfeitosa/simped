import { useEffect, useMemo, useState } from 'react';
import { NOME_RITMO } from '../../casos/tipos';
import { toleranciaDe } from '../../configuracoes/configuracoes';
import { useConfiguracoes } from '../../configuracoes/ContextoConfiguracoes';
import { CENARIOS_PARADA } from '../../dados/parada-a-validar';
import { relacaoDoCenario } from '../../parada/debriefing';
import { estadoDaParada } from '../../parada/parada';
import { estadoRcp } from '../../parada/rcp';
import { cenarioDaSala, compressorDaVez, membrosDaSala, papeisDaTela, rcpPelasTeclas, relogioDaSala, tempoDoRelogio } from '../../parada/sala';
import { FolhaEmergencia } from '../FolhaEmergencia';
import { AntesDoCodigo } from './AntesDoCodigo';
import { Contexto, type ContextoCodigo } from './contexto';
import { DepoisDoCodigo } from './Debriefing';
import { DuranteCodigo } from './DuranteCodigo';
import { useSalaParada } from './useSalaParada';

/**
 * Código de parada (PCR pediátrica) em três telas: ANTES (cenário, equipe, teclas, briefing),
 * DURANTE (cada membro vê o painel do seu papel e o que a equipe fez) e DEPOIS (avaliação,
 * qualidade da RCP, equipe e debriefing). A equipe pode dividir uma tela ou abrir várias janelas.
 * Doses, tempos e alvos: A VALIDAR.
 */
export function CodigoParada() {
  const { config } = useConfiguracoes();
  const s = useSalaParada();
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
  const recomecos = useMemo(() => eventos.filter((e) => e.tipo === 'checarRitmo' || e.tipo === 'choque').map((e) => e.tS), [eventos]);
  const rcp = teclas ? estadoRcp(s.sala.marcas, { relacao, recomecosS: recomecos, ...(estado.viaAvancadaS !== undefined && { viaAvancadaS: estado.viaAvancadaS }) }, tS) : null;
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
    meusPapeis: papeisDaTela(s.sala, s.tela, s.vivas),
    rcp,
    relacao,
    compressorDaVez: compressorDaVez(s.sala, estado.ciclo.numero, s.vivas),
    prova,
    tolerancia: toleranciaDe(config),
    pausado,
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
        {fase === 'antes' && <AntesDoCodigo s={s} cenario={cenario} aoAbrirFolha={() => setFolhaAberta(true)} aoIniciar={() => s.iniciar(ctx.meusPapeis.includes('lider') ? 'lider' : ctx.meusPapeis[0])} />}
        {fase === 'durante' && <DuranteCodigo />}
        {fase === 'depois' && <DepoisDoCodigo aoRecomecar={s.recomecar} />}
        {folhaAberta && <FolhaEmergencia pesoKg={cenario.pesoKg} idadeAnos={cenario.idadeAnos} titulo={`${cenario.titulo} (${cenario.idadeTexto})`} aoFechar={() => setFolhaAberta(false)} />}
      </div>
    </Contexto.Provider>
  );
}
