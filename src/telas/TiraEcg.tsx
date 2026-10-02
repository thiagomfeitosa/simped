import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import type { Ritmo } from '../casos/tipos';
import { ecgDoRitmo } from '../monitor/monitor';

/** Papel padrão de ECG: 25 mm/s e 10 mm/mV. */
const MM_POR_S = 25;
const MM_POR_MV = 10;
const DURACAO_S = 6;
/** Calibração (1 mV, 0,2 s) antes do traçado. */
const CALIBRACAO_MM = 10;
const LARGURA_MM = CALIBRACAO_MM + DURACAO_S * MM_POR_S;
const ALTURA_MM = 40;
/** Linha de base (0 mV): 2,5 mV acima e 1,5 mV abaixo cabem no papel. */
const BASE_MM = 25;
const PASSO_MM = 0.2;

export interface DadosTira {
  ritmo: Ritmo;
  fc: number;
  k?: number;
  /** Instante (segundos, no relógio do monitor) em que a tira foi impressa. */
  instanteS: number;
  /** Nome do ritmo (escondido no modo prova). */
  nomeRitmo?: string;
  identificacao?: { nome: string; idade: string; leito: string; quando: string };
}

/** Caminho do traçado em milímetros: pulso de calibração + 6 segundos de ECG terminando no instante da impressão. */
export function caminhoDaTira(d: Pick<DadosTira, 'ritmo' | 'fc' | 'k' | 'instanteS'>): string {
  const y = (mv: number) => (BASE_MM - mv * MM_POR_MV).toFixed(2);
  // calibração: degrau de 1 mV com 5 mm de largura
  let caminho = `M0 ${y(0)} L2 ${y(0)} L2 ${y(1)} L7 ${y(1)} L7 ${y(0)} L${CALIBRACAO_MM} ${y(0)}`;
  const inicio = d.instanteS - DURACAO_S;
  for (let x = 0; x <= DURACAO_S * MM_POR_S + 1e-9; x += PASSO_MM) {
    const t = inicio + x / MM_POR_S;
    caminho += ` L${(CALIBRACAO_MM + x).toFixed(2)} ${y(ecgDoRitmo(t, d.fc, d.ritmo, d.k))}`;
  }
  return caminho;
}

function Grade() {
  const linhas = [];
  for (let x = 0; x <= LARGURA_MM; x += 1) {
    linhas.push(<line key={`v${x}`} x1={x} x2={x} y1={0} y2={ALTURA_MM} className={x % 5 === 0 ? 'grade-grossa' : 'grade-fina'} />);
  }
  for (let yv = 0; yv <= ALTURA_MM; yv += 1) {
    linhas.push(<line key={`h${yv}`} x1={0} x2={LARGURA_MM} y1={yv} y2={yv} className={yv % 5 === 0 ? 'grade-grossa' : 'grade-fina'} />);
  }
  return <g>{linhas}</g>;
}

/**
 * Fase 2 — "imprimir o ritmo": tira de ECG em papel milimetrado (6 s, DII didática),
 * com cabeçalho do paciente. Abre por cima de tudo e imprime só a tira.
 */
export function TiraEcg({ dados, aoFechar }: { dados: DadosTira; aoFechar: () => void }) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoFechar();
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [aoFechar]);

  const imprimir = () => {
    document.body.classList.add('imprimindo-tira');
    const limpar = () => {
      document.body.classList.remove('imprimindo-tira');
      window.removeEventListener('afterprint', limpar);
    };
    window.addEventListener('afterprint', limpar);
    window.print();
    // navegadores sem "afterprint": tira a marca logo depois
    window.setTimeout(limpar, 1000);
  };

  const id = dados.identificacao;
  return createPortal(
    <div className="tira-ecg-fundo" role="dialog" aria-modal="true" aria-label="Tira de ECG">
      <div className="tira-ecg">
        <header className="tira-ecg-cabecalho">
          <strong>SimPed — tira de ECG</strong> <span>(treinamento · traçado didático, não é ECG real)</span>
          {id && (
            <p>
              {id.nome} · {id.idade} · leito {id.leito} · {id.quando}
            </p>
          )}
          <p>
            25 mm/s · 10 mm/mV · derivação DII · {dados.nomeRitmo ? `Ritmo: ${dados.nomeRitmo}` : 'Ritmo: reconheça pelo traçado'}
          </p>
        </header>
        <svg
          className="tira-ecg-papel"
          viewBox={`0 0 ${LARGURA_MM} ${ALTURA_MM}`}
          role="img"
          aria-label="Traçado de 6 segundos em papel milimetrado"
        >
          <rect x={0} y={0} width={LARGURA_MM} height={ALTURA_MM} className="papel-fundo" />
          <Grade />
          <path d={caminhoDaTira(dados)} className="tracado" />
        </svg>
        <p className="tira-ecg-dica">
          Como ler: cada quadrado pequeno = 0,04 s (1 mm); cada quadrado grande = 0,2 s (5 mm). FC ≈ 300 ÷ nº de quadrados grandes
          entre dois R (ou: nº de complexos em 6 s × 10). O degrau no começo é a calibração (1 mV = 10 mm).
        </p>
        <div className="linha-botoes tira-ecg-botoes">
          <button type="button" onClick={imprimir} title="Na janela de impressão, escolha “Salvar como PDF” para gerar o arquivo">
            🖨 Imprimir / PDF
          </button>
          <button type="button" onClick={aoFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
