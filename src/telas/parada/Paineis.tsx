import { useState } from 'react';
import { arredondar, conferirValor } from '../../calculos';
import { NOME_RITMO } from '../../casos/tipos';
import { nomeDaTecla } from '../../configuracoes/configuracoes';
import { useConfiguracoes } from '../../configuracoes/ContextoConfiguracoes';
import { CAUSAS_REVERSIVEIS, CHOQUE, DROGAS_PARADA, EXPANSAO_PARADA, TEMPOS_PARADA } from '../../dados/parada-a-validar';
import { ORDENS_LIDER } from '../../dados/parada-briefing-a-validar';
import { ADMINISTRACAO_DROGA, RCP } from '../../dados/parada-rcp-a-validar';
import { descreverEventos, ordensPendentes, papelPorId, quemFez } from '../../parada/equipe';
import { doseDaDroga, energiaDoChoque, EVENTOS_DA_FOLHA, mmss, ritmoChocavel, tuboEndotraqueal, volumeDoBolus } from '../../parada/parada';
import { formatarNumero, lerNumero } from '../../prescricao/comum';
import { useCodigo } from './contexto';

const n = formatarNumero;

/** Papel desta tela que faz a ação (o primeiro dos `papeis` que é desta tela). */
function usePapel(...papeis: string[]): string {
  const { meusPapeis } = useCodigo();
  return papeis.find((p) => meusPapeis.includes(p)) ?? papeis[0]!;
}

/** Retorno da conta (só no modo treino). */
function Retorno({ retorno }: { retorno: { ok: boolean; texto: string } | null }) {
  const { prova } = useCodigo();
  if (!retorno || prova) return null;
  return (
    <p className={retorno.ok ? 'retorno-ok' : 'retorno-erro'} role="status">
      {retorno.ok ? '✔' : '✘'} {retorno.texto}
    </p>
  );
}

/** Ordens do líder para estes papéis, esperando o "entendido" (comunicação em alça fechada). */
function OrdensRecebidas({ papeis }: { papeis: readonly string[] }) {
  const { s, membros, tS } = useCodigo();
  const pendentes = ordensPendentes(s.sala.eventos, papeis);
  if (!pendentes.length) return null;
  return (
    <ul className="ordens-recebidas" aria-label="Ordens do líder">
      {pendentes.map((o) => (
        <li key={o.id}>
          <span>
            📣 <strong>{o.texto}</strong> <small>— {quemFez(o.por, membros)}, há {Math.max(0, Math.round(tS - o.tS))} s</small>
          </span>
          <button type="button" className="botao-principal" onClick={() => s.registrar({ tipo: 'entendido', tS: s.agoraS(), ordemId: o.id! }, o.para)}>
            ✔ Entendido
          </button>
        </li>
      ))}
    </ul>
  );
}

function BotaoChecarRitmo({ por }: { por: string }) {
  const { s, estado } = useCodigo();
  return (
    <button type="button" className={`botao-principal${estado.ciclo.restanteS <= 0 ? ' piscando' : ''}`} onClick={() => s.registrar({ tipo: 'checarRitmo', tS: s.agoraS() }, por)}>
      🔍 Checar ritmo (pausa até 10 s)
    </button>
  );
}

// ---- Líder ---------------------------------------------------------------------------------

