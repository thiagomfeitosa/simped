import { roteiroAdrenalinaPcr } from './adrenalina-pcr';
import { roteiroDesidratacaoPlanoC } from './desidratacao-plano-c';
import { roteiroHipercalemia } from './hipercalemia';
import { roteiroHipernatremia } from './hipernatremia';
import { roteiroHipocalcemiaRn } from './hipocalcemia-rn';
import { roteiroHipocalemia } from './hipocalemia';
import { roteiroHiponatremia } from './hiponatremia';
import { roteiroIctericiaNeonatal } from './ictericia-neonatal';
import { roteiroInfusaoContinuaAdrenalina } from './infusao-continua-adrenalina';
import { comPrescricaoFinal } from './prescricao-final';
import { roteiroRediluicaoPenicilina } from './rediluicao-penicilina';
import { roteiroSepseNeonatal } from './sepse-neonatal';
import type { Roteiro, TemaRoteiro } from './tipos';

/** Temas, na ordem do menu. */
export const TEMAS: TemaRoteiro[] = ['Neonatologia', 'Preparo: diluição, BIC e infusão', 'Distúrbios hidroeletrolíticos', 'Emergência'];

/**
 * Todos os roteiros "passo a passo", na ordem do menu.
 * Cada um ganha, no fim, a etapa "prescrição com os cálculos" (prescricao-final.ts).
 */
export const ROTEIROS: Roteiro[] = [
  roteiroSepseNeonatal,
  roteiroIctericiaNeonatal,
  roteiroHipocalcemiaRn,
  roteiroRediluicaoPenicilina,
  roteiroInfusaoContinuaAdrenalina,
  roteiroAdrenalinaPcr,
  roteiroDesidratacaoPlanoC,
  roteiroHiponatremia,
  roteiroHipernatremia,
  roteiroHipocalemia,
  roteiroHipercalemia,
].map(comPrescricaoFinal);
