import { useMemo } from 'react';
import { useBanco } from '../../dados/medicacoes/ContextoBanco';
import { BANCO_MEDICACOES } from '../../dados/medicacoes';
import { compararBancos, dataBrasileira, HISTORICO_BANCO, type MudancaBanco, NOME_TIPO_MUDANCA } from '../../dados/medicacoes/versao';

function Mudancas({ lista }: { lista: readonly MudancaBanco[] }) {
  if (lista.length === 0) return <p className="nota">Nenhuma mudança.</p>;
  return (
    <ul className="mudancas-banco">
      {lista.map((m, i) => (
        <li key={`${m.medicacaoId}-${m.itemId ?? ''}-${i}`}>
          <strong>{m.medicacao}</strong> <span className="selo-pequeno">{NOME_TIPO_MUDANCA[m.tipo]}</span>
          {m.itemId && <span className="nota"> ({m.itemId})</span>}
          {m.antes && (
            <div className="nota">
              <b>era:</b> {m.antes}
            </div>
          )}
          {m.depois && (
            <div className="nota">
              <b>{m.antes ? 'ficou:' : 'entrou:'}</b> {m.depois}
            </div>
          )}
          {m.conferencia && (
            <div className="nota">
              ✔ conferido{m.conferencia.quem ? ` por ${m.conferencia.quem}` : ''} em {new Date(m.conferencia.quando).toLocaleString('pt-BR')} ·{' '}
              {m.conferencia.fonte}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** B7: versão do banco em uso, histórico de mudanças do projeto e o que só existe neste computador. */
export function VersaoBanco() {
  const { banco, emUso, validacoes, importadas } = useBanco();
  const locais = useMemo(() => (emUso.local ? compararBancos(BANCO_MEDICACOES, banco, validacoes) : []), [emUso.local, banco, validacoes]);
  const qtdImportadas = Object.values(importadas).reduce((s, l) => s + l.length, 0);
  const versoes = [...HISTORICO_BANCO].reverse();

  return (
    <section className="painel versao-banco" aria-label="Versão do banco">
      <h2>Versão do banco</h2>
      <p className="versao-atual">
        <strong>Versão {emUso.versao.versao}</strong> de {dataBrasileira(emUso.versao.data)} · código <code>{emUso.versao.codigo}</code>
      </p>
      <p className="nota">{emUso.versao.descricao}</p>
      {emUso.local ? (
        <div className="sit-atencao aviso-local">
          ⚠ Este computador usa o banco <strong>com mudanças que ainda não entraram no projeto</strong> ({validacoes.length} conferência(s),{' '}
          {qtdImportadas} apresentação(ões) importada(s)). Código em uso: <code>{emUso.codigo}</code> — é ele que sai no relatório do caso.
          <details>
            <summary>Ver as mudanças deste computador ({locais.length})</summary>
            <Mudancas lista={locais} />
          </details>
        </div>
      ) : (
        <p className="nota">Este computador usa exatamente o banco do projeto (nenhuma mudança local).</p>
      )}
      <details className="historico-banco">
        <summary>Histórico de mudanças ({HISTORICO_BANCO.length} versões)</summary>
        {versoes.map((v) => (
          <details key={v.versao}>
            <summary>
              <strong>Versão {v.versao}</strong> — {dataBrasileira(v.data)} — {v.descricao}{' '}
              <span className="nota">
                ({v.mudancas.length} mudança(s); {v.resumo.medicacoes} medicações, {v.resumo.conferidos} itens conferidos)
              </span>
            </summary>
            <Mudancas lista={v.mudancas} />
          </details>
        ))}
      </details>
      <p className="nota">
        Cada correção que entra no projeto vira uma versão nova, com o que era, o que ficou e quem conferiu. O relatório do caso diz com qual
        versão o aluno treinou.
      </p>
    </section>
  );
}
