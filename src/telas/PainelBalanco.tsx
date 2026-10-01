import { useState } from 'react';
import { conferirValor } from '../calculos';
import { toleranciaDe } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { calcularBalanco, type Infusao, type RegistroManual } from '../motor/balanco';
import { formatarNumero, lerNumero } from '../prescricao/comum';
import { formatarTempo } from './ControlesCaso';

const PERIODOS = [
  { horas: 0, rotulo: 'desde o início' },
  { horas: 6, rotulo: 'últimas 6 h' },
  { horas: 12, rotulo: 'últimas 12 h' },
  { horas: 24, rotulo: 'últimas 24 h' },
] as const;

interface Props {
  agoraMin: number;
  pesoKg: number;
  diureseMlKgH: number;
  infusoes: readonly Infusao[];
  registros: readonly RegistroManual[];
  aoRegistrar: (registro: Omit<RegistroManual, 'id' | 'minuto'>) => void;
}

/** Balanço hídrico: o aluno soma entradas e saídas e calcula a diurese; o programa confere. */
export function PainelBalanco({ agoraMin, pesoKg, diureseMlKgH, infusoes, registros, aoRegistrar }: Props) {
  const { config } = useConfiguracoes();
  const [periodoH, setPeriodoH] = useState(0);
  const [tipo, setTipo] = useState<'entrada' | 'saida'>('entrada');
  const [descricao, setDescricao] = useState('');
  const [volume, setVolume] = useState('');
  const [respostaBalanco, setRespostaBalanco] = useState('');
  const [respostaDiurese, setRespostaDiurese] = useState('');
  const [conferir, setConferir] = useState(false);

  const deMin = periodoH === 0 ? 0 : Math.max(0, agoraMin - periodoH * 60);
  const b = calcularBalanco({ infusoes, registros, diureseMlKgH, pesoKg, deMin, ateMin: agoraMin });
  const tol = toleranciaDe(config);

  const veredito = (texto: string, esperado: number, unidade: string, conta: string) => {
    const valor = lerNumero(texto);
    if (valor === null) return <li className="sit-atencao">Escreva o valor ({unidade}).</li>;
    // margem mínima de 1 mL para o balanço (arredondamento)
    const ok = conferirValor(valor, esperado, { ...tol, absoluta: unidade === 'mL' ? 1 : 0.01 }).correto;
    return (
      <li className={ok ? 'sit-certo' : 'sit-errado'}>
        {ok ? '✔' : '✘'} {config.modo === 'prova' ? (ok ? 'Certo.' : 'Não confere.') : `${conta} (você: ${formatarNumero(valor)} ${unidade})`}
      </li>
    );
  };

  const linha = (l: { descricao: string; volumeMl: number }, i: number) => (
    <tr key={i}>
      <td>{l.descricao}</td>
      <td className="valor">{formatarNumero(l.volumeMl)} mL</td>
    </tr>
  );

  return (
    <section className="painel painel-balanco" aria-label="Balanço hídrico">
      <h2>Balanço hídrico</h2>
      <label className="campo-linha">
        Período:
        <select value={periodoH} onChange={(e) => setPeriodoH(Number(e.target.value))}>
          {PERIODOS.map((p) => (
            <option key={p.horas} value={p.horas}>
              {p.rotulo}
            </option>
          ))}
        </select>
        <small>
          {formatarTempo(deMin)}–{formatarTempo(agoraMin)} ({formatarNumero(b.horas)} h)
        </small>
      </label>

      <table className="tabela-resultado">
        <tbody>
          <tr>
            <th colSpan={2}>Entradas</th>
          </tr>
          {b.entradas.length > 0 ? b.entradas.map(linha) : <tr><td colSpan={2} className="nota">nenhuma</td></tr>}
          <tr>
            <th colSpan={2}>Saídas</th>
          </tr>
          {b.saidas.length > 0 ? b.saidas.map(linha) : <tr><td colSpan={2} className="nota">nenhuma</td></tr>}
        </tbody>
      </table>

      <div className="linha-botoes registrar-balanco">
        <select aria-label="Tipo de registro" value={tipo} onChange={(e) => setTipo(e.target.value as 'entrada' | 'saida')}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
        <input aria-label="Descrição do registro" placeholder={tipo === 'entrada' ? 'ex.: leite VO' : 'ex.: vômito'} size={10} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        <input aria-label="Volume do registro (mL)" inputMode="decimal" size={4} value={volume} onChange={(e) => setVolume(e.target.value)} />
        mL
        <button
          type="button"
          onClick={() => {
            const v = lerNumero(volume);
            if (v === null || v <= 0) return;
            aoRegistrar({ tipo, descricao: descricao.trim() || (tipo === 'entrada' ? 'Entrada' : 'Saída'), volumeMl: v });
            setDescricao('');
            setVolume('');
          }}
        >
          Registrar
        </button>
      </div>

      <div className="linha-botoes">
        <label>
          Balanço
          <input aria-label="Balanço (mL)" inputMode="decimal" size={5} value={respostaBalanco} onChange={(e) => setRespostaBalanco(e.target.value)} /> mL
        </label>
        <label>
          Diurese
          <input aria-label="Diurese (mL/kg/h)" inputMode="decimal" size={4} value={respostaDiurese} onChange={(e) => setRespostaDiurese(e.target.value)} /> mL/kg/h
        </label>
        <button type="button" onClick={() => setConferir((v) => !v)}>
          {conferir ? 'Esconder' : 'Conferir'}
        </button>
      </div>
      {conferir && (
        <ul className="conferencia">
          {veredito(
            respostaBalanco,
            b.balancoMl,
            'mL',
            `Entradas ${formatarNumero(b.totalEntradasMl)} − saídas ${formatarNumero(b.totalSaidasMl)} = ${formatarNumero(b.balancoMl)} mL`,
          )}
          {b.horas > 0 &&
            veredito(
              respostaDiurese,
              b.diureseMlKgH,
              'mL/kg/h',
              `${formatarNumero(b.diureseMl)} mL ÷ ${formatarNumero(pesoKg)} kg ÷ ${formatarNumero(b.horas)} h = ${formatarNumero(b.diureseMlKgH)} mL/kg/h`,
            )}
        </ul>
      )}
      <p className="nota">Soros e infusões contam pela vazão desde que foram instalados. Diurese do caso: A VALIDAR.</p>
    </section>
  );
}
