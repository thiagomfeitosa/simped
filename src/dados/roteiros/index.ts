import { roteiroAdrenalinaPcr } from './adrenalina-pcr';
import { roteiroDesidratacaoPlanoC } from './desidratacao-plano-c';
import { roteiroHipocalemia } from './hipocalemia';
import { roteiroHiponatremia } from './hiponatremia';
import { roteiroIctericiaNeonatal } from './ictericia-neonatal';
import { comPrescricaoFinal } from './prescricao-final';
import { roteiroSepseNeonatal } from './sepse-neonatal';
import type { Roteiro, TemaRoteiro } from './tipos';

/** Temas, na ordem do menu. */
export const TEMAS: TemaRoteiro[] = ['Neonatologia', 'Distúrbios hidroeletrolíticos', 'Emergência'];

/**
 * Todos os roteiros "passo a passo", na ordem do menu.
 * Cada um ganha, no fim, a etapa "prescrição com os cálculos" (prescricao-final.ts).
 */
export const ROTEIROS: Roteiro[] = [
  roteiroSepseNeonatal,
  roteiroIctericiaNeonatal,
  roteiroDesidratacaoPlanoC,
  roteiroHiponatremia,
  roteiroHipocalemia,
  roteiroAdrenalinaPcr,
].map(comPrescricaoFinal);
