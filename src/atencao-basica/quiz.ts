/**
 * "O que é isto?" (sem tela): sorteia um achado de exame e 3 alternativas do mesmo sistema.
 * Também classifica a PA do adolescente (≥ 13 anos, AAP 2017 — A VALIDAR).
 */

import { ACHADOS_ATENCAO_BASICA, type AchadoExame, type SistemaExame } from '../dados/atencao-basica/exame-fisico-a-validar';

export interface PerguntaQuiz {
  achado: AchadoExame;
  alternativas: string[];
}

function embaralhar<T>(lista: readonly T[], sorteio: () => number): T[] {
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(sorteio() * (i + 1));
    [r[i], r[j]] = [r[j]!, r[i]!];
  }
  return r;
}

export function gerarPergunta(sorteio: () => number, sistema?: SistemaExame): PerguntaQuiz {
  const candidatos = ACHADOS_ATENCAO_BASICA.filter((a) => a.desenho && (!sistema || a.sistema === sistema));
  const achado = candidatos[Math.floor(sorteio() * candidatos.length)] ?? candidatos[0]!;
  const mesmos = ACHADOS_ATENCAO_BASICA.filter((a) => a.sistema === achado.sistema && a.id !== achado.id);
  const outros = ACHADOS_ATENCAO_BASICA.filter((a) => a.sistema !== achado.sistema);
  const erradas = [...embaralhar(mesmos, sorteio), ...embaralhar(outros, sorteio)].slice(0, 3).map((a) => a.nome);
  return { achado, alternativas: embaralhar([achado.nome, ...erradas], sorteio) };
}

export function classificarPaAdolescente(sistolica: number, diastolica: number): string {
  if (sistolica >= 140 || diastolica >= 90) return 'Hipertensão estágio 2';
  if (sistolica >= 130 || diastolica >= 80) return 'Hipertensão estágio 1';
  if (sistolica >= 120) return 'PA elevada';
  return 'Normal';
}
