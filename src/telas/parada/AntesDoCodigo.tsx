import { useEffect, useState } from 'react';
import { pesoEstimadoApls } from '../../calculos';
import { nomeDaTecla, teclaValida } from '../../configuracoes/configuracoes';
import { useConfiguracoes } from '../../configuracoes/ContextoConfiguracoes';
import { type CenarioParada, CENARIOS_PARADA } from '../../dados/parada-a-validar';
import { CHECKLIST_BRIEFING, PAPEIS_EQUIPE, type PapelEquipe } from '../../dados/parada-briefing-a-validar';
import { NOME_TOM } from '../../ilustracoes/pele';
import { TONS_DE_PELE } from '../../neonatal/exame';
import { type AparenciaAvatar, aparenciaDoMembro, type Cabelo, CORES_ROUPA, NOME_CABELO } from '../../parada/cena';
import { relacaoDoCenario } from '../../parada/debriefing';
import { briefingDaSala, CHAVES, donoDoPapel, type Membro, membrosDaSala, observadoresDaSala, ordemDasTelas, rcpPelasTeclas } from '../../parada/sala';
import { formatarNumero } from '../../prescricao/comum';
import { MiniAvatar } from './CenaRcp';
import type { SalaNaTela } from './useSalaParada';

const n = formatarNumero;

/**
 * Abre outra janela do SimPed na Parada (a tela de um colega, no mesmo computador). Com ?janela=parada
 * ela só espelha a sessão do Prescrever (não pergunta "continuar" nem grava por cima da do aluno).
 */
function abrirOutraTela() {
  const url = new URL(window.location.href);
  url.searchParams.delete('assistir');
  url.searchParams.set('janela', 'parada');
  url.hash = 'parada';
  window.open(url.toString(), '_blank');
}

/** Botão que espera a próxima tecla apertada para virar a tecla da compressão/ventilação. */
function EscolherTecla({ rotulo, atual, outra, aoEscolher }: { rotulo: string; atual: string; outra: string; aoEscolher: (codigo: string) => void }) {
  const [esperando, setEsperando] = useState(false);
  const [erro, setErro] = useState('');
  useEffect(() => {
    if (!esperando) return;
    const aoApertar = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEsperando(false);
      if (e.code === 'Escape') return;
      if (!teclaValida(e.code)) setErro('Essa tecla não pode ser usada.');
      else if (e.code === outra) setErro('Essa tecla já é da outra função.');
      else {
        setErro('');
        aoEscolher(e.code);
      }
    };
    window.addEventListener('keydown', aoApertar, true);
    return () => window.removeEventListener('keydown', aoApertar, true);
  }, [esperando, outra, aoEscolher]);
  return (
    <span className="escolher-tecla">
      {rotulo}: <kbd>{nomeDaTecla(atual)}</kbd>{' '}
      <button type="button" className="botao-discreto" aria-pressed={esperando} onClick={() => setEsperando((x) => !x)}>
        {esperando ? 'aperte a tecla nova… (Esc cancela)' : 'mudar'}
      </button>
      {erro && <small className="texto-erro"> {erro}</small>}
    </span>
  );
}

const CABELOS = Object.keys(NOME_CABELO) as Cabelo[];

