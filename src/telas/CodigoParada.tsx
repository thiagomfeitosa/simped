import { useEffect, useMemo, useState } from 'react';
import { arredondar, conferirValor, pesoEstimadoApls } from '../calculos';
import { NOME_RITMO, type SinaisVitais } from '../casos/tipos';
import { toleranciaDe } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import {
  CAUSAS_REVERSIVEIS,
  CENARIOS_PARADA,
  CHOQUE,
  DROGAS_PARADA,
  EXPANSAO_PARADA,
  type GavetaCarrinho,
  NOME_GAVETA,
  TEMPOS_PARADA,
} from '../dados/parada-a-validar';
import {
  avaliarParada,
  doseDaDroga,
  energiaDoChoque,
  estadoDaParada,
  type EventoParada,
  mmss,
  ritmoChocavel,
  tuboEndotraqueal,
  volumeDoBolus,
} from '../parada/parada';
import { formatarNumero, lerNumero } from '../prescricao/comum';
import { FolhaEmergencia } from './FolhaEmergencia';
import { Monitor } from './Monitor';

const n = formatarNumero;
const VELOCIDADES = [1, 2, 4] as const;
const PASSO_MS = 200;

/** Sinais do monitor durante o código: sem pulso, o monitor mostra "---" (src/monitor). */
function sinaisDoCodigo(rce: boolean, ritmo: string, idadeAnos: number): SinaisVitais {
  const lactente = idadeAnos < 1;
  if (rce) return { fc: lactente ? 140 : 110, fr: lactente ? 30 : 20, spo2: 92, paSistolica: lactente ? 75 : 90, paDiastolica: 50, temperaturaC: 36, glicemiaMgDl: 110, tecS: 3, glasgow: 6 };
  return { fc: ritmo === 'aesp' ? 50 : ritmo === 'tv' ? 200 : 0, fr: 0, spo2: 0, paSistolica: 0, paDiastolica: 0, temperaturaC: 36, glicemiaMgDl: 100, tecS: 6, glasgow: 3 };
}

/** Uma linha do registro do código (linha do tempo). */
function descreverEvento(e: EventoParada, ritmoDepois?: string): string {
  switch (e.tipo) {
    case 'iniciar':
      return 'Código iniciado: RCP de alta qualidade';
    case 'checarRitmo':
      return `Checagem de ritmo${ritmoDepois ? `: ${ritmoDepois}` : ''}`;
    case 'choque':
      return `⚡ Choque de ${e.joules} J`;
    case 'droga':
      return `💉 ${DROGAS_PARADA.find((d) => d.id === e.drogaId)?.nome ?? e.drogaId}: ${n(e.volumeMl)} mL`;
    case 'fluido':
      return `💧 SF 0,9% ${n(e.volumeMl)} mL em bolus`;
    case 'viaAerea':
      return `🫁 ${e.descricao}`;
    case 'acesso':
      return `🩸 ${e.descricao}`;
    case 'encerrar':
      return 'Código encerrado';
  }
}

/**
 * Código de parada (PCR pediátrica): relógio do código, ciclos de 2 min, adrenalina a cada 3–5 min,
 * desfibrilador (J/kg), carrinho com gavetas (doses pelo peso; o aluno diz quantos mL aspirar)
 * e a avaliação do algoritmo no fim. Doses e tempos: A VALIDAR.
 */
