import { useMemo } from 'react';
import type { CenarioParada } from '../dados/parada-a-validar';
import { CHECKLIST_BRIEFING, FASES_DEBRIEFING, ITENS_CRM, PAPEIS_EQUIPE } from '../dados/parada-briefing-a-validar';
import { metricasDoCodigo, textoDoDebriefing } from '../parada/debriefing';
import type { EventoParada } from '../parada/parada';
import { formatarNumero } from '../prescricao/comum';

function baixarTexto(nome: string, texto: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

const alternar = (s: ReadonlySet<string>, id: string) => {
  const n = new Set(s);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  return n;
};

/** Briefing antes do código: papéis da equipe (com nomes) e a lista de conferência. */
export function BriefingParada({
  cenario,
  feitos,
  aoMudarFeitos,
  nomes,
  aoMudarNomes,
  aberto,
  aoAlternar,
  aoAbrirFolha,
}: {
  cenario: CenarioParada;
  feitos: ReadonlySet<string>;
  aoMudarFeitos: (s: Set<string>) => void;
  nomes: Readonly<Record<string, string>>;
  aoMudarNomes: (n: Record<string, string>) => void;
  aberto: boolean;
  aoAlternar: (aberto: boolean) => void;
  aoAbrirFolha: () => void;
}) {
  return (
    <details className="painel briefing" open={aberto} onToggle={(e) => aoAlternar((e.target as HTMLDetailsElement).open)}>
      <summary>
        <strong>🗣️ Briefing da equipe</strong> — antes de começar ({feitos.size}/{CHECKLIST_BRIEFING.length})
      </summary>
      <div className="briefing-grade">
        <section aria-label="Papéis da equipe">
          <h3>Quem faz o quê</h3>
          {PAPEIS_EQUIPE.map((p) => (
            <label key={p.id} className="papel-equipe">
              <span>
                <strong>{p.nome}</strong>
                <small>{p.tarefas}</small>
              </span>
              <input aria-label={`Nome: ${p.nome}`} placeholder="nome" value={nomes[p.id] ?? ''} onChange={(e) => aoMudarNomes({ ...nomes, [p.id]: e.target.value })} />
            </label>
          ))}
        </section>
        <section aria-label="Conferência do briefing">
          <h3>Antes do primeiro minuto</h3>
          <p className="nota">
            Paciente: {cenario.idadeTexto}, <strong>{formatarNumero(cenario.pesoKg)} kg</strong>.{' '}
            <button type="button" className="botao-discreto" onClick={aoAbrirFolha}>
              Abrir a folha de emergência
            </button>
          </p>
          {CHECKLIST_BRIEFING.map((i) => (
            <label key={i.id} className="linha-check">
              <input type="checkbox" checked={feitos.has(i.id)} onChange={() => aoMudarFeitos(alternar(feitos, i.id))} /> {i.texto}
            </label>
          ))}
          <p className="nota">Roteiro A VALIDAR (AHA/PALS — dinâmica de equipe; CRM).</p>
        </section>
      </div>
    </details>
  );
}

/** Debriefing depois do código: números tirados do registro + roteiro em 4 fases + trabalho em equipe. */
export function DebriefingParada({
  cenario,
  eventos,
  feitos,
  nomes,
  respostas,
  aoMudarRespostas,
  crm,
  aoMudarCrm,
}: {
  cenario: CenarioParada;
  eventos: readonly EventoParada[];
  feitos: ReadonlySet<string>;
  nomes: Readonly<Record<string, string>>;
  respostas: Readonly<Record<string, string>>;
  aoMudarRespostas: (r: Record<string, string>) => void;
  crm: Readonly<Record<string, number>>;
  aoMudarCrm: (c: Record<string, number>) => void;
}) {
  const metricas = useMemo(() => metricasDoCodigo(cenario, eventos), [cenario, eventos]);
  const baixar = () => {
    const agora = new Date();
    baixarTexto(`debriefing-${agora.toISOString().slice(0, 16).replace(/[:T]/g, '-')}.txt`, textoDoDebriefing({ cenario, eventos, briefingFeito: feitos, nomesPapeis: nomes, respostas, crm, data: agora }));
  };
  return (
    <section className="painel debriefing" aria-label="Debriefing">
      <h2>📋 Debriefing</h2>
      <p className="nota">Logo depois do código, em lugar calmo, sem buscar culpados: o objetivo é a equipe aprender.</p>
      <div className="debriefing-grade">
        <div>
          <h3>Números do código</h3>
          <ul className="metricas-codigo" aria-label="Números do código">
            {metricas.map((m) => (
              <li key={m.id} className={m.ok === undefined ? '' : m.ok ? 'sit-certo' : 'sit-errado'}>
                <span>{m.ok === undefined ? '•' : m.ok ? '✔' : '✘'}</span> <strong>{m.rotulo}:</strong> {m.valor}
                {m.alvo && <small> — alvo: {m.alvo}</small>}
              </li>
            ))}
          </ul>
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
                  {[1, 2, 3].map((n) => (
                    <td key={n}>
                      <input type="radio" name={`crm-${c}`} aria-label={`${c}: ${n}`} checked={crm[c] === n} onChange={() => aoMudarCrm({ ...crm, [c]: n })} />
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
              <textarea aria-label={f.nome} rows={3} value={respostas[f.id] ?? ''} onChange={(e) => aoMudarRespostas({ ...respostas, [f.id]: e.target.value })} />
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
      <p className="nota">A fração de compressão é estimada (o app não sabe quando a RCP parou de verdade). Roteiro A VALIDAR (GAS/PEARLS).</p>
    </section>
  );
}
