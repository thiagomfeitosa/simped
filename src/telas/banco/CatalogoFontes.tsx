import { useState } from 'react';
import { FONTES_DE_DOSE } from '../../configuracoes/configuracoes';
import { CATALOGO_FONTES, type DocumentoFonte, verificarCatalogo } from '../../dados/fontes/fontes';
import { useBanco } from '../../dados/medicacoes/ContextoBanco';
import type { CodigoFonte } from '../../dados/medicacoes/tipos';

const VAZIO: DocumentoFonte = { id: '', sociedade: 'SBP', titulo: '', status: 'A_VALIDAR' };

/** Catálogo de fontes (B6): lista de documentos; o usuário confere e cadastra os seus. */
export function CatalogoFontes({ aoBaixar }: { aoBaixar: (nome: string, conteudo: string) => void }) {
  const { catalogo, documentosDoApp, salvarDocumento, removerDocumento, banco } = useBanco();
  const [editando, setEditando] = useState<DocumentoFonte | null>(null);
  const problemas = verificarCatalogo(catalogo);
  const doProjeto = new Set(CATALOGO_FONTES.map((d) => d.id));
  const usos = (id: string) =>
    banco.reduce(
      (n, m) => n + [...m.regras.map((r) => r.fonte), ...m.apresentacoes.flatMap((a) => (a.fonte ? [a.fonte] : []))].filter((f) => f.documentoId === id).length,
      0,
    );

  return (
    <section className="painel catalogo-fontes" aria-label="Catálogo de fontes">
      <h2>Catálogo de fontes</h2>
      <p className="nota">
        Cada dose aponta para um documento desta lista. Títulos, edições e anos foram preenchidos pelo assistente: A VALIDAR. Confira e corrija
        (“Editar”), ou cadastre um documento novo.
      </p>
      <table className="tabela-resultado">
        <thead>
          <tr>
            <th>Código</th>
            <th>Documento</th>
            <th>Situação</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {[...catalogo]
            .sort((a, b) => a.sociedade.localeCompare(b.sociedade) || a.id.localeCompare(b.id))
            .map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.sociedade}</strong>
                  <div className="nota">{d.id}</div>
                </td>
                <td>
                  {d.titulo}
                  {d.edicao ? `, ${d.edicao}` : ''}
                  {d.ano ? ` (${d.ano})` : ''}
                  {d.padraoDaSociedade && <span className="selo-pequeno selo-hospital">padrão da {d.sociedade}</span>}
                  {d.link && (
                    <div className="nota">
                      <a href={d.link} target="_blank" rel="noreferrer">
                        {d.link}
                      </a>
                    </div>
                  )}
                  {usos(d.id) > 0 && <div className="nota">usado em {usos(d.id)} item(ns) conferido(s)</div>}
                </td>
                <td>
                  <span className="selo-pequeno">{d.status === 'CONFERIDO' ? '✔ CONFERIDO' : 'A VALIDAR'}</span>
                  {!doProjeto.has(d.id) && <div className="nota">cadastrado no app</div>}
                </td>
                <td>
                  <button type="button" onClick={() => setEditando(d)}>
                    Editar
                  </button>
                  {documentosDoApp.some((x) => x.id === d.id) && (
                    <button type="button" onClick={() => removerDocumento(d.id)} title={doProjeto.has(d.id) ? 'Volta ao que está no projeto' : 'Apaga o documento'}>
                      {doProjeto.has(d.id) ? 'Desfazer edição' : 'Apagar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {problemas.map((p) => (
        <p key={p} className="aviso-erro">
          {p}
        </p>
      ))}
      <div className="linha-botoes">
        <button type="button" onClick={() => setEditando({ ...VAZIO })}>
          + Novo documento
        </button>
        <button type="button" onClick={() => aoBaixar('simped-catalogo-fontes.json', JSON.stringify(catalogo, null, 2))}>
          ⬇ Baixar catálogo (.json)
        </button>
      </div>
      {editando && (
        <EditarDocumento
          inicial={editando}
          novo={!catalogo.some((d) => d.id === editando.id)}
          aoSalvar={(d) => {
            salvarDocumento(d);
            setEditando(null);
          }}
          aoCancelar={() => setEditando(null)}
        />
      )}
    </section>
  );
}

function EditarDocumento({
  inicial,
  novo,
  aoSalvar,
  aoCancelar,
}: {
  inicial: DocumentoFonte;
  novo: boolean;
  aoSalvar: (d: DocumentoFonte) => void;
  aoCancelar: () => void;
}) {
  const [d, setD] = useState(inicial);
  const [erro, setErro] = useState('');
  const muda = (m: Partial<DocumentoFonte>) => setD((x) => ({ ...x, ...m }));
  return (
    <div className="conferir-item" role="group" aria-label="Editar documento">
      <div className="linha-botoes">
        <label className="campo">
          Código
          <input value={d.id} disabled={!novo} onChange={(e) => muda({ id: e.target.value.toUpperCase().replace(/\s+/g, '-') })} placeholder="EX.: SBP-NEO-2024" />
        </label>
        <label className="campo">
          Sociedade
          <select value={d.sociedade} onChange={(e) => muda({ sociedade: e.target.value as CodigoFonte })}>
            {FONTES_DE_DOSE.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="campo campo-largo">
          Título
          <input value={d.titulo} onChange={(e) => muda({ titulo: e.target.value })} />
        </label>
      </div>
      <div className="linha-botoes">
        <label className="campo">
          Edição
          <input value={d.edicao ?? ''} onChange={(e) => muda({ edicao: e.target.value || undefined })} size={10} />
        </label>
        <label className="campo">
          Ano
          <input value={d.ano ?? ''} inputMode="numeric" size={6} onChange={(e) => muda({ ano: e.target.value ? Number(e.target.value) : undefined })} />
        </label>
        <label className="campo">
          Autor / órgão
          <input value={d.autor ?? ''} onChange={(e) => muda({ autor: e.target.value || undefined })} />
        </label>
        <label className="campo campo-largo">
          Link
          <input value={d.link ?? ''} onChange={(e) => muda({ link: e.target.value || undefined })} />
        </label>
        <label className="campo">
          <span>
            <input type="checkbox" checked={d.status === 'CONFERIDO'} onChange={(e) => muda({ status: e.target.checked ? 'CONFERIDO' : 'A_VALIDAR' })} /> Dados do
            documento conferidos
          </span>
        </label>
      </div>
      {erro && <p className="aviso-erro">{erro}</p>}
      <div className="linha-botoes">
        <button
          type="button"
          className="administrar"
          onClick={() => {
            if (!d.id.trim() || !d.titulo.trim()) {
              setErro('Preencha o código e o título.');
              return;
            }
            aoSalvar({ ...d, id: d.id.trim(), titulo: d.titulo.trim() });
          }}
        >
          Salvar documento
        </button>
        <button type="button" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
