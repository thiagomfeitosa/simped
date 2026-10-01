import { useEffect, useReducer, useRef, useState } from 'react';
import {
  type ArquivoBackup,
  criarBackup,
  lerBackup,
  nomeDoArquivo,
  restaurarBackup,
  resumirBackup,
  textoDoBackup,
} from '../backup/backup';
import { useBanco } from '../dados/medicacoes/ContextoBanco';

function baixarJson(nome: string, texto: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

/** O que está guardado neste computador agora (ou nada, se o navegador não deixa ler). */
function backupAgora(banco: string): ArquivoBackup | null {
  try {
    return criarBackup(window.localStorage, new Date(), banco);
  } catch {
    return null;
  }
}

/** B4: salvar tudo num arquivo e restaurar em outro computador (aba Configurações). */
export function PainelBackup() {
  const { emUso } = useBanco();
  const [aRestaurar, setARestaurar] = useState<{ backup: ArquivoBackup; ignoradas: string[]; arquivo: string } | null>(null);
  const [erro, setErro] = useState('');
  const arquivo = useRef<HTMLInputElement>(null);
  // a aba fica aberta escondida: ao voltar para ela (ou quando outra janela grava), lê de novo
  const [, atualizar] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    // as outras partes do app gravam logo depois de abrir: lê de novo em seguida
    const id = window.setTimeout(atualizar, 0);
    window.addEventListener('hashchange', atualizar);
    window.addEventListener('storage', atualizar);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener('hashchange', atualizar);
      window.removeEventListener('storage', atualizar);
    };
  }, []);
  const atual = backupAgora(emUso.texto);
  const itensAgora = atual ? resumirBackup(atual) : [];

  async function abrir(f: File | undefined) {
    if (!f) return;
    setErro('');
    const r = lerBackup(await f.text());
    if ('erro' in r) {
      setARestaurar(null);
      setErro(r.erro);
    } else {
      setARestaurar({ ...r, arquivo: f.name });
    }
    if (arquivo.current) arquivo.current.value = '';
  }

  function restaurar() {
    if (!aRestaurar) return;
    try {
      restaurarBackup(window.localStorage, aRestaurar.backup);
    } catch (e) {
      setErro((e as Error).message);
      return;
    }
    // todas as telas leem de novo o que está guardado
    window.location.reload();
  }

  return (
    <section className="painel" aria-label="Backup e restauração">
      <h2>Backup e restauração</h2>
      <p className="nota">
        Salva num arquivo tudo o que o SimPed guarda neste computador (configurações, casos criados, histórico de relatórios, apresentações
        importadas, conferências, catálogo de fontes, caso em andamento). Para levar a outro computador ou guardar uma cópia de segurança.
      </p>
      <h3>Guardado neste computador agora</h3>
      {itensAgora.length === 0 ? (
        <p className="nota">Nada guardado ainda (tudo como veio no app).</p>
      ) : (
        <ul className="backup-conteudo" aria-label="Guardado agora">
          {itensAgora.map((i) => (
            <li key={i.chave}>
              {i.nome}: <span className="nota">{i.detalhe}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="linha-botoes">
        <button
          type="button"
          disabled={!atual}
          onClick={() => {
            // lê na hora do clique: leva o que estiver guardado neste instante
            const agora = backupAgora(emUso.texto);
            if (agora) baixarJson(nomeDoArquivo(new Date()), textoDoBackup(agora));
          }}
        >
          💾 Salvar backup (.json)
        </button>
        <button type="button" onClick={() => arquivo.current?.click()}>
          📂 Restaurar backup…
        </button>
        <input
          ref={arquivo}
          type="file"
          accept=".json,application/json"
          hidden
          aria-label="Arquivo de backup"
          onChange={(e) => void abrir(e.target.files?.[0])}
        />
      </div>
      {erro && <p className="aviso-erro">{erro}</p>}
      {aRestaurar && (
        <div className="aviso-local" role="group" aria-label="Restaurar backup">
          <p>
            <strong>{aRestaurar.arquivo}</strong>
            {aRestaurar.backup.geradoEm && <> — feito em {new Date(aRestaurar.backup.geradoEm).toLocaleString('pt-BR')}</>}
            {aRestaurar.backup.banco && <> (banco {aRestaurar.backup.banco})</>}
          </p>
          {Object.keys(aRestaurar.backup.dados).length === 0 ? (
            <p>O backup está vazio.</p>
          ) : (
            <ul className="backup-conteudo">
              {resumirBackup(aRestaurar.backup).map((i) => (
                <li key={i.chave}>
                  {i.nome}: {i.detalhe}
                </li>
              ))}
            </ul>
          )}
          {aRestaurar.ignoradas.length > 0 && <p className="nota">Ignorado (não é do SimPed): {aRestaurar.ignoradas.join(', ')}.</p>}
          <p>
            ⚠ Restaurar <strong>substitui</strong> o que está guardado neste computador. Se quiser guardar o atual, clique antes em “Salvar
            backup”.
          </p>
          <div className="linha-botoes">
            <button type="button" className="administrar" onClick={restaurar}>
              Restaurar agora
            </button>
            <button type="button" onClick={() => setARestaurar(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
