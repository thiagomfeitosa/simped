import { useState } from 'react';
import type { ConfiguracaoHospital } from '../dados/hospitais';
import type { Paciente } from '../dados/pacientes';
import { SECOES_FOLHA } from '../dados/folhaPrescricao';
import { mostrarNumero } from './numeros';

interface Props {
  paciente: Paciente;
  hospital: ConfiguracaoHospital;
}

/** Folha de prescrição na ordem oficial. Por enquanto as linhas são texto livre. */
export function FolhaPrescricao({ paciente, hospital }: Props) {
  const [linhas, setLinhas] = useState<Record<string, string[]>>({});

  function mudarLinha(secao: string, indice: number, texto: string) {
    const atual = [...(linhas[secao] ?? [])];
    atual[indice] = texto;
    setLinhas({ ...linhas, [secao]: atual });
  }

  function adicionarLinha(secao: string) {
    setLinhas({ ...linhas, [secao]: [...(linhas[secao] ?? []), ''] });
  }

  function removerLinha(secao: string, indice: number) {
    setLinhas({ ...linhas, [secao]: (linhas[secao] ?? []).filter((_, i) => i !== indice) });
  }

  let numeroItem = 0;

  return (
    <section className="painel folha">
      <h2>Folha de prescrição — {hospital.nome}</h2>
      <ol className="secoes">
        {SECOES_FOLHA.map((secao) => (
          <li key={secao.id}>
            <h3>
              {secao.titulo}
              {secao.seAplicavel && <span className="nota"> (se aplicável)</span>}
            </h3>
            {secao.id === 'identificacao' ? (
              <p className="identificacao">
                {paciente.nome} · {paciente.idade} · {mostrarNumero(paciente.pesoKg, 3)} kg · {paciente.leito}
              </p>
            ) : (
              <>
                {(linhas[secao.id] ?? []).map((texto, i) => {
                  numeroItem += 1;
                  return (
                    <div className="linha" key={i}>
                      <span className="numero">{numeroItem}.</span>
                      <input
                        value={texto}
                        placeholder="Escreva o item da prescrição"
                        onChange={(e) => mudarLinha(secao.id, i, e.target.value)}
                      />
                      <button title="Remover linha" onClick={() => removerLinha(secao.id, i)}>
                        ✕
                      </button>
                    </div>
                  );
                })}
                <button className="adicionar" onClick={() => adicionarLinha(secao.id)}>
                  + adicionar linha
                </button>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
