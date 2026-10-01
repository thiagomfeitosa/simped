import { useMemo, useState } from 'react';
import { casosPorGrupo } from '../casos/index';
import {
  NOME_PADRAO_RESPIRATORIO,
  NOME_RITMO,
  type EstadoClinico,
  type NomeSinal,
  type PadraoRespiratorio,
  type Ritmo,
  type SinaisVitais,
} from '../casos/tipos';
import { hospitalAtual } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { COMPLICACOES } from '../dados/complicacoes';
import { useBanco } from '../dados/medicacoes/ContextoBanco';
import { reproduzirEventos } from '../motor/paciente';
import { pacienteNoMinuto } from '../paciente/atual';
import { abrirJanelaProfessor, useSessao } from '../sessao/ContextoSessao';
import { descreverRegistro } from '../sessao/sessao';
import { formatarTempo } from './ControlesCaso';
import { FolhaSomenteLeitura } from './FolhaSomenteLeitura';
import { Monitor } from './Monitor';

const CAMPOS: { id: NomeSinal; nome: string; casas?: number }[] = [
  { id: 'fc', nome: 'FC (bpm)' },
  { id: 'fr', nome: 'FR (irpm)' },
  { id: 'spo2', nome: 'SpO₂ (%)' },
  { id: 'paSistolica', nome: 'PAS (mmHg)' },
  { id: 'paDiastolica', nome: 'PAD (mmHg)' },
  { id: 'temperaturaC', nome: 'Temp. (°C)', casas: 1 },
  { id: 'glicemiaMgDl', nome: 'Glicemia (mg/dL)' },
  { id: 'tecS', nome: 'TEC (s)', casas: 1 },
  { id: 'glasgow', nome: 'Glasgow' },
];

function arredondar(v: number, casas = 0): string {
  const f = 10 ** casas;
  return String(Math.round(v * f) / f);
}

/**
 * B14 — Painel do professor: muda sinais, dispara complicações, manda mensagens e vê a folha do aluno ao vivo.
 * Na mesma janela, vale para a aba Prescrever. B15: numa segunda janela (?papel=professor), as ações vão
 * para a janela do aluno pelo canal entre janelas.
 */
