import type { Dispatch } from 'react';
import type { PacienteAtual } from '../paciente/atual';
import { formatarDataHora, lerDataHora } from '../paciente/variaveis';
import type { Medicacao } from '../dados/medicacoes/tipos';
import { type AcaoPrescricao, type EstadoPrescricao, numerarItens, SECOES } from '../prescricao/estado';
import { ItemMedicacaoFolha } from './ItemMedicacaoFolha';

interface Props {
  paciente: PacienteAtual;
  estado: EstadoPrescricao;
  despachar: Dispatch<AcaoPrescricao>;
  medicacoes: readonly Medicacao[];
  aoAdministrar: (medicacaoId: string, descricao: string) => void;
}

export function FolhaPrescricao({ paciente, estado, despachar, medicacoes, aoAdministrar }: Props) {
  const numeros = numerarItens(estado);

  return (
    <section className="painel prancheta" aria-label="Folha de prescrição">
      <div className="folha-papel">
        <h2 className="folha-titulo">Prescrição médica</h2>

        <div className="secao">
          <h3>1. Identificação do paciente</h3>
          <p className="identificacao">
            {paciente.nome} · {paciente.sexo} · DN {formatarDataHora(lerDataHora(paciente.nascimento)).slice(0, 10)} ·{' '}
            {paciente.idadeTexto} · Peso: {paciente.pesoKg.toLocaleString('pt-BR')} kg · SC{' '}
            {paciente.variaveis.superficieCorporal.m2.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m² · Leito{' '}
            {paciente.leito}
            <br />
            Alergias: {paciente.alergias && paciente.alergias.length > 0 ? paciente.alergias.join(', ') : 'nenhuma conhecida'}
          </p>
        </div>

        {SECOES.map((secao) => (
          <div className="secao" key={secao.id}>
            <h3>
              {secao.numero}. {secao.titulo}
              {secao.seAplicavel && <span className="se-aplicavel"> (se aplicável)</span>}
            </h3>
            <ol className="itens">
              {estado.itens[secao.id].map((item) =>
                item.tipo === 'medicacao' ? (
                  <ItemMedicacaoFolha
                    key={item.id}
                    numero={numeros.get(item.id)}
                    secao={secao}
                    campos={item.campos}
                    medicacoes={medicacoes}
                    paciente={paciente}
                    aoMudar={(campos) => despachar({ tipo: 'editarMedicacao', secao: secao.id, id: item.id, campos })}
                    aoRemover={() => despachar({ tipo: 'remover', secao: secao.id, id: item.id })}
                    aoAdministrar={aoAdministrar}
                  />
                ) : (
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
                ),
              )}
            </ol>
            <button
              type="button"
              className="adicionar"
              onClick={() => despachar({ tipo: 'adicionar', secao: secao.id })}
            >
              + item em texto
            </button>
            {secao.aceitaMedicacao && (
              <button
                type="button"
                className="adicionar"
                onClick={() => despachar({ tipo: 'adicionarMedicacao', secao: secao.id })}
              >
                + medicação
              </button>
            )}
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