export function CodigoParada() {
  const { config } = useConfiguracoes();
  const prova = config.modo === 'prova';
  const [cenarioId, setCenarioId] = useState(CENARIOS_PARADA[0]!.id);
  const cenario = CENARIOS_PARADA.find((c) => c.id === cenarioId) ?? CENARIOS_PARADA[0]!;
  const [eventos, setEventos] = useState<EventoParada[]>([]);
  const [tS, setTS] = useState(0);
  const [rodando, setRodando] = useState(false);
  const [velocidade, setVelocidade] = useState<(typeof VELOCIDADES)[number]>(1);
  const [joules, setJoules] = useState('');
  const [volumes, setVolumes] = useState<Record<string, string>>({});
  const [retorno, setRetorno] = useState<{ ok: boolean; texto: string } | null>(null);
  const [folhaAberta, setFolhaAberta] = useState(false);

  const estado = useMemo(() => estadoDaParada(cenario, eventos, tS), [cenario, eventos, tS]);
  const avaliacao = useMemo(() => (estado.encerrada ? avaliarParada(cenario, eventos, toleranciaDe(config)) : null), [estado.encerrada, cenario, eventos, config]);

  // relógio do código
  useEffect(() => {
    if (!rodando) return;
    const id = window.setInterval(() => setTS((t) => t + (PASSO_MS / 1000) * velocidade), PASSO_MS);
    return () => window.clearInterval(id);
  }, [rodando, velocidade]);

  const registrar = (e: EventoParada) => setEventos((l) => [...l, e]);

  const recomecar = (novoId = cenarioId) => {
    setCenarioId(novoId);
    setEventos([]);
    setTS(0);
    setRodando(false);
    setJoules('');
    setVolumes({});
    setRetorno(null);
  };

  const iniciar = () => {
    registrar({ tipo: 'iniciar', tS });
    setRodando(true);
  };

  const darDroga = (drogaId: string) => {
    const volume = lerNumero(volumes[drogaId] ?? '');
    if (volume === null || volume <= 0) return;
    registrar({ tipo: 'droga', tS, drogaId, volumeMl: volume });
    const droga = DROGAS_PARADA.find((d) => d.id === drogaId)!;
    const certo = doseDaDroga(droga, cenario.pesoKg);
    const ok = conferirValor(volume, certo.volumeMl, toleranciaDe(config)).correto;
    setRetorno({ ok, texto: ok ? `${droga.nome}: ${n(volume)} mL confere.` : `${droga.nome}: ${n(volume)} mL não confere — ${n(droga.dosePorKg)} ${droga.unidade}/kg × ${n(cenario.pesoKg)} kg = ${n(arredondar(certo.dose, 3))} ${droga.unidade} = ${n(arredondar(certo.volumeMl, 2))} mL.` });
    setVolumes((v) => ({ ...v, [drogaId]: '' }));
  };

  const darBolus = () => {
    const volume = lerNumero(volumes[EXPANSAO_PARADA.id] ?? '');
    if (volume === null || volume <= 0) return;
    registrar({ tipo: 'fluido', tS, volumeMl: volume });
    const certo = volumeDoBolus(cenario.pesoKg);
    const ok = conferirValor(volume, certo, toleranciaDe(config)).correto;
    setRetorno({ ok, texto: ok ? `SF ${n(volume)} mL confere.` : `SF ${n(volume)} mL não confere — ${EXPANSAO_PARADA.mlPorKg} mL/kg × ${n(cenario.pesoKg)} kg = ${n(certo)} mL.` });
    setVolumes((v) => ({ ...v, [EXPANSAO_PARADA.id]: '' }));
  };

  const chocar = () => {
    const j = lerNumero(joules);
    if (j === null || j <= 0) return;
    const ritmoAgora = estado.ritmo;
    registrar({ tipo: 'choque', tS, joules: j });
    const certo = energiaDoChoque(estado.choques + 1, cenario.pesoKg);
    if (!ritmoChocavel(ritmoAgora)) setRetorno({ ok: false, texto: `Choque com ritmo NÃO chocável (${NOME_RITMO[ritmoAgora]}): não se choca.` });
    else {
      const ok = conferirValor(j, certo, { relativa: 0.1, absoluta: 1 }).correto;
      setRetorno({ ok, texto: ok ? `${j} J confere. Volte já às compressões.` : `${j} J não confere — ${estado.choques === 0 ? CHOQUE.primeiroJKg : CHOQUE.seguintesJKg} J/kg × ${n(cenario.pesoKg)} kg = ${certo} J.` });
    }
    setJoules('');
  };

  const checar = () => {
    registrar({ tipo: 'checarRitmo', tS });
    setRetorno(null);
  };

  const encerrar = () => {
    registrar({ tipo: 'encerrar', tS });
    setRodando(false);
  };

  const desdeAdrenalina = estado.ultimaAdrenalinaS === undefined ? undefined : tS - estado.ultimaAdrenalinaS;
  const corAdrenalina = desdeAdrenalina === undefined ? '' : desdeAdrenalina < TEMPOS_PARADA.adrenalinaMinS ? 'ok' : desdeAdrenalina <= TEMPOS_PARADA.adrenalinaMaxS ? 'atencao' : 'perigo';
  const progressoCiclo = Math.min(1, Math.max(0, 1 - estado.ciclo.restanteS / TEMPOS_PARADA.cicloRcpS));
  const ativo = estado.iniciada && !estado.encerrada;
  const tubo = tuboEndotraqueal(cenario.idadeAnos);
  const pesoEstimado = cenario.idadeAnos <= 12 ? pesoEstimadoApls(Math.round(cenario.idadeAnos * 12)) : null;
  const ritmosNoRegistro = eventos.map((e, i) =>
    e.tipo === 'checarRitmo' ? (estadoDaParada(cenario, eventos.slice(0, i + 1), e.tS).rce ? 'retorno da circulação (com pulso)' : prova ? 'sem pulso' : NOME_RITMO[estadoDaParada(cenario, eventos.slice(0, i + 1), e.tS).ritmo]) : undefined,
  );

  return (
    <div className="pagina-simples codigo-parada">
      <header className="cabecalho">
        <h1>🚨 Código de parada</h1>
        <label>
          Cenário:{' '}
          <select
            aria-label="Cenário da parada"
            value={cenarioId}
            onChange={(e) => {
              if (eventos.length > 0 && !window.confirm('Trocar de cenário começa o código do zero. Continuar?')) return;
              recomecar(e.target.value);
            }}
          >
            {CENARIOS_PARADA.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setFolhaAberta(true)}>
          📄 Folha de emergência ({n(cenario.pesoKg)} kg)
        </button>
        <button type="button" onClick={() => recomecar()}>
          ↺ Recomeçar
        </button>
      </header>
      <p className="aviso-treino" role="note">
        ⚠️ Treinamento. Doses, energias e tempos do algoritmo: A VALIDAR (PALS). Não substitui protocolos institucionais.
      </p>

      <div className="parada-grade">
        {/* PACIENTE E MONITOR */}
        <section className="painel parada-paciente" aria-label="Paciente da parada">
          <h2>{cenario.titulo}</h2>
          <p>{cenario.descricao}</p>
          <p>
            <strong>{cenario.idadeTexto}</strong> · <strong>{n(cenario.pesoKg)} kg</strong>
            {pesoEstimado && (
              <span className="nota">
                {' '}
                (sem balança, pela idade: {pesoEstimado.formula} = {n(pesoEstimado.pesoKg)} kg — A VALIDAR)
              </span>
            )}
          </p>
          <Monitor
            sinais={sinaisDoCodigo(estado.rce, estado.ritmo, cenario.idadeAnos)}
            idadeDias={cenario.idadeAnos * 365}
            ritmo={estado.ritmo}
            padraoRespiratorio={estado.rce ? 'assistida' : ativo ? 'assistida' : 'apneia'}
          />
          <details className="causas">
            <summary>Causas reversíveis (Hs e Ts)</summary>
            <ul>
              {CAUSAS_REVERSIVEIS.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </details>
        </section>

        {/* RELÓGIO E AÇÕES */}
        <section className="painel parada-relogio" aria-label="Relógio do código">
          <div className="relogio-grande" aria-label="Tempo de código">
            {mmss(estado.tempoS)}
          </div>
          <div className="ciclo" aria-label="Ciclo de RCP">
            <div className="ciclo-rotulo">
              Ciclo {estado.ciclo.numero} de RCP · {estado.iniciada ? (estado.ciclo.restanteS > 0 ? `checar ritmo em ${mmss(estado.ciclo.restanteS)}` : 'CHECAR RITMO AGORA') : 'aguardando'}
            </div>
            <div className="ciclo-barra">
              <span style={{ width: `${estado.iniciada ? progressoCiclo * 100 : 0}%` }} className={estado.ciclo.restanteS <= 0 ? 'vencido' : ''} />
            </div>
          </div>
          <div className="parada-contadores">
            <div className={`contador ${corAdrenalina}`} aria-label="Tempo desde a última adrenalina">
              <strong>{desdeAdrenalina === undefined ? '—' : mmss(desdeAdrenalina)}</strong>
              <span>desde a última adrenalina (3–5 min)</span>
            </div>
            <div className="contador">
              <strong>{estado.adrenalinas}</strong>
              <span>adrenalina(s)</span>
            </div>
            <div className="contador">
              <strong>{estado.choques}</strong>
              <span>choque(s)</span>
            </div>
          </div>

          <div className="linha-botoes parada-botoes">
            {!estado.iniciada ? (
              <button type="button" className="botao-principal" onClick={iniciar}>
                ▶ Iniciar o código (RCP)
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setRodando((r) => !r)} disabled={estado.encerrada}>
                  {rodando ? '⏸ Pausar relógio' : '▶ Continuar relógio'}
                </button>
                <button type="button" className="botao-principal" onClick={checar} disabled={!ativo}>
                  🔍 Checar ritmo
                </button>
                <button type="button" onClick={encerrar} disabled={!ativo}>
                  ⏹ Encerrar o código
                </button>
              </>
            )}
            <span className="velocidade" role="group" aria-label="Velocidade do relógio">
              {VELOCIDADES.map((v) => (
                <button key={v} type="button" aria-pressed={velocidade === v} onClick={() => setVelocidade(v)}>
                  ×{v}
                </button>
              ))}
            </span>
          </div>

          {!prova && <p className="proxima-acao" aria-label="Próxima ação">{estado.proximaAcao}</p>}
          {retorno && !prova && (
            <p className={retorno.ok ? 'retorno-ok' : 'retorno-erro'} role="status">
              {retorno.ok ? '✔' : '✘'} {retorno.texto}
            </p>
          )}

          <div className="desfibrilador" aria-label="Desfibrilador">
            <h3>⚡ Desfibrilador</h3>
            <form
              className="linha-botoes"
              onSubmit={(e) => {
                e.preventDefault();
                chocar();
              }}
            >
              <label>
                Energia{' '}
                <input aria-label="Energia do choque (J)" inputMode="decimal" size={5} value={joules} onChange={(e) => setJoules(e.target.value)} disabled={!ativo} /> J
              </label>
              <button type="submit" className="botao-choque" disabled={!ativo}>
                Carregar e chocar
              </button>
            </form>
            {!prova && (
              <p className="nota">
                {CHOQUE.primeiroJKg} J/kg no 1º choque, {CHOQUE.seguintesJKg} J/kg nos seguintes (A VALIDAR). Só FV e TV sem pulso.
              </p>
            )}
          </div>
        </section>

        {/* CARRINHO */}
        <section className="painel carrinho" aria-label="Carrinho de parada">
          <h2>🛒 Carrinho de parada</h2>
          {(Object.keys(NOME_GAVETA) as GavetaCarrinho[]).map((g) => (
            <details key={g} className="gaveta" open={g === 'drogas'}>
              <summary>{NOME_GAVETA[g]}</summary>
              <div className="gaveta-conteudo">
                {g === 'drogas' &&
                  DROGAS_PARADA.map((d) => (
                    <form
                      key={d.id}
                      className="item-carrinho"
                      onSubmit={(e) => {
                        e.preventDefault();
                        darDroga(d.id);
                      }}
                    >
                      <strong>{d.nome}</strong>
                      <small>
                        {d.apresentacao}
                        {d.preparo ? ` · ${d.preparo}` : ''}
                      </small>
                      {!prova && (
                        <small>
                          {d.quando}. Dose: {n(d.dosePorKg)} {d.unidade}/kg{d.doseMaxima !== undefined ? ` (máx. ${n(d.doseMaxima)} ${d.unidade})` : ''} — A VALIDAR
                        </small>
                      )}
                      <span className="linha-botoes">
                        <input
                          aria-label={`mL de ${d.nome}`}
                          inputMode="decimal"
                          size={5}
                          placeholder="mL"
                          value={volumes[d.id] ?? ''}
                          onChange={(e) => setVolumes((v) => ({ ...v, [d.id]: e.target.value }))}
                          disabled={!ativo}
                        />
                        <button type="submit" disabled={!ativo}>
                          Dar
                        </button>
                      </span>
                    </form>
                  ))}
                {g === 'fluidos' && (
                  <form
                    className="item-carrinho"
                    onSubmit={(e) => {
                      e.preventDefault();
                      darBolus();
                    }}
                  >
                    <strong>{EXPANSAO_PARADA.nome}</strong>
                    {!prova && (
                      <small>
                        {EXPANSAO_PARADA.quando}. {EXPANSAO_PARADA.mlPorKg} mL/kg — A VALIDAR
                      </small>
                    )}
                    <span className="linha-botoes">
                      <input
                        aria-label="mL de SF em bolus"
                        inputMode="decimal"
                        size={5}
                        placeholder="mL"
                        value={volumes[EXPANSAO_PARADA.id] ?? ''}
                        onChange={(e) => setVolumes((v) => ({ ...v, [EXPANSAO_PARADA.id]: e.target.value }))}
                        disabled={!ativo}
                      />
                      <button type="submit" disabled={!ativo}>
                        Dar
                      </button>
                    </span>
                  </form>
                )}
                {g === 'vias-aereas' && (
                  <div className="item-carrinho">
                    <span className="linha-botoes">
                      <button type="button" disabled={!ativo} onClick={() => registrar({ tipo: 'viaAerea', tS, descricao: 'Bolsa-válvula-máscara com O₂ 100%' })}>
                        Bolsa-válvula-máscara
                      </button>
                      <button type="button" disabled={!ativo} onClick={() => registrar({ tipo: 'viaAerea', tS, descricao: `Intubação (tubo com cuff nº ${n(tubo.comCuff)})` })}>
                        Intubar
                      </button>
                    </span>
                    {!prova && (
                      <small>
                        Tubo pela idade: com cuff nº {n(tubo.comCuff)} · sem cuff nº {n(tubo.semCuff)} · fixar a ~{n(tubo.profundidadeCm)} cm (A VALIDAR)
                      </small>
                    )}
                  </div>
                )}
                {g === 'acesso' && (
                  <div className="item-carrinho">
                    <span className="linha-botoes">
                      <button type="button" disabled={!ativo} onClick={() => registrar({ tipo: 'acesso', tS, descricao: 'Acesso venoso periférico' })}>
                        Acesso EV
                      </button>
                      <button type="button" disabled={!ativo} onClick={() => registrar({ tipo: 'acesso', tS, descricao: 'Acesso intraósseo (IO)' })}>
                        Intraósseo (IO)
                      </button>
                    </span>
                    <small>Sem veia em 60–90 s: intraósseo.</small>
                  </div>
                )}
              </div>
            </details>
          ))}
        </section>

        {/* REGISTRO E AVALIAÇÃO */}
        <section className="painel parada-registro" aria-label="Registro do código">
          <h2>Registro do código</h2>
          {eventos.length === 0 ? (
            <p className="nota">Clique em “Iniciar o código”. Cada ação entra aqui com o horário.</p>
          ) : (
            <ol className="linha-do-tempo">
              {eventos.map((e, i) => (
                <li key={i}>
                  <span className="hora">{mmss(e.tS - (eventos[0]?.tS ?? 0))}</span> {descreverEvento(e, ritmosNoRegistro[i])}
                </li>
              ))}
            </ol>
          )}
          {avaliacao && (
            <div className="avaliacao-parada" aria-label="Avaliação do código" role="status">
              <h3>{avaliacao.rce ? '✔ Retorno da circulação' : '✘ Sem retorno da circulação'} — {mmss(avaliacao.tempoTotalS)} de código</h3>
              <ul className="conferencia">
                {avaliacao.itens.map((item, i) => (
                  <li key={i} className={item.ok ? 'sit-certo' : 'sit-errado'}>
                    <span className="selo">{item.ok ? '✔' : '✘'}</span> {item.texto}
                  </li>
                ))}
              </ul>
              <p className="nota">Algoritmo e tempos: PALS, A VALIDAR.</p>
            </div>
          )}
        </section>
      </div>
      {folhaAberta && <FolhaEmergencia pesoKg={cenario.pesoKg} idadeAnos={cenario.idadeAnos} titulo={`${cenario.titulo} (${cenario.idadeTexto})`} aoFechar={() => setFolhaAberta(false)} />}
    </div>
  );
}
