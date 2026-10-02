import { useState } from 'react';
import type { SinaisVitais } from '../../casos/tipos';
import { pesoEstimadoApls } from '../../calculos';
import { CAUSAS_REVERSIVEIS } from '../../dados/parada-a-validar';
import { PAPEIS_EQUIPE, type PainelPapel } from '../../dados/parada-briefing-a-validar';
import { descreverEventos, ordensPendentes, quemFez } from '../../parada/equipe';
import { mmss, tuboEndotraqueal } from '../../parada/parada';
import type { TipoMarca } from '../../parada/rcp';
import { rcpPelasTeclas, relogioDaSala } from '../../parada/sala';
import { formatarNumero } from '../../prescricao/comum';
import { Monitor } from '../Monitor';
import { useCodigo } from './contexto';
import { PainelAnotacao, PainelCompressoes, PainelLider, PainelMedicacao, PainelMonitor, PainelTempo, PainelVentilacao } from './Paineis';
import { FaixaRcp, useTeclasRcp } from './Rcp';

const n = formatarNumero;
const VELOCIDADES = [1, 2, 4] as const;

const NOME_PAINEL: Record<PainelPapel, string> = {
  lider: 'Líder',
  compressoes: 'Compressões',
  ventilacao: 'Ventilação',
  medicacao: 'Medicação',
  monitor: 'Monitor e choque',
  tempo: 'Tempo',
  anotacao: 'Anotação',
};

const PAINEL: Record<PainelPapel, () => React.JSX.Element> = {
  lider: PainelLider,
  compressoes: PainelCompressoes,
  ventilacao: PainelVentilacao,
  medicacao: PainelMedicacao,
  monitor: PainelMonitor,
  tempo: PainelTempo,
  anotacao: PainelAnotacao,
};

/** Sinais do monitor durante o código: sem pulso, o monitor mostra "---" (src/monitor). */
function sinaisDoCodigo(rce: boolean, ritmo: string, idadeAnos: number): SinaisVitais {
  const lactente = idadeAnos < 1;
  if (rce) return { fc: lactente ? 140 : 110, fr: lactente ? 30 : 20, spo2: 92, paSistolica: lactente ? 75 : 90, paDiastolica: 50, temperaturaC: 36, glicemiaMgDl: 110, tecS: 3, glasgow: 6 };
  return { fc: ritmo === 'aesp' ? 50 : ritmo === 'tv' ? 200 : 0, fr: 0, spo2: 0, paSistolica: 0, paDiastolica: 0, temperaturaC: 36, glicemiaMgDl: 100, tecS: 6, glasgow: 3 };
}

/** Barra fixa no alto: tempo de código, pausar e encerrar (o resto fica no painel de cada papel). */
function BarraDoCodigo() {
  const { s, estado, pausado, meusPapeis, membros } = useCodigo();
  const relogio = relogioDaSala(s.sala);
  const teclas = rcpPelasTeclas(s.sala);
  const souLider = meusPapeis.includes('lider');
  return (
    <div className="barra-codigo" role="group" aria-label="Relógio do código">
      <span className="relogio-grande" aria-label="Tempo de código">
        {mmss(estado.tempoS)}
      </span>
      <span className="selo">Ciclo {estado.ciclo.numero}</span>
      <span className="eu-sou" aria-label="Papéis nesta tela">
        {meusPapeis.length === PAPEIS_EQUIPE.length ? 'Toda a equipe nesta tela' : meusPapeis.map((p) => quemFez(p, membros)).join(' · ')}
      </span>
      <span className="barra-codigo-botoes">
        {!teclas && (
          <span className="velocidade" role="group" aria-label="Velocidade do relógio">
            {VELOCIDADES.map((v) => (
              <button key={v} type="button" aria-pressed={relogio.velocidade === v} onClick={() => s.relogio(v)}>
                ×{v}
              </button>
            ))}
          </span>
        )}
        <button type="button" onClick={() => s.relogio(pausado ? 'continuar' : 'pausar')}>
          {pausado ? '▶ Continuar relógio' : '⏸ Pausar relógio'}
        </button>
        <button
          type="button"
          className="botao-perigo"
          onClick={() => {
            if (souLider || window.confirm('Encerrar o código para toda a equipe?')) s.encerrar(souLider ? 'lider' : meusPapeis[0]);
          }}
        >
          ⏹ Encerrar o código
        </button>
      </span>
    </div>
  );
}

