import { useMemo, useState } from 'react';
import type { Etapa, Roteiro } from '../../dados/roteiros/tipos';
import { SECOES } from '../../dados/secoes';
import { montarPrescricaoComCalculos, type ContaDaLinha } from '../../logica/progresso';
import type { Direcao } from './PassoAPasso';
import { useRitmo } from './ritmo';

interface Props {
  roteiro: Roteiro;
  etapa: Etapa;
  direcao: Direcao;
  aoIrParaEtapa: (indice: number) => void;
}

/**
 * Etapa final: a folha de prescrição completa, com as contas de cada item
 * escritas "à mão" logo abaixo dele. Pode ser impressa.
 */
export function PrescricaoComCalculos({ roteiro, etapa, direcao, aoIrParaEtapa }: Props) {
  const fator = useRitmo();
  const [mostrarContas, setMostrarContas] = useState(true);
  const { secoes, contasSoltas } = useMemo(() => montarPrescricaoComCalculos(roteiro), [roteiro]);
  const info = SECOES[etapa.secao];

  let numeroItem = 0;
  let ordem = 0; // ordem de entrada na tela (animação escalonada)
  const atraso = () => `${(250 + ordem++ * 180) * fator}ms`;

  return (
    <section className={`prescricao-final entrar-${direcao}`} style={{ ['--cor-secao' as string]: info.cor }}>
      <header className="pf-topo">
        <div className="pf-intro">
          <span className="chip-secao">{info.nome}</span>
          <h2>{etapa.titulo}</h2>
          {etapa.explicacao.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="pf-acoes">
          <label className="pf-alternar">
            <input type="checkbox" checked={mostrarContas} onChange={(ev) => setMostrarContas(ev.target.checked)} />
            Mostrar os cálculos
          </label>
          <button type="button" className="pf-imprimir" onClick={() => window.print()}>
            Imprimir
          </button>
        </div>
      </header>

      <article className="papel folha pf-folha" aria-label="Prescrição com os cálculos">
        <header className="folha-cabecalho">
          <h3>Folha de prescrição</h3>
          <span>
            Treinamento · {roteiro.paciente.nome} · {roteiro.paciente.descricao}
          </span>
        </header>

        {secoes.map(({ secao, linhas }) => {
          const infoSecao = SECOES[secao];
          return (
            <div key={secao} className="folha-secao preenchida" style={{ ['--cor-secao' as string]: infoSecao.cor }}>
              <h4>
                {infoSecao.numero}. {infoSecao.nome}
              </h4>
              <ul>
                {linhas.map(({ linha, contas, aValidar }) => {
                  const numerada = secao !== 'identificacao';
                  if (numerada) numeroItem += 1;
                  return (
                    <li key={linha.id} className="pf-item" style={{ animationDelay: atraso() }}>
                      {numerada && <span className="folha-numero">{numeroItem}.</span>}
                      <div className="pf-item-corpo">
                        <span className="folha-texto">
                          {linha.texto}
                          {aValidar && <span className="selo-a-validar pf-selo">A VALIDAR</span>}
                        </span>
                        {linha.detalhe && <span className="folha-detalhe">{linha.detalhe}</span>}
                        {mostrarContas && contas.length > 0 && <ListaDeContas contas={contas} atraso={atraso} aoIrParaEtapa={aoIrParaEtapa} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {mostrarContas && contasSoltas.length > 0 && (
          <div className="folha-secao preenchida">
            <h4>Outros cálculos</h4>
            <ListaDeContas contas={contasSoltas} atraso={atraso} aoIrParaEtapa={aoIrParaEtapa} />
          </div>
        )}

        <footer className="folha-rodape">Assinatura e carimbo: ____________________</footer>
      </article>
    </section>
  );
}

function ListaDeContas({ contas, atraso, aoIrParaEtapa }: { contas: ContaDaLinha[]; atraso: () => string; aoIrParaEtapa: (i: number) => void }) {
  return (
    <ol className="pf-contas">
      {contas.map((c) => (
        <li key={c.idEtapa} className="pf-conta" style={{ animationDelay: atraso() }}>
          <span className="pf-conta-formula">
            <b>{c.curto.replace(/\?$/, '')}:</b> {c.conta.formula}
          </span>
          <span className="pf-conta-mao">{c.conta.rascunho}</span>
          <button type="button" className="pf-ver" onClick={() => aoIrParaEtapa(c.indiceEtapa)} title="Voltar à explicação desta conta">
            ver etapa {c.indiceEtapa + 1}
          </button>
        </li>
      ))}
    </ol>
  );
}
