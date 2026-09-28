import { useEffect, useRef } from 'react';
import type { Roteiro, SecaoPrescricao } from '../../dados/roteiros/tipos';
import { SECOES } from '../../dados/secoes';
import type { EstadoFolha, LinhaRascunho } from '../../logica/progresso';

/**
 * Rascunho de cálculos: as contas vão se acumulando, a mais nova em destaque.
 * A conta da etapa atual só é escrita quando o resultado aparece na explicação
 * (e é apagada de novo se o aluno desfizer o resultado).
 */
export function Rascunho({ linhas: todas, idEtapaAtual, ocultarAtual = false }: { linhas: LinhaRascunho[]; idEtapaAtual: string; ocultarAtual?: boolean }) {
  const linhas = ocultarAtual ? todas.filter((l) => l.idEtapa !== idEtapaAtual) : todas;
  // Rola só dentro do rascunho (sem mexer na página) para mostrar a conta mais nova.
  const refPapel = useRef<HTMLElement>(null);
  useEffect(() => {
    const papel = refPapel.current;
    if (papel) papel.scrollTo({ top: papel.scrollHeight, behavior: 'smooth' });
  }, [linhas.length]);

  return (
    <section ref={refPapel} className="papel rascunho" aria-label="Rascunho de cálculos">
      <h3>Rascunho de cálculos</h3>
      {linhas.length === 0 ? (
        <p className="papel-vazio">As contas aparecem aqui conforme você avança.</p>
      ) : (
        <ol>
          {linhas.map((l) => (
            <li key={l.idEtapa}>
              <span className={l.idEtapa === idEtapaAtual ? 'escrevendo' : ''}>{l.texto}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Folha de prescrição oficial, preenchida seção por seção. */
export function FolhaPrescricao({ roteiro, folha, secaoAtual }: { roteiro: Roteiro; folha: EstadoFolha; secaoAtual: SecaoPrescricao }) {
  let numeroItem = 0;
  return (
    <section className="papel folha" aria-label="Folha de prescrição">
      <header className="folha-cabecalho">
        <h3>Folha de prescrição</h3>
        <span>Treinamento · {roteiro.paciente.nome}</span>
      </header>
      {folha.secoes.map(({ secao, linhas }) => {
        const info = SECOES[secao];
        const ativa = secao === secaoAtual;
        return (
          <div
            key={secao}
            className={`folha-secao ${linhas.length ? 'preenchida' : 'vazia'} ${ativa ? 'ativa' : ''}`}
            style={{ ['--cor-secao' as string]: info.cor }}
          >
            <h4>
              {info.numero}. {info.nome}
            </h4>
            {linhas.length === 0 ? (
              <p className="folha-pontilhado">…</p>
            ) : (
              <ul>
                {linhas.map((l) => {
                  const numerada = secao !== 'identificacao';
                  if (numerada) numeroItem += 1;
                  const nova = l.id === folha.idLinhaNova;
                  return (
                    <li key={`${l.id}|${l.texto}|${l.detalhe ?? ''}`}>
                      {numerada && <span className="folha-numero">{numeroItem}.</span>}
                      <span className={`folha-textos ${nova ? 'escrevendo' : ''}`}>
                        <span className="folha-texto">{l.texto}</span>
                        {l.detalhe && <span className="folha-detalhe">{l.detalhe}</span>}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
      <footer className="folha-rodape">Assinatura e carimbo: ____________________</footer>
    </section>
  );
}
