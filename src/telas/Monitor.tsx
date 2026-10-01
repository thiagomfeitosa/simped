import { useEffect, useRef, useState } from 'react';
import type { Ritmo, SinaisVitais } from '../casos/tipos';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { LIMITES_ALARME } from '../dados/limites-alarme';
import { alarmesAtivos, ecgDoRitmo, limitesParaIdade, nomeDoRitmo, pletismografiaDoRitmo, semMedida } from '../monitor/monitor';

function formatar(valor: number, casas = 0): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Segundos de traçado visíveis na tela. */
const JANELA_S = 4;

interface Traco {
  cor: string;
  valor: (t: number) => number;
  /** Faixa de valores que ocupa a altura do traço. */
  min: number;
  max: number;
}

/** Desenha os traçados com "varredura": a linha é reescrita da esquerda para a direita, com um vão no ponto atual. */
function useTracado(canvas: React.RefObject<HTMLCanvasElement | null>, tracos: () => Traco[]) {
  const tracosRef = useRef(tracos);
  tracosRef.current = tracos;
  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    let quadro = 0;
    const desenhar = (agoraMs: number) => {
      // aba escondida (todas as abas ficam abertas): não desenha, só espera o próximo quadro
      if (el.offsetParent === null) {
        quadro = requestAnimationFrame(desenhar);
        return;
      }
      const largura = (el.width = el.clientWidth || 270);
      const altura = el.height;
      const lista = tracosRef.current();
      const alturaTraco = altura / lista.length;
      const agora = agoraMs / 1000;
      const xAgora = ((agora % JANELA_S) / JANELA_S) * largura;
      ctx.fillStyle = '#0e1418';
      ctx.fillRect(0, 0, largura, altura);
      lista.forEach((traco, k) => {
        ctx.strokeStyle = traco.cor;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        let desenhando = false;
        for (let x = 0; x < largura; x++) {
          const atras = (xAgora - x + largura) % largura; // pixels "atrás" do ponto atual
          if (atras < 0.5 || atras > largura - 10) {
            desenhando = false; // vão logo à frente do ponto atual
            continue;
          }
          const t = agora - (atras / largura) * JANELA_S;
          const v = traco.valor(t);
          const y = k * alturaTraco + alturaTraco * (1 - (v - traco.min) / (traco.max - traco.min));
          if (desenhando) ctx.lineTo(x, y);
          else ctx.moveTo(x, y);
          desenhando = true;
        }
        ctx.stroke();
      });
      quadro = requestAnimationFrame(desenhar);
    };
    quadro = requestAnimationFrame(desenhar);
    return () => cancelAnimationFrame(quadro);
  }, [canvas]);
}

/** Bipe curto (Web Audio). Sem som disponível, não faz nada. */
function bipe() {
  try {
    const Contexto = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return;
    const audio = new Contexto();
    const osc = audio.createOscillator();
    const ganho = audio.createGain();
    osc.frequency.value = 880;
    ganho.gain.value = 0.08;
    osc.connect(ganho).connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.15);
    osc.onended = () => void audio.close();
  } catch {
    // navegador sem áudio: o alarme continua visível
  }
}

interface Props {
  sinais: SinaisVitais;
  idadeDias: number;
  /** Ritmo cardíaco (B10/B11); padrão: sinusal. */
  ritmo?: Ritmo;
}

/** Monitor multiparamétrico: ECG e pletismografia em movimento, números e alarmes por idade (A VALIDAR). */
export function Monitor({ sinais, idadeDias, ritmo = 'sinusal' }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [som, setSom] = useState(false);
  const [silenciadoAte, setSilenciadoAte] = useState(0);
  const { config } = useConfiguracoes();
  const limites = limitesParaIdade(idadeDias);
  const alarmes = alarmesAtivos(sinais, limites, ritmo);
  const emAlarme = new Set(alarmes.map((a) => a.sinal));
  const sem = semMedida(ritmo);

  useTracado(canvas, () => [
    { cor: '#3ee07a', valor: (t) => ecgDoRitmo(t, sinais.fc, ritmo), min: -0.8, max: 1.1 },
    { cor: '#38c8f0', valor: (t) => pletismografiaDoRitmo(t, sinais.fc, ritmo) * (sinais.spo2 >= 85 ? 1 : 0.5), min: -0.1, max: 1.2 },
  ]);

  // bipe a cada 1,5 s enquanto houver alarme, com som ligado e sem silêncio
  const tocar = som && alarmes.length > 0;
  useEffect(() => {
    if (!tocar) return;
    const id = window.setInterval(() => {
      if (Date.now() >= silenciadoAte) bipe();
    }, 1500);
    return () => window.clearInterval(id);
  }, [tocar, silenciadoAte]);

  const numero = (sinal: keyof SinaisVitais | 'pa', rotulo: string, valor: string, unidade: string, classe: string) => {
    const alarme = sinal === 'pa' ? emAlarme.has('paSistolica') : emAlarme.has(sinal);
    return (
      <div className={`vital ${classe}${alarme ? ' em-alarme' : ''}`} key={rotulo}>
        <span className="vital-rotulo">{rotulo}</span>
        <span className="vital-valor">{valor}</span>
        <span className="vital-unidade">{unidade}</span>
      </div>
    );
  };

  return (
    <div className="monitor" aria-label="Monitor">
      <canvas ref={canvas} height={110} className="monitor-tela" aria-label="ECG (verde) e pletismografia (azul)" />
      {/* no modo prova o aluno reconhece o ritmo sozinho */}
      <p className="monitor-ritmo" aria-label="Ritmo no monitor">
        {config.modo === 'prova' ? 'Ritmo: reconheça pelo traçado' : `Ritmo: ${nomeDoRitmo(ritmo, sinais.fc, limites)}`}
      </p>
      <div className="vitais">
        {numero('fc', 'FC', sem.fc ? '---' : formatar(sinais.fc), 'bpm', 'cor-fc')}
        {numero('spo2', 'SpO₂', sem.spo2 ? '---' : formatar(sinais.spo2), '%', 'cor-spo2')}
        {numero('pa', 'PA', sem.pa ? '--- × ---' : `${formatar(sinais.paSistolica)} × ${formatar(sinais.paDiastolica)}`, 'mmHg', 'cor-pa')}
        {numero('fr', 'FR', formatar(sinais.fr), 'irpm', 'cor-fr')}
        {numero('temperaturaC', 'Temp. axilar', formatar(sinais.temperaturaC, 1), '°C', 'cor-temp')}
        {numero('glicemiaMgDl', 'Glicemia capilar', formatar(sinais.glicemiaMgDl), 'mg/dL', 'cor-glic')}
      </div>
      <div className="monitor-alarmes" role={alarmes.length > 0 ? 'alert' : undefined}>
        {alarmes.length > 0 ? alarmes.map((a) => <span key={a.sinal}>{a.texto}</span>) : <span className="sem-alarme">sem alarmes</span>}
      </div>
      <div className="linha-botoes monitor-botoes">
        <button type="button" aria-pressed={som} onClick={() => setSom((v) => !v)}>
          {som ? '🔔 Som ligado' : '🔕 Som desligado'}
        </button>
        {tocar && (
          <button type="button" onClick={() => setSilenciadoAte(Date.now() + 2 * 60_000)}>
            Silenciar 2 min
          </button>
        )}
      </div>
      <p className="nota">
        Limites de alarme para {limites.nome}: {LIMITES_ALARME.status === 'A_VALIDAR' ? 'A VALIDAR' : 'conferidos'}. Traçados
        didáticos.
      </p>
    </div>
  );
}
