import { useState } from 'react';
import { FONTES_DE_DOSE } from '../../configuracoes/configuracoes';
import { useBanco } from '../../dados/medicacoes/ContextoBanco';
import type { Apresentacao, CodigoFonte, ExpressaoDeDose, Periodo, RegraDeDose, UnidadeDroga, Via } from '../../dados/medicacoes/tipos';
import {
  type AlvoValidacao,
  type CorrecaoApresentacao,
  type CorrecaoRegra,
  historicoDoAlvo,
  textoDaApresentacao,
  textoDaRegraCompleta,
  type Validacao,
  verificarValidacao,
} from '../../dados/medicacoes/validacoes';
import { referenciaCurta } from '../../dados/fontes/fontes';
import { lerNumero, NOME_VIA, UNIDADES_DOSE, VIAS } from '../../prescricao/itemMedicacao';

const CHAVE_QUEM = 'simped.validador';
const PERIODOS: { valor: Periodo; rotulo: string }[] = [
  { valor: 'dose', rotulo: 'por dose' },
  { valor: 'dia', rotulo: 'por dia' },
  { valor: 'min', rotulo: 'por minuto (infusão)' },
  { valor: 'h', rotulo: 'por hora (infusão)' },
];
const TIPOS_DOSE: { valor: ExpressaoDeDose['tipo']; rotulo: string }[] = [
  { valor: 'porKg', rotulo: 'por kg' },
  { valor: 'porM2', rotulo: 'por m²' },
  { valor: 'fixa', rotulo: 'fixa' },
  { valor: 'texto', rotulo: 'em texto (não corrige o aluno)' },
];

function lerQuem(): string {
  try {
    return window.localStorage.getItem(CHAVE_QUEM) ?? '';
  } catch {
    return '';
  }
}

const num = (n: number | undefined) => (n === undefined ? '' : String(n).replace('.', ','));

interface Props {
  alvo: AlvoValidacao;
  regra?: RegraDeDose;
  apresentacao?: Apresentacao;
  aoFechar: () => void;
}

/**
 * Formulário "Conferir" (B5): o usuário diz onde conferiu (documento do catálogo + página),
 * corrige o valor se precisar e marca CONFERIDO. Tudo vira um registro com data e valor anterior.
 */
