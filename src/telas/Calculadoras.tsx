import { type ReactNode, useState } from 'react';
import {
  converterMassa,
  deficitDeSodio,
  diluir,
  gotasPorMinuto,
  hollidaySegarMlDia,
  misturarDuasSolucoes,
  sodioCorrigido,
  type UnidadeDeMassa,
  vazaoMlPorHora,
  vazaoParaVig,
  vig,
} from '../calculos';
import { EQUIPOS } from '../dados/equipos';
import { calcularVariaveis, lerDataHora, textoSemanasEDias } from '../paciente/variaveis';
import { formatarNumero, lerNumero } from '../prescricao/comum';

const n = formatarNumero;

/** Campo numérico de calculadora (aceita vírgula). */
function Num({ rotulo, valor, aoMudar, unidade }: { rotulo: string; valor: string; aoMudar: (v: string) => void; unidade?: string }) {
  return (
    <label className="campo campo-calc">
      {rotulo}
      <span>
        <input inputMode="decimal" value={valor} onChange={(e) => aoMudar(e.target.value)} /> {unidade}
      </span>
    </label>
  );
}

/** Mostra o resultado ou explica o que falta; erros de conta (ex.: peso zero) aparecem em português. */
function Resultado({ calcular }: { calcular: () => ReactNode }) {
  let conteudo: ReactNode;
  try {
    conteudo = calcular();
  } catch (e) {
    conteudo = <span className="nota">{(e as Error).message}</span>;
  }
  return <div className="resultado-calc">{conteudo ?? <span className="nota">Preencha os campos.</span>}</div>;
}

function useNumeros<T extends string>(inicial: Record<T, string>) {
  const [v, setV] = useState(inicial);
  const ler = (k: T) => lerNumero(v[k]);
  const muda = (k: T) => (x: string) => setV((a) => ({ ...a, [k]: x }));
  return { v, ler, muda };
}