/** Recado do tempo, ordem do líder ou "afastem-se" dos últimos segundos, à vista de quem precisa. */
function Recados() {
  const { s, tS, meusPapeis, membros, estado } = useCodigo();
  const recentes = s.sala.eventos.filter((e) => tS - e.tS <= 8 && tS >= e.tS && (e.tipo === 'aviso' || (e.tipo === 'ordem' && meusPapeis.includes(e.para))));
  const pendentes = ordensPendentes(s.sala.eventos, meusPapeis).length;
  if (!recentes.length && estado.carregadoJ === undefined && !pendentes) return null;
  const textos = descreverEventos(s.sala.eventos);
  return (
    <div className="recados" role="status" aria-label="Recados da equipe">
      {estado.carregadoJ !== undefined && <p className="recado perigo">⚡ Carregado {estado.carregadoJ} J — afastem-se!</p>}
      {recentes.map((e) => (
        <p key={e.id} className="recado">
          {textos[s.sala.eventos.indexOf(e)]} <small>— {quemFez(e.por, membros)}</small>
        </p>
      ))}
    </div>
  );
}

/** O que a equipe fez (mais recente primeiro): cada ação com o horário e quem fez. */
function FeedEquipe() {
  const { s, membros, ritmoNaChecagem } = useCodigo();
  const [tudo, setTudo] = useState(false);
  const eventos = s.sala.eventos;
  const textos = descreverEventos(eventos, ritmoNaChecagem);
  const anotados = new Set(eventos.flatMap((e) => (e.tipo === 'anotado' ? [e.eventoId] : [])));
  const inicio = eventos.find((e) => e.tipo === 'iniciar')?.tS ?? 0;
  const linhas = eventos.map((e, i) => ({ e, texto: textos[i]! })).filter(({ e }) => e.tipo !== 'anotado').reverse();
  const mostradas = tudo ? linhas : linhas.slice(0, 12);
  return (
    <section className="painel feed-equipe" aria-label="Registro do código">
      <h2>👥 O que a equipe fez</h2>
      <ol className="linha-do-tempo">
        {mostradas.map(({ e, texto }) => (
          <li key={e.id ?? `${e.tipo}-${e.tS}`}>
            <span className="hora">{mmss(e.tS - inicio)}</span> {texto}
            {e.por && <small className="quem"> — {quemFez(e.por, membros)}</small>}
            {e.id && anotados.has(e.id) && (
              <span className="anotado" title="Anotado na folha">
                {' '}
                ✍️
              </span>
            )}
          </li>
        ))}
      </ol>
      {linhas.length > 12 && (
        <button type="button" className="botao-discreto" onClick={() => setTudo((t) => !t)}>
          {tudo ? 'Mostrar só as últimas' : `Ver tudo (${linhas.length})`}
        </button>
      )}
    </section>
  );
}

