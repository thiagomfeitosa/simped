import { useState } from 'react';
import { DISPOSITIVOS_O2, type DispositivoO2 } from '../dados/oxigenio-a-validar';
import { dispositivo, type EstadoOxigenio, fio2DoDispositivo } from '../motor/oxigenacao';
import { lerNumero } from '../prescricao/comum';

const pct = (fio2: number) => `${Math.round(fio2 * 100)}%`;

/** Texto do O₂ em uso (ex.: "Cateter nasal 2 L/min (FiO₂ ≈ 29%)"). */
export function descreverOxigenio(o: EstadoOxigenio): string {
  const d = dispositivo(o.dispositivo);
  if (o.dispositivo === 'ar') return d.nome;
  return `${d.nome}${o.fluxoLMin !== undefined ? ` ${o.fluxoLMin.toLocaleString('pt-BR')} L/min` : ''} (FiO₂ ≈ ${pct(o.fio2)})`;
}

interface Props {
  atual: EstadoOxigenio;
  /** O₂ instalado sem efeito (apneia/gasping sem ventilar). */
  semEfeito: boolean;
  aoInstalar: (oxigenio: EstadoOxigenio, descricao: string) => void;
}

/**
 * Oxigenoterapia à beira do leito: escolher o dispositivo e o fluxo (ou a FiO₂) e instalar.
 * A SpO₂ do monitor passa a seguir o O₂ (modelo didático, A VALIDAR).
 */
export function ControleOxigenio({ atual, semEfeito, aoInstalar }: Props) {
  const [id, setId] = useState<DispositivoO2>(atual.dispositivo === 'ar' ? 'cateter' : atual.dispositivo);
  const [fluxo, setFluxo] = useState('');
  const [fio2Texto, setFio2Texto] = useState('');
  const d = dispositivo(id);
  const fluxoLido = lerNumero(fluxo) ?? d.fluxo?.padrao;
  const fio2Lida = lerNumero(fio2Texto);
  const fio2 = fio2DoDispositivo(id, fluxoLido, fio2Lida !== null ? fio2Lida / 100 : undefined);

  const instalar = (escolhido: DispositivoO2) => {
    const disp = dispositivo(escolhido);
    const novo: EstadoOxigenio =
      escolhido === 'ar'
        ? { dispositivo: 'ar', fio2: 0.21 }
        : {
            dispositivo: escolhido,
            fio2: escolhido === id ? fio2 : fio2DoDispositivo(escolhido),
            ...(disp.ajuste === 'fluxo' && { fluxoLMin: Math.min(disp.fluxo!.max, Math.max(disp.fluxo!.min, escolhido === id ? (fluxoLido ?? disp.fluxo!.padrao) : disp.fluxo!.padrao)) }),
          };
    aoInstalar(novo, descreverOxigenio(novo));
  };

  return (
    <div className="controle-oxigenio" aria-label="Oxigênio">
      <h3>🫁 Oxigênio</h3>
      <p>
        Agora: <strong>{descreverOxigenio(atual)}</strong>
      </p>
      {semEfeito && (
        <p className="alerta-oxigenio" role="alert">
          ⚠ Em apneia ou gasping o O₂ sozinho não adianta: ventile (bolsa-válvula-máscara ou ventilador).
        </p>
      )}
      <div className="linha-botoes">
        <select aria-label="Dispositivo de O₂" value={id} onChange={(e) => setId(e.target.value as DispositivoO2)}>
          {DISPOSITIVOS_O2.filter((x) => x.id !== 'ar').map((x) => (
            <option key={x.id} value={x.id}>
              {x.nome}
            </option>
          ))}
        </select>
        {d.ajuste === 'fluxo' && (
          <label>
            <input aria-label="Fluxo de O₂ (L/min)" inputMode="decimal" size={3} placeholder={String(d.fluxo?.padrao ?? '')} value={fluxo} onChange={(e) => setFluxo(e.target.value)} /> L/min
          </label>
        )}
        {d.ajuste === 'fio2' && (
          <label>
            FiO₂{' '}
            <input aria-label="FiO₂ (%)" inputMode="decimal" size={3} placeholder={String(Math.round((d.fio2Padrao ?? 0.21) * 100))} value={fio2Texto} onChange={(e) => setFio2Texto(e.target.value)} /> %
          </label>
        )}
        <button type="button" onClick={() => instalar(id)}>
          Instalar
        </button>
        {atual.dispositivo !== 'ar' && (
          <button type="button" onClick={() => instalar('ar')}>
            Retirar O₂
          </button>
        )}
      </div>
      <p className="nota">
        FiO₂ ≈ {pct(fio2)} {d.fluxo ? `(fluxo de ${d.fluxo.min} a ${d.fluxo.max} L/min)` : ''}. Valores e modelo: A VALIDAR. A SpO₂ do caso é em ar ambiente; com O₂, o
        monitor mostra a SpO₂ calculada. Prescreva também na seção 2 da folha.
      </p>
    </div>
  );
}
