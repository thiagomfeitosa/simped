import type { UnidadeDroga } from '../dados/medicacoes/tipos';
import type { CamposMedicacao } from '../prescricao/itemMedicacao';
import { UNIDADES_DOSE } from '../prescricao/itemMedicacao';
import {
  DILUENTES,
  type Diluente,
  type EtapaDiluicaoCampos,
  etapaVazia,
  type InfusaoCampos,
  type SeringaBicCampos,
  seringaVazia,
  type TempoInfusao,
} from '../prescricao/preparo';

interface Props {
  rotulo: string;
  campos: CamposMedicacao;
  /** Unidade da concentração da apresentação (mg, UI...), para os rótulos "mg/mL". */
  unidade: UnidadeDroga | undefined;
  volumeFinalBicMl: number;
  podeDiluir: boolean;
  mudar: (mudanca: Partial<CamposMedicacao>) => void;
}

function Numero({ rotulo, valor, aoMudar, tamanho = 5 }: { rotulo: string; valor: string; aoMudar: (v: string) => void; tamanho?: number }) {
  return <input aria-label={rotulo} inputMode="decimal" size={tamanho} value={valor} onChange={(e) => aoMudar(e.target.value)} />;
}

/** Diluição/rediluição em etapas, seringa da BIC (dose intermitente) e infusão contínua. */
export function PreparoItem({ rotulo, campos, unidade, volumeFinalBicMl, podeDiluir, mudar }: Props) {
  const u = unidade ?? '?';
  const continua = campos.intervalo === 'continua';

  const mudarEtapa = (i: number, mudanca: Partial<EtapaDiluicaoCampos>) =>
    mudar({ etapas: campos.etapas.map((e, j) => (j === i ? { ...e, ...mudanca } : e)) });
  const mudarSeringa = (mudanca: Partial<SeringaBicCampos>) =>
    campos.seringaBic && mudar({ seringaBic: { ...campos.seringaBic, ...mudanca } });
  const mudarInfusao = (mudanca: Partial<InfusaoCampos>) =>
    campos.infusao && mudar({ infusao: { ...campos.infusao, ...mudanca } });

  return (
    <div className="preparo">
      {campos.etapas.map((etapa, i) => (
        <div className="preparo-linha" key={i}>
          <span className="preparo-rotulo">{i === 0 ? 'Diluição' : `Rediluição ${i}`}:</span>
          aspirar
          <Numero rotulo={`${rotulo} — etapa ${i + 1}, volume aspirado (mL)`} valor={etapa.aspirarMl} aoMudar={(v) => mudarEtapa(i, { aspirarMl: v })} tamanho={4} />
          mL {i === 0 ? 'da apresentação' : 'da etapa anterior'} +
          <select
            aria-label={`${rotulo} — etapa ${i + 1}, diluente`}
            value={etapa.diluente}
            onChange={(e) => mudarEtapa(i, { diluente: e.target.value as Diluente })}
          >
            {DILUENTES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          até
          <Numero rotulo={`${rotulo} — etapa ${i + 1}, volume final (mL)`} valor={etapa.completarAteMl} aoMudar={(v) => mudarEtapa(i, { completarAteMl: v })} tamanho={4} />
          mL → concentração
          <Numero rotulo={`${rotulo} — etapa ${i + 1}, concentração`} valor={etapa.concentracao} aoMudar={(v) => mudarEtapa(i, { concentracao: v })} />
          {u}/mL
          <button
            type="button"
            className="remover"
            aria-label={`Remover etapa ${i + 1}`}
            onClick={() => mudar({ etapas: campos.etapas.filter((_, j) => j !== i) })}
          >
            ×
          </button>
        </div>
      ))}

      {campos.seringaBic && !continua && (
        <div className="preparo-linha">
          <span className="preparo-rotulo">Seringa da BIC:</span>
          volume da dose + SF
          <Numero rotulo={`${rotulo} — SF da seringa (mL)`} valor={campos.seringaBic.soroMl} aoMudar={(v) => mudarSeringa({ soroMl: v })} tamanho={4} />
          mL = {volumeFinalBicMl} mL · concentração final
          <Numero rotulo={`${rotulo} — concentração final da seringa`} valor={campos.seringaBic.concentracao} aoMudar={(v) => mudarSeringa({ concentracao: v })} />
          {campos.unidadeDose || u}/mL · correr em
          <Numero rotulo={`${rotulo} — tempo de infusão (min)`} valor={campos.seringaBic.tempoMin} aoMudar={(v) => mudarSeringa({ tempoMin: v })} tamanho={3} />
          min a
          <Numero rotulo={`${rotulo} — vazão da seringa (mL/h)`} valor={campos.seringaBic.vazaoMlH} aoMudar={(v) => mudarSeringa({ vazaoMlH: v })} tamanho={4} />
          mL/h
          <button type="button" className="remover" aria-label="Remover seringa da BIC" onClick={() => mudar({ seringaBic: null })}>
            ×
          </button>
        </div>
      )}

      {continua && campos.infusao && (
        <div className="preparo-linha">
          <span className="preparo-rotulo">Infusão contínua:</span>
          <Numero rotulo={`${rotulo} — dose da infusão`} valor={campos.infusao.dose} aoMudar={(v) => mudarInfusao({ dose: v })} />
          <select
            aria-label={`${rotulo} — unidade da infusão`}
            value={campos.infusao.unidade}
            onChange={(e) => mudarInfusao({ unidade: e.target.value as UnidadeDroga })}
          >
            {UNIDADES_DOSE.map((x) => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
          /kg/
          <select
            aria-label={`${rotulo} — por minuto ou por hora`}
            value={campos.infusao.por}
            onChange={(e) => mudarInfusao({ por: e.target.value as TempoInfusao })}
          >
            <option value="min">min</option>
            <option value="h">h</option>
          </select>
          · seringa: medicação
          <Numero rotulo={`${rotulo} — medicação na seringa (mL)`} valor={campos.infusao.volumeNaSeringaMl} aoMudar={(v) => mudarInfusao({ volumeNaSeringaMl: v })} tamanho={4} />
          mL + SF
          <Numero rotulo={`${rotulo} — SF da seringa da infusão (mL)`} valor={campos.infusao.soroMl} aoMudar={(v) => mudarInfusao({ soroMl: v })} tamanho={4} />
          mL = {volumeFinalBicMl} mL · concentração
          <Numero rotulo={`${rotulo} — concentração da infusão`} valor={campos.infusao.concentracao} aoMudar={(v) => mudarInfusao({ concentracao: v })} />
          {campos.infusao.unidade}/mL · vazão
          <Numero rotulo={`${rotulo} — vazão da infusão (mL/h)`} valor={campos.infusao.vazaoMlH} aoMudar={(v) => mudarInfusao({ vazaoMlH: v })} tamanho={4} />
          mL/h
        </div>
      )}

      <div className="preparo-botoes">
        {podeDiluir && (
          <button type="button" className="adicionar" onClick={() => mudar({ etapas: [...campos.etapas, etapaVazia()] })}>
            + {campos.etapas.length === 0 ? 'diluição' : 'rediluição'}
          </button>
        )}
        {!continua && !campos.seringaBic && (
          <button type="button" className="adicionar" onClick={() => mudar({ seringaBic: seringaVazia() })}>
            + seringa da BIC ({volumeFinalBicMl} mL)
          </button>
        )}
      </div>
    </div>
  );
}
