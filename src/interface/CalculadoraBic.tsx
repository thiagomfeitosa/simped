import { useState } from 'react';
import { fatorBic } from '../clinica/formulas';
import type { ConfiguracaoHospital } from '../dados/hospitais';
import { lerNumero, mostrarNumero } from './numeros';

/** Calculadora de conferência do fator de correção da BIC (volume final fixo). */
export function CalculadoraBic({ hospital }: { hospital: ConfiguracaoHospital }) {
  const [volume, setVolume] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState('mg');

  const preenchido = volume.trim() !== '' && quantidade.trim() !== '';
  const resultado = preenchido
    ? fatorBic(lerNumero(volume), lerNumero(quantidade), hospital.volumeFinalBicMl)
    : null;

  return (
    <section className="painel">
      <h2>Fator de correção da BIC</h2>
      <p className="nota">
        Regra {hospital.nome}: volume final de <strong>{hospital.volumeFinalBicMl} mL</strong> (medicação + SF).
      </p>
      <label>
        Volume da medicação (mL)
        <input inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="ex.: 0,3" />
      </label>
      <label>
        Quantidade de droga nesse volume
        <span className="com-unidade">
          <input
            inputMode="decimal"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="ex.: 3"
          />
          <select value={unidade} onChange={(e) => setUnidade(e.target.value)}>
            {['mg', 'mcg', 'UI', 'mEq', 'g'].map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </span>
      </label>
      {resultado &&
        (resultado.ok ? (
          <div className="resultado">
            SF a completar: <strong>{mostrarNumero(resultado.valor.volumeSF)} mL</strong>
            <br />
            Concentração final:{' '}
            <strong>
              {mostrarNumero(resultado.valor.concentracaoFinal, 4)} {unidade}/mL
            </strong>
          </div>
        ) : (
          <div className="resultado erro">{resultado.erro}</div>
        ))}
    </section>
  );
}