export function Professor() {
  const { papel, conexao, caso, casos, sessao, fazer, trocarCaso, geracao, variacao, textoVariacao, variarCaso, voltarAoOriginal } = useSessao();
  const { config } = useConfiguracoes();
  const { banco } = useBanco();
  const { estado, registros } = sessao;
  const paciente = useMemo(() => reproduzirEventos(caso, estado.eventosPaciente), [caso, estado.eventosPaciente]);
  const atual = useMemo(() => pacienteNoMinuto(caso, paciente.tempoMin, config.fonteFaixa), [caso, paciente.tempoMin, config.fonteFaixa]);
  const [mensagem, setMensagem] = useState('');
  const [mandarSugerida, setMandarSugerida] = useState(true);
  const [aviso, setAviso] = useState('');
  const espelho = papel === 'professor';
  const avisar = (texto: string) => {
    setAviso(texto);
    window.setTimeout(() => setAviso(''), 2500);
  };

  return (
    <div className="pagina-simples professor">
      <header className="cabecalho">
        <h1>Painel do professor</h1>
        <span className="subtitulo">
          {espelho ? (
            conexao.conectado ? (
              <span className="conexao ok">
                ● Conectado à janela do aluno · atualizado às {conexao.ultima?.toLocaleTimeString('pt-BR')}
              </span>
            ) : (
              <span className="conexao espera">○ Aguardando a janela do aluno (abra o SimPed em outra janela, aba Prescrever)…</span>
            )
          ) : (
            'Mesma janela: o que você faz aqui vale para a aba Prescrever.'
          )}
        </span>
        {!espelho && (
          <button type="button" onClick={abrirJanelaProfessor} title="Abre uma segunda janela só do professor, ligada a esta">
            🪟 Abrir janela do professor
          </button>
        )}
      </header>
      {aviso && (
        <p className="aviso-professor" role="status">
          {aviso}
        </p>
      )}

      <div className="professor-grade">
        <section className="painel" aria-label="Paciente agora">
          <h2>Paciente agora — {caso.titulo}</h2>
          <label className="campo">
            Caso do aluno
            <select
              aria-label="Caso do aluno"
              value={caso.id}
              onChange={(e) => {
                if (window.confirm('Trocar o caso do aluno? A sessão dele começa do zero.')) trocarCaso(e.target.value);
              }}
            >
              {casosPorGrupo(casos).map(([grupo, lista]) => (
                <optgroup key={grupo} label={grupo}>
                  {lista.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.titulo}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <div className="linha-botoes">
            <button
              type="button"
              title="Mesmo caso com outro peso, idade e apresentação da farmácia (a sessão do aluno começa do zero)"
              onClick={() => {
                if (window.confirm('Sortear outra variação para o aluno? A sessão dele começa do zero.')) variarCaso();
              }}
            >
              🎲 Variar o caso do aluno
            </button>
            {variacao && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Voltar ao caso original? A sessão do aluno começa do zero.')) voltarAoOriginal();
                }}
              >
                Caso original
              </button>
            )}
          </div>
          {variacao && <p className="nota">🎲 Variação: {textoVariacao.join(' · ')}.</p>}
          <p>
            <strong>⏱ {formatarTempo(paciente.tempoMin)}</strong> · {atual.nome}, {atual.idadeTexto}, {atual.pesoKg.toLocaleString('pt-BR')} kg
          </p>
          <div className="linha-botoes">
            {[1, 5, 15].map((min) => (
              <button key={min} type="button" onClick={() => fazer({ tipo: 'tempo', minutos: min }, 'professor')}>
                +{min} min
              </button>
            ))}
          </div>
          <Monitor sinais={paciente.sinais} idadeDias={atual.variaveis.idade.dias} ritmo={paciente.clinico.ritmo} />
          <p className="nota">
            TEC {arredondar(paciente.sinais.tecS, 1)} s · Glasgow {arredondar(paciente.sinais.glasgow)} ·{' '}
            {NOME_PADRAO_RESPIRATORIO[paciente.clinico.padraoRespiratorio]}
          </p>
        </section>

        <AlterarSinais
          key={geracao}
          sinais={paciente.sinais}
          clinico={paciente.clinico}
          aoAplicar={(sinais, clinico, motivo) => {
            fazer({ tipo: 'professorSinais', sinais, ...(clinico && { clinico }), ...(motivo && { motivo }) }, 'professor');
            avisar('✔ Sinais alterados.');
          }}
        />

        <section className="painel" aria-label="Complicações">
          <h2>Complicações</h2>
          <p className="nota">Um clique e o paciente muda aos poucos. Valores provisórios (A VALIDAR).</p>
          <label>
            <input type="checkbox" checked={mandarSugerida} onChange={(e) => setMandarSugerida(e.target.checked)} /> mandar também o aviso
            sugerido para o aluno
          </label>
          <div className="complicacoes">
            {COMPLICACOES.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.descricao}
                onClick={() => {
                  fazer({ tipo: 'complicacao', id: c.id, nome: c.nome, mudancas: c.mudancas, ...(c.clinico && { clinico: c.clinico }) }, 'professor');
                  if (mandarSugerida && c.mensagemSugerida) fazer({ tipo: 'mensagem', texto: c.mensagemSugerida }, 'professor');
                  avisar(`✔ Complicação disparada: ${c.nome}.`);
                }}
              >
                <strong>{c.nome}</strong>
                <small>{c.descricao}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="painel" aria-label="Mensagem para o aluno">
          <h2>Mensagem para o aluno</h2>
          <textarea
            aria-label="Texto da mensagem"
            rows={3}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Ex.: A mãe conta que ele tomou um remédio do avô."
          />
          <div className="linha-botoes">
            <button
              type="button"
              disabled={!mensagem.trim()}
              onClick={() => {
                fazer({ tipo: 'mensagem', texto: mensagem.trim() }, 'professor');
                setMensagem('');
                avisar('✔ Mensagem enviada.');
              }}
            >
              Enviar mensagem
            </button>
          </div>
        </section>

        <section className="painel professor-folha" aria-label="Folha do aluno ao vivo">
          <h2>Folha do aluno (ao vivo)</h2>
          <FolhaSomenteLeitura estado={estado.prescricao} medicacoes={banco} volumeFinalBicMl={hospitalAtual(config).volumeFinalBicMl} />
          {estado.receita.length > 0 && <p className="nota">Receita de alta: {estado.receita.length} item(ns).</p>}
          {estado.rascunho && (
            <>
              <h3>Rascunho do aluno</h3>
              <pre className="revisao-rascunho">{estado.rascunho}</pre>
            </>
          )}
        </section>

        <section className="painel" aria-label="Últimas ações">
          <h2>Últimas ações</h2>
          {registros.length === 0 ? (
            <p className="nota">Nada ainda.</p>
          ) : (
            <ol className="ultimas-acoes">
              {[...registros]
                .reverse()
                .slice(0, 15)
                .map((r) => (
                  <li key={r.n}>
                    <span className="hora">{formatarTempo(r.minutoCaso)}</span> {r.autor === 'professor' ? '👩‍🏫 ' : '🧑‍🎓 '}
                    {descreverRegistro(r)}
                  </li>
                ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

function AlterarSinais({
  sinais,
  clinico,
  aoAplicar,
}: {
  sinais: SinaisVitais;
  clinico: EstadoClinico;
  aoAplicar: (sinais: Partial<SinaisVitais>, clinico: Partial<EstadoClinico> | undefined, motivo: string) => void;
}) {
  // os campos mostram o valor de agora (ao vivo); só o que o professor mexer é enviado
  const [editados, setEditados] = useState<Partial<Record<NomeSinal, string>>>({});
  const [ritmo, setRitmo] = useState<Ritmo | null>(null);
  const [respiracao, setRespiracao] = useState<PadraoRespiratorio | null>(null);
  const [motivo, setMotivo] = useState('');

  function aplicar() {
    const mudados: Partial<SinaisVitais> = {};
    for (const [id, texto] of Object.entries(editados) as [NomeSinal, string][]) {
      const v = Number(texto.replace(',', '.'));
      if (texto.trim() !== '' && Number.isFinite(v)) mudados[id] = v;
    }
    const novoClinico: Partial<EstadoClinico> = {
      ...(ritmo && { ritmo }),
      ...(respiracao && { padraoRespiratorio: respiracao }),
    };
    if (Object.keys(mudados).length === 0 && Object.keys(novoClinico).length === 0) return;
    aoAplicar(mudados, Object.keys(novoClinico).length > 0 ? novoClinico : undefined, motivo.trim());
    setEditados({});
    setRitmo(null);
    setRespiracao(null);
    setMotivo('');
  }

  return (
    <section className="painel" aria-label="Alterar sinais">
      <h2>Alterar sinais agora</h2>
      <p className="nota">Os campos mostram o valor de agora. Mude só o que quiser e clique em “Aplicar agora”.</p>
      <div className="grade-sinais">
        {CAMPOS.map((c) => (
          <label key={c.id} className={editados[c.id] !== undefined ? 'campo editado' : 'campo'}>
            {c.nome}
            <input
              aria-label={c.nome}
              inputMode="decimal"
              value={editados[c.id] ?? arredondar(sinais[c.id], c.casas)}
              onChange={(e) => setEditados((v) => ({ ...v, [c.id]: e.target.value }))}
            />
          </label>
        ))}
        <label className={ritmo ? 'campo editado' : 'campo'}>
          Ritmo
          <select aria-label="Ritmo" value={ritmo ?? clinico.ritmo} onChange={(e) => setRitmo(e.target.value as Ritmo)}>
            {(Object.keys(NOME_RITMO) as Ritmo[]).map((r) => (
              <option key={r} value={r}>
                {NOME_RITMO[r]}
              </option>
            ))}
          </select>
        </label>
        <label className={respiracao ? 'campo editado' : 'campo'}>
          Respiração
          <select
            aria-label="Respiração"
            value={respiracao ?? clinico.padraoRespiratorio}
            onChange={(e) => setRespiracao(e.target.value as PadraoRespiratorio)}
          >
            {(Object.keys(NOME_PADRAO_RESPIRATORIO) as PadraoRespiratorio[]).map((r) => (
              <option key={r} value={r}>
                {NOME_PADRAO_RESPIRATORIO[r]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="campo">
        Motivo (aparece na linha do tempo)
        <input value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: piora do quadro" />
      </label>
      <div className="linha-botoes">
        <button type="button" className="administrar" onClick={aplicar}>
          Aplicar agora
        </button>
        {(Object.keys(editados).length > 0 || ritmo || respiracao) && (
          <button
            type="button"
            onClick={() => {
              setEditados({});
              setRitmo(null);
              setRespiracao(null);
            }}
          >
            Desfazer mudanças
          </button>
        )}
      </div>
    </section>
  );
}
