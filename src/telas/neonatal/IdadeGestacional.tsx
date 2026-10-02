import { useState } from 'react';
import { CLASSIFICACAO_PESO_IG, FONTE_REDATAR, REDATAR_PELA_USG } from '../../dados/neonatal/maturidade-a-validar';
import { classificarIgDetalhada, classificarPesoParaIg, dataBr, decidirIg, igPelaDum, igPelaUsg, textoIg } from '../../neonatal/maturidade';
import { classificarPesoNascer } from '../../paciente/variaveis';
import { lerNumero } from '../../prescricao/comum';
import type { ResultadoGuardado } from './Maturidade';

function hoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function tentar<T>(f: () => T): T | null {
  try {
    return f();
  } catch {
    return null;
  }
}

/**
 * Idade gestacional por datas (DUM e USG), qual usar, data provável do parto, classificação do RN
 * pela IG, pelo peso ao nascer e pelo peso para a IG (percentil lido na curva).
 */
export function IdadeGestacional({ exame }: { exame: ResultadoGuardado | null }) {
  const [dum, setDum] = useState('');
  const [referencia, setReferencia] = useState(hoje);
  const [dataUsg, setDataUsg] = useState('');
  const [semUsg, setSemUsg] = useState('');
  const [diasUsg, setDiasUsg] = useState('0');
  const [peso, setPeso] = useState('');
  const [percentil, setPercentil] = useState('');

  const pelaDum = dum ? tentar(() => igPelaDum(dum, referencia)) : null;
  const igUsg = lerNumero(semUsg);
  const diasUsgN = lerNumero(diasUsg) ?? 0;
  const usgOk = dataUsg && igUsg !== null && igUsg > 0 && diasUsgN >= 0 && diasUsgN < 7;
  const pelaUsg = usgOk ? tentar(() => igPelaUsg(dataUsg, { semanas: igUsg, dias: diasUsgN }, referencia)) : null;
  const decisao = pelaDum && usgOk ? tentar(() => decidirIg(dum, dataUsg, { semanas: igUsg!, dias: diasUsgN }, referencia)) : null;
  const escolhida = decisao?.escolhida ?? pelaUsg ?? pelaDum;
  const pesoG = lerNumero(peso);
  const p = lerNumero(percentil);

  return (
    <div className="cartoes idade-gestacional">
      <section className="painel" aria-label="Idade gestacional pelas datas">
        <h2>📅 Pelas datas (DUM e USG)</h2>
        <label className="campo">
          Data da última menstruação (DUM)
          <input type="date" aria-label="DUM" value={dum} onChange={(e) => setDum(e.target.value)} />
        </label>
        <label className="campo">
          Data de hoje / do nascimento
          <input type="date" aria-label="Data de referência" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
        </label>
        <fieldset className="opcoes">
          <legend>USG mais precoce</legend>
          <label className="campo">
            Data da USG
            <input type="date" aria-label="Data da USG" value={dataUsg} onChange={(e) => setDataUsg(e.target.value)} />
          </label>
          <span className="linha-botoes">
            <label>
              IG na USG <input aria-label="Semanas na USG" inputMode="numeric" size={3} value={semUsg} onChange={(e) => setSemUsg(e.target.value)} /> s
            </label>
            <label>
              <input aria-label="Dias na USG" inputMode="numeric" size={2} value={diasUsg} onChange={(e) => setDiasUsg(e.target.value)} /> d
            </label>
          </span>
        </fieldset>
      </section>

      <section className="painel" aria-label="Resultado da idade gestacional" role="status">
        <h2>Resultado</h2>
        {!pelaDum && !pelaUsg && <p className="nota">Preencha a DUM e/ou a USG.</p>}
        {pelaDum && (
          <p>
            Pela DUM: <strong>{textoIg(pelaDum.ig)}</strong> · DPP {dataBr(pelaDum.dpp)}
          </p>
        )}
        {pelaUsg && (
          <p>
            Pela USG: <strong>{textoIg(pelaUsg.ig)}</strong> · DPP {dataBr(pelaUsg.dpp)}
          </p>
        )}
        {decisao && (
          <p className={decisao.usar === 'USG' ? 'retorno-erro' : 'retorno-ok'}>
            <strong>Usar a {decisao.usar}.</strong> {decisao.motivo}
          </p>
        )}
        {escolhida && (
          <p className="selo-ig">
            {textoIg(escolhida.ig)} — {classificarIgDetalhada(escolhida.igDias).nome}
          </p>
        )}
        {exame && (
          <p>
            Pelo exame do RN ({exame.metodo}): <strong>{textoIg(exame.resultado.ig)}</strong>
            {escolhida && ` · diferença de ${Math.abs(escolhida.igDias - exame.resultado.igDias)} dia(s) da IG obstétrica`}
          </p>
        )}
        <details>
          <summary>Quando a USG muda a data (A VALIDAR)</summary>
          <ul>
            {REDATAR_PELA_USG.map((r) => (
              <li key={r.texto}>{r.texto}</li>
            ))}
          </ul>
          <p className="nota">Fonte: {FONTE_REDATAR.referencia}. A ordem de confiança costuma ser: USG do 1º trimestre &gt; DUM confiável &gt; USG tardia &gt; exame do RN (Capurro/Ballard).</p>
        </details>
      </section>

      <section className="painel" aria-label="Classificação do RN">
        <h2>⚖️ Classificação do RN</h2>
        <label className="campo">
          Peso ao nascer (g)
          <input aria-label="Peso ao nascer (g)" inputMode="numeric" value={peso} onChange={(e) => setPeso(e.target.value)} />
        </label>
        {pesoG !== null && pesoG > 0 && <p>{classificarPesoNascer(pesoG)}</p>}
        <label className="campo">
          Percentil do peso para a IG (lido na curva Intergrowth-21st ou Fenton)
          <input aria-label="Percentil do peso para a IG" inputMode="numeric" value={percentil} onChange={(e) => setPercentil(e.target.value)} />
        </label>
        {p !== null && p >= 0 && p <= 100 && (
          <p className="selo-ig">
            <strong>{classificarPesoParaIg(p).sigla}</strong> — {classificarPesoParaIg(p).nome}
          </p>
        )}
        <p className="nota">
          PIG &lt; percentil {CLASSIFICACAO_PESO_IG.pigAbaixoDoPercentil}; GIG &gt; percentil {CLASSIFICACAO_PESO_IG.gigAcimaDoPercentil}. As curvas não estão no app: leia o percentil na curva impressa ou no
          aplicativo oficial. A VALIDAR.
        </p>
      </section>
    </div>
  );
}
