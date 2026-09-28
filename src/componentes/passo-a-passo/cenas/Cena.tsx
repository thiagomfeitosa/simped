import { useState } from 'react';
import type { Etapa } from '../../../dados/roteiros/tipos';
import type { Direcao } from '../PassoAPasso';
import { CenaBancada } from './CenaBancada';
import { CenaCartoes, CenaConclusao } from './CenaCartoes';
import { CenaMultiplicacao } from './CenaMultiplicacao';
import { CenaPaciente } from './CenaPaciente';

/**
 * Escolhe a animação da etapa.
 * Etapas seguidas de "bancada" reaproveitam o mesmo desenho, para que os líquidos
 * fluam de um estado para o outro — inclusive ao contrário quando o aluno volta.
 */
export function Cena({ etapa, direcao }: { etapa: Etapa; direcao: Direcao }) {
  // Quantas vezes o aluno pediu "repetir" NESTA etapa (zera sozinho ao trocar de etapa).
  const [pedido, setPedido] = useState({ idEtapa: etapa.id, vezes: 0 });
  const repeticao = pedido.idEtapa === etapa.id ? pedido.vezes : 0;

  const { cena } = etapa;
  const chave = `${cena.tipo === 'bancada' ? 'bancada' : etapa.id}-${repeticao}`;
  const animarDoInicio = direcao === 'avancar' || repeticao > 0;

  return (
    <div className="cena-moldura">
      <div key={chave} className={`cena cena-entrar-${repeticao > 0 ? 'avancar' : direcao}`}>
        {cena.tipo === 'bancada' && <CenaBancada cena={cena} idEtapa={etapa.id} animarDoInicio={animarDoInicio} />}
        {cena.tipo === 'paciente' && <CenaPaciente cena={cena} />}
        {cena.tipo === 'multiplicacao' && <CenaMultiplicacao cena={cena} />}
        {cena.tipo === 'cartoes' && <CenaCartoes cena={cena} />}
        {cena.tipo === 'conclusao' && <CenaConclusao cena={cena} />}
      </div>
      <button type="button" className="botao-repetir" onClick={() => setPedido({ idEtapa: etapa.id, vezes: repeticao + 1 })} title="Ver a animação desta etapa de novo">
        ↻ Repetir animação
      </button>
    </div>
  );
}
