import { PAPEIS_EQUIPE } from '../../dados/parada-briefing-a-validar';
import { RCP } from '../../dados/parada-rcp-a-validar';
import { aparenciaDoMembro } from '../../parada/cena';
import { quemFez } from '../../parada/equipe';
import { mmss } from '../../parada/parada';
import { formatarNumero } from '../../prescricao/comum';
import { DesenhoCenaRcp, MiniAvatar } from './CenaRcp';
import { useCodigo } from './contexto';
import { DepoisDoCodigo } from './Debriefing';
import { FeedEquipe, MonitorDoCodigo } from './DuranteCodigo';
import { cenaNoTempo, PainelCena } from './PainelCena';

const n = formatarNumero;

export type FaseCodigo = 'antes' | 'durante' | 'depois';

const NOME_FAIXA = { lenta: 'lenta', boa: 'no alvo', rapida: 'rápida' } as const;

/** Quem é quem: avatar, papel e nome de cada membro da equipe. */
function QuemEQuem() {
  const { membros } = useCodigo();
  return (
    <ul className="quem-e-quem" aria-label="Quem é quem">
      {PAPEIS_EQUIPE.map((p) => (
        <li key={p.id}>
          <MiniAvatar aparencia={aparenciaDoMembro(p.id, membros[p.id])} tamanho={40} rotulo={membros[p.id]?.nome.trim() || p.nome} />
          <span>
            <strong>{membros[p.id]?.nome.trim() || '—'}</strong>
            <small>
              {p.icone} {p.nome}
            </small>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Números da RCP para quem assiste: frequência, série e totais (sem botões). */
function NumerosRcp() {
  const { rcp, relacao, compressorDaVez, membros } = useCodigo();
  if (!rcp) {
    return (
      <section className="painel numeros-rcp" aria-label="Números da RCP">
        <h2>🫀 RCP</h2>
        <p className="nota">RCP automática (sem teclas): a cena mostra as compressões no ritmo certo.</p>
      </section>
    );
  }
  return (
    <section className="painel numeros-rcp" aria-label="Números da RCP">
      <h2>🫀 RCP</h2>
      <dl>
        <div className={rcp.faixaCompressao ? `faixa-${rcp.faixaCompressao}` : ''}>
          <dt>Frequência</dt>
          <dd aria-label="Frequência das compressões">
            {rcp.freqCompressao === null ? (
              '—'
            ) : (
              <>
                {Math.round(rcp.freqCompressao)}
                <span className="unidade">/min</span>
              </>
            )}
            {rcp.faixaCompressao && <small>{NOME_FAIXA[rcp.faixaCompressao]}</small>}
          </dd>
        </div>
        <div>
          <dt>Série</dt>
          <dd aria-label="Série de compressões">{rcp.modo === 'sincronizado' ? `${rcp.serie}/${relacao}` : 'contínuas'}</dd>
        </div>
        <div>
          <dt>{rcp.modo === 'sincronizado' ? 'Ventilações na pausa' : 'Ventilações'}</dt>
          <dd>
            {rcp.modo === 'sincronizado'
              ? `${rcp.ventilacoesNaPausa}/${RCP.ventilacoesPorPausa}`
              : rcp.freqVentilacao === null
                ? '—'
                : `${Math.round(rcp.freqVentilacao)}/min`}
          </dd>
        </div>
      </dl>
      <p className="nota">
        {rcp.compressoes} compressões · {rcp.ventilacoes} ventilações · vez de {quemFez(compressorDaVez, membros)}
      </p>
    </section>
  );
}

/**
 * Tela de quem só assiste (professor, telão): a cena da RCP em tamanho grande, o monitor, os números
 * da RCP e o que a equipe fez. Sem teclas da RCP nem painéis de papel. Antes do código: a equipe
 * esperando; depois: o debriefing de todos.
 */
export function TelaObservador({ fase, aoSair }: { fase: FaseCodigo; aoSair: () => void }) {
  const ctx = useCodigo();
  const { s, cenario, estado, pausado, tS } = ctx;
  return (
    <div className="tela-observador">
      <div className="barra-observador" role="group" aria-label="Só assistindo">
        <span className="selo">👀 Só assistindo</span>
        <span className="barra-observador-caso">
          {cenario.titulo} — {cenario.idadeTexto}, {n(cenario.pesoKg)} kg
        </span>
        {fase === 'durante' && (
          <>
            <span className="relogio-grande" aria-label="Tempo de código">
              {mmss(estado.tempoS)}
            </span>
            <span className="selo">Ciclo {estado.ciclo.numero}</span>
            {pausado && <span className="selo">⏸ relógio pausado</span>}
          </>
        )}
        <button type="button" className="botao-discreto" onClick={aoSair}>
          Sair do modo só assistir
        </button>
      </div>

      {fase === 'antes' && (
        <div className="observador-espera">
          <section className="painel painel-cena tamanho-grande" aria-label="Cena da RCP">
            <p className="espera-equipe" role="status">
              ⏳ Esperando a equipe começar…
            </p>
            <div className="painel-cena-desenho">
              <DesenhoCenaRcp cena={cenaNoTempo(ctx, tS, true)} tamanho="grande" />
            </div>
          </section>
          <section className="painel" aria-label="Equipe">
            <h2>👥 Quem é quem</h2>
            <QuemEQuem />
            <p className="nota">Os nomes e os avatares são escolhidos na tela da equipe (passo 2 do Preparar).</p>
          </section>
        </div>
      )}

      {fase === 'durante' && (
        <div className="observador-grade">
          <PainelCena tamanho="grande" recolhivel={false} />
          <aside className="parada-lateral">
            <MonitorDoCodigo />
            <NumerosRcp />
            <FeedEquipe />
          </aside>
        </div>
      )}

      {fase === 'depois' && <DepoisDoCodigo aoRecomecar={s.recomecar} />}
    </div>
  );
}
