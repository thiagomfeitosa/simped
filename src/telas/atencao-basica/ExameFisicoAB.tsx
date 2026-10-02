import { useState } from 'react';
import { gerarPergunta, type PerguntaQuiz } from '../../atencao-basica/quiz';
import { ACHADOS_ATENCAO_BASICA, NOME_SISTEMA, type SistemaExame } from '../../dados/atencao-basica/exame-fisico-a-validar';
import { criarSorteio } from '../../estudo/treino';
import type { TomDePele } from '../../neonatal/exame';
import { DesenhoAchadoAB } from './DesenhoAchadoAB';

const sorteio = criarSorteio(Date.now() % 1_000_000);
const SISTEMAS = Object.keys(NOME_SISTEMA) as SistemaExame[];

/** Exame físico de doenças comuns: atlas ilustrado por sistema e o quiz "o que é isto?". */
export function ExameFisicoAB({ tom }: { tom: TomDePele }) {
  const [modo, setModo] = useState<'atlas' | 'quiz'>('atlas');
  const [sistema, setSistema] = useState<SistemaExame>('ouvido');
  const [pergunta, setPergunta] = useState<PerguntaQuiz>(() => gerarPergunta(sorteio));
  const [resposta, setResposta] = useState<string | null>(null);
  const [placar, setPlacar] = useState({ certas: 0, total: 0 });

  const responder = (alt: string) => {
    if (resposta) return;
    setResposta(alt);
    setPlacar((p) => ({ certas: p.certas + (alt === pergunta.achado.nome ? 1 : 0), total: p.total + 1 }));
  };

  return (
    <div className="exame-ab">
      <div className="painel barra-opcoes">
        <div className="subabas" role="group" aria-label="Modo do exame físico">
          <button type="button" aria-pressed={modo === 'atlas'} onClick={() => setModo('atlas')}>
            📖 Atlas
          </button>
          <button type="button" aria-pressed={modo === 'quiz'} onClick={() => setModo('quiz')}>
            ❓ O que é isto?
          </button>
        </div>
        {modo === 'atlas' && (
          <div className="subabas" role="group" aria-label="Sistema">
            {SISTEMAS.map((s) => (
              <button key={s} type="button" aria-pressed={sistema === s} onClick={() => setSistema(s)}>
                {NOME_SISTEMA[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {modo === 'atlas' ? (
        <div className="atlas-grade">
          {ACHADOS_ATENCAO_BASICA.filter((a) => a.sistema === sistema).map((a) => (
            <article key={a.id} className="painel cartao-atlas" aria-label={a.nome}>
              <div className="atlas-desenho">
                <DesenhoAchadoAB achado={a} tom={tom} />
              </div>
              <h3>{a.nome}</h3>
              <p>
                <strong>O que se vê:</strong> {a.oQueSeVe}
              </p>
              <details>
                <summary>Significado e conduta</summary>
                <p>{a.significado}</p>
                <p>
                  <strong>Conduta:</strong> {a.conduta}
                </p>
                <p className="nota">A VALIDAR.</p>
              </details>
            </article>
          ))}
        </div>
      ) : (
        <section className="painel quiz-ab" aria-label="O que é isto?">
          <p className="nota">
            Placar: {placar.certas} de {placar.total}
          </p>
          <div className="quiz-desenho">
            <DesenhoAchadoAB achado={pergunta.achado} tom={tom} />
          </div>
          <p>
            <strong>{NOME_SISTEMA[pergunta.achado.sistema]}:</strong> {pergunta.achado.oQueSeVe}
          </p>
          <div className="classificar" role="group" aria-label="Alternativas">
            {pergunta.alternativas.map((alt) => (
              <button
                key={alt}
                type="button"
                className={resposta ? (alt === pergunta.achado.nome ? 'alternativa-certa' : alt === resposta ? 'alternativa-errada' : '') : ''}
                aria-pressed={resposta === alt}
                onClick={() => responder(alt)}
              >
                {alt}
              </button>
            ))}
          </div>
          {resposta && (
            <div className={resposta === pergunta.achado.nome ? 'retorno-ok' : 'retorno-erro'} role="status">
              <p>
                {resposta === pergunta.achado.nome ? '✔ Certo!' : `✘ É ${pergunta.achado.nome}.`} {pergunta.achado.significado}
              </p>
              <p>
                <strong>Conduta:</strong> {pergunta.achado.conduta}
              </p>
              <button
                type="button"
                onClick={() => {
                  setPergunta(gerarPergunta(sorteio));
                  setResposta(null);
                }}
              >
                Próxima →
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
