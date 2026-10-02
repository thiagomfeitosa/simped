import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { arredondar } from '../calculos';
import { CHOQUE, DROGAS_PARADA, EXPANSAO_PARADA, TUBO } from '../dados/parada-a-validar';
import { doseDaDroga, energiaDoChoque, tuboEndotraqueal, volumeDoBolus } from '../parada/parada';
import { formatarNumero } from '../prescricao/comum';

const n = formatarNumero;

/**
 * Folha de emergência por peso ("tabela de bolso"): doses e volumes do carrinho de parada,
 * energia do choque, bolus e tubo, já calculados para o peso. Tudo A VALIDAR.
 * Abre por cima de tudo e imprime só a folha.
 */
export function FolhaEmergencia({ pesoKg, idadeAnos, titulo, aoFechar }: { pesoKg: number; idadeAnos?: number; titulo?: string; aoFechar: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aoFechar]);

  const imprimir = () => {
    document.body.classList.add('imprimindo-folha-emergencia');
    const limpar = () => {
      document.body.classList.remove('imprimindo-folha-emergencia');
      window.removeEventListener('afterprint', limpar);
    };
    window.addEventListener('afterprint', limpar);
    window.print();
    window.setTimeout(limpar, 1000);
  };

  const tubo = idadeAnos !== undefined ? tuboEndotraqueal(idadeAnos) : null;
  return createPortal(
    <div className="folha-emergencia-fundo" role="dialog" aria-modal="true" aria-label="Folha de emergência">
      <div className="folha-emergencia">
        <header>
          <h2>Folha de emergência — {n(pesoKg)} kg</h2>
          <p>
            {titulo ? `${titulo} · ` : ''}Contas feitas pelo SimPed para este peso. <strong>Doses e energias A VALIDAR</strong> — treinamento, não
            substitui protocolos institucionais.
          </p>
        </header>
        <div className="tabela-rola">
          <table className="tabela-emergencia">
            <thead>
              <tr>
                <th>Item</th>
                <th>Dose/kg</th>
                <th>Para {n(pesoKg)} kg</th>
                <th>Apresentação e preparo</th>
                <th>Aspirar</th>
              </tr>
            </thead>
            <tbody>
              {DROGAS_PARADA.map((d) => {
                const c = doseDaDroga(d, pesoKg);
                return (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.nome}</strong>
                      <small>{d.quando}</small>
                    </td>
                    <td>
                      {n(d.dosePorKg)} {d.unidade}/kg
                      {d.doseMaxima !== undefined && <small>máx. {n(d.doseMaxima)} {d.unidade}</small>}
                    </td>
                    <td>
                      {n(arredondar(c.dose, 3))} {d.unidade}
                      {c.limitada && <small>(dose máxima)</small>}
                    </td>
                    <td>
                      {d.apresentacao}
                      {d.preparo && <small>{d.preparo}</small>}
                      <small>
                        {d.via}
                        {d.repetir ? ` · ${d.repetir}` : ''}
                      </small>
                    </td>
                    <td className="valor">{n(arredondar(c.volumeMl, 2))} mL</td>
                  </tr>
                );
              })}
              <tr>
                <td>
                  <strong>{EXPANSAO_PARADA.nome}</strong>
                  <small>{EXPANSAO_PARADA.quando}</small>
                </td>
                <td>{EXPANSAO_PARADA.mlPorKg} mL/kg</td>
                <td>{n(volumeDoBolus(pesoKg))} mL</td>
                <td>
                  <small>Reavaliar depois de cada bolus</small>
                </td>
                <td className="valor">{n(volumeDoBolus(pesoKg))} mL</td>
              </tr>
              <tr>
                <td>
                  <strong>Desfibrilação</strong>
                  <small>FV / TV sem pulso</small>
                </td>
                <td>
                  {CHOQUE.primeiroJKg} J/kg → {CHOQUE.seguintesJKg} J/kg
                </td>
                <td>
                  1º: {energiaDoChoque(1, pesoKg)} J · depois: {energiaDoChoque(2, pesoKg)} J
                </td>
                <td>
                  <small>Máx. {CHOQUE.maximoJKg} J/kg ou dose de adulto</small>
                </td>
                <td />
              </tr>
              {tubo && (
                <tr>
                  <td>
                    <strong>Tubo endotraqueal</strong>
                    <small>pela idade</small>
                  </td>
                  <td colSpan={2}>
                    com cuff nº {n(tubo.comCuff)} · sem cuff nº {n(tubo.semCuff)}
                  </td>
                  <td>
                    <small>
                      Fixar a ~{n(tubo.profundidadeCm)} cm (3 × nº do tubo). {idadeAnos !== undefined && idadeAnos < 1 ? 'Menor de 1 ano: tamanho usual, sem fórmula.' : `Fórmula: idade/4 + ${n(TUBO.comCuffSoma)} (com cuff).`}
                    </small>
                  </td>
                  <td />
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="nota">Fontes previstas: PALS (rascunho) e PALS 2020 para choque e tubo — conferir em docs/a-validar-dados-novos.md.</p>
        <div className="linha-botoes folha-emergencia-botoes">
          <button type="button" className="botao botao-principal" onClick={imprimir}>
            🖨 Imprimir / PDF
          </button>
          <button type="button" className="botao" onClick={aoFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
