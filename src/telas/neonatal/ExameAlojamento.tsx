import { useMemo, useState } from 'react';
import { NOME_CATEGORIA, REGIOES_EXAME_RN, SINAIS_ALTERADOS_RN, TRIAGENS_NEONATAIS } from '../../dados/neonatal/exame-rn-a-validar';
import { criarSorteio } from '../../estudo/treino';
import { AREAS_DO_CORPO, BebeCorpo } from '../../ilustracoes/BebeCorpo';
import { DetalheRN } from '../../ilustracoes/detalhes/DetalheRN';
import { achadoPorId, ajusteDoCorpo, avaliarSinais, type Classificacao, conferirExame, gerarRnVirtual, interpretarCoracaozinho, type RnVirtual } from '../../neonatal/exame';
import { lerNumero } from '../../prescricao/comum';
import { SeloCategoria } from '../comum/Pecas';

const novaSemente = () => Math.floor(Math.random() * 1_000_000) + 1;
const novoRn = (semente: number) => gerarRnVirtual(criarSorteio(semente), semente);
const CLASSES: readonly Classificacao[] = ['normal', 'variacao', 'alterado'];

/**
 * Exame do RN no alojamento conjunto: um RN virtual sorteado (com ou sem achados), examinado
 * região por região. O aluno lê/olha o que encontrou e classifica: normal, variação do normal
 * ou alterado. No fim, o resumo mostra acertos e as urgências que passaram.
 */
