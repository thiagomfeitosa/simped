import { useRef, useState } from 'react';
import { textoCondicoes, verificarBanco } from '../dados/medicacoes/consulta';
import { useBanco } from '../dados/medicacoes/ContextoBanco';
import { listaAValidarCsv, resumirBanco, textoDaRegra } from '../dados/medicacoes/resumo';
import type { Apresentacao, StatusValidacao } from '../dados/medicacoes/tipos';
import { importarApresentacoes, type ResultadoImportacao } from '../importacao/apresentacoes';
import { lerXlsx } from '../importacao/xlsx';

const SELO: Record<StatusValidacao, string> = { A_VALIDAR: 'A VALIDAR', CONFERIDO: '✔ CONFERIDO' };

function baixar(nome: string, conteudo: string, tipo: string) {
  // BOM para o Excel abrir o CSV com acentos certos
  const blob = new Blob([tipo === 'text/csv' ? `﻿${conteudo}` : conteudo], { type: `${tipo};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

/** Banco de medicações: o que existe, o que já foi conferido e a importação da planilha do hospital. */
export function Banco() {
  const { banco, importadas, usarImportadas, descartarImportadas } = useBanco();
  const [busca, setBusca] = useState('');
  const [secao, setSecao] = useState<'' | '4' | '5' | '6'>('');
  const [importacao, setImportacao] = useState<ResultadoImportacao | null>(null);
  const [erro, setErro] = useState('');
  const arquivo = useRef<HTMLInputElement>(null);
  const resumo = resumirBanco(banco);
  const problemas = verificarBanco(banco);
  const qtdImportadas = Object.values(importadas).reduce((s, l) => s + l.length, 0);

  const normal = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const visiveis = banco
    .filter((m) => (secao ? String(m.secao) === secao : true))
    .filter((m) => normal(m.nome).includes(normal(busca)))
    .sort((a, b) => a.secao - b.secao || a.nome.localeCompare(b.nome, 'pt-BR'));

  async function abrirPlanilha(f: File | undefined) {
    if (!f) return;
    setErro('');
    try {
      const abas = await lerXlsx(new Uint8Array(await f.arrayBuffer()));
      setImportacao(importarApresentacoes(abas, banco));
    } catch (e) {
      setImportacao(null);
      setErro((e as Error).message);
    }
  }

  return (
    <div className="pagina-simples banco">
      <header className="cabecalho">
        <h1>Banco de medicações</h1>
        <span className="subtitulo">O que o app usa para conferir as prescrições. Só o que estiver CONFERIDO corrige o aluno.</span>
      </header>

      <div className="cartoes">
        <section className="painel">
          <h2>Situação da validação</h2>
          <div className="relatorio-numeros">
            <div>
              <strong>{resumo.medicacoes}</strong>
              <span>medicações</span>
            </div>
            <div>
              <strong>
                {resumo.apresentacoesConferidas}/{resumo.apresentacoes}
              </strong>
              <span>apresentações conferidas</span>
            </div>
            <div>
              <strong>
                {resumo.regrasConferidas}/{resumo.regras}
              </strong>
              <span>regras de dose conferidas</span>
            </div>
          </div>
          <button type="button" onClick={() => baixar('simped-a-validar.csv', listaAValidarCsv(banco), 'text/csv')}>
            ⬇ Baixar lista do que falta validar (.csv, abre no Excel)
          </button>
          <ul className="conferencia">
            {problemas.length === 0 ? (
              <li className="sit-certo">
                <span className="selo">✔ íntegro</span> O verificador não achou erro de digitação no banco.
              </li>
            ) : (
              problemas.map((p) => (
                <li key={p} className="sit-errado">
                  <span className="selo">✘</span> {p}
                </li>
              ))
            )}
          </ul>
        </section>

        <section className="painel">
          <h2>Importar planilha de apresentações</h2>
          <p className="nota">
            Use o formulário <code>docs/fase-0/apresentacoes-formulario.xlsx</code>. O app lê a aba “Apresentações” sem internet. Linha com
            “Onde conferi” preenchido entra como CONFERIDA; sem fonte, fica A VALIDAR.
          </p>
          <div className="linha-botoes">
            <button type="button" onClick={() => arquivo.current?.click()}>
              📂 Escolher planilha (.xlsx)
            </button>
            <input
              ref={arquivo}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              onChange={(e) => void abrirPlanilha(e.target.files?.[0])}
            />
            {qtdImportadas > 0 && (
              <>
                <button type="button" onClick={() => baixar('apresentacoes-hospital.json', JSON.stringify(importadas, null, 2), 'application/json')}>
                  💾 Baixar o que está em uso (.json)
                </button>
                <button type="button" onClick={descartarImportadas}>
                  Voltar ao rascunho
                </button>
              </>
            )}
          </div>
          {qtdImportadas > 0 && <p className="nota">Em uso: {qtdImportadas} apresentação(ões) do hospital.</p>}
          {erro && <p className="sit-errado aviso-erro">{erro}</p>}
          {importacao && (
            <>
              <table className="tabela-resultado tabela-importacao">
                <thead>
                  <tr>
                    <th>Linha</th>
                    <th>Medicação</th>
                    <th>Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {importacao.linhas
                    .filter((l) => l.ignorada !== 'ainda não preenchida')
                    .map((l) => (
                      <tr key={l.linha} className={l.avisos.length > 0 && !l.apresentacao ? 'fora' : undefined}>
                        <td>{l.linha}</td>
                        <td>{l.medicacao}</td>
                        <td>
                          {l.ignorada ? (
                            <span className="nota">ignorada: {l.ignorada}</span>
                          ) : (
                            <>
                              {l.apresentacao && (
                                <>
                                  {l.apresentacao.descricao} <span className="selo-pequeno">{SELO[l.apresentacao.status]}</span>
                                </>
                              )}
                              {l.avisos.map((a) => (
                                <div key={a} className="nota">
                                  ⚠ {a}
                                </div>
                              ))}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <p className="nota">
                {importacao.linhas.filter((l) => l.ignorada === 'ainda não preenchida').length} linha(s) ainda não preenchida(s) não aparecem.
              </p>
              <div className="linha-botoes">
                <button
                  type="button"
                  className="administrar"
                  disabled={importacao.porMedicacao.size === 0}
                  onClick={() => {
                    usarImportadas(Object.fromEntries(importacao.porMedicacao));
                    setImportacao(null);
                  }}
                >
                  Usar estas apresentações no app
                </button>
                <button type="button" onClick={() => setImportacao(null)}>
                  Cancelar
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="painel lista-banco">
        <div className="linha-botoes">
          <input aria-label="Buscar medicação" placeholder="Buscar medicação…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          <select aria-label="Seção" value={secao} onChange={(e) => setSecao(e.target.value as typeof secao)}>
            <option value="">Todas as seções</option>
            <option value="4">4. Reposição volêmica e glicose</option>
            <option value="5">5. Antibióticos / antiparasitários / ARV</option>
            <option value="6">6. Demais medicações</option>
          </select>
          <span className="nota">{visiveis.length} medicação(ões)</span>
        </div>
        {visiveis.map((m) => (
          <details key={m.id} className="med-banco">
            <summary>
              <strong>{m.nome}</strong> <span className="nota">seção {m.secao}</span>{' '}
              <span className="selo-pequeno">
                {m.apresentacoes.filter((a) => a.status === 'CONFERIDO').length}/{m.apresentacoes.length} apresentações ·{' '}
                {m.regras.filter((r) => r.status === 'CONFERIDO').length}/{m.regras.length} regras conferidas
              </span>
              {importadas[m.id] && <span className="selo-pequeno selo-hospital">do hospital</span>}
            </summary>
            <h4>Apresentações</h4>
            <ul>
              {m.apresentacoes.map((a: Apresentacao) => (
                <li key={a.id}>
                  {a.descricao} — {a.vias.join('/') || 'via?'} <span className="selo-pequeno">{SELO[a.status]}</span>
                  {a.fonte?.documento && <span className="nota"> · {a.fonte.documento}</span>}
                  {a.observacao && <div className="nota">{a.observacao}</div>}
                </li>
              ))}
            </ul>
            <h4>Regras de dose</h4>
            {m.regras.length === 0 ? (
              <p className="nota">Sem regra de dose no banco (a dose não é conferida).</p>
            ) : (
              <ul>
                {m.regras.map((r) => (
                  <li key={r.id}>
                    <strong>{r.indicacao}</strong> ({r.faixas.join(', ')}
                    {r.condicoes ? `; ${textoCondicoes(r.condicoes)}` : ''}) — {r.vias.join('/')} — {textoDaRegra(r)}
                    {r.intervalosHoras ? ` · ${r.intervalosHoras.map((h) => `${h}/${h}h`).join(' ou ')}` : ''} · fonte {r.fonte.codigo}{' '}
                    <span className="selo-pequeno">{SELO[r.status]}</span>
                    {r.observacoes && <div className="nota">{r.observacoes}</div>}
                  </li>
                ))}
              </ul>
            )}
            {m.alertas && m.alertas.length > 0 && <p className="nota">⚠ {m.alertas.join(' · ')}</p>}
          </details>
        ))}
      </section>
    </div>
  );
}
