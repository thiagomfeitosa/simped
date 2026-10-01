import type { Dispatch } from 'react';
import type { PacienteAtual } from '../paciente/atual';
import { formatarDataHora, lerDataHora } from '../paciente/variaveis';
import type { Medicacao } from '../dados/medicacoes/tipos';
import { alertasDaFolha } from '../prescricao/alertas';
import { type AcaoPrescricao, type EstadoPrescricao, numerarItens, SECOES } from '../prescricao/estado';
import type { CamposMedicacao } from '../prescricao/itemMedicacao';
import { ItemMedicacaoFolha } from './ItemMedicacaoFolha';
import { ItemSoroFolha } from './ItemSoroFolha';

interface Props {
  paciente: PacienteAtual;
  estado: EstadoPrescricao;
  despachar: Dispatch<AcaoPrescricao>;
  medicacoes: readonly Medicacao[];
  /** vazaoMlH: só para soro e infusão contínua (entra no balanço hídrico); campos: para a reação depender da dose (B9). */
  aoAdministrar: (medicacaoId: string, descricao: string, vazaoMlH?: number, campos?: CamposMedicacao) => void;
  /** O aluno abriu a conferência de um item (entra no registro da sessão). */
  aoConferir?: (itemId: number, descricao: string) => void;
}

export function FolhaPrescricao({ paciente, estado, despachar, medicacoes, aoAdministrar, aoConferir }: Props) {
  const numeros = numerarItens(estado);
  const alertas = alertasDaFolha(estado, medicacoes, paciente);

  return (
    <section className="painel prancheta" aria-label="Folha de prescrição">
      <div className="folha-papel">
        <p className="so-impressao aviso-impressao">
          SimPed — documento de TREINAMENTO. Não é uma prescrição real. Doses, apresentações e horários marcados A VALIDAR
          ainda não foram conferidos.
        </p>
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

        {alertas.length > 0 && (
          <div className="alertas-folha" role="alert" aria-label="Alertas de segurança">
            <strong>⚠ Alertas de segurança</strong>
            <ul>
              {alertas.map((a, i) => (
                <li key={i} className={`alerta-${a.gravidade}`}>
                  <span className="alerta-itens">
                    item {a.itemIds.map((id) => numeros.get(id)).filter(Boolean).join(', ')}
                  </span>{' '}
                  {a.texto}
                  {a.status === 'A_VALIDAR' && <span className="alerta-validar"> A VALIDAR</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

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
                    aoConferir={(descricao) => aoConferir?.(numeros.get(item.id) ?? item.id, descricao)}
                  />
                ) : item.tipo === 'soro' ? (
                  <ItemSoroFolha
                    key={item.id}
                    numero={numeros.get(item.id)}
                    campos={item.campos}
                    pesoKg={paciente.pesoKg}
                    aoMudar={(campos) => despachar({ tipo: 'editarSoro', secao: secao.id, id: item.id, campos })}
                    aoRemover={() => despachar({ tipo: 'remover', secao: secao.id, id: item.id })}
                    aoAdministrar={(descricao, vazaoMlH) => aoAdministrar('soro', descricao, vazaoMlH)}
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
            {secao.id === 'volemia' && (
              <button
                type="button"
                className="adicionar"
                onClick={() => despachar({ tipo: 'adicionarSoro', secao: secao.id })}
              >
                + soro
              </button>
            )}
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
