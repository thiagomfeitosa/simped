import { type ReactNode, useRef, useState } from 'react';
import { useCasos } from '../casos/ContextoCasos';
import { casoVazio, copiarCaso, idDoTitulo, lerCasoDeJson, PREFIXO_PERSONALIZADO } from '../casos/editor';
import { CASOS, verificarCaso } from '../casos/index';
import type { CasoClinico, CondutaEsperada, MudancaDeSinal, NomeSinal, SinaisVitais } from '../casos/tipos';
import { EXAMES } from '../dados/exames';
import { BANCO_MEDICACOES } from '../dados/medicacoes';
import { SECOES } from '../prescricao/secoes';

const SINAIS: { id: NomeSinal; nome: string }[] = [
  { id: 'fc', nome: 'FC (bpm)' },
  { id: 'fr', nome: 'FR (irpm)' },
  { id: 'spo2', nome: 'SpO₂ (%)' },
  { id: 'paSistolica', nome: 'PA sistólica' },
  { id: 'paDiastolica', nome: 'PA diastólica' },
  { id: 'temperaturaC', nome: 'Temperatura (°C)' },
  { id: 'glicemiaMgDl', nome: 'Glicemia (mg/dL)' },
];

const MEDS_ORDENADAS = [...BANCO_MEDICACOES].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
const ALVOS: Record<CondutaEsperada['tipo'], { id: string; nome: string }[]> = {
  medicacao: [...MEDS_ORDENADAS.map((m) => ({ id: m.id, nome: m.nome })), { id: 'soro', nome: 'Soro (item de soro)' }],
  exame: EXAMES.map((e) => ({ id: e.id, nome: e.nome })),
  secao: SECOES.map((s) => ({ id: s.id, nome: `${s.numero}. ${s.titulo}` })),
  soro: [],
};

function num(texto: string): number {
  const v = Number(texto.replace(',', '.'));
  return Number.isFinite(v) ? v : 0;
}

function Campo({ rotulo, children, largo }: { rotulo: string; children: ReactNode; largo?: boolean }) {
  return (
    <label className={largo ? 'campo campo-largo' : 'campo'}>
      {rotulo}
      {children}
    </label>
  );
}

