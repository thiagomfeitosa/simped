import { useState } from 'react';
import { toleranciaDe } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { SOLUCOES } from '../dados/solucoes';
import { formatarNumero, type Situacao } from '../prescricao/comum';
import { textoParaModo } from '../prescricao/itemMedicacao';
import { type CamposSoro, conferirSoro, textoDoSoro } from '../prescricao/soro';

const SELO: Record<Situacao, string> = {
  certo: '✔ certo',
  errado: '✘ errado',
  atencao: '⚠ atenção',
  'a-validar': 'A VALIDAR',
};

interface Props {
  numero: number | undefined;
  campos: CamposSoro;
  pesoKg: number;
  aoMudar: (campos: CamposSoro) => void;
  aoRemover: () => void;
  aoAdministrar: (descricao: string) => void;
}

/** Montador de soro: soluções + tempo; o aluno escreve vazão, VIG, Na e K e o programa confere. */
export function ItemSoroFolha({ numero, campos, pesoKg, aoMudar, aoRemover, aoAdministrar }: Props) {
  const [mostrar, setMostrar] = useState(false);
  const { config } = useConfiguracoes();
  const resultado = conferirSoro(campos, pesoKg, toleranciaDe(config));
  const rotulo = `Item ${numero ?? ''} (soro)`;
  const texto = textoDoSoro(campos);
  const mudar = (m: Partial<CamposSoro>) => aoMudar({ ...campos, ...m });
  const r = resultado.resumo;

  const campoNumero = (nome: keyof CamposSoro, rotuloCampo: string, unidade: string, tamanho = 5) => (
    <label>
      {rotuloCampo}
      <input
        aria-label={`${rotulo} — ${rotuloCampo}`}
        inputMode="decimal"
        size={tamanho}
        value={campos[nome] as string}
        onChange={(e) => mudar({ [nome]: e.target.value })}
      />
      {unidade}
    </label>
  );

  return (
    <li className="item-med item-soro">
      <div className="item-med-linha">
        <span className="numero-item">{numero}.</span>
        <strong>Soro</strong>
        {campos.componentes.map((c, i) => (
          <span className="soro-componente" key={i}>
            {i > 0 && '+'}
            <select
              aria-label={`${rotulo} — solução ${i + 1}`}
              value={c.solucaoId}
              onChange={(e) =>
                mudar({ componentes: campos.componentes.map((x, j) => (j === i ? { ...x, solucaoId: e.target.value } : x)) })
              }
            >
              {SOLUCOES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
            </select>
            <input
              aria-label={`${rotulo} — volume da solução ${i + 1} (mL)`}
              inputMode="decimal"
              size={5}
              value={c.volumeMl}
              onChange={(e) =>
                mudar({ componentes: campos.componentes.map((x, j) => (j === i ? { ...x, volumeMl: e.target.value } : x)) })
              }
            />
            mL
            {campos.componentes.length > 1 && (
              <button
                type="button"
                className="remover"
                aria-label={`Remover solução ${i + 1}`}
                onClick={() => mudar({ componentes: campos.componentes.filter((_, j) => j !== i) })}
              >
                ×
              </button>
            )}
          </span>
        ))}
        <button
          type="button"
          className="adicionar"
          onClick={() => mudar({ componentes: [...campos.componentes, { solucaoId: 'nacl20', volumeMl: '' }] })}
        >
          + solução
        </button>
        <button type="button" className="remover" aria-label="Remover item" onClick={aoRemover}>
          ×
        </button>
      </div>

      <div className="item-med-linha item-med-campos">
        {campoNumero('horas', 'Correr em', 'h', 3)}
        {campoNumero('vazaoMlH', 'Vazão', 'mL/h')}
        {campoNumero('vig', 'VIG', 'mg/kg/min')}
        {campoNumero('sodioMEqKgDia', 'Na', 'mEq/kg/dia', 4)}
        {campoNumero('potassioMEqKgDia', 'K', 'mEq/kg/dia', 4)}
      </div>

      {texto && <p className="item-med-texto">{texto}</p>}

      <div className="item-med-acoes">
        <button type="button" onClick={() => setMostrar((v) => !v)}>
          {mostrar ? 'Esconder conferência' : 'Conferir'}
        </button>
        <button
          type="button"
          className="administrar"
          disabled={!resultado.completo}
          title={resultado.completo ? 'Instalar este soro' : `Falta: ${resultado.faltando.join(', ')}`}
          onClick={() => aoAdministrar(`Soro: ${texto}`)}
        >
          Administrar
        </button>
      </div>

      {mostrar && (
        <ul className="conferencia" aria-label={`Conferência do ${rotulo}`}>
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
          {r && config.modo === 'treino' && (
            <li className="sit-a-validar">
              <span className="selo">resumo</span> {formatarNumero(r.volumeTotalMl)} mL · glicose{' '}
              {formatarNumero(r.glicosePct)}% · Na {formatarNumero(r.sodioMEqL)} mEq/L · K {formatarNumero(r.potassioMEqL)}{' '}
              mEq/L · osmolaridade ≈ {formatarNumero(r.osmolaridade)} mOsm/L · Holliday-Segar para{' '}
              {formatarNumero(pesoKg)} kg: {formatarNumero(r.hollidaySegarMlDia)} mL/dia (referência; quando usar é decisão
              clínica, A VALIDAR). Concentrações das soluções: A VALIDAR.
            </li>
          )}
        </ul>
      )}
    </li>
  );
}
