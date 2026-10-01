import { useState } from 'react';
import { toleranciaDe } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import type { Medicacao, UnidadeDroga } from '../dados/medicacoes/tipos';
import type { PacienteAtual } from '../paciente/atual';
import { formatarDataHora } from '../paciente/variaveis';
import type { Situacao } from '../prescricao/comum';
import { indicacoesDisponiveis, textoParaModo, UNIDADES_DOSE } from '../prescricao/itemMedicacao';
import {
  type CamposReceita,
  conferirReceita,
  medicacoesOrais,
  receitaVazia,
  textoDaReceita,
  textoFrequencia,
  unidadeDaVez,
} from '../prescricao/receita';

const SELO: Record<Situacao, string> = { certo: '✔ certo', errado: '✘ errado', atencao: '⚠ atenção', 'a-validar': 'A VALIDAR' };
const INTERVALOS = [4, 6, 8, 12, 24] as const;

interface ItemReceita {
  id: number;
  campos: CamposReceita;
}

interface Props {
  paciente: PacienteAtual;
  medicacoes: readonly Medicacao[];
}

/** Receita de alta / ambulatorial: medicações orais, quanto dar por vez e quanto comprar. */
export function ReceitaAlta({ paciente, medicacoes }: Props) {
  const [itens, setItens] = useState<ItemReceita[]>([]);
  const [proximo, setProximo] = useState(1);
  const orais = medicacoesOrais(medicacoes);

  const mudar = (id: number, campos: CamposReceita) => setItens((l) => l.map((i) => (i.id === id ? { ...i, campos } : i)));

  return (
    <section className="painel prancheta" aria-label="Receita de alta">
      <div className="folha-papel receita">
        <p className="so-impressao aviso-impressao">
          SimPed — documento de TREINAMENTO. Não é uma receita real. Valores marcados A VALIDAR não foram conferidos.
        </p>
        <h2 className="folha-titulo">Receita médica</h2>
        <p className="identificacao">
          Paciente: {paciente.nome} · {paciente.idadeTexto} · Peso: {paciente.pesoKg.toLocaleString('pt-BR')} kg
          <br />
          Alergias: {paciente.alergias && paciente.alergias.length > 0 ? paciente.alergias.join(', ') : 'nenhuma conhecida'}
          <br />
          Data: {formatarDataHora(paciente.agora).slice(0, 10)}
        </p>
        <h3>Uso oral</h3>
        <ol className="itens">
          {itens.map((item, n) => (
            <LinhaReceita
              key={item.id}
              numero={n + 1}
              campos={item.campos}
              orais={orais}
              medicacoes={medicacoes}
              paciente={paciente}
              aoMudar={(c) => mudar(item.id, c)}
              aoRemover={() => setItens((l) => l.filter((i) => i.id !== item.id))}
            />
          ))}
        </ol>
        <button
          type="button"
          className="adicionar"
          onClick={() => {
            setItens((l) => [...l, { id: proximo, campos: receitaVazia() }]);
            setProximo((p) => p + 1);
          }}
        >
          + medicação oral
        </button>
        <div className="assinatura">
          <span>Assinatura e carimbo (CRM)</span>
        </div>
      </div>
    </section>
  );
}

