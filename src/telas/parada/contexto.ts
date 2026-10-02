import { createContext, useContext } from 'react';
import type { Tolerancia } from '../../calculos';
import type { CenarioParada } from '../../dados/parada-a-validar';
import type { EstadoParada } from '../../parada/parada';
import type { EstadoRcp } from '../../parada/rcp';
import type { Membro } from '../../parada/sala';
import type { SalaNaTela } from './useSalaParada';

/** Tudo o que os painéis do código precisam (uma tela = um ou mais papéis da equipe). */
export interface ContextoCodigo {
  s: SalaNaTela;
  cenario: CenarioParada;
  estado: EstadoParada;
  /** Tempo do código agora (s). */
  tS: number;
  membros: Readonly<Record<string, Membro>>;
  /** Papéis desta tela. */
  meusPapeis: readonly string[];
  /** RCP pelas teclas (null = automática). */
  rcp: EstadoRcp | null;
  relacao: number;
  /** Compressor da vez (revezam a cada ciclo). */
  compressorDaVez: 'compressor-1' | 'compressor-2';
  prova: boolean;
  tolerancia: Tolerancia;
  pausado: boolean;
  /** Texto do que a checagem i mostrou (escondido no modo prova). */
  ritmoNaChecagem: (i: number) => string | undefined;
  abrirFolha: () => void;
}

export const Contexto = createContext<ContextoCodigo | null>(null);

export function useCodigo(): ContextoCodigo {
  const c = useContext(Contexto);
  if (!c) throw new Error('useCodigo fora do código de parada');
  return c;
}
