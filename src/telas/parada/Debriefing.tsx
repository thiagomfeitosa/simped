import { useMemo } from 'react';
import { FASES_DEBRIEFING, ITENS_CRM, PAPEIS_EQUIPE } from '../../dados/parada-briefing-a-validar';
import { metricasDoCodigo, qualidadeDaRcp, textoDoDebriefing } from '../../parada/debriefing';
import { descreverEventos, metricasDaEquipe, participacao, quemFez } from '../../parada/equipe';
import { avaliarParada, mmss } from '../../parada/parada';
import { briefingDaSala, CHAVES, crmDaSala, rcpPelasTeclas, respostasDaSala } from '../../parada/sala';
import { useCodigo } from './contexto';

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

/**
 * Depois do código: resultado, algoritmo, qualidade da RCP, equipe e o debriefing (GAS/PEARLS)
 * para anotar e baixar. Tudo dividido entre as telas da equipe.
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