/** Linhas de mudança de sinal (evolução natural ou resposta a uma medicação). */
function Mudancas({ lista, aoMudar }: { lista: MudancaDeSinal[]; aoMudar: (l: MudancaDeSinal[]) => void }) {
  const mudar = (i: number, m: Partial<MudancaDeSinal>) => aoMudar(lista.map((x, j) => (j === i ? { ...x, ...m } : x)));
  return (
    <div className="mudancas">
      {lista.map((m, i) => (
        <div className="linha-botoes" key={i}>
          <select aria-label="Sinal" value={m.sinal} onChange={(e) => mudar(i, { sinal: e.target.value as NomeSinal })}>
            {SINAIS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
          vai até
          <input aria-label="Alvo" type="number" step="any" value={m.alvo} onChange={(e) => mudar(i, { alvo: num(e.target.value) })} />
          começando em
          <input aria-label="Atraso (min)" type="number" min={0} value={m.atrasoMin} onChange={(e) => mudar(i, { atrasoMin: num(e.target.value) })} />
          min, durante
          <input aria-label="Duração (min)" type="number" min={0} value={m.duracaoMin} onChange={(e) => mudar(i, { duracaoMin: num(e.target.value) })} />
          min
          <button type="button" className="remover" aria-label="Remover mudança" onClick={() => aoMudar(lista.filter((_, j) => j !== i))}>
            ×
          </button>
        </div>
      ))}
      <button type="button" className="adicionar" onClick={() => aoMudar([...lista, { sinal: 'fc', alvo: 100, atrasoMin: 0, duracaoMin: 30 }])}>
        + mudança de sinal
      </button>
    </div>
  );
}

/** Editor de casos clínicos: criar, copiar, conferir, salvar no app e baixar/abrir arquivo. */
export function EditorCasos() {
  const { personalizados, salvar, remover } = useCasos();
  const [caso, setCaso] = useState<CasoClinico>(casoVazio);
  const [aviso, setAviso] = useState('');
  const arquivo = useRef<HTMLInputElement>(null);
  const problemas = verificarCaso(caso, BANCO_MEDICACOES);
  const jaSalvo = personalizados.some((c) => c.id === caso.id);

  const m = (mudanca: Partial<CasoClinico>) => setCaso((c) => ({ ...c, ...mudanca }));
  const mp = (mudanca: Partial<CasoClinico['paciente']>) => setCaso((c) => ({ ...c, paciente: { ...c.paciente, ...mudanca } }));
  const ms = (sinal: keyof SinaisVitais, valor: number) => setCaso((c) => ({ ...c, sinaisIniciais: { ...c.sinaisIniciais, [sinal]: valor } }));
  const lista = (texto: string) => texto.split(',').map((x) => x.trim()).filter(Boolean);

  function comecarDe(valor: string) {
    if (valor === 'novo') setCaso(casoVazio());
    else {
      const meu = personalizados.find((c) => c.id === valor);
      const doApp = CASOS.find((c) => c.id === valor);
      if (meu) setCaso(JSON.parse(JSON.stringify(meu)) as CasoClinico);
      else if (doApp) setCaso(copiarCaso(doApp));
    }
    setAviso('');
  }

  function baixar() {
    const blob = new Blob([JSON.stringify(caso, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${caso.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function abrirArquivo(f: File | undefined) {
    if (!f) return;
    const { caso: lido, problemas: p } = lerCasoDeJson(await f.text(), BANCO_MEDICACOES);
    if (lido) setCaso(lido);
    setAviso(p.length > 0 ? `Arquivo aberto com ${p.length} problema(s): veja a lista abaixo.` : 'Arquivo aberto sem problemas.');
  }

  function jogar() {
    salvar(caso);
    window.location.hash = '#prescrever';
    window.dispatchEvent(new CustomEvent('simped:abrir-caso', { detail: caso.id }));
  }

  const respostas = caso.respostas ?? [];
  const condutas = caso.condutasEsperadas ?? [];
  const resultados = caso.resultadosExames ?? {};

  return (
    <div className="pagina-simples editor-casos">
      <header className="cabecalho">
        <h1>Editor de casos</h1>
        <span className="subtitulo">Crie ou copie um caso sem programar. Fica guardado neste computador e aparece no menu da aba Prescrever.</span>
      </header>

      <div className="painel barra-editor">
        <Campo rotulo="Começar de">
          <select aria-label="Começar de" onChange={(e) => comecarDe(e.target.value)} defaultValue="">
            <option value="" disabled>
              escolha…
            </option>
            <option value="novo">Novo caso em branco</option>
            {personalizados.length > 0 && (
              <optgroup label="Meus casos (editar)">
                {personalizados.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titulo}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Copiar um caso do app">
              {CASOS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titulo}
                </option>
              ))}
            </optgroup>
          </select>
        </Campo>
        <div className="linha-botoes">
          <button type="button" onClick={() => arquivo.current?.click()}>
            📂 Abrir arquivo .json
          </button>
          <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={(e) => void abrirArquivo(e.target.files?.[0])} />
          <button type="button" onClick={baixar}>
            💾 Baixar arquivo .json
          </button>
          <button type="button" disabled={problemas.length > 0} onClick={() => { salvar(caso); setAviso('Salvo nos meus casos.'); }}>
            Salvar no app
          </button>
          <button type="button" disabled={problemas.length > 0} onClick={jogar}>
            ▶ Jogar este caso
          </button>
          {jaSalvo && (
            <button type="button" onClick={() => { remover(caso.id); setAviso('Removido dos meus casos.'); }}>
              Excluir dos meus casos
            </button>
          )}
        </div>
        {aviso && <p className="nota">{aviso}</p>}
        <ul className="conferencia">
          {problemas.length === 0 ? (
            <li className="sit-certo">
              <span className="selo">✔ ok</span> Caso sem problemas.
            </li>
          ) : (
            problemas.map((p) => (
              <li key={p} className="sit-errado">
                <span className="selo">✘ corrigir</span> {p}
              </li>
            ))
          )}
        </ul>
        <p className="nota">Lembrete: tudo o que for clínico (sinais, reações, condutas) fica marcado A VALIDAR.</p>
      </div>

      <div className="cartoes">
        <section className="painel">
          <h2>Identificação do caso</h2>
          <Campo rotulo="Título">
            <input
              value={caso.titulo}
              onChange={(e) => {
                const titulo = e.target.value;
                // caso novo: o id acompanha o título; caso já salvo mantém o id
                setCaso((c) => ({ ...c, titulo, ...(jaSalvo ? {} : { id: idDoTitulo(titulo) }) }));
              }}
            />
          </Campo>
          <Campo rotulo="Grupo no menu">
            <input value={caso.grupo ?? ''} onChange={(e) => m({ grupo: e.target.value })} />
          </Campo>
          <Campo rotulo="Cenário">
            <input value={caso.cenario ?? ''} onChange={(e) => m({ cenario: e.target.value })} />
          </Campo>
          <Campo rotulo="Hipótese esperada (aparece só no relatório)">
            <input value={caso.hipotese ?? ''} onChange={(e) => m({ hipotese: e.target.value })} />
          </Campo>
          <Campo rotulo="Início do caso (data e hora)">
            <input type="datetime-local" value={caso.inicio} onChange={(e) => e.target.value && m({ inicio: e.target.value })} />
          </Campo>
          <p className="nota">Código do caso: {caso.id}{caso.id.startsWith(PREFIXO_PERSONALIZADO) ? '' : ' (do app)'}</p>
        </section>

        <section className="painel">
          <h2>Paciente (dados de origem)</h2>
          <Campo rotulo="Nome">
            <input value={caso.paciente.nome} onChange={(e) => mp({ nome: e.target.value })} />
          </Campo>
          <div className="linha-botoes">
            <Campo rotulo="Sexo">
              <select value={caso.paciente.sexo} onChange={(e) => mp({ sexo: e.target.value as 'F' | 'M' })}>
                <option value="F">F</option>
                <option value="M">M</option>
              </select>
            </Campo>
            <Campo rotulo="Leito">
              <input size={6} value={caso.paciente.leito} onChange={(e) => mp({ leito: e.target.value })} />
            </Campo>
          </div>
          <Campo rotulo="Nascimento (data e hora)">
            <input type="datetime-local" value={caso.paciente.nascimento} onChange={(e) => e.target.value && mp({ nascimento: e.target.value })} />
          </Campo>
          <div className="linha-botoes">
            <Campo rotulo="IG ao nascer (semanas)">
              <input type="number" min={20} max={45} value={caso.paciente.igNascer.semanas} onChange={(e) => mp({ igNascer: { ...caso.paciente.igNascer, semanas: num(e.target.value) } })} />
            </Campo>
            <Campo rotulo="+ dias">
              <input type="number" min={0} max={6} value={caso.paciente.igNascer.dias} onChange={(e) => mp({ igNascer: { ...caso.paciente.igNascer, dias: num(e.target.value) } })} />
            </Campo>
          </div>
          <div className="linha-botoes">
            <Campo rotulo="Peso ao nascer (g)">
              <input type="number" min={1} value={caso.paciente.pesoNascerG} onChange={(e) => mp({ pesoNascerG: num(e.target.value) })} />
            </Campo>
            <Campo rotulo="Peso atual (kg)">
              <input type="number" min={0} step="any" value={caso.paciente.pesoKg} onChange={(e) => mp({ pesoKg: num(e.target.value) })} />
            </Campo>
            <Campo rotulo="Estatura (cm)">
              <input
                type="number"
                min={0}
                step="any"
                value={caso.paciente.estaturaCm ?? ''}
                onChange={(e) => {
                  const { estaturaCm: _, ...resto } = caso.paciente;
                  setCaso((c) => ({ ...c, paciente: e.target.value === '' ? resto : { ...c.paciente, estaturaCm: num(e.target.value) } }));
                }}
              />
            </Campo>
          </div>
          <Campo rotulo="Alergias (separadas por vírgula)">
            <input value={(caso.paciente.alergias ?? []).join(', ')} onChange={(e) => mp({ alergias: lista(e.target.value) })} />
          </Campo>
          <Campo rotulo="Condições de base (separadas por vírgula)">
            <input value={(caso.paciente.condicoesDeBase ?? []).join(', ')} onChange={(e) => mp({ condicoesDeBase: lista(e.target.value) })} />
          </Campo>
          <Campo rotulo="Dados maternos (RN)">
            <input value={caso.paciente.dadosMaternos ?? ''} onChange={(e) => mp({ dadosMaternos: e.target.value })} />
          </Campo>
        </section>

        <section className="painel">
          <h2>História</h2>
          <Campo rotulo="Queixa">
            <textarea rows={2} value={caso.queixa} onChange={(e) => m({ queixa: e.target.value })} />
          </Campo>
          <Campo rotulo="História">
            <textarea rows={3} value={caso.historia} onChange={(e) => m({ historia: e.target.value })} />
          </Campo>
          <Campo rotulo="Exame físico">
            <textarea rows={3} value={caso.exameFisico} onChange={(e) => m({ exameFisico: e.target.value })} />
          </Campo>
          <Campo rotulo="Pontos de ensino (um por linha)">
            <textarea
              rows={3}
              value={(caso.pontosDeEnsino ?? []).join('\n')}
              onChange={(e) => m({ pontosDeEnsino: e.target.value.split('\n') })}
              onBlur={(e) => m({ pontosDeEnsino: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })}
            />
          </Campo>
        </section>

        <section className="painel">
          <h2>Sinais iniciais</h2>
          <div className="grade-sinais">
            {SINAIS.map((s) => (
              <Campo key={s.id} rotulo={s.nome}>
                <input type="number" step="any" min={0} value={caso.sinaisIniciais[s.id]} onChange={(e) => ms(s.id, num(e.target.value))} />
              </Campo>
            ))}
            <Campo rotulo="Diurese (mL/kg/h)">
              <input type="number" step="any" min={0} value={caso.diureseMlKgH ?? 1} onChange={(e) => m({ diureseMlKgH: num(e.target.value) })} />
            </Campo>
          </div>
          <h3>Evolução sem tratamento</h3>
          <Mudancas lista={caso.evolucaoNatural ?? []} aoMudar={(l) => m({ evolucaoNatural: l })} />
        </section>

        <section className="painel">
          <h2>Reações às medicações</h2>
          {respostas.map((r, i) => (
            <div className="bloco-editor" key={i}>
              <div className="linha-botoes">
                <select
                  aria-label="Medicação"
                  value={r.medicacaoId}
                  onChange={(e) => m({ respostas: respostas.map((x, j) => (j === i ? { ...x, medicacaoId: e.target.value } : x)) })}
                >
                  {ALVOS.medicacao.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.nome}
                    </option>
                  ))}
                </select>
                <button type="button" className="remover" aria-label="Remover reação" onClick={() => m({ respostas: respostas.filter((_, j) => j !== i) })}>
                  ×
                </button>
              </div>
              <Mudancas lista={r.mudancas} aoMudar={(l) => m({ respostas: respostas.map((x, j) => (j === i ? { ...x, mudancas: l } : x)) })} />
            </div>
          ))}
          <button
            type="button"
            className="adicionar"
            onClick={() => m({ respostas: [...respostas, { medicacaoId: ALVOS.medicacao[0]!.id, mudancas: [], status: 'A_VALIDAR' }] })}
          >
            + reação a uma medicação
          </button>
        </section>

        <section className="painel">
          <h2>Resultados de exames</h2>
          {Object.entries(resultados).map(([exameId, r]) => {
            const exame = EXAMES.find((e) => e.id === exameId);
            if (!exame) return null;
            const mudarResultado = (novo: typeof r) => m({ resultadosExames: { ...resultados, [exameId]: novo } });
            return (
              <div className="bloco-editor" key={exameId}>
                <div className="linha-botoes">
                  <strong>{exame.nome}</strong>
                  <button
                    type="button"
                    className="remover"
                    aria-label={`Remover ${exame.nome}`}
                    onClick={() => {
                      const { [exameId]: _, ...resto } = resultados;
                      m({ resultadosExames: resto });
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="grade-sinais">
                  {exame.analitos.map((a) => (
                    <Campo key={a.id} rotulo={`${a.nome}${a.unidade ? ` (${a.unidade})` : ''}`}>
                      <input
                        type="number"
                        step="any"
                        value={r.valores?.[a.id] ?? ''}
                        onChange={(e) => {
                          const valores = { ...(r.valores ?? {}) };
                          if (e.target.value === '') delete valores[a.id];
                          else valores[a.id] = num(e.target.value);
                          mudarResultado({ ...r, valores });
                        }}
                      />
                    </Campo>
                  ))}
                </div>
                {exame.laudo && (
                  <Campo rotulo="Laudo" largo>
                    <textarea rows={2} value={r.laudo ?? ''} onChange={(e) => mudarResultado({ ...r, laudo: e.target.value })} />
                  </Campo>
                )}
              </div>
            );
          })}
          <select
            aria-label="Adicionar resultado de exame"
            value=""
            onChange={(e) => e.target.value && m({ resultadosExames: { ...resultados, [e.target.value]: { status: 'A_VALIDAR' } } })}
          >
            <option value="">+ resultado de exame…</option>
            {EXAMES.filter((e) => !(e.id in resultados)).map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </section>

        <section className="painel">
          <h2>Condutas esperadas (relatório)</h2>
          {condutas.map((c, i) => {
            const mudar = (x: Partial<CondutaEsperada>) => m({ condutasEsperadas: condutas.map((y, j) => (j === i ? { ...y, ...x } : y)) });
            return (
              <div className="bloco-editor" key={i}>
                <div className="linha-botoes">
                  <input aria-label="Descrição da conduta" size={28} value={c.descricao} onChange={(e) => mudar({ descricao: e.target.value })} />
                  <select aria-label="Tipo da conduta" value={c.tipo} onChange={(e) => mudar({ tipo: e.target.value as CondutaEsperada['tipo'], alvos: [] })}>
                    <option value="medicacao">medicação</option>
                    <option value="exame">exame</option>
                    <option value="secao">seção escrita</option>
                    <option value="soro">soro</option>
                  </select>
                  <label>
                    prazo
                    <input
                      aria-label="Prazo (min)"
                      type="number"
                      min={0}
                      size={4}
                      value={c.prazoMin ?? ''}
                      onChange={(e) => {
                        const { prazoMin: _, ...resto } = c;
                        m({ condutasEsperadas: condutas.map((y, j) => (j === i ? (e.target.value === '' ? resto : { ...c, prazoMin: num(e.target.value) }) : y)) });
                      }}
                    />
                    min
                  </label>
                  <button type="button" className="remover" aria-label="Remover conduta" onClick={() => m({ condutasEsperadas: condutas.filter((_, j) => j !== i) })}>
                    ×
                  </button>
                </div>
                {c.tipo !== 'soro' && (
                  <div className="linha-botoes">
                    {c.alvos.map((a) => (
                      <span className="chip" key={a}>
                        {ALVOS[c.tipo].find((x) => x.id === a)?.nome ?? a}
                        <button type="button" aria-label={`Tirar ${a}`} onClick={() => mudar({ alvos: c.alvos.filter((x) => x !== a) })}>
                          ×
                        </button>
                      </span>
                    ))}
                    <select aria-label="Adicionar alvo" value="" onChange={(e) => e.target.value && mudar({ alvos: [...c.alvos, e.target.value] })}>
                      <option value="">+ {c.tipo === 'medicacao' ? 'medicação' : c.tipo === 'exame' ? 'exame' : 'seção'} (qualquer uma vale)…</option>
                      {ALVOS[c.tipo]
                        .filter((x) => !c.alvos.includes(x.id))
                        .map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
          <button
            type="button"
            className="adicionar"
            onClick={() =>
              m({
                condutasEsperadas: [
                  ...condutas,
                  { id: `conduta-${condutas.length + 1}-${Date.now() % 10000}`, descricao: 'Nova conduta', tipo: 'medicacao', alvos: [], status: 'A_VALIDAR' },
                ],
              })
            }
          >
            + conduta esperada
          </button>
        </section>
      </div>
    </div>
  );
}
