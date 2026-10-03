import { useEffect, useMemo, useRef, useState } from 'react';
import { FASES_DEBRIEFING, ITENS_CRM, PAPEIS_EQUIPE } from '../../dados/parada-briefing-a-validar';
import { metricasDoCodigo, qualidadeDaRcp, textoDoDebriefing } from '../../parada/debriefing';
import { descreverEventos, metricasDaEquipe, participacao, quemFez } from '../../parada/equipe';
import { avaliarParada, mmss } from '../../parada/parada';
import { briefingDaSala, CHAVES, crmDaSala, rcpPelasTeclas, respostasDaSala } from '../../parada/sala';
import { DesenhoCenaRcp } from './CenaRcp';
import { useCodigo } from './contexto';
import { cenaNoTempo, semMovimento, useMenosMovimento } from './PainelCena';

function baixarTexto(nome: string, texto: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

type Linha = { id: string; rotulo: string; valor: string; ok?: boolean; alvo?: string };

function ListaMetricas({ itens, rotulo }: { itens: readonly Linha[]; rotulo: string }) {
  return (
    <ul className="metricas-codigo" aria-label={rotulo}>
      {itens.map((m) => (
        <li key={m.id} className={m.ok === undefined ? '' : m.ok ? 'sit-certo' : 'sit-errado'}>
          <span>{m.ok === undefined ? '•' : m.ok ? '✔' : '✘'}</span> <strong>{m.rotulo}:</strong> {m.valor}
          {m.alvo && <small> — alvo: {m.alvo}</small>}
        </li>
      ))}
    </ul>
  );
}

const VELOCIDADES_REVER = [1, 4] as const;

/**
 * Rever o código: a cena da RCP em qualquer momento (a cena é função do tempo: é só pedi-la num
 * tempo passado). Controle deslizante, tocar/pausar e velocidade 1× ou 4×. Começa recolhida.
 */
function ReverCodigo() {
  const ctx = useCodigo();
  const { eventos, marcas } = ctx.s.sala;
  const inicio = eventos.find((e) => e.tipo === 'iniciar')?.tS ?? 0;
  const fim = Math.max(inicio, eventos.find((e) => e.tipo === 'encerrar')?.tS ?? Math.max(eventos[eventos.length - 1]?.tS ?? 0, marcas[marcas.length - 1]?.tS ?? 0));
  const [aberto, setAberto] = useState(false);
  const [t, setT] = useState(inicio);
  const [tocando, setTocando] = useState(false);
  const [velocidade, setVelocidade] = useState<(typeof VELOCIDADES_REVER)[number]>(1);
  const menos = useMenosMovimento();
  const alvo = useRef<HTMLDivElement>(null);
  const agora = Math.min(fim, Math.max(inicio, t));

  // tocando: o tempo do código anda (na velocidade escolhida) até o fim
  useEffect(() => {
    if (!tocando || !aberto) return;
    let id = 0;
    let antes = performance.now();
    const passo = (ms: number) => {
      const dt = Math.max(0, ms - antes) / 1000;
      antes = ms;
      // aba escondida: não anda
      if (alvo.current?.offsetParent !== null) setT((x) => Math.min(fim, x + dt * velocidade));
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [tocando, aberto, velocidade, fim]);
  useEffect(() => {
    if (tocando && agora >= fim) setTocando(false);
  }, [tocando, agora, fim]);

  const tocar = () => {
    if (!tocando && agora >= fim) setT(inicio);
    setTocando(!tocando);
  };
  const cena = aberto ? cenaNoTempo(ctx, agora) : null;

  return (
    <details className="painel rever-codigo" onToggle={(e) => setAberto(e.currentTarget.open)}>
      <summary>
        🎬 <strong>Rever o código</strong> <small>— a cena da RCP em qualquer momento</small>
      </summary>
      {cena && (
        <div ref={alvo} className="rever-codigo-conteudo" role="region" aria-label="Rever o código" data-tempo={agora.toFixed(1)}>
          <div className="rever-controles">
            <button type="button" className="botao-principal" onClick={tocar} aria-label={tocando ? 'Pausar' : 'Tocar'}>
              {tocando ? '⏸' : '▶'}
            </button>
            <input
              type="range"
              min={inicio}
              max={fim}
              step="any"
              value={agora}
              aria-label="Momento do código"
              aria-valuetext={`${mmss(agora - inicio)} de ${mmss(fim - inicio)}`}
              onChange={(e) => setT(Number(e.target.value))}
            />
            <span className="rever-tempo">
              {mmss(agora - inicio)} / {mmss(fim - inicio)}
            </span>
            <span className="velocidade" role="group" aria-label="Velocidade">
              {VELOCIDADES_REVER.map((v) => (
                <button key={v} type="button" aria-pressed={velocidade === v} onClick={() => setVelocidade(v)}>
                  {v}×
                </button>
              ))}
            </span>
          </div>
          <div className="painel-cena-desenho">
            <DesenhoCenaRcp cena={menos ? semMovimento(cena) : cena} />
          </div>
        </div>
      )}
    </details>
  );
}

/**
 * Depois do código: resultado, algoritmo, qualidade da RCP, equipe, o debriefing (GAS/PEARLS)
 * para anotar e baixar e o "rever o código" (a cena da RCP em qualquer momento).
 * Tudo dividido entre as telas da equipe.
 */
export function DepoisDoCodigo({ aoRecomecar }: { aoRecomecar: () => void }) {
  const { s, cenario, membros, tolerancia, ritmoNaChecagem } = useCodigo();
  const eventos = s.sala.eventos;
  const teclas = rcpPelasTeclas(s.sala);
  const avaliacao = useMemo(() => avaliarParada(cenario, eventos, tolerancia), [cenario, eventos, tolerancia]);
  const numeros = metricasDoCodigo(cenario, eventos, { rcpMedida: teclas });
  const rcp = teclas ? qualidadeDaRcp(cenario, eventos, s.sala.marcas) : [];
  const equipe = metricasDaEquipe(eventos, membros);
  const part = participacao(eventos, s.sala.marcas);
  const respostas = respostasDaSala(s.sala);
  const crm = crmDaSala(s.sala);
  const textos = descreverEventos(eventos, ritmoNaChecagem);
  const inicio = eventos.find((e) => e.tipo === 'iniciar')?.tS ?? 0;

  const baixar = () => {
    const agora = new Date();
    baixarTexto(
      `debriefing-${agora.toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`,
      textoDoDebriefing({
        cenario,
        eventos,
        briefingFeito: briefingDaSala(s.sala),
        nomesPapeis: Object.fromEntries(PAPEIS_EQUIPE.map((p) => [p.id, membros[p.id]?.nome ?? ''])),
        respostas,
        crm,
        data: agora,
        ...(teclas && { marcas: s.sala.marcas }),
      }),
    );
  };

  return (
    <div className="parada-depois">
      <section className={`painel resultado-codigo ${avaliacao.rce ? 'sit-certo' : 'sit-errado'}`}>
        <h2>
          {avaliacao.rce ? '✔ Retorno da circulação' : '✘ Sem retorno da circulação'} — {mmss(avaliacao.tempoTotalS)} de código
        </h2>
        <button type="button" className="botao-principal" onClick={aoRecomecar}>
          ↺ Novo código (a equipe continua)
        </button>
      </section>
      <div className="grade-depois">
        <section className="painel" aria-label="Avaliação do código" role="status">
          <h3>Algoritmo e contas</h3>
          <ul className="conferencia">
            {avaliacao.itens.map((item, i) => (
              <li key={i} className={item.ok ? 'sit-certo' : 'sit-errado'}>
                <span className="selo">{item.ok ? '✔' : '✘'}</span> {item.texto}
              </li>
            ))}
          </ul>
          <p className="nota">Algoritmo e tempos: PALS, A VALIDAR.</p>
        </section>
        {teclas && (
          <section className="painel" aria-label="Qualidade da RCP">
            <h3>🫀 Qualidade da RCP</h3>
            <ListaMetricas itens={rcp} rotulo="Números da RCP" />
            <p className="nota">Medida pelas teclas. Alvos A VALIDAR (AHA/PALS).</p>
          </section>
        )}
        <section className="painel" aria-label="Equipe">
          <h3>👥 Equipe</h3>
          <ListaMetricas itens={equipe} rotulo="Números da equipe" />
          <ul className="lista-participacao">
            {Object.entries(part).map(([papel, p]) => (
              <li key={papel}>
                <strong>{quemFez(papel, membros)}:</strong> {[p.acoes && `${p.acoes} ação(ões)`, p.compressoes && `${p.compressoes} compressões`, p.ventilacoes && `${p.ventilacoes} ventilações`].filter(Boolean).join(', ')}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="painel debriefing" aria-label="Debriefing">
        <h2>📋 Debriefing</h2>
        <p className="nota">Logo depois do código, em lugar calmo, sem buscar culpados: o objetivo é a equipe aprender.</p>
        <div className="debriefing-grade">
          <div>
            <h3>Números do código</h3>
            <ListaMetricas itens={numeros} rotulo="Números do código" />
            <h3>Trabalho em equipe</h3>
            <table className="tabela-simples tabela-crm">
              <thead>
                <tr>
                  <th>Comportamento</th>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                </tr>
              </thead>
              <tbody>
                {ITENS_CRM.map((c) => (
                  <tr key={c}>
                    <td>{c}</td>
                    {[1, 2, 3].map((v) => (
                      <td key={v}>
                        <input type="radio" name={`crm-${c}`} aria-label={`${c}: ${v}`} checked={crm[c] === v} onChange={() => s.mudar(CHAVES.crm(c), v)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="nota">1 = precisa melhorar · 3 = ótimo</p>
          </div>
          <div>
            {FASES_DEBRIEFING.map((f) => (
              <label key={f.id} className="campo fase-debriefing">
                <strong>{f.nome}</strong> {f.pergunta}
                <textarea aria-label={f.nome} rows={3} value={respostas[f.id] ?? ''} onChange={(e) => s.mudar(CHAVES.resposta(f.id), e.target.value)} />
              </label>
            ))}
            <div className="linha-botoes">
              <button type="button" className="botao-principal" onClick={baixar}>
                ⬇ Baixar o debriefing (.txt)
              </button>
              <button type="button" onClick={() => window.print()}>
                🖨️ Imprimir
              </button>
            </div>
          </div>
        </div>
        {!teclas && <p className="nota">A fração de compressão é estimada (RCP automática). Roteiro A VALIDAR (GAS/PEARLS).</p>}
      </section>

      <ReverCodigo />

      <details className="painel">
        <summary>Linha do tempo completa</summary>
        <ol className="linha-do-tempo" aria-label="Linha do tempo">
          {eventos.map((e, i) =>
            e.tipo === 'anotado' ? null : (
              <li key={e.id ?? i}>
                <span className="hora">{mmss(e.tS - inicio)}</span> {textos[i]}
                {e.por && <small> — {quemFez(e.por, membros)}</small>}
              </li>
            ),
          )}
        </ol>
      </details>
    </div>
  );
}