/** Escolha do avatar de um papel (pele, cabelo, cor da roupa), com a prévia. Sem escolha vale a padrão do papel. */
function EscolherAvatar({ papel, membro, aoMudar }: { papel: PapelEquipe; membro: Membro | undefined; aoMudar: (avatar: AparenciaAvatar | undefined) => void }) {
  const atual = aparenciaDoMembro(papel.id, membro);
  const mudar = (parte: Partial<AparenciaAvatar>) => aoMudar({ ...atual, ...parte });
  return (
    <div className="escolher-avatar" role="group" aria-label={`Avatar: ${papel.nome}`}>
      <div className="previa-avatar" data-pele={atual.pele} data-cabelo={atual.cabelo} data-roupa={atual.roupa}>
        <MiniAvatar aparencia={atual} tamanho={64} rotulo={membro?.nome.trim() || papel.nome} />
      </div>
      <div className="opcoes-avatar">
        <div role="group" aria-label="Pele">
          {TONS_DE_PELE.map((t) => (
            <button key={t} type="button" className={`amostra-tom tom-${t}`} aria-pressed={atual.pele === t} title={NOME_TOM[t]} onClick={() => mudar({ pele: t })}>
              <span className="sr-only">{NOME_TOM[t]}</span>
            </button>
          ))}
        </div>
        <div role="group" aria-label="Cabelo">
          {CABELOS.map((c) => (
            <button key={c} type="button" className="botao-cabelo" aria-pressed={atual.cabelo === c} onClick={() => mudar({ cabelo: c })}>
              {NOME_CABELO[c]}
            </button>
          ))}
        </div>
        <div role="group" aria-label="Cor da roupa">
          {CORES_ROUPA.map((r) => (
            <button key={r.cor} type="button" className="amostra-roupa" style={{ background: r.cor }} aria-pressed={atual.roupa.toLowerCase() === r.cor.toLowerCase()} title={r.nome} onClick={() => mudar({ roupa: r.cor })}>
              <span className="sr-only">{r.nome}</span>
            </button>
          ))}
        </div>
        {membro?.avatar && (
          <button type="button" className="botao-discreto" onClick={() => aoMudar(undefined)}>
            Voltar ao padrão
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Antes do código: cenário, equipe (quem faz cada papel e em qual tela), RCP pelas teclas,
 * briefing (opcional) e o botão de iniciar. Nada de botões do código aqui: a tela fica limpa.
 */
export function AntesDoCodigo({
  s,
  cenario,
  aoAbrirFolha,
  aoIniciar,
  aoAssistir,
}: {
  s: SalaNaTela;
  cenario: CenarioParada;
  aoAbrirFolha: () => void;
  aoIniciar: () => void;
  /** Esta tela passa a só assistir (professor, telão). */
  aoAssistir: () => void;
}) {
  const { config, mudar: mudarConfig } = useConfiguracoes();
  const membros = membrosDaSala(s.sala);
  const feitos = briefingDaSala(s.sala);
  const teclas = rcpPelasTeclas(s.sala);
  const [avatarAberto, setAvatarAberto] = useState<string | null>(null);
  const telas = ordemDasTelas(s.sala, s.vivas);
  const assistindo = [...observadoresDaSala(s.sala)].filter((t) => s.vivas.has(t)).length;
  const mudarAvatar = (papel: string, avatar: AparenciaAvatar | undefined) => {
    const m: Membro = { ...membros[papel], nome: membros[papel]?.nome ?? '' };
    if (avatar) m.avatar = avatar;
    else delete m.avatar;
    s.mudar(CHAVES.membro(papel), m);
  };
  const variasTelas = telas.length > 1;
  const nomeDaTela = (t: string | undefined) => (t === s.tela ? 'nesta tela' : `Tela ${telas.indexOf(t ?? '') + 1}`);
  const pesoEstimado = cenario.idadeAnos <= 12 ? pesoEstimadoApls(Math.round(cenario.idadeAnos * 12)) : null;

  return (
    <div className="parada-antes">
      <section className="painel passo-antes" aria-label="Cenário">
        <h2>
          <span className="numero-passo">1</span> Cenário
        </h2>
        <div className="cenarios" role="radiogroup" aria-label="Cenário da parada">
          {CENARIOS_PARADA.map((c) => (
            <label key={c.id} className={`cartao-cenario${c.id === cenario.id ? ' escolhido' : ''}`}>
              <input type="radio" name={`cenario-${s.tela}`} checked={c.id === cenario.id} onChange={() => s.mudar(CHAVES.cenario, c.id)} />
              <strong>{c.titulo}</strong>
              <span className="selo">
                {c.idadeTexto} · {n(c.pesoKg)} kg
              </span>
              <small>{c.descricao}</small>
            </label>
          ))}
        </div>
        {pesoEstimado && !(config.modo === 'prova') && (
          <p className="nota">
            Sem balança, pela idade: {pesoEstimado.formula} = {n(pesoEstimado.pesoKg)} kg (A VALIDAR).
          </p>
        )}
      </section>

      <section className="painel passo-antes" aria-label="Equipe">
        <h2>
          <span className="numero-passo">2</span> Equipe — quem faz o quê
        </h2>
        <p className="nota">
          Escreva o nome de cada um. Papel sem nome continua valendo: quem estiver na tela faz.
          {variasTelas ? ' Cada colega marca, na tela dele, o papel que é seu.' : ''}
        </p>
        <ul className="lista-papeis">
          {PAPEIS_EQUIPE.map((p) => {
            const dono = donoDoPapel(s.sala, p.id, s.vivas);
            return (
              <li key={p.id} className={`papel-equipe${dono === s.tela ? ' meu' : ''}`}>
                <span className="papel-icone" aria-hidden="true">
                  {p.icone}
                </span>
                <span className="papel-texto">
                  <strong>{p.nome}</strong>
                  <small>{p.tarefas}</small>
                </span>
                <input
                  aria-label={`Nome: ${p.nome}`}
                  placeholder="nome"
                  value={membros[p.id]?.nome ?? ''}
                  onChange={(e) => s.mudar(CHAVES.membro(p.id), { ...membros[p.id], nome: e.target.value })}
                />
                {variasTelas && (
                  <span className="papel-tela">
                    <span className={`selo${dono === s.tela ? ' selo-ok' : ''}`}>📍 {nomeDaTela(dono)}</span>
                    {dono !== s.tela && (
                      <button type="button" className="botao-discreto" aria-label={`Fazer ${p.nome} nesta tela`} onClick={() => s.mudar(CHAVES.membro(p.id), { ...membros[p.id], tela: s.tela })}>
                        é meu
                      </button>
                    )}
                  </span>
                )}
                <button
                  type="button"
                  className="botao-avatar"
                  aria-label={`Avatar de ${p.nome}`}
                  aria-expanded={avatarAberto === p.id}
                  title="Escolher o avatar (pele, cabelo, roupa)"
                  onClick={() => setAvatarAberto((a) => (a === p.id ? null : p.id))}
                >
                  🎨
                </button>
                {avatarAberto === p.id && <EscolherAvatar papel={p} membro={membros[p.id]} aoMudar={(a) => mudarAvatar(p.id, a)} />}
              </li>
            );
          })}
        </ul>
        <p className="linha-botoes nota">
          <button type="button" onClick={abrirOutraTela}>
            ↗ Abrir a tela de um colega
          </button>
          <button type="button" onClick={aoAssistir} title="Esta tela não faz nenhum papel: mostra a cena grande, o monitor e o que a equipe fez">
            👀 Só assistir (professor ou telão)
          </button>
          <span>
            {variasTelas ? `${telas.length} telas abertas.` : 'Todos nesta tela (um computador ou tablet).'}
            {assistindo > 0 && ` 👀 ${assistindo} só assistindo.`} Cada colega no próprio celular: modo online (fase futura).
          </span>
        </p>
      </section>

      <section className="painel passo-antes" aria-label="RCP pelas teclas">
        <h2>
          <span className="numero-passo">3</span> RCP
        </h2>
        <label className="linha-check">
          <input type="checkbox" checked={teclas} onChange={(e) => s.mudar(CHAVES.teclas, e.target.checked)} /> Compressões e ventilações apertando teclas (treina o ritmo; relógio em tempo real)
        </label>
        {teclas ? (
          <p className="teclas-rcp">
            <EscolherTecla rotulo="🫀 Compressão" atual={config.teclaCompressao} outra={config.teclaVentilacao} aoEscolher={(c) => mudarConfig({ teclaCompressao: c })} />
            <EscolherTecla rotulo="🫁 Ventilação" atual={config.teclaVentilacao} outra={config.teclaCompressao} aoEscolher={(c) => mudarConfig({ teclaVentilacao: c })} />
            <small>
              Neste cenário: {relacaoDoCenario(cenario)}:2 sem via aérea avançada. No tablet, toque nos botões grandes. (A VALIDAR)
            </small>
          </p>
        ) : (
          <p className="nota">RCP automática: dá para acelerar o relógio (×2, ×4) e treinar só o algoritmo.</p>
        )}
      </section>

      <details className="painel passo-antes briefing">
        <summary>
          <span className="numero-passo">4</span> <strong>🗣️ Briefing</strong> — conferência antes de começar ({feitos.size}/{CHECKLIST_BRIEFING.length}) <small>opcional</small>
        </summary>
        <div aria-label="Conferência do briefing" role="region">
          {CHECKLIST_BRIEFING.map((i) => (
            <label key={i.id} className="linha-check">
              <input type="checkbox" checked={feitos.has(i.id)} onChange={(e) => s.mudar(CHAVES.briefing(i.id), e.target.checked)} /> {i.texto}
            </label>
          ))}
          <p className="nota">Roteiro A VALIDAR (AHA/PALS — dinâmica de equipe; CRM).</p>
        </div>
      </details>

      <div className="parada-iniciar">
        <button type="button" className="botao-principal botao-iniciar" onClick={aoIniciar}>
          ▶ Iniciar o código
        </button>
        <button type="button" onClick={aoAbrirFolha}>
          📄 Folha de emergência ({n(cenario.pesoKg)} kg)
        </button>
      </div>
    </div>
  );
}