export function ConferirItem({ alvo, regra, apresentacao, aoFechar }: Props) {
  const { catalogo, validacoes, registrarValidacao, banco } = useBanco();
  const fonteAtual = regra?.fonte ?? apresentacao?.fonte ?? { codigo: 'SBP' as CodigoFonte };
  const [codigo, setCodigo] = useState<CodigoFonte>(fonteAtual.codigo);
  const [documentoId, setDocumentoId] = useState(
    fonteAtual.documentoId ?? catalogo.find((d) => d.sociedade === fonteAtual.codigo && d.padraoDaSociedade)?.id ?? '',
  );
  const [documentoLivre, setDocumentoLivre] = useState(fonteAtual.documentoId ? '' : (fonteAtual.documento ?? ''));
  const [pagina, setPagina] = useState(fonteAtual.pagina ?? '');
  const [quem, setQuem] = useState(lerQuem);
  const [nota, setNota] = useState('');
  const [problemas, setProblemas] = useState<string[]>([]);

  // regra
  const d = regra?.dose;
  const [tipoDose, setTipoDose] = useState<ExpressaoDeDose['tipo']>(d?.tipo ?? 'porKg');
  const [min, setMin] = useState(d && d.tipo !== 'texto' ? num(d.min) : '');
  const [max, setMax] = useState(d && d.tipo !== 'texto' ? num(d.max) : '');
  const [unidade, setUnidade] = useState<UnidadeDroga>(d && d.tipo !== 'texto' ? d.unidade : 'mg');
  const [por, setPor] = useState<Periodo>(d && d.tipo !== 'texto' ? d.por : 'dose');
  const [descricaoDose, setDescricaoDose] = useState(d?.tipo === 'texto' ? d.descricao : '');
  const [maxValor, setMaxValor] = useState(num(regra?.doseMaxima?.valor));
  const [maxUnidade, setMaxUnidade] = useState<UnidadeDroga>(regra?.doseMaxima?.unidade ?? 'mg');
  const [maxPor, setMaxPor] = useState<Periodo>(regra?.doseMaxima?.por ?? 'dose');
  const [intervalos, setIntervalos] = useState((regra?.intervalosHoras ?? []).join(', '));
  const [observacoes, setObservacoes] = useState(regra?.observacoes ?? apresentacao?.observacao ?? '');
  const [vias, setVias] = useState<Via[]>(regra?.vias ?? apresentacao?.vias ?? []);

  // apresentação
  const [descricao, setDescricao] = useState(apresentacao?.descricao ?? '');
  const [concValor, setConcValor] = useState(num(apresentacao?.concentracaoPorMl?.valor));
  const [concUnidade, setConcUnidade] = useState<UnidadeDroga>(apresentacao?.concentracaoPorMl?.unidade ?? 'mg');
  const [qtdValor, setQtdValor] = useState(num(apresentacao?.quantidade?.valor));
  const [qtdUnidade, setQtdUnidade] = useState<UnidadeDroga>(apresentacao?.quantidade?.unidade ?? 'mg');
  const [volume, setVolume] = useState(num(apresentacao?.volumeMl));

  const historico = historicoDoAlvo(validacoes, alvo);
  const documentosDaSociedade = catalogo.filter((doc) => doc.sociedade === codigo);

  function correcaoDaRegra(): CorrecaoRegra {
    const dose: ExpressaoDeDose =
      tipoDose === 'texto'
        ? { tipo: 'texto', descricao: descricaoDose }
        : { tipo: tipoDose, min: lerNumero(min) ?? 0, max: lerNumero(max || min) ?? 0, unidade, por };
    const valorMax = lerNumero(maxValor);
    return {
      dose,
      doseMaxima: valorMax === null ? null : { valor: valorMax, unidade: maxUnidade, por: maxPor },
      intervalosHoras: intervalos
        .split(/[;,\s]+/)
        .filter(Boolean)
        .map((h) => lerNumero(h) ?? -1),
      vias,
      observacoes,
    };
  }

  function correcaoDaApresentacao(): CorrecaoApresentacao {
    const c = lerNumero(concValor);
    const q = lerNumero(qtdValor);
    const v = lerNumero(volume);
    return {
      descricao,
      vias,
      observacao: observacoes,
      ...(c !== null && { concentracaoPorMl: { valor: c, unidade: concUnidade } }),
      ...(q !== null && { quantidade: { valor: q, unidade: qtdUnidade } }),
      ...(v !== null && { volumeMl: v }),
    };
  }

  function salvar(status: Validacao['status']) {
    const v: Validacao = {
      alvo,
      status,
      fonte: {
        codigo,
        ...(documentoId ? { documentoId } : documentoLivre.trim() ? { documento: documentoLivre.trim() } : {}),
        ...(pagina.trim() && { pagina: pagina.trim() }),
      },
      ...(quem.trim() && { quem: quem.trim() }),
      quando: new Date().toISOString(),
      valorAnterior: regra ? textoDaRegraCompleta(regra) : apresentacao ? textoDaApresentacao(apresentacao) : '',
      ...(regra && { correcaoRegra: correcaoDaRegra() }),
      ...(apresentacao && { correcaoApresentacao: correcaoDaApresentacao() }),
      ...(nota.trim() && { nota: nota.trim() }),
    };
    const erros = verificarValidacao(v, banco);
    setProblemas(erros);
    if (erros.length > 0) return;
    try {
      window.localStorage.setItem(CHAVE_QUEM, quem.trim());
    } catch {
      // sem armazenamento: só não lembra o nome
    }
    registrarValidacao(v);
    aoFechar();
  }

  const seletorUnidade = (valor: UnidadeDroga, mudar: (u: UnidadeDroga) => void, rotulo: string) => (
    <select aria-label={rotulo} value={valor} onChange={(e) => mudar(e.target.value as UnidadeDroga)}>
      {UNIDADES_DOSE.map((u) => (
        <option key={u} value={u}>
          {u}
        </option>
      ))}
    </select>
  );

  return (
    <div className="conferir-item" role="group" aria-label="Conferir item">
      <p className="nota">
        Valor atual: <strong>{regra ? textoDaRegraCompleta(regra) : apresentacao ? textoDaApresentacao(apresentacao) : ''}</strong>
      </p>

      <fieldset>
        <legend>1. Onde você conferiu</legend>
        <div className="linha-botoes">
          <label className="campo">
            Sociedade / órgão
            <select
              value={codigo}
              onChange={(e) => {
                const novo = e.target.value as CodigoFonte;
                setCodigo(novo);
                setDocumentoId(catalogo.find((doc) => doc.sociedade === novo && doc.padraoDaSociedade)?.id ?? '');
              }}
            >
              {FONTES_DE_DOSE.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Documento (catálogo de fontes)
            <select value={documentoId} onChange={(e) => setDocumentoId(e.target.value)}>
              <option value="">Outro (escrever ao lado)</option>
              {documentosDaSociedade.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {referenciaCurta(doc)}
                  {doc.status === 'A_VALIDAR' ? ' (dados do documento A VALIDAR)' : ''}
                </option>
              ))}
            </select>
          </label>
          {!documentoId && (
            <label className="campo">
              Documento, edição e ano
              <input value={documentoLivre} onChange={(e) => setDocumentoLivre(e.target.value)} placeholder="Ex.: Manual X, 2ª ed., 2023" />
            </label>
          )}
          <label className="campo">
            Página / tabela / seção
            <input value={pagina} onChange={(e) => setPagina(e.target.value)} placeholder="Ex.: 345 ou tabela 2" size={14} />
          </label>
          <label className="campo">
            Quem conferiu
            <input value={quem} onChange={(e) => setQuem(e.target.value)} size={14} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>2. O valor (corrija se a fonte disser outra coisa)</legend>
        {regra && (
          <>
            <div className="linha-botoes">
              <label className="campo">
                Dose
                <select aria-label="Tipo de dose" value={tipoDose} onChange={(e) => setTipoDose(e.target.value as ExpressaoDeDose['tipo'])}>
                  {TIPOS_DOSE.map((t) => (
                    <option key={t.valor} value={t.valor}>
                      {t.rotulo}
                    </option>
                  ))}
                </select>
              </label>
              {tipoDose === 'texto' ? (
                <label className="campo campo-largo">
                  Dose em texto
                  <input value={descricaoDose} onChange={(e) => setDescricaoDose(e.target.value)} />
                </label>
              ) : (
                <>
                  <label className="campo">
                    Mínima
                    <input aria-label="Dose mínima" inputMode="decimal" size={6} value={min} onChange={(e) => setMin(e.target.value)} />
                  </label>
                  <label className="campo">
                    Máxima
                    <input aria-label="Dose máxima da faixa" inputMode="decimal" size={6} value={max} onChange={(e) => setMax(e.target.value)} />
                  </label>
                  <label className="campo">
                    Unidade
                    {seletorUnidade(unidade, setUnidade, 'Unidade da dose')}
                  </label>
                  <label className="campo">
                    Período
                    <select aria-label="Período da dose" value={por} onChange={(e) => setPor(e.target.value as Periodo)}>
                      {PERIODOS.map((p) => (
                        <option key={p.valor} value={p.valor}>
                          {p.rotulo}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>
            <div className="linha-botoes">
              <label className="campo">
                Dose máxima (vazio = sem máxima)
                <input aria-label="Teto da dose" inputMode="decimal" size={6} value={maxValor} onChange={(e) => setMaxValor(e.target.value)} />
              </label>
              <label className="campo">
                Unidade
                {seletorUnidade(maxUnidade, setMaxUnidade, 'Unidade do teto')}
              </label>
              <label className="campo">
                Período
                <select aria-label="Período do teto" value={maxPor} onChange={(e) => setMaxPor(e.target.value as Periodo)}>
                  {PERIODOS.map((p) => (
                    <option key={p.valor} value={p.valor}>
                      {p.rotulo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="campo">
                Intervalos em horas (ex.: 6, 8)
                <input value={intervalos} onChange={(e) => setIntervalos(e.target.value)} size={10} />
              </label>
            </div>
          </>
        )}
        {apresentacao && (
          <div className="linha-botoes">
            <label className="campo campo-largo">
              Descrição
              <input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </label>
            <label className="campo">
              Concentração por mL
              <input aria-label="Concentração" inputMode="decimal" size={6} value={concValor} onChange={(e) => setConcValor(e.target.value)} />
            </label>
            <label className="campo">
              Unidade
              {seletorUnidade(concUnidade, setConcUnidade, 'Unidade da concentração')}
            </label>
            <label className="campo">
              Quantidade por unidade
              <input aria-label="Quantidade" inputMode="decimal" size={6} value={qtdValor} onChange={(e) => setQtdValor(e.target.value)} />
            </label>
            <label className="campo">
              Unidade
              {seletorUnidade(qtdUnidade, setQtdUnidade, 'Unidade da quantidade')}
            </label>
            <label className="campo">
              Volume (mL)
              <input aria-label="Volume da apresentação" inputMode="decimal" size={5} value={volume} onChange={(e) => setVolume(e.target.value)} />
            </label>
          </div>
        )}
        <div className="linha-botoes vias-conferir" role="group" aria-label="Vias">
          Vias:
          {VIAS.map((v) => (
            <label key={v}>
              <input
                type="checkbox"
                checked={vias.includes(v)}
                onChange={(e) => setVias((l) => (e.target.checked ? [...l, v] : l.filter((x) => x !== v)))}
              />
              {NOME_VIA[v]}
            </label>
          ))}
        </div>
        <label className="campo">
          Observações
          <input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </label>
        <label className="campo">
          Nota da conferência (opcional)
          <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ex.: a fonte diz 'até 4 g/dia'" />
        </label>
      </fieldset>

      {problemas.length > 0 && (
        <ul className="conferencia">
          {problemas.map((p) => (
            <li key={p} className="sit-errado">
              <span className="selo">✘</span> {p}
            </li>
          ))}
        </ul>
      )}

      <div className="linha-botoes">
        <button type="button" className="administrar" onClick={() => salvar('CONFERIDO')}>
          ✔ Conferido — marcar CONFERIDO
        </button>
        <button type="button" onClick={() => salvar('A_VALIDAR')} title="Guarda a correção e a fonte, mas o item continua sem corrigir o aluno">
          Salvar e manter A VALIDAR
        </button>
        <button type="button" onClick={aoFechar}>
          Cancelar
        </button>
      </div>

      {historico.length > 0 && (
        <details className="historico">
          <summary>Histórico deste item ({historico.length})</summary>
          <ol>
            {historico.map((h) => (
              <li key={h.quando}>
                {new Date(h.quando).toLocaleString('pt-BR')} — {h.status === 'CONFERIDO' ? '✔ CONFERIDO' : 'A VALIDAR'}
                {h.quem ? ` por ${h.quem}` : ''} · antes: {h.valorAnterior}
                {h.nota ? ` · ${h.nota}` : ''}
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