export function ExameAlojamento() {
  const [rn, setRn] = useState<RnVirtual>(() => novoRn(novaSemente()));
  const [regiaoId, setRegiaoId] = useState(REGIOES_EXAME_RN[0]!.id);
  const [respostas, setRespostas] = useState<Record<string, Classificacao>>({});
  const [resumo, setResumo] = useState(false);
  const regiao = REGIOES_EXAME_RN.find((r) => r.id === regiaoId)!;
  const achado = achadoPorId(rn.achados[regiaoId]);
  const conferencia = useMemo(() => conferirExame(rn, respostas), [rn, respostas]);
  const resposta = respostas[regiaoId];
  const daRegiao = conferencia.regioes.find((r) => r.regiaoId === regiaoId)!;
  const sinalAlterado = SINAIS_ALTERADOS_RN.find((s) => s.id === rn.sinalAlterado);
  const detalhe = achado?.detalhe ?? (achado ? undefined : regiao.detalheNormal);

  const recomecar = () => {
    setRn(novoRn(novaSemente()));
    setRespostas({});
    setRegiaoId(REGIOES_EXAME_RN[0]!.id);
    setResumo(false);
  };

  const proxima = () => {
    const i = REGIOES_EXAME_RN.findIndex((r) => r.id === regiaoId);
    const seguinte = REGIOES_EXAME_RN.slice(i + 1).find((r) => !respostas[r.id]) ?? REGIOES_EXAME_RN.find((r) => !respostas[r.id]);
    if (seguinte) setRegiaoId(seguinte.id);
    else setResumo(true);
  };

  const regioesClicaveis = REGIOES_EXAME_RN.filter((r) => AREAS_DO_CORPO[r.id]).map((r) => ({ id: r.id, nome: r.nome, ...AREAS_DO_CORPO[r.id]! }));

  return (
    <div className="exame-alojamento">
      <div className="exame-grade">
        <section className="painel exame-bebe" aria-label="RN no alojamento conjunto">
          <div className="linha-botoes">
            <strong>
              RN {rn.sexo === 'masculino' ? 'menino' : 'menina'}, {rn.horasDeVida} h de vida
            </strong>
            <button type="button" onClick={recomecar}>
              🎲 Outro RN
            </button>
          </div>
          <BebeCorpo
            tom={rn.tom}
            ajuste={ajusteDoCorpo(rn)}
            regioes={regioesClicaveis}
            regiaoAtiva={regiaoId}
            aoEscolherRegiao={(id) => {
              setRegiaoId(id);
              setResumo(false);
            }}
            titulo={`RN de ${rn.horasDeVida} horas de vida no berço`}
          />
          <p className="nota">Toque nos pontos do corpo ou escolha a região na lista. O lado direito do bebê fica à esquerda da tela.</p>
        </section>

        <section className="painel exame-regiao" aria-label="Região examinada">
          <nav className="lista-regioes" aria-label="Roteiro do exame">
            {REGIOES_EXAME_RN.map((r) => {
              const c = conferencia.regioes.find((x) => x.regiaoId === r.id)!;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={r.id === regiaoId && !resumo}
                  className={c.resposta ? (c.certo ? 'feito-certo' : 'feito-errado') : ''}
                  onClick={() => {
                    setRegiaoId(r.id);
                    setResumo(false);
                  }}
                >
                  {r.icone} {r.nome}
                  {c.resposta && <span aria-hidden="true">{c.certo ? ' ✔' : ' ✘'}</span>}
                </button>
              );
            })}
            <button type="button" aria-pressed={resumo} onClick={() => setResumo(true)} className="botao-resumo">
              📋 Resumo ({conferencia.respondidas}/{REGIOES_EXAME_RN.length})
            </button>
          </nav>

          {resumo ? (
            <div className="resumo-exame" role="status" aria-label="Resumo do exame">
              <h2>
                Resumo: {conferencia.acertos} de {conferencia.respondidas} classificações certas
              </h2>
              {conferencia.urgenciasPerdidas.length > 0 && (
                <p className="retorno-erro">⚠️ Urgência que passou: {conferencia.urgenciasPerdidas.join(', ')}.</p>
              )}
              <ul className="conferencia">
                {conferencia.regioes.map((c) => {
                  const r = REGIOES_EXAME_RN.find((x) => x.id === c.regiaoId)!;
                  return (
                    <li key={c.regiaoId} className={!c.resposta ? 'sit-a-validar' : c.certo ? 'sit-certo' : 'sit-errado'}>
                      <span className="selo">{!c.resposta ? 'não visto' : c.certo ? '✔ certo' : '✘ errado'}</span> {r.nome}:{' '}
                      {c.regiaoId === 'sinais-vitais' && sinalAlterado ? sinalAlterado.texto : c.achado ? c.achado.nome : 'normal'} ({NOME_CATEGORIA[c.esperado]})
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="botao-principal" onClick={recomecar}>
                🎲 Examinar outro RN
              </button>
            </div>
          ) : (
            <div className="regiao-conteudo">
              <h2>
                {regiao.icone} {regiao.nome}
              </h2>
              <p className="como-examinar">
                <strong>Como examinar:</strong> {regiao.comoExaminar}
              </p>
              {regiaoId === 'sinais-vitais' ? (
                <div className="sinais-rn" aria-label="Sinais vitais do RN">
                  <span>
                    FC <strong>{rn.sinais.fc}</strong> bpm
                  </span>
                  <span>
                    FR <strong>{rn.sinais.fr}</strong> irpm
                  </span>
                  <span>
                    T axilar <strong>{String(rn.sinais.temperatura).replace('.', ',')}</strong> °C
                  </span>
                </div>
              ) : null}
              <div className="achado-texto" aria-label="O que você encontra">
                <strong>O que você encontra:</strong>{' '}
                {regiaoId === 'sinais-vitais' ? (rn.sinalAlterado ? 'Bebê em repouso, sem choro.' : 'Ativo, choro forte, postura em flexão.') : (achado?.oQueSeVe ?? regiao.normal)}
              </div>
              {detalhe && (
                <figure className="detalhe-figura">
                  <DetalheRN detalhe={detalhe} tom={rn.tom} />
                  <figcaption>Desenho de perto (o achado, se houver, está nele)</figcaption>
                </figure>
              )}
              <div className="classificar" role="group" aria-label="Como você classifica?">
                {CLASSES.map((c) => (
                  <button key={c} type="button" aria-pressed={resposta === c} onClick={() => setRespostas((r) => ({ ...r, [regiaoId]: c }))}>
                    {NOME_CATEGORIA[c]}
                  </button>
                ))}
              </div>
              {resposta && (
                <div className={daRegiao.certo ? 'retorno-ok' : 'retorno-erro'} role="status">
                  <p>
                    {daRegiao.certo ? '✔ Certo.' : `✘ Esperado: ${NOME_CATEGORIA[daRegiao.esperado]}.`}{' '}
                    {achado && <SeloCategoria categoria={achado.categoria} {...(achado.urgente && { urgente: true })} />}
                  </p>
                  {regiaoId === 'sinais-vitais' ? (
                    <p>
                      {sinalAlterado ? (
                        <>
                          <strong>{sinalAlterado.texto}.</strong> {sinalAlterado.conduta}
                        </>
                      ) : avaliarSinais(rn.sinais).length > 0 ? (
                        <>
                          <strong>{avaliarSinais(rn.sinais).join('; ')}.</strong> Veja o tórax: há desconforto respiratório.
                        </>
                      ) : (
                        regiao.normal
                      )}
                    </p>
                  ) : achado ? (
                    <>
                      <p>
                        <strong>{achado.nome}.</strong> {achado.explicacao}
                      </p>
                      {achado.diferencial && (
                        <p>
                          <strong>Diferencial:</strong> {achado.diferencial}
                        </p>
                      )}
                      <p>
                        <strong>Conduta:</strong> {achado.conduta}
                      </p>
                    </>
                  ) : (
                    <p>{regiao.normal}</p>
                  )}
                  <button type="button" onClick={proxima}>
                    Próxima região →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="cartoes">
        <TesteCoracaozinho />
        <section className="painel" aria-label="Triagens neonatais">
          <h2>🧪 Triagens antes da alta</h2>
          <ul className="lista-triagens">
            {TRIAGENS_NEONATAIS.map((t) => (
              <li key={t.id}>
                <strong>{t.nome}</strong> — {t.quando} {t.como} <em>Alterado:</em> {t.alterado}
              </li>
            ))}
          </ul>
          <p className="nota">Prazos e critérios: A VALIDAR (MS/SBP).</p>
        </section>
      </div>
    </div>
  );
}

function TesteCoracaozinho() {
  const [mao, setMao] = useState('');
  const [pe, setPe] = useState('');
  const [tentativa, setTentativa] = useState<1 | 2>(1);
  const m = lerNumero(mao);
  const p = lerNumero(pe);
  const r = m !== null && p !== null ? interpretarCoracaozinho(m, p, tentativa) : null;
  return (
    <section className="painel" aria-label="Teste do coraçãozinho">
      <h2>💗 Teste do coraçãozinho</h2>
      <p className="nota">Oximetria entre 24 e 48 h de vida, RN &gt; 34 semanas: mão direita e um pé.</p>
      <span className="linha-botoes">
        <label>
          SpO₂ mão direita <input aria-label="SpO₂ mão direita" inputMode="numeric" size={4} value={mao} onChange={(e) => setMao(e.target.value)} /> %
        </label>
        <label>
          SpO₂ pé <input aria-label="SpO₂ pé" inputMode="numeric" size={4} value={pe} onChange={(e) => setPe(e.target.value)} /> %
        </label>
        <label>
          <select aria-label="Medida" value={tentativa} onChange={(e) => setTentativa(Number(e.target.value) as 1 | 2)}>
            <option value={1}>1ª medida</option>
            <option value={2}>2ª medida (1 h depois)</option>
          </select>
        </label>
      </span>
      {r && (
        <p className={r.resultado === 'normal' ? 'retorno-ok' : 'retorno-erro'} role="status">
          {r.texto}
        </p>
      )}
      <p className="nota">Critério A VALIDAR (SBP/MS).</p>
    </section>
  );
}