/** Calculadoras de bolso: usam o mesmo motor de cálculo do app. */
export function Calculadoras() {
  const sc = useNumeros({ peso: '16', estatura: '102' });
  const hs = useNumeros({ peso: '16' });
  const vg = useNumeros({ vazao: '14', pct: '10', peso: '4,2', vigDesejada: '6' });
  const inf = useNumeros({ dose: '0,1', peso: '16', c: '10' });
  const dil = useNumeros({ c1: '1', v1: '1', v2: '10' });
  const mis = useNumeros({ menor: '5', maior: '50', desejada: '10', final: '500' });
  const got = useNumeros({ volume: '500', horas: '8' });
  const conv = useNumeros({ valor: '1' });
  const [de, setDe] = useState<UnidadeDeMassa>('mg');
  const na = useNumeros({ na: '131', glic: '480', atual: '118', desejado: '125', peso: '8' });
  const [idade, setIdade] = useState({ nascimento: '2026-09-01T08:00', agora: '2026-10-01T08:00', semanas: '32', dias: '0', peso: '1,8', estatura: '' });

  return (
    <div className="pagina-simples calculadoras">
      <header className="cabecalho">
        <h1>Calculadoras</h1>
        <span className="subtitulo">Contas rápidas com o motor do SimPed. Treinamento: não substitui protocolos institucionais.</span>
      </header>
      <div className="cartoes">
        <section className="painel">
          <h2>Idade e variáveis do paciente</h2>
          <label className="campo">
            Nascimento
            <input type="datetime-local" value={idade.nascimento} onChange={(e) => setIdade((a) => ({ ...a, nascimento: e.target.value }))} />
          </label>
          <label className="campo">
            Agora
            <input type="datetime-local" value={idade.agora} onChange={(e) => setIdade((a) => ({ ...a, agora: e.target.value }))} />
          </label>
          <div className="linha-botoes">
            <Num rotulo="IG (sem)" valor={idade.semanas} aoMudar={(x) => setIdade((a) => ({ ...a, semanas: x }))} />
            <Num rotulo="+ dias" valor={idade.dias} aoMudar={(x) => setIdade((a) => ({ ...a, dias: x }))} />
            <Num rotulo="Peso" unidade="kg" valor={idade.peso} aoMudar={(x) => setIdade((a) => ({ ...a, peso: x }))} />
          </div>
          <Resultado
            calcular={() => {
              const peso = lerNumero(idade.peso);
              const sem = lerNumero(idade.semanas);
              const dias = lerNumero(idade.dias) ?? 0;
              if (peso === null || sem === null) return null;
              const v = calcularVariaveis(
                { nascimento: idade.nascimento, igNascer: { semanas: sem, dias }, pesoNascerG: peso * 1000, pesoKg: peso },
                lerDataHora(idade.agora),
              );
              return (
                <>
                  <strong>{v.idadeTexto}</strong> ({n(v.idade.horas)} h · {n(v.idade.dias)} d · {n(v.idade.semanas)} sem · {n(v.idade.meses)} m)
                  <br />
                  Idade pós-menstrual: <strong>{textoSemanasEDias(v.idadePosMenstrual)}</strong>
                  {v.idadeCorrigida && (
                    <>
                      <br />
                      Idade corrigida: <strong>{v.idadeCorrigida.texto}</strong>
                    </>
                  )}
                  <br />
                  {v.classificacaoIG} · faixa {v.nomeFaixa} (SBP, A VALIDAR)
                </>
              );
            }}
          />
        </section>

        <section className="painel">
          <h2>Superfície corporal</h2>
          <div className="linha-botoes">
            <Num rotulo="Peso" unidade="kg" valor={sc.v.peso} aoMudar={sc.muda('peso')} />
            <Num rotulo="Estatura (opcional)" unidade="cm" valor={sc.v.estatura} aoMudar={sc.muda('estatura')} />
          </div>
          <Resultado
            calcular={() => {
              const p = sc.ler('peso');
              const e = sc.ler('estatura');
              if (p === null || p <= 0) return null;
              const m2 = e !== null && e > 0 ? Math.sqrt((p * e) / 3600) : (4 * p + 7) / (p + 90);
              return (
                <>
                  <strong>{n(m2)} m²</strong> — {e !== null && e > 0 ? `Mosteller: √(${n(p)} × ${n(e)} ÷ 3600)` : `(4 × ${n(p)} + 7) ÷ (${n(p)} + 90)`}
                </>
              );
            }}
          />
        </section>

        <section className="painel">
          <h2>Holliday-Segar</h2>
          <Num rotulo="Peso" unidade="kg" valor={hs.v.peso} aoMudar={hs.muda('peso')} />
          <Resultado
            calcular={() => {
              const p = hs.ler('peso');
              if (p === null) return null;
              const dia = hollidaySegarMlDia(p);
              return (
                <>
                  <strong>{n(dia)} mL/dia</strong> = {n(dia / 24)} mL/h. Quando usar é decisão clínica (A VALIDAR).
                </>
              );
            }}
          />
        </section>

        <section className="painel">
          <h2>VIG</h2>
          <div className="linha-botoes">
            <Num rotulo="Vazão" unidade="mL/h" valor={vg.v.vazao} aoMudar={vg.muda('vazao')} />
            <Num rotulo="Glicose" unidade="%" valor={vg.v.pct} aoMudar={vg.muda('pct')} />
            <Num rotulo="Peso" unidade="kg" valor={vg.v.peso} aoMudar={vg.muda('peso')} />
          </div>
          <Resultado
            calcular={() => {
              const [vz, pc, p] = [vg.ler('vazao'), vg.ler('pct'), vg.ler('peso')];
              if (vz === null || pc === null || p === null) return null;
              return (
                <>
                  <strong>{n(vig({ vazaoMlPorHora: vz, concentracaoGlicosePct: pc, pesoKg: p }))} mg/kg/min</strong> = {n(vz)} × {n(pc)} ÷ (6 × {n(p)})
                </>
              );
            }}
          />
          <Num rotulo="Ao contrário: VIG desejada" unidade="mg/kg/min" valor={vg.v.vigDesejada} aoMudar={vg.muda('vigDesejada')} />
          <Resultado
            calcular={() => {
              const [d, pc, p] = [vg.ler('vigDesejada'), vg.ler('pct'), vg.ler('peso')];
              if (d === null || pc === null || p === null) return null;
              return (
                <>
                  Vazão: <strong>{n(vazaoParaVig({ vigMgKgMin: d, concentracaoGlicosePct: pc, pesoKg: p }))} mL/h</strong>
                </>
              );
            }}
          />
        </section>

        <section className="painel">
          <h2>Infusão contínua</h2>
          <div className="linha-botoes">
            <Num rotulo="Dose" unidade="mcg/kg/min" valor={inf.v.dose} aoMudar={inf.muda('dose')} />
            <Num rotulo="Peso" unidade="kg" valor={inf.v.peso} aoMudar={inf.muda('peso')} />
            <Num rotulo="Concentração" unidade="mcg/mL" valor={inf.v.c} aoMudar={inf.muda('c')} />
          </div>
          <Resultado
            calcular={() => {
              const [d, p, c] = [inf.ler('dose'), inf.ler('peso'), inf.ler('c')];
              if (d === null || p === null || c === null) return null;
              return (
                <>
                  <strong>{n(vazaoMlPorHora({ dosePorKg: d, pesoKg: p, concentracao: c, por: 'min' }))} mL/h</strong> = {n(d)} × {n(p)} × 60 ÷ {n(c)}
                </>
              );
            }}
          />
        </section>

        <section className="painel">
          <h2>Diluição (C1 × V1 = C2 × V2)</h2>
          <div className="linha-botoes">
            <Num rotulo="C1" unidade="/mL" valor={dil.v.c1} aoMudar={dil.muda('c1')} />
            <Num rotulo="V1 aspirado" unidade="mL" valor={dil.v.v1} aoMudar={dil.muda('v1')} />
            <Num rotulo="V2 final" unidade="mL" valor={dil.v.v2} aoMudar={dil.muda('v2')} />
          </div>
          <Resultado
            calcular={() => {
              const [c1, v1, v2] = [dil.ler('c1'), dil.ler('v1'), dil.ler('v2')];
              if (c1 === null || v1 === null || v2 === null) return null;
              const r = diluir({ concentracaoInicial: c1, volumeAspiradoMl: v1, volumeFinalMl: v2 });
              return (
                <>
                  C2 = <strong>{n(r.concentracaoFinal)} /mL</strong>; diluente: {n(r.volumeDiluenteMl)} mL
                </>
              );
            }}
          />
        </section>

        <section className="painel">
          <h2>Mistura de duas soluções</h2>
          <div className="linha-botoes">
            <Num rotulo="Menos concentrada" unidade="%" valor={mis.v.menor} aoMudar={mis.muda('menor')} />
            <Num rotulo="Mais concentrada" unidade="%" valor={mis.v.maior} aoMudar={mis.muda('maior')} />
            <Num rotulo="Desejada" unidade="%" valor={mis.v.desejada} aoMudar={mis.muda('desejada')} />
            <Num rotulo="Volume final" unidade="mL" valor={mis.v.final} aoMudar={mis.muda('final')} />
          </div>
          <Resultado
            calcular={() => {
              const [a, b, d, f] = [mis.ler('menor'), mis.ler('maior'), mis.ler('desejada'), mis.ler('final')];
              if (a === null || b === null || d === null || f === null) return null;
              const r = misturarDuasSolucoes({ concentracaoMenor: a, concentracaoMaior: b, concentracaoDesejada: d, volumeFinalMl: f });
              return (
                <>
                  <strong>{n(r.volumeMaiorMl)} mL</strong> da de {n(b)}% + <strong>{n(r.volumeMenorMl)} mL</strong> da de {n(a)}%
                </>
              );
            }}
          />
        </section>

        <section className="painel">
          <h2>Gotejamento</h2>
          <div className="linha-botoes">
            <Num rotulo="Volume" unidade="mL" valor={got.v.volume} aoMudar={got.muda('volume')} />
            <Num rotulo="Tempo" unidade="h" valor={got.v.horas} aoMudar={got.muda('horas')} />
          </div>
          <Resultado
            calcular={() => {
              const [v, h] = [got.ler('volume'), got.ler('horas')];
              if (v === null || h === null || h <= 0) return null;
              const vz = v / h;
              return (
                <>
                  {n(vz)} mL/h → <strong>{n(gotasPorMinuto(vz, EQUIPOS.macrogotas.gotasPorMl))} gotas/min</strong> (macro, {EQUIPOS.macrogotas.gotasPorMl}/mL) ou{' '}
                  <strong>{n(gotasPorMinuto(vz, EQUIPOS.microgotas.gotasPorMl))} microgotas/min</strong>. Equipos: A VALIDAR.
                </>
              );
            }}
          />
        </section>

        <section className="painel">
          <h2>Conversão de massa</h2>
          <div className="linha-botoes">
            <Num rotulo="Valor" valor={conv.v.valor} aoMudar={conv.muda('valor')} />
            <label className="campo campo-calc">
              Unidade
              <select value={de} onChange={(e) => setDe(e.target.value as UnidadeDeMassa)}>
                <option value="g">g</option>
                <option value="mg">mg</option>
                <option value="mcg">mcg</option>
              </select>
            </label>
          </div>
          <Resultado
            calcular={() => {
              const x = conv.ler('valor');
              if (x === null) return null;
              return (
                <>
                  {(['g', 'mg', 'mcg'] as const).map((u) => (
                    <span key={u}>
                      <strong>{n(converterMassa(x, de, u))}</strong> {u}{' '}
                    </span>
                  ))}
                </>
              );
            }}
          />
        </section>

        <section className="painel">
          <h2>Sódio</h2>
          <div className="linha-botoes">
            <Num rotulo="Na" unidade="mEq/L" valor={na.v.na} aoMudar={na.muda('na')} />
            <Num rotulo="Glicemia" unidade="mg/dL" valor={na.v.glic} aoMudar={na.muda('glic')} />
          </div>
          <Resultado
            calcular={() => {
              const [s, g] = [na.ler('na'), na.ler('glic')];
              if (s === null || g === null) return null;
              return (
                <>
                  Na corrigido: <strong>{n(sodioCorrigido(s, g))} mEq/L</strong> = {n(s)} + 1,6 × ({n(g)} − 100) ÷ 100
                </>
              );
            }}
          />
          <div className="linha-botoes">
            <Num rotulo="Na atual" valor={na.v.atual} aoMudar={na.muda('atual')} />
            <Num rotulo="Na desejado" valor={na.v.desejado} aoMudar={na.muda('desejado')} />
            <Num rotulo="Peso" unidade="kg" valor={na.v.peso} aoMudar={na.muda('peso')} />
          </div>
          <Resultado
            calcular={() => {
              const [a, d, p] = [na.ler('atual'), na.ler('desejado'), na.ler('peso')];
              if (a === null || d === null || p === null) return null;
              return (
                <>
                  Déficit: <strong>{n(deficitDeSodio({ sodioAtual: a, sodioDesejado: d, pesoKg: p }))} mEq</strong> = ({n(d)} − {n(a)}) × 0,6 × {n(p)}
                </>
              );
            }}
          />
          <p className="nota">Fórmulas do rascunho (fatores 1,6 e 0,6): A VALIDAR. Subir no máx. 8–10 mEq/L em 24 h.</p>
        </section>
      </div>
    </div>
  );
}
