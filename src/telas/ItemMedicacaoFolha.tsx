import { useState } from 'react';
import { hospitalAtual, toleranciaDe } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import type { PacienteAtual } from '../paciente/atual';
import type { Medicacao } from '../dados/medicacoes/tipos';
import {
  atualizarCampos,
  type CamposMedicacao,
  camposDaApresentacao,
  conferirItemMedicacao,
  indicacoesDisponiveis,
  INTERVALOS_HORAS,
  NOME_VIA,
  type Situacao,
  textoDaFolha,
  textoIntervalo,
  lerNumero,
  textoParaModo,
  UNIDADES_DOSE,
  unidadeDaConcentracao,
  VIAS,
} from '../prescricao/itemMedicacao';
import { PreparoItem } from './PreparoItem';
import type { DefinicaoSecao } from '../dados/secoes';

const SELO: Record<Situacao, string> = {
  certo: '✔ certo',
  errado: '✘ errado',
  atencao: '⚠ atenção',
  'a-validar': 'A VALIDAR',
};

interface Props {
  numero: number | undefined;
  secao: DefinicaoSecao;
  campos: CamposMedicacao;
  medicacoes: readonly Medicacao[];
  paciente: PacienteAtual;
  aoMudar: (campos: CamposMedicacao) => void;
  aoRemover: () => void;
  aoAdministrar: (medicacaoId: string, descricao: string, vazaoMlH?: number) => void;
}