function LinhaReceita({
  numero,
  campos,
  orais,
  medicacoes,
  paciente,
  aoMudar,
  aoRemover,
}: {
  numero: number;
  campos: CamposReceita;
  orais: readonly Medicacao[];
  medicacoes: readonly Medicacao[];
  paciente: PacienteAtual;
  aoMudar: (c: CamposReceita) => void;
  aoRemover: () => void;
}) {
  const [mostrar, setMostrar] = useState(false);
  const { config } = useConfiguracoes();
  const resultado = conferirReceita({
    campos,
    medicacoes,
    paciente: { faixa: paciente.faixa, pesoKg: paciente.pesoKg, variaveis: paciente.paraRegra },
    fontePreferida: config.fonteDose,
    tolerancia: toleranciaDe(config),
  });
  const med = resultado.medicacao;
  const apresentacoesOrais = med?.apresentacoes.filter((a) => unidadeDaVez(a) !== null) ?? [];
  const indicacoes = med ? indicacoesDisponiveis(med, paciente.faixa, paciente.paraRegra) : [];
  const texto = textoDaReceita(campos, medicacoes);
  const rotulo = `Receita, item ${numero}`;
  const m = (mudanca: Partial<CamposReceita>) => aoMudar({ ...campos, ...mudanca });

  return (
    <li className="item-med">
      <div className="item-med-linha">
        <span className="numero-item">{numero}.</span>
        <select
          aria-label={`${rotulo} — medicação`}
          value={campos.medicacaoId}
          onChange={(e) => {
            const nova = orais.find((x) => x.id === e.target.value);
            const aps = nova?.apresentacoes.filter((a) => unidadeDaVez(a) !== null) ?? [];
            const indic = nova ? indicacoesDisponiveis(nova, paciente.faixa, paciente.paraRegra) : [];
            const ap = aps.length === 1 ? aps[0] : undefined;
            const unidade = ap?.concentracaoPorMl?.unidade ?? ap?.quantidade?.unidade ?? '';
            aoMudar({
              ...receitaVazia(),
              medicacaoId: e.target.value,
              apresentacaoId: ap?.id ?? '',
              indicacao: indic.length === 1 ? (indic[0] ?? '') : '',
              unidadeDose: unidade === 'mL' ? '' : unidade,
            });
          }}
        >
          <option value="">Medicação…</option>
          {orais.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>
        {med && (
          <select
            aria-label={`${rotulo} — apresentação`}
            value={campos.apresentacaoId}
            onChange={(e) => {
              const ap = apresentacoesOrais.find((a) => a.id === e.target.value);
              const unidade = ap?.concentracaoPorMl?.unidade ?? ap?.quantidade?.unidade ?? '';
              m({ apresentacaoId: e.target.value, unidadeDose: unidade === 'mL' ? '' : unidade });
            }}
          >
            <option value="">Apresentação…</option>
            {apresentacoesOrais.map((a) => (
              <option key={a.id} value={a.id}>
                {a.descricao}
              </option>
            ))}
          </select>
        )}
        {indicacoes.length > 0 && (
          <select aria-label={`${rotulo} — indicação`} value={campos.indicacao} onChange={(e) => m({ indicacao: e.target.value })}>
            <option value="">Indicação…</option>
            {indicacoes.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="remover" aria-label="Remover item" onClick={aoRemover}>
          ×
        </button>
      </div>

      {med && (
        <div className="item-med-linha item-med-campos">
          <label>
            Dose
            <input aria-label={`${rotulo} — dose`} inputMode="decimal" size={5} value={campos.dose} onChange={(e) => m({ dose: e.target.value })} />
          </label>
          <select
            aria-label={`${rotulo} — unidade da dose`}
            value={campos.unidadeDose}
            onChange={(e) => m({ unidadeDose: e.target.value as UnidadeDroga | '' })}
          >
            <option value="">unid.</option>
            {UNIDADES_DOSE.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          <label>
            Dar
            <input
              aria-label={`${rotulo} — quantidade por vez`}
              inputMode="decimal"
              size={4}
              value={campos.quantidadePorVez}
              onChange={(e) => m({ quantidadePorVez: e.target.value })}
            />
            {resultado.unidade ?? ''}
          </label>
          <select
            aria-label={`${rotulo} — intervalo`}
            value={String(campos.intervaloHoras)}
            onChange={(e) => m({ intervaloHoras: e.target.value === '' ? '' : Number(e.target.value) })}
          >
            <option value="">Intervalo…</option>
            {INTERVALOS.map((h) => (
              <option key={h} value={h}>
                {textoFrequencia(h)}
              </option>
            ))}
          </select>
          <label>
            por
            <input aria-label={`${rotulo} — duração (dias)`} inputMode="decimal" size={3} value={campos.duracaoDias} onChange={(e) => m({ duracaoDias: e.target.value })} />
            dias
          </label>
          <label>
            Comprar
            <input aria-label={`${rotulo} — frascos`} inputMode="numeric" size={3} value={campos.frascos} onChange={(e) => m({ frascos: e.target.value })} />
            {resultado.unidade === 'comprimidos' ? 'caixa(s)' : 'frasco(s)'}
          </label>
          <label>
            Orientação
            <input
              aria-label={`${rotulo} — orientação`}
              size={16}
              placeholder="ex.: se febre ou dor"
              value={campos.orientacao}
              onChange={(e) => m({ orientacao: e.target.value })}
            />
          </label>
        </div>
      )}

      {texto.cabecalho && (
        <p className="item-med-texto">
          <span className="so-impressao">{numero}. </span>
          {texto.cabecalho}
          {texto.instrucao && (
            <>
              <br />
              {texto.instrucao}
            </>
          )}
        </p>
      )}

      {med && (
        <div className="item-med-acoes">
          <button type="button" onClick={() => setMostrar((v) => !v)}>
            {mostrar ? 'Esconder conferência' : 'Conferir'}
          </button>
        </div>
      )}
      {mostrar && (
        <ul className="conferencia" aria-label={`Conferência do ${rotulo.toLowerCase()}`}>
          {resultado.faltando.length > 0 && (
            <li className="sit-atencao">
              <span className="selo">falta</span> {resultado.faltando.join(', ')}.
            </li>
          )}
          {resultado.verificacoes.map((v, i) => (
            <li key={i} className={`sit-${v.situacao}`}>
              <span className="selo">{SELO[v.situacao]}</span> {textoParaModo(v, config.modo)}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