export function PainelLider() {
  const { s, estado, prova, membros, cenario } = useCodigo();
  const [detalhe, setDetalhe] = useState('');
  const ordens = s.sala.eventos.filter((e) => e.tipo === 'ordem');
  const entendidas = new Set(s.sala.eventos.flatMap((e) => (e.tipo === 'entendido' ? [e.ordemId] : [])));
  const dar = (texto: string, para: string) => {
    const d = detalhe.trim();
    s.registrar({ tipo: 'ordem', tS: s.agoraS(), para, texto: d ? `${texto}: ${d}` : texto }, 'lider');
    setDetalhe('');
  };
  return (
    <div className="painel-papel-conteudo">
      {!prova && (
        <p className="proxima-acao" aria-label="Próxima ação">
          {estado.proximaAcao}
        </p>
      )}
      <div className="linha-botoes">
        <BotaoChecarRitmo por="lider" />
        <span className="nota">
          {cenario.idadeTexto} · {n(cenario.pesoKg)} kg · {estado.adrenalinas} adrenalina(s) · {estado.choques} choque(s)
        </span>
      </div>
      <h3>📣 Dar uma ordem</h3>
      <label className="campo-ordem">
        Detalhe (opcional):{' '}
        <input value={detalhe} onChange={(e) => setDetalhe(e.target.value)} placeholder="dose, energia… (ex.: quantos mL)" aria-label="Detalhe da ordem" />
      </label>
      <div className="grade-ordens">
        {ORDENS_LIDER.map((o) => (
          <button key={o.id} type="button" onClick={() => dar(o.texto, o.para)} title={`Para: ${papelPorId(o.para)?.nome}`}>
            {o.texto}
            <small>→ {quemFez(o.para, membros)}</small>
          </button>
        ))}
      </div>
      {ordens.length > 0 && (
        <ul className="lista-ordens" aria-label="Ordens dadas">
          {[...ordens].reverse().map((o) => (
            <li key={o.id} className={entendidas.has(o.id!) ? 'sit-certo' : ''}>
              {entendidas.has(o.id!) ? '✔' : '⏳'} {o.tipo === 'ordem' && o.texto} <small>→ {o.tipo === 'ordem' && quemFez(o.para, membros)}</small>
            </li>
          ))}
        </ul>
      )}
      <details className="causas">
        <summary>Causas reversíveis (Hs e Ts)</summary>
        <ul>
          {CAUSAS_REVERSIVEIS.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

// ---- Compressões e ventilação -----------------------------------------------------------------

export function PainelCompressoes() {
  const { rcp, prova, compressorDaVez, membros, estado } = useCodigo();
  const { config } = useConfiguracoes();
  return (
    <div className="painel-papel-conteudo">
      <OrdensRecebidas papeis={['compressor-1', 'compressor-2']} />
      <p>
        <strong>Vez de: {quemFez(compressorDaVez, membros)}.</strong> {membros['compressor-2']?.nome.trim() ? 'A troca é a cada checagem de ritmo (2 min).' : 'Com o 2º compressor, vocês revezam a cada 2 min.'}
      </p>
      {rcp ? (
        !prova && (
          <ul className="dicas">
            <li>
              Aperte <kbd>{nomeDaTecla(config.teclaCompressao)}</kbd> a cada compressão: {RCP.compressoesPorMin.min}–{RCP.compressoesPorMin.max}/min.
            </li>
            <li>Profundidade de 1/3 do tórax, deixe o tórax voltar todo, mínimo de pausas (até {RCP.pausaMaximaS} s).</li>
            <li>{estado.viaAvancadaS === undefined ? 'Sem via aérea avançada: pare para as 2 ventilações.' : 'Com via aérea avançada: compressões contínuas.'}</li>
            <li>Desfibrilador carregado: mãos fora do tórax no choque.</li>
          </ul>
        )
      ) : (
        <p className="nota">RCP automática (sem teclas): as compressões contam sozinhas.</p>
      )}
    </div>
  );
}

export function PainelVentilacao() {
  const { s, estado, cenario, prova, rcp, relacao } = useCodigo();
  const { config } = useConfiguracoes();
  const tubo = tuboEndotraqueal(cenario.idadeAnos);
  const vias = s.sala.eventos.filter((e) => e.tipo === 'viaAerea');
  return (
    <div className="painel-papel-conteudo">
      <OrdensRecebidas papeis={['via-aerea']} />
      <div className="linha-botoes">
        <button type="button" onClick={() => s.registrar({ tipo: 'viaAerea', tS: s.agoraS(), descricao: 'Bolsa-válvula-máscara com O₂ 100%' }, 'via-aerea')}>
          Bolsa-válvula-máscara (O₂ 100%)
        </button>
        <button type="button" disabled={estado.viaAvancadaS !== undefined} onClick={() => s.registrar({ tipo: 'viaAerea', tS: s.agoraS(), descricao: `Intubação (tubo com cuff nº ${n(tubo.comCuff)})` }, 'via-aerea')}>
          Intubar
        </button>
      </div>
      {!prova && (
        <small className="nota">
          Tubo pela idade: com cuff nº {n(tubo.comCuff)} · sem cuff nº {n(tubo.semCuff)} · fixar a ~{n(tubo.profundidadeCm)} cm (A VALIDAR)
        </small>
      )}
      {vias.length > 0 && (
        <p>
          {vias.map((v) => (v.tipo === 'viaAerea' ? `✔ ${v.descricao} (${mmss(v.tS)})` : '')).join(' · ')}
        </p>
      )}
      {rcp && !prova && (
        <ul className="dicas">
          {estado.viaAvancadaS === undefined ? (
            <li>
              Sem via aérea avançada: aperte <kbd>{nomeDaTecla(config.teclaVentilacao)}</kbd> {RCP.ventilacoesPorPausa} vezes na pausa, depois de cada {relacao} compressões (cerca de 1 s cada).
            </li>
          ) : (
            <li>
              Com via aérea avançada: <kbd>{nomeDaTecla(config.teclaVentilacao)}</kbd> 1 vez a cada 2–3 s ({RCP.ventilacoesPorMinComVia.min}–{RCP.ventilacoesPorMinComVia.max}/min), sem parar as compressões. Mais rápido = hiperventilação.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ---- Medicação -----------------------------------------------------------------------------------

export function PainelMedicacao() {
  const { s, estado, cenario, prova, tolerancia } = useCodigo();
  const [escolhida, setEscolhida] = useState<string>(DROGAS_PARADA[0]!.id);
  const [volume, setVolume] = useState('');
  const [flush, setFlush] = useState('');
  const [elevar, setElevar] = useState(false);
  const [retorno, setRetorno] = useState<{ ok: boolean; texto: string } | null>(null);
  const droga = DROGAS_PARADA.find((d) => d.id === escolhida);
  const bolus = escolhida === EXPANSAO_PARADA.id;
  const acessos = s.sala.eventos.filter((e) => e.tipo === 'acesso');

  const administrar = () => {
    const ml = lerNumero(volume);
    if (ml === null || ml <= 0) return;
    const tS = s.agoraS();
    if (bolus) {
      s.registrar({ tipo: 'fluido', tS, volumeMl: ml }, 'medicacao');
      const certo = volumeDoBolus(cenario.pesoKg);
      const ok = conferirValor(ml, certo, tolerancia).correto;
      setRetorno({ ok, texto: ok ? `SF ${n(ml)} mL confere.` : `SF ${n(ml)} mL não confere — ${EXPANSAO_PARADA.mlPorKg} mL/kg × ${n(cenario.pesoKg)} kg = ${n(certo)} mL.` });
    } else if (droga) {
      const f = lerNumero(flush);
      s.registrar({ tipo: 'droga', tS, drogaId: droga.id, volumeMl: ml, ...(f !== null && f > 0 && { flushMl: f }), ...(elevar && { elevouMembro: true }) }, 'medicacao');
      const certo = doseDaDroga(droga, cenario.pesoKg);
      const ok = conferirValor(ml, certo.volumeMl, tolerancia).correto;
      const semFlush = f === null || f <= 0 ? ' Faltou o flush de SF.' : '';
      setRetorno({
        ok: ok && !semFlush,
        texto: ok
          ? `${droga.nome}: ${n(ml)} mL confere.${semFlush}`
          : `${droga.nome}: ${n(ml)} mL não confere — ${n(droga.dosePorKg)} ${droga.unidade}/kg × ${n(cenario.pesoKg)} kg = ${n(arredondar(certo.dose, 3))} ${droga.unidade} = ${n(arredondar(certo.volumeMl, 2))} mL.${semFlush}`,
      });
    }
    setVolume('');
    setFlush('');
    setElevar(false);
  };

  return (
    <div className="painel-papel-conteudo">
      <OrdensRecebidas papeis={['medicacao']} />
      <div className="linha-botoes acesso-linha">
        <strong>🩸 Acesso:</strong>
        {acessos.length ? (
          <span className="selo selo-ok">{acessos.map((a) => (a.tipo === 'acesso' ? `${a.descricao} (${mmss(a.tS)})` : '')).join(' · ')}</span>
        ) : (
          <span className="selo selo-perigo">sem acesso</span>
        )}
        <button type="button" onClick={() => s.registrar({ tipo: 'acesso', tS: s.agoraS(), descricao: 'Acesso venoso periférico' }, 'medicacao')}>
          Acesso EV
        </button>
        <button type="button" onClick={() => s.registrar({ tipo: 'acesso', tS: s.agoraS(), descricao: 'Acesso intraósseo (IO)' }, 'medicacao')}>
          Intraósseo (IO)
        </button>
      </div>
      {!prova && !acessos.length && <small className="nota">Sem veia em 60–90 s: intraósseo.</small>}

      <div className="lista-drogas" role="group" aria-label="Drogas e fluidos">
        {[...DROGAS_PARADA.map((d) => ({ id: d.id, nome: d.nome })), { id: EXPANSAO_PARADA.id, nome: EXPANSAO_PARADA.nome }].map((d) => (
          <button key={d.id} type="button" aria-pressed={escolhida === d.id} onClick={() => setEscolhida(d.id)}>
            {d.nome}
            {estado.dadas[d.id] ? <span className="selo">{estado.dadas[d.id]}×</span> : null}
          </button>
        ))}
      </div>

      <form
        className="form-droga"
        aria-label={`Administrar ${bolus ? EXPANSAO_PARADA.nome : droga?.nome}`}
        onSubmit={(e) => {
          e.preventDefault();
          administrar();
        }}
      >
        {droga && !bolus && (
          <p className="nota">
            <strong>{droga.apresentacao}</strong>
            {droga.preparo ? ` · ${droga.preparo}` : ''} · {droga.via}
            {!prova && (
              <>
                <br />
                {droga.quando}. Dose: {n(droga.dosePorKg)} {droga.unidade}/kg{droga.doseMaxima !== undefined ? ` (máx. ${n(droga.doseMaxima)} ${droga.unidade})` : ''}
                {droga.repetir ? `, ${droga.repetir}` : ''} — A VALIDAR
              </>
            )}
          </p>
        )}
        {bolus && !prova && (
          <p className="nota">
            {EXPANSAO_PARADA.quando}. {EXPANSAO_PARADA.mlPorKg} mL/kg — A VALIDAR
          </p>
        )}
        <label>
          Aspirei{' '}
          <input data-numero aria-label={`mL de ${bolus ? 'SF em bolus' : droga?.nome}`} inputMode="decimal" size={5} value={volume} onChange={(e) => setVolume(e.target.value)} /> mL
        </label>
        {!bolus && (
          <>
            <label>
              Flush de SF{' '}
              <input data-numero aria-label="Flush de SF (mL)" inputMode="decimal" size={4} value={flush} onChange={(e) => setFlush(e.target.value)} /> mL
            </label>
            <label className="linha-check">
              <input type="checkbox" checked={elevar} onChange={(e) => setElevar(e.target.checked)} /> Elevar o membro
            </label>
          </>
        )}
        <button type="submit" className="botao-principal">
          💉 Administrar
        </button>
        {!prova && !bolus && (
          <small className="nota">
            Depois de cada droga: flush de {ADMINISTRACAO_DROGA.flushMl.min}–{ADMINISTRACAO_DROGA.flushMl.max} mL de SF; no acesso periférico, elevar o membro por {ADMINISTRACAO_DROGA.elevarMembroS.min}–{ADMINISTRACAO_DROGA.elevarMembroS.max} s (A VALIDAR).
          </small>
        )}
      </form>
      <Retorno retorno={retorno} />
    </div>
  );
}

// ---- Monitor e desfibrilador ---------------------------------------------------------------------

export function PainelMonitor() {
  const { s, estado, cenario, prova } = useCodigo();
  const [joules, setJoules] = useState('');
  const [retorno, setRetorno] = useState<{ ok: boolean; texto: string } | null>(null);
  const carga = estado.carregadoJ;

  const carregar = () => {
    const j = lerNumero(joules);
    if (j === null || j <= 0) return;
    s.registrar({ tipo: 'carga', tS: s.agoraS(), joules: j }, 'monitor');
    setJoules('');
  };
  const chocar = () => {
    if (carga === undefined) return;
    const ritmoAgora = estado.ritmo;
    const certo = energiaDoChoque(estado.choques + 1, cenario.pesoKg);
    s.registrar({ tipo: 'choque', tS: s.agoraS(), joules: carga }, 'monitor');
    if (!ritmoChocavel(ritmoAgora)) setRetorno({ ok: false, texto: `Choque com ritmo NÃO chocável (${NOME_RITMO[ritmoAgora]}): não se choca.` });
    else {
      const ok = conferirValor(carga, certo, { relativa: 0.1, absoluta: 1 }).correto;
      setRetorno({ ok, texto: ok ? `${carga} J confere. Volte já às compressões.` : `${carga} J não confere — ${estado.choques === 0 ? CHOQUE.primeiroJKg : CHOQUE.seguintesJKg} J/kg × ${n(cenario.pesoKg)} kg = ${certo} J.` });
    }
  };

  return (
    <div className="painel-papel-conteudo">
      <OrdensRecebidas papeis={['monitor']} />
      <div className="linha-botoes">
        <BotaoChecarRitmo por="monitor" />
      </div>
      <div className="desfibrilador" aria-label="Desfibrilador">
        <h3>⚡ Desfibrilador</h3>
        {carga === undefined ? (
          <form
            className="linha-botoes"
            onSubmit={(e) => {
              e.preventDefault();
              carregar();
            }}
          >
            <label>
              Energia <input data-numero aria-label="Energia do choque (J)" inputMode="decimal" size={5} value={joules} onChange={(e) => setJoules(e.target.value)} /> J
            </label>
            <button type="submit">Carregar</button>
          </form>
        ) : (
          <div className="linha-botoes">
            <strong className="carregado">Carregado: {carga} J — “Afastem-se!”</strong>
            <button type="button" className="botao-choque" onClick={chocar}>
              ⚡ Chocar
            </button>
            <button type="button" onClick={() => s.registrar({ tipo: 'carga', tS: s.agoraS(), joules: 0 }, 'monitor')}>
              Cancelar a carga
            </button>
          </div>
        )}
        {!prova && (
          <p className="nota">
            {CHOQUE.primeiroJKg} J/kg no 1º choque, {CHOQUE.seguintesJKg} J/kg nos seguintes (A VALIDAR). Só FV e TV sem pulso.
          </p>
        )}
      </div>
      <Retorno retorno={retorno} />
    </div>
  );
}

// ---- Tempo ----------------------------------------------------------------------------------------

export function PainelTempo() {
  const { s, estado, tS } = useCodigo();
  const desdeAdrenalina = estado.ultimaAdrenalinaS === undefined ? undefined : tS - estado.ultimaAdrenalinaS;
  const corAdrenalina = desdeAdrenalina === undefined ? '' : desdeAdrenalina < TEMPOS_PARADA.adrenalinaMinS ? 'ok' : desdeAdrenalina <= TEMPOS_PARADA.adrenalinaMaxS ? 'atencao' : 'perigo';
  const progresso = Math.min(1, Math.max(0, 1 - estado.ciclo.restanteS / TEMPOS_PARADA.cicloRcpS));
  const avisar = (aviso: 'checar-ritmo' | 'adrenalina') => s.registrar({ tipo: 'aviso', tS: s.agoraS(), aviso }, 'tempo');
  return (
    <div className="painel-papel-conteudo">
      <OrdensRecebidas papeis={['tempo']} />
      <div className="ciclo" aria-label="Ciclo de RCP">
        <div className="ciclo-rotulo">
          Ciclo {estado.ciclo.numero} de RCP · {estado.ciclo.restanteS > 0 ? `checar ritmo em ${mmss(estado.ciclo.restanteS)}` : 'CHECAR RITMO AGORA'}
        </div>
        <div className="ciclo-barra">
          <span style={{ width: `${progresso * 100}%` }} className={estado.ciclo.restanteS <= 0 ? 'vencido' : ''} />
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
      <div className="linha-botoes">
        <button type="button" onClick={() => avisar('checar-ritmo')}>
          📣 Avisar: 2 minutos (checar ritmo e trocar o compressor)
        </button>
        <button type="button" onClick={() => avisar('adrenalina')}>
          📣 Avisar: hora da adrenalina
        </button>
      </div>
    </div>
  );
}

// ---- Anotação ----------------------------------------------------------------------------------------

export function PainelAnotacao() {
  const { s, membros, ritmoNaChecagem } = useCodigo();
  const [texto, setTexto] = useState('');
  const eventos = s.sala.eventos;
  const textos = descreverEventos(eventos, ritmoNaChecagem);
  const anotados = new Map(eventos.flatMap((e) => (e.tipo === 'anotado' ? [[e.eventoId, e.tS] as const] : [])));
  const daFolha = eventos.map((e, i) => ({ e, texto: textos[i]! })).filter(({ e }) => EVENTOS_DA_FOLHA.includes(e.tipo) && e.id);
  const inicio = eventos.find((e) => e.tipo === 'iniciar')?.tS ?? 0;
  return (
    <div className="painel-papel-conteudo">
      <OrdensRecebidas papeis={['registro']} />
      <h3>✍️ Folha do código</h3>
      {daFolha.length === 0 ? (
        <p className="nota">Cada ação da equipe aparece aqui para você anotar com o horário.</p>
      ) : (
        <table className="tabela-simples folha-codigo" aria-label="Folha do código">
          <tbody>
            {daFolha.map(({ e, texto: t }) => (
              <tr key={e.id} className={anotados.has(e.id!) ? 'sit-certo' : ''}>
                <td className="hora">{mmss(e.tS - inicio)}</td>
                <td>
                  {t} <small>— {quemFez(e.por, membros)}</small>
                </td>
                <td>
                  {anotados.has(e.id!) ? (
                    <span className="selo selo-ok">✔ anotado</span>
                  ) : (
                    <button type="button" onClick={() => s.registrar({ tipo: 'anotado', tS: s.agoraS(), eventoId: e.id! }, 'registro')}>
                      ✍ Anotar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form
        className="linha-botoes"
        onSubmit={(e) => {
          e.preventDefault();
          if (!texto.trim()) return;
          s.registrar({ tipo: 'anotacao', tS: s.agoraS(), texto: texto.trim() }, 'registro');
          setTexto('');
        }}
      >
        <input aria-label="Observação" placeholder="observação (ex.: pupilas, família avisada…)" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button type="submit">📝 Anotar observação</button>
      </form>
    </div>
  );
}