/** Item de medicação estruturado: medicação → apresentação → indicação → dose → volume → via → intervalo. */
export function ItemMedicacaoFolha({ numero, secao, campos, medicacoes, paciente, aoMudar, aoRemover, aoAdministrar }: Props) {
  const [mostrarConferencia, setMostrarConferencia] = useState(false);
  const { config } = useConfiguracoes();
  const volumeFinalBicMl = hospitalAtual(config).volumeFinalBicMl;
  const resultado = conferirItemMedicacao({
    campos,
    medicacoes,
    paciente: {
      faixa: paciente.faixa,
      pesoKg: paciente.pesoKg,
      variaveis: paciente.paraRegra,
      superficieM2: paciente.variaveis.superficieCorporal.m2,
    },
    secaoNumero: secao.numero,
    fontePreferida: config.fonteDose,
    tolerancia: toleranciaDe(config),
    volumeFinalBicMl,
  });
  const { medicacao, apresentacao } = resultado;
  const indicacoes = medicacao ? indicacoesDisponiveis(medicacao, paciente.faixa, paciente.paraRegra) : [];
  const pede = camposDaApresentacao(apresentacao);
  const texto = textoDaFolha(campos, medicacoes, volumeFinalBicMl);
  const continua = campos.intervalo === 'continua';
  const rotulo = `Item ${numero ?? ''}`;

  const mudar = (mudanca: Partial<CamposMedicacao>) =>
    aoMudar(atualizarCampos(campos, mudanca, medicacoes, paciente.faixa, paciente.paraRegra));

  function administrar() {
    if (!medicacao || !campos.via) return;
    const descricao = continua
      ? `${medicacao.nome} ${campos.infusao?.dose ?? ''} ${campos.infusao?.unidade ?? ''}/kg/${campos.infusao?.por ?? 'min'} em infusão contínua`
      : `${medicacao.nome} ${campos.dose} ${campos.unidadeDose} ${NOME_VIA[campos.via]}`;
    const vazao = continua ? lerNumero(campos.infusao?.vazaoMlH ?? '') : null;
    aoAdministrar(medicacao.id, descricao, vazao ?? undefined);
  }

  return (
    <li className="item-med">
      <div className="item-med-linha">
        <span className="numero-item">{numero}.</span>
        <select
          aria-label={`${rotulo} — medicação`}
          value={campos.medicacaoId}
          onChange={(e) => mudar({ medicacaoId: e.target.value })}
        >
          <option value="">Medicação…</option>
          {([4, 5, 6] as const).map((n) => (
            <optgroup key={n} label={`Seção ${n}`}>
              {medicacoes
                .filter((m) => m.secao === n)
                .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        {medicacao && (
          <select
            aria-label={`${rotulo} — apresentação`}
            value={campos.apresentacaoId}
            onChange={(e) => mudar({ apresentacaoId: e.target.value })}
          >
            <option value="">Apresentação…</option>
            {medicacao.apresentacoes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.descricao}
              </option>
            ))}
          </select>
        )}
        {indicacoes.length > 0 && (
          <select
            aria-label={`${rotulo} — indicação`}
            value={campos.indicacao}
            onChange={(e) => mudar({ indicacao: e.target.value })}
          >
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

      {medicacao && (
        <div className="item-med-linha item-med-campos">
          {!continua && (
            <>
              <label>
                Dose
                <input
                  aria-label={`${rotulo} — dose`}
                  inputMode="decimal"
                  size={6}
                  value={campos.dose}
                  onChange={(e) => mudar({ dose: e.target.value })}
                />
              </label>
              <select
                aria-label={`${rotulo} — unidade da dose`}
                value={campos.unidadeDose}
                onChange={(e) => mudar({ unidadeDose: e.target.value as CamposMedicacao['unidadeDose'] })}
              >
                <option value="">unid.</option>
                {UNIDADES_DOSE.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </>
          )}
          {pede.reconstituicao && (
            <label>
              Reconstituir em
              <input
              aria-label={`${rotulo} — volume de reconstituição (mL)`}
                inputMode="decimal"
                size={4}
                value={campos.reconstituicaoMl}
                onChange={(e) => mudar({ reconstituicaoMl: e.target.value })}
              />
              mL
            </label>
          )}
          {pede.volume && !continua && (
            <label>
              {campos.etapas.length > 0 ? 'Volume a administrar' : 'Volume'}
              <input
              aria-label={`${rotulo} — volume (mL)`}
                inputMode="decimal"
                size={5}
                value={campos.volumeMl}
                onChange={(e) => mudar({ volumeMl: e.target.value })}
              />
              mL
            </label>
          )}
          <select
            aria-label={`${rotulo} — via`}
            value={campos.via}
            onChange={(e) => mudar({ via: e.target.value as CamposMedicacao['via'] })}
          >
            <option value="">Via…</option>
            {VIAS.map((v) => (
              <option key={v} value={v}>
                {NOME_VIA[v]}
              </option>
            ))}
          </select>
          <select
            aria-label={`${rotulo} — intervalo`}
            value={String(campos.intervalo)}
            onChange={(e) => {
              const valor = e.target.value;
              mudar({ intervalo: valor === '' || valor === 'dose-unica' || valor === 'continua' ? valor : Number(valor) });
            }}
          >
            <option value="">Intervalo…</option>
            <option value="dose-unica">{textoIntervalo('dose-unica')}</option>
            <option value="continua">{textoIntervalo('continua')}</option>
            {INTERVALOS_HORAS.map((h) => (
              <option key={h} value={h}>
                {textoIntervalo(h)}
              </option>
            ))}
          </select>
        </div>
      )}

      {medicacao && (
        <PreparoItem
          rotulo={rotulo}
          campos={campos}
          unidade={unidadeDaConcentracao(apresentacao)}
          volumeFinalBicMl={volumeFinalBicMl}
          podeDiluir={apresentacao !== undefined && pede.volume}
          mudar={mudar}
        />
      )}

      {texto && (
        <p className="item-med-texto">
          <span className="so-impressao">{numero}. </span>
          {texto}
        </p>
      )}

      {medicacao && (
        <div className="item-med-acoes">
          <button type="button" onClick={() => setMostrarConferencia((v) => !v)}>
            {mostrarConferencia ? 'Esconder conferência' : 'Conferir'}
          </button>
          <button
            type="button"
            className="administrar"
            disabled={!resultado.completo}
            title={resultado.completo ? 'Dar esta dose ao paciente' : `Falta: ${resultado.faltando.join(', ')}`}
            onClick={administrar}
          >
            Administrar
          </button>
        </div>
      )}

      {mostrarConferencia && medicacao && (
        <ul className="conferencia" aria-label={`Conferência do ${rotulo.toLowerCase()}`}>
          {config.modo === 'prova' && (
            <li className="sit-a-validar">
              <span className="selo">modo prova</span> gabarito escondido (mude em Configurações).
            </li>
          )}
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
