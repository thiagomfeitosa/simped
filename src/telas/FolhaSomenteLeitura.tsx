import type { Medicacao } from '../dados/medicacoes/tipos';
import type { EstadoPrescricao } from '../prescricao/estado';
import { folhaEmTexto } from '../prescricao/folhaEmTexto';

/** A folha do aluno só para ler (rever o caso, painel do professor). */
export function FolhaSomenteLeitura({
  estado,
  medicacoes,
  volumeFinalBicMl,
}: {
  estado: EstadoPrescricao;
  medicacoes: readonly Medicacao[];
  volumeFinalBicMl?: number;
}) {
  const secoes = folhaEmTexto(estado, medicacoes, volumeFinalBicMl);
  const vazia = secoes.every((s) => s.itens.length === 0);
  return (
    <div className="folha-leitura" aria-label="Folha do aluno">
      {vazia && <p className="nota">Folha ainda em branco.</p>}
      {secoes
        .filter((s) => s.itens.length > 0)
        .map((s) => (
          <div key={s.numero} className="folha-leitura-secao">
            <h4>
              {s.numero}. {s.titulo}
            </h4>
            <ol>
              {s.itens.map((i) => (
                <li key={i.numero} value={i.numero}>
                  {i.texto || <em className="nota">(em branco)</em>}
                </li>
              ))}
            </ol>
          </div>
        ))}
    </div>
  );
}
