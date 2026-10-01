import { useEffect, useState } from 'react';
import type { CenaBancada as TipoCenaBancada, CorLiquido, EstadoBancada } from '../../../dados/roteiros/tipos';
import { fmt } from '../../../logica/formatacao';
import { useRitmo } from '../ritmo';
import { prefereMenosMovimento, useNumeroAnimado } from '../useNumeroAnimado';

/** Cores só para ensino (na vida real quase tudo é transparente). */
export const CORES_LIQUIDO: Record<CorLiquido, string> = {
  medicacao: 'var(--liq-medicacao)',
  medicacao2: 'var(--liq-medicacao2)',
  sf: 'var(--liq-sf)',
  agua: 'var(--liq-agua)',
  glicose: 'var(--liq-glicose)',
  adrenalina: 'var(--liq-adrenalina)',
  mistura: 'var(--liq-mistura)',
};

const ATRASO_ANIMACAO_MS = 900;

interface Props {
  cena: TipoCenaBancada;
  idEtapa: string;
  /** Verdadeiro quando a animação deve partir do estado inicial (chegou avançando ou pediu "repetir"). */
  animarDoInicio: boolean;
}

export function CenaBancada({ cena, idEtapa, animarDoInicio }: Props) {
  const fator = useRitmo();
  const usarInicial = animarDoInicio && !!cena.estadoInicial && !prefereMenosMovimento();
  const [mostrado, setMostrado] = useState<EstadoBancada>(usarInicial ? cena.estadoInicial! : cena.estado);

  useEffect(() => {
    if (usarInicial) {
      setMostrado(cena.estadoInicial!);
      const t = window.setTimeout(() => setMostrado(cena.estado), ATRASO_ANIMACAO_MS * fator);
      return () => window.clearTimeout(t);
    }
    setMostrado(cena.estado);
    // A cena muda quando muda a etapa; `cena` é estável dentro de uma etapa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEtapa]);

  const e = mostrado;
  const fluxos = new Set(e.fluxos ?? []);
  const mostrarPaciente = fluxos.has('bic-paciente') || fluxos.has('seringa-paciente');

  return (
    <svg className="bancada" viewBox="0 0 700 390" role="img" aria-label="Animação da bancada de preparo">
      <defs>
        <marker id="ponta-seta" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--seta)" />
        </marker>
      </defs>

      {e.medidor && <Medidor {...e.medidor} />}
      {e.frasco && <Frasco key={e.frasco.modelo + e.frasco.rotulo} {...e.frasco} />}
      {e.seringa && <Seringa {...e.seringa} />}
      {e.bolsa && <Bolsa key={e.bolsa.rotulo} {...e.bolsa} />}
      {e.bic && <Bic {...e.bic} />}
      {mostrarPaciente && <Paciente />}

      {/* Setas de fluxo: mostram para onde o líquido está indo */}
      {fluxos.has('frasco-seringa') && <Fluxo d="M128 150 Q205 50 290 112" />}
      {fluxos.has('seringa-frasco') && <Fluxo d="M290 112 Q205 50 128 150" />}
      {fluxos.has('bolsa-seringa') && <Fluxo d="M512 172 Q430 40 350 84" />}
      {fluxos.has('bolsa-bic') && <Fluxo d="M530 172 L530 232" />}
      {fluxos.has('seringa-bic') && <Fluxo d="M352 250 Q400 250 436 282" />}
      {fluxos.has('bic-paciente') && <Fluxo d="M622 292 Q662 292 662 250" />}
      {fluxos.has('seringa-paciente') && <Fluxo d="M322 346 Q470 400 646 248" />}

      {e.balao && <Balao key={e.balao} texto={e.balao} />}
    </svg>
  );
}

// ---- Peças ------------------------------------------------------------------

function Fluxo({ d }: { d: string }) {
  return (
    <g className="fluxo surgir">
      <path d={d} className="fluxo-fundo" />
      <path d={d} className="fluxo-traco" markerEnd="url(#ponta-seta)" />
    </g>
  );
}

function Balao({ texto }: { texto: string }) {
  const largura = Math.max(120, texto.length * 8.6 + 32);
  return (
    <g className="balao" transform="translate(320 26)">
      <rect x={-largura / 2} y={-18} width={largura} height={34} rx={17} />
      <text x={0} y={4} textAnchor="middle">
        {texto}
      </text>
    </g>
  );
}

function Frasco(props: NonNullable<EstadoBancada['frasco']>) {
  const { modelo, rotulo, sublinha, nivel, cor, po } = props;
  const ehAmpola = modelo === 'ampola';
  // Área interna onde o líquido aparece
  const interno = ehAmpola ? { x: 84, y: 194, w: 42, h: 108 } : { x: 64, y: 180, w: 82, h: 122 };
  const idClip = `clip-frasco-${modelo}`;

  return (
    <g className="surgir">
      <defs>
        <clipPath id={idClip}>
          {ehAmpola ? <rect x={80} y={190} width={50} height={116} rx={14} /> : <rect x={60} y={176} width={90} height={130} rx={14} />}
        </clipPath>
      </defs>

      {/* líquido */}
      <g clipPath={`url(#${idClip})`}>
        <rect
          className="liquido"
          x={interno.x - 4}
          y={interno.y}
          width={interno.w + 8}
          height={interno.h + 4}
          fill={CORES_LIQUIDO[cor]}
          style={{ transform: `scaleY(${Math.max(0, Math.min(1, nivel))})` }}
        />
        {/* pó (antes de reconstituir) */}
        <g className="po" style={{ opacity: po ? 1 : 0 }}>
          {Array.from({ length: 34 }, (_, i) => (
            <circle key={i} cx={70 + ((i * 37) % 72)} cy={300 - ((i * 13) % 14)} r={2.6} />
          ))}
        </g>
      </g>

      {/* vidro */}
      {ehAmpola ? (
        <>
          <rect className="vidro" x={80} y={190} width={50} height={116} rx={14} />
          <path className="vidro" d="M92 190 Q92 176 99 170 L111 170 Q118 176 118 190" />
          <ellipse className="vidro" cx={105} cy={152} rx={11} ry={17} />
          <path className="gargalo" d="M97 168 L113 168" />
        </>
      ) : (
        <>
          <rect className="vidro" x={60} y={176} width={90} height={130} rx={14} />
          <rect className="vidro" x={84} y={152} width={42} height={26} rx={4} />
          <rect className="tampa" x={79} y={138} width={52} height={16} rx={4} />
        </>
      )}
      <rect className="reflexo" x={ehAmpola ? 88 : 70} y={ehAmpola ? 200 : 188} width={6} height={ehAmpola ? 80 : 96} rx={3} />

      <text className="rotulo-forte" x={105} y={332} textAnchor="middle">
        {rotulo}
      </text>
      <text className="rotulo" x={105} y={350} textAnchor="middle">
        {sublinha}
      </text>
    </g>
  );
}

const SERINGA = { x: 296, topo: 90, base: 290, largura: 48, altura: 200 };
const MAX_CAMADAS = 3;

function Seringa({ capacidadeMl, camadas, rotulo }: NonNullable<EstadoBancada['seringa']>) {
  const pxPorMl = SERINGA.altura / capacidadeMl;
  const alturas = camadas.map((c) => (c.volumeMl > 0 ? Math.max(3, c.volumeMl * pxPorMl) : 0));
  const total = camadas.reduce((s, c) => s + c.volumeMl, 0);
  const alturaTotal = alturas.reduce((s, h) => s + h, 0);
  const topoLiquido = SERINGA.base - alturaTotal;
  const totalAnimado = useNumeroAnimado(total, 1300 * useRitmo(), 0);

  const menor = capacidadeMl <= 1 ? 0.1 : capacidadeMl <= 5 ? 0.5 : 1;
  const rotuloCada = capacidadeMl <= 1 ? 0.5 : capacidadeMl <= 5 ? 1 : capacidadeMl <= 10 ? 2 : 5;
  const marcas: { v: number; grande: boolean }[] = [];
  for (let v = menor; v <= capacidadeMl + 1e-9; v += menor) {
    const vv = Math.round(v * 100) / 100;
    marcas.push({ v: vv, grande: Math.abs(vv / rotuloCada - Math.round(vv / rotuloCada)) < 1e-6 });
  }

  let acumulado = 0;
  const slots = Array.from({ length: MAX_CAMADAS }, (_, i) => {
    const camada = camadas[i];
    const h = alturas[i] ?? 0;
    const deslocamento = acumulado;
    acumulado += h;
    return { camada, h, deslocamento };
  });

  return (
    <g className="surgir">
      {/* êmbolo */}
      <rect className="embolo-haste" x={314} y={70} width={12} height={220} style={{ transform: `scaleY(${(topoLiquido - 10 - 70) / 220})` }} />
      <rect className="embolo-cabo" x={288} y={62} width={64} height={9} rx={3} />
      <rect className="embolo-borracha" x={SERINGA.x + 1} y={0} width={SERINGA.largura - 2} height={10} rx={2} style={{ transform: `translateY(${topoLiquido - 10}px)` }} />

      {/* líquido em camadas (de baixo para cima) */}
      {slots.map(({ camada, h, deslocamento }, i) => (
        <rect
          key={i}
          className="liquido"
          x={SERINGA.x + 1}
          y={SERINGA.topo}
          width={SERINGA.largura - 2}
          height={SERINGA.altura}
          fill={camada ? CORES_LIQUIDO[camada.cor] : 'transparent'}
          style={{ transform: `translateY(${-deslocamento}px) scaleY(${h / SERINGA.altura})` }}
        />
      ))}

      {/* corpo, bico e agulha */}
      <rect className="vidro" x={SERINGA.x} y={SERINGA.topo} width={SERINGA.largura} height={SERINGA.altura} rx={3} />
      <rect className="vidro" x={SERINGA.x - 12} y={SERINGA.topo - 4} width={SERINGA.largura + 16} height={6} rx={2} />
      <path className="vidro" d="M308 290 L332 290 L326 304 L314 304 Z" />
      <path className="agulha" d="M320 304 L320 342" />

      {/* graduação */}
      {marcas.map(({ v, grande }) => {
        const y = SERINGA.base - v * pxPorMl;
        return (
          <g key={v}>
            <line className="marca" x1={SERINGA.x + SERINGA.largura - (grande ? 14 : 8)} x2={SERINGA.x + SERINGA.largura} y1={y} y2={y} />
            {grande && (
              <text className="marca-texto" x={SERINGA.x + SERINGA.largura + 7} y={y + 4}>
                {fmt(v)}
              </text>
            )}
          </g>
        );
      })}

      {/* nomes das camadas */}
      {slots.map(({ camada, h, deslocamento }, i) =>
        camada && h > 0 ? (
          <g key={`r${i}`} className="rotulo-camada" style={{ transform: `translateY(${SERINGA.base - deslocamento - h / 2}px)` }}>
            <line x1={262} x2={SERINGA.x - 2} y1={0} y2={0} />
            <circle cx={262} cy={0} r={3} fill={CORES_LIQUIDO[camada.cor]} />
            <text x={256} y={4} textAnchor="end">
              {camada.rotulo}
            </text>
          </g>
        ) : null,
      )}

      {/* total */}
      {total > 0 && (
        <g className="total-seringa" style={{ transform: `translateY(${topoLiquido}px)` }}>
          <path d="M376 0 L386 -7 L386 7 Z" />
          <text x={390} y={5}>
            {fmt(totalAnimado, 2)} mL
          </text>
        </g>
      )}

      <text className="rotulo-forte" x={320} y={366} textAnchor="middle">
        {rotulo}
      </text>
    </g>
  );
}

function Bolsa({ rotulo, cor, gotejando }: NonNullable<EstadoBancada['bolsa']>) {
  return (
    <g className="surgir">
      <path className="suporte" d="M530 0 L530 12" />
      <path className="bolsa" d="M492 18 H568 V100 Q568 126 544 128 H516 Q492 126 492 100 Z" />
      <path d="M496 40 H564 V100 Q564 122 544 124 H516 Q496 122 496 100 Z" fill={CORES_LIQUIDO[cor]} />
      <rect className="etiqueta-bolsa" x={502} y={56} width={56} height={30} rx={4} />
      <text className="etiqueta-bolsa-texto" x={530} y={75} textAnchor="middle">
        {rotulo}
      </text>
      <rect className="vidro" x={522} y={130} width={16} height={36} rx={5} />
      {gotejando && (
        <g className="gotas">
          <circle className="gota" cx={530} cy={138} r={3.2} fill={CORES_LIQUIDO[cor]} />
          <circle className="gota gota-2" cx={530} cy={138} r={3.2} fill={CORES_LIQUIDO[cor]} />
        </g>
      )}
    </g>
  );
}

function Bic({ vazaoMlH, ligada, rotulo }: NonNullable<EstadoBancada['bic']>) {
  const vazao = useNumeroAnimado(vazaoMlH, 1600 * useRitmo(), 0);
  return (
    <g className="surgir">
      <rect className="bic-corpo" x={440} y={236} width={182} height={96} rx={12} />
      <rect className="bic-tela" x={454} y={250} width={112} height={44} rx={5} />
      <text className={`bic-numero ${ligada ? 'ligada' : ''}`} x={560} y={280} textAnchor="end">
        {fmt(vazao, 1)}
      </text>
      <text className="bic-unidade" x={560} y={290} textAnchor="end">
        mL/h
      </text>
      <circle className={`bic-led ${ligada ? 'ligada' : ''}`} cx={598} cy={258} r={6} />
      <circle className="bic-botao" cx={582} cy={306} r={7} />
      <circle className="bic-botao" cx={604} cy={306} r={7} />
      <rect className="bic-botao" x={456} y={304} width={60} height={14} rx={4} />
      <text className="rotulo-forte" x={531} y={352} textAnchor="middle">
        {rotulo ?? 'Bomba de infusão (BIC)'}
      </text>
      <text className="rotulo" x={531} y={369} textAnchor="middle">
        {ligada ? 'infundindo' : 'aguardando programação'}
      </text>
    </g>
  );
}

function Paciente() {
  return (
    <g className="surgir paciente-marcador">
      <circle cx={664} cy={214} r={14} />
      <path d="M642 250 Q664 222 686 250 Z" />
      <text className="rotulo" x={664} y={192} textAnchor="middle">
        paciente
      </text>
    </g>
  );
}

function Medidor({ rotulo, valor, unidade, minimo, maximo, faixaAlvo }: NonNullable<EstadoBancada['medidor']>) {
  const x0 = 40;
  const largura = 300;
  const escala = (v: number) => x0 + ((Math.min(maximo, Math.max(minimo, v)) - minimo) / (maximo - minimo)) * largura;
  const fator = useRitmo();
  const [valorMostrado, setValorMostrado] = useState(minimo);
  useEffect(() => {
    const t = window.setTimeout(() => setValorMostrado(valor), 500 * fator);
    return () => window.clearTimeout(t);
  }, [valor, fator]);
  const animado = useNumeroAnimado(valorMostrado, 1700 * fator, minimo);
  const dentro = valor >= faixaAlvo[0] && valor <= faixaAlvo[1];

  return (
    <g className="surgir medidor">
      <text className="medidor-titulo" x={x0} y={46}>
        {rotulo}: <tspan className={dentro ? 'ok' : 'fora'}>{fmt(animado, 1)}</tspan> {unidade}
      </text>
      <rect className="medidor-trilho" x={x0} y={70} width={largura} height={16} rx={8} />
      <rect className="medidor-faixa" x={escala(faixaAlvo[0])} y={70} width={escala(faixaAlvo[1]) - escala(faixaAlvo[0])} height={16} />
      {[minimo, faixaAlvo[0], faixaAlvo[1], maximo].map((v) => (
        <text key={v} className="marca-texto" x={escala(v)} y={104} textAnchor="middle">
          {fmt(v)}
        </text>
      ))}
      <g className="medidor-ponteiro" style={{ transform: `translateX(${escala(valorMostrado) - x0}px)` }}>
        <path d={`M${x0} 66 L${x0 - 8} 54 L${x0 + 8} 54 Z`} />
        <line x1={x0} x2={x0} y1={66} y2={90} />
      </g>
      <text className="rotulo" x={x0} y={124}>
        faixa verde = alvo ({fmt(faixaAlvo[0])} a {fmt(faixaAlvo[1])})
      </text>
    </g>
  );
}