/** Consulta rápida (recolhida): causas reversíveis, tubo, peso estimado e folha de emergência. */
function Consulta() {
  const { cenario, prova, abrirFolha } = useCodigo();
  const tubo = tuboEndotraqueal(cenario.idadeAnos);
  const pesoEstimado = cenario.idadeAnos <= 12 ? pesoEstimadoApls(Math.round(cenario.idadeAnos * 12)) : null;
  return (
    <details className="painel consulta-rapida">
      <summary>📚 Consulta rápida</summary>
      <p>
        <strong>{cenario.titulo}</strong> — {cenario.idadeTexto}, {n(cenario.pesoKg)} kg
        {pesoEstimado && !prova && (
          <small>
            {' '}
            (pela idade: {pesoEstimado.formula} = {n(pesoEstimado.pesoKg)} kg — A VALIDAR)
          </small>
        )}
      </p>
      <button type="button" onClick={abrirFolha}>
        📄 Folha de emergência ({n(cenario.pesoKg)} kg)
      </button>
      {!prova && (
        <p className="nota">
          Tubo: com cuff nº {n(tubo.comCuff)} · sem cuff nº {n(tubo.semCuff)} · ~{n(tubo.profundidadeCm)} cm (A VALIDAR)
        </p>
      )}
      <strong>Causas reversíveis (Hs e Ts)</strong>
      <ul>
        {CAUSAS_REVERSIVEIS.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </details>
  );
}

/**
 * Durante o código: cada tela mostra só o painel do(s) papel(éis) dela; ao lado, o monitor e o que
 * a equipe fez. Quem comprime e quem ventila têm a faixa da RCP sempre à vista (teclas ou toque).
 */
export function DuranteCodigo() {
  const ctx = useCodigo();
  const { s, estado, cenario, meusPapeis, rcp, compressorDaVez } = ctx;
  const paineis = [...new Set(PAPEIS_EQUIPE.filter((p) => meusPapeis.includes(p.id)).map((p) => p.painel))];
  const [escolhido, setEscolhido] = useState<PainelPapel | null>(null);
  const painel = escolhido && paineis.includes(escolhido) ? escolhido : paineis[0];
  const comprime = meusPapeis.includes('compressor-1') || meusPapeis.includes('compressor-2');
  const ventila = meusPapeis.includes('via-aerea');
  const meuCompressor = meusPapeis.includes(compressorDaVez) ? compressorDaVez : meusPapeis.find((p) => p.startsWith('compressor')) ?? compressorDaVez;

  const apertar = (tipo: TipoMarca) => {
    if (tipo === 'compressao' && comprime) s.marcar('compressao', meuCompressor);
    if (tipo === 'ventilacao' && ventila) s.marcar('ventilacao', 'via-aerea');
  };
  useTeclasRcp(!!rcp && (comprime || ventila), apertar);

  const pendentesDoPainel = (pp: PainelPapel) =>
    ordensPendentes(
      s.sala.eventos,
      PAPEIS_EQUIPE.filter((p) => p.painel === pp && meusPapeis.includes(p.id)).map((p) => p.id),
    ).length;
  const Painel = painel ? PAINEL[painel] : null;
  const papelDoPainel = PAPEIS_EQUIPE.find((p) => p.painel === painel);

  return (
    <div className="parada-durante">
      <BarraDoCodigo />
      <Recados />
      <FaixaRcp comprime={comprime} ventila={ventila} aoApertar={apertar} />
      {paineis.length > 1 && (
        <nav className="abas-papeis" aria-label="Papéis nesta tela">
          {paineis.map((pp) => {
            const pend = pendentesDoPainel(pp);
            const papel = PAPEIS_EQUIPE.find((p) => p.painel === pp)!;
            return (
              <button key={pp} type="button" aria-pressed={pp === painel} onClick={() => setEscolhido(pp)}>
                <span aria-hidden="true">{papel.icone}</span> {NOME_PAINEL[pp]}
                {pend > 0 && (
                  <span className="selo selo-perigo" aria-label={`${pend} ordem(ns)`}>
                    {pend}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
      <div className="parada-durante-grade">
        {Painel && papelDoPainel && (
          <section className="painel painel-papel" aria-label={`Painel: ${NOME_PAINEL[painel!]}`}>
            <h2>
              {papelDoPainel.icone} {NOME_PAINEL[painel!]}
              {papelDoPainel.painel !== 'compressoes' && <small> — {quemFez(papelDoPainel.id, ctx.membros)}</small>}
            </h2>
            <Painel />
          </section>
        )}
        <aside className="parada-lateral">
          <Monitor
            sinais={sinaisDoCodigo(estado.rce, estado.ritmo, cenario.idadeAnos)}
            idadeDias={cenario.idadeAnos * 365}
            ritmo={estado.ritmo}
            padraoRespiratorio={estado.rce || estado.iniciada ? 'assistida' : 'apneia'}
          />
          <FeedEquipe />
          <Consulta />
        </aside>
      </div>
    </div>
  );
}
