import type { Dispatch } from 'react';
import type { Paciente } from '../casos/tipos';
import { type AcaoPrescricao, type EstadoPrescricao, numerarItens, SECOES } from '../prescricao/estado';

interface Props {
  paciente: Paciente;
  estado: EstadoPrescricao;
  despachar: Dispatch<AcaoPrescricao>;
}

export function FolhaPrescricao({ paciente, estado, despachar }: Props) {
  const numeros = numerarItens(estado);

  return (
    <section className="painel prancheta" aria-label="Folha de prescrição">
      <div className="folha">
        <h2 className="folha-titulo">Prescrição médica</h2>

        <div className="secao">
          <h3>1. Identificação do paciente</h3>
          <p className="identificacao">
            {paciente.nome} · {paciente.idadeTexto} · {paciente.sexo} · Peso: {paciente.pesoKg.toLocaleString('pt-BR')} kg ·
            Leito {paciente.leito}
          </p>
        </div>

        {SECOES.map((secao) => (
          <div className="secao" key={secao.id}>
            <h3>
              {secao.numero}. {secao.titulo}
              {secao.seAplicavel && <span className="se-aplicavel"> (se aplicável)</span>}
            </h3>
            <ol className="itens">
              {estado.itens[secao.id].map((item) => (
                <li key={item.id}>
                  <span className="numero-item">{numeros.get(item.id)}.</span>
                  <input
                    aria-label={`Item ${numeros.get(item.id)} — ${secao.titulo}`}
                    value={item.texto}
                    placeholder="Escreva o item da prescrição"
                    onChange={(e) =>
                      despachar({ tipo: 'editar', secao: secao.id, id: item.id, texto: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="remover"
                    aria-label="Remover item"
                    onClick={() => despachar({ tipo: 'remover', secao: secao.id, id: item.id })}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="adicionar"
              onClick={() => despachar({ tipo: 'adicionar', secao: secao.id })}
            >
              + adicionar item
            </button>
          </div>
        ))}

        <div className="rodape-folha">
          <button type="button" onClick={() => despachar({ tipo: 'limpar' })}>
            Limpar folha
          </button>
        </div>
      </div>
    </section>
  );
}
