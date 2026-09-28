import { roteiroAdrenalinaPcr } from './adrenalina-pcr';
import { roteiroSepseNeonatal } from './sepse-neonatal';
import type { Roteiro } from './tipos';

/** Todos os roteiros "passo a passo" disponíveis, na ordem do menu. */
export const ROTEIROS: Roteiro[] = [roteiroSepseNeonatal, roteiroAdrenalinaPcr];
