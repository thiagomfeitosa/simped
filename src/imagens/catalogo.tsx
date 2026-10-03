/**
 * Catálogo de TODAS as ilustrações do app (para trocar pelos desenhos/fotos do usuário).
 *
 * Cada imagem tem um nome fixo (`id` = "pasta/arquivo", sem extensão). Esse nome é o mesmo:
 * - do PNG gerado em imagens/originais/<id>.png (`npm run exportar-imagens`), para o usuário ver qual é qual;
 * - do arquivo que o usuário vai pôr em imagens/minhas/<id>.png (ou .jpg/.webp) para substituir o desenho.
 * NÃO mude um id depois de publicado: o usuário já pode ter salvo a imagem dele com esse nome.
 *
 * A galeria (galeria.html, só no `npm run dev`) desenha tudo daqui; o exportador fotografa cada uma.
 */

import type { ReactNode } from 'react';
import { CenaBancada } from '../componentes/passo-a-passo/cenas/CenaBancada';
import { CenaIctericia } from '../componentes/passo-a-passo/cenas/CenaIctericia';
import { CenaPaciente } from '../componentes/passo-a-passo/cenas/CenaPaciente';
import { IconeSvg } from '../componentes/passo-a-passo/Icones';
import { NOME_PADRAO_RESPIRATORIO, type PadraoRespiratorio } from '../casos/tipos';
import { ACHADOS_ATENCAO_BASICA, NOME_SISTEMA } from '../dados/atencao-basica/exame-fisico-a-validar';
import { FAIXAS_DNPM } from '../dados/atencao-basica/desenvolvimento-a-validar';
import { ACHADOS_RN, REGIOES_EXAME_RN, ZONAS_KRAMER } from '../dados/neonatal/exame-rn-a-validar';
import { METODOS_MATURIDADE } from '../dados/neonatal/maturidade-a-validar';
import type { EstadoBancada, Icone } from '../dados/roteiros/tipos';
import { BebeCorpo } from '../ilustracoes/BebeCorpo';
import { IlustracaoCriterio, temDesenho } from '../ilustracoes/Criterios';
import { DESENHOS_DNPM, DesenhoDnpm } from '../ilustracoes/Desenvolvimento';
import { DetalheRN } from '../ilustracoes/detalhes/DetalheRN';
import { DesenhoAchadoAB } from '../telas/atencao-basica/DesenhoAchadoAB';
import { RespiracaoAnimada } from '../telas/RespiracaoAnimada';
import { IMAGENS_DA_PARADA } from './catalogo-parada';

export interface ImagemDoCatalogo {
  /** "pasta/subpasta/arquivo" (sem extensão). */
  id: string;
  /** O que a imagem mostra. */
  titulo: string;
  /** Onde aparece no app (aba → parte). */
  onde: string;
  /** O desenho muda com o tom de pele escolhido (o PNG é na pele clara). */
  variaPelaPele?: boolean;
  /** É animada no app (o PNG é um quadro parado). */
  animada?: boolean;
  /** Observação para quem for trocar (ex.: "fundo transparente", "2 quadros"). */
  nota?: string;
  desenhar: () => ReactNode;
}

/** "Céfalo-hematoma (bossa)" → "cefalo-hematoma-bossa". */
export function nomeDeArquivo(texto: string, maximo = 60): string {
  const s = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[º°ª]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length <= maximo) return s;
  return s.slice(0, maximo).replace(/-[^-]*$/, '') || s.slice(0, maximo);
}

const dois = (n: number) => String(n).padStart(2, '0');

// ---- 01 Recém-nascido ------------------------------------------------------------------------

function recemNascido(): ImagemDoCatalogo[] {
  const r: ImagemDoCatalogo[] = [];
  const nomeRegiao = (id: string) => REGIOES_EXAME_RN.find((x) => x.id === id)?.nome ?? id;

  r.push({
    id: '01-recem-nascido/corpo-inteiro/rn-corpo-inteiro-normal',
    titulo: 'Recém-nascido deitado, visto de frente (normal)',
    onde: 'Aba 👶 Recém-nascido → Exame no alojamento (RN virtual) e Atlas',
    variaPelaPele: true,
    nota: 'O app desenha por cima dele os achados (cor, manchas) e as áreas clicáveis do exame: mantenha o bebê na mesma posição e enquadramento.',
    desenhar: () => <BebeCorpo tom="claro" />,
  });

  for (const reg of REGIOES_EXAME_RN) {
    if (!reg.detalheNormal) continue;
    r.push({
      id: `01-recem-nascido/exame-regioes-normais/${nomeDeArquivo(reg.nome)}-normal`,
      titulo: `${reg.nome} — normal (de perto)`,
      onde: `Aba 👶 Recém-nascido → Exame no alojamento → ${reg.nome}`,
      variaPelaPele: true,
      desenhar: () => <DetalheRN detalhe={reg.detalheNormal!} tom="claro" />,
    });
  }

  for (const a of ACHADOS_RN) {
    if (!a.detalhe && !a.corpo) continue;
    r.push({
      id: `01-recem-nascido/atlas-de-achados/${nomeDeArquivo(nomeRegiao(a.regiao), 20)}--${nomeDeArquivo(a.nome)}`,
      titulo: `${a.nome} (${nomeRegiao(a.regiao)})`,
      onde: `Aba 👶 Recém-nascido → Atlas de achados${a.soNoAtlas ? '' : ' e Exame no alojamento (sorteado)'}`,
      variaPelaPele: true,
      ...(a.tomSugerido && a.tomSugerido !== 'claro' && { nota: `No app aparece de preferência na pele ${a.tomSugerido === 'negro' ? 'negra' : 'parda'} (mais didático).` }),
      desenhar: () => (a.detalhe ? <DetalheRN detalhe={a.detalhe} tom={a.tomSugerido ?? 'claro'} /> : <BebeCorpo tom={a.tomSugerido ?? 'claro'} ajuste={a.corpo!} titulo={`RN com ${a.nome}`} />),
    });
  }

  for (const z of [0, ...ZONAS_KRAMER.map((k) => k.zona)] as const) {
    const onde = z === 0 ? 'sem icterícia' : ZONAS_KRAMER.find((k) => k.zona === z)!.onde;
    r.push({
      id: `01-recem-nascido/zonas-de-kramer/kramer-zona-${z}`,
      titulo: z === 0 ? 'Zonas de Kramer — sem icterícia (linhas das zonas)' : `Zonas de Kramer — amarelo até a zona ${z} (${onde})`,
      onde: 'Aba 👶 Recém-nascido → Atlas → Zonas de Kramer',
      variaPelaPele: true,
      desenhar: () => <BebeCorpo tom="claro" ajuste={z ? { ictericiaZona: z } : {}} zonasKramer titulo={`Zona ${z} de Kramer`} />,
    });
  }

  // Capurro e New Ballard: cada opção de cada critério (os critérios repetidos entre métodos saem uma vez)
  const vistos = new Set<string>();
  for (const m of METODOS_MATURIDADE) {
    const metodo = m.id === 'new-ballard' ? 'new-ballard' : 'capurro';
    for (const c of m.criterios) {
      if (vistos.has(c.id) || !temDesenho(c.id)) continue;
      vistos.add(c.id);
      c.opcoes.forEach((o, i) => {
        r.push({
          id: `01-recem-nascido/capurro-e-ballard/${metodo}--${nomeDeArquivo(c.nome, 30)}--opcao-${i + 1}-${nomeDeArquivo(o.texto, 40)}`,
          titulo: `${m.id === 'new-ballard' ? 'New Ballard' : 'Capurro'} — ${c.nome}: opção ${i + 1} de ${c.opcoes.length} (“${o.texto}”, ${o.pontos} pontos)`,
          onde: 'Aba 👶 Recém-nascido → Idade gestacional (Capurro / New Ballard)',
          variaPelaPele: true,
          desenhar: () => <IlustracaoCriterio criterioId={c.id} indice={i} total={c.opcoes.length} tom="claro" />,
        });
      });
    }
  }
  return r;
}

// ---- 02 Atenção básica ---------------------------------------------------------------------

function atencaoBasica(): ImagemDoCatalogo[] {
  const r: ImagemDoCatalogo[] = [];
  for (const a of ACHADOS_ATENCAO_BASICA) {
    if (!a.desenho) continue;
    r.push({
      id: `02-atencao-basica/exame-fisico/${nomeDeArquivo(NOME_SISTEMA[a.sistema], 20)}--${nomeDeArquivo(a.nome)}`,
      titulo: `${a.nome} (${NOME_SISTEMA[a.sistema]})`,
      onde: 'Aba 🩺 Atenção básica → Exame físico (atlas e quiz)',
      variaPelaPele: a.desenho.tipo !== 'otoscopia',
      ...(a.desenho.tipo === 'respiracao' && { animada: true, nota: 'Animada no app (o tórax sobe e desce): uma foto parada perde o movimento — prefira um vídeo curto em loop (.mp4/.webm) ou deixe o desenho.' }),
      desenhar: () => <DesenhoAchadoAB achado={a} tom="claro" />,
    });
  }

  for (const d of DESENHOS_DNPM) {
    const marcos = FAIXAS_DNPM.flatMap((f) => f.marcos.filter((m) => m.desenho === d).map((m) => `${m.texto} (${f.rotulo})`));
    if (!marcos.length) continue;
    r.push({
      id: `02-atencao-basica/desenvolvimento-dnpm/${nomeDeArquivo(d)}`,
      titulo: `Marco do desenvolvimento: ${marcos[0]}`,
      onde: `Aba 🩺 Atenção básica → Desenvolvimento (DNPM)${marcos.length > 1 ? ` — usado em ${marcos.length} marcos: ${marcos.join('; ')}` : ''}`,
      variaPelaPele: true,
      desenhar: () => <DesenhoDnpm desenho={d} tom="claro" />,
    });
  }
  return r;
}

// ---- 03 Passo a passo ------------------------------------------------------------------------

const ICONES: Record<Icone, string> = {
  pulmao: 'Pulmão (oxigenoterapia)',
  saturacao: 'Oxímetro (saturação)',
  mamadeira: 'Mamadeira (dieta por fórmula)',
  seio: 'Gota de leite (seio materno)',
  jejum: 'Jejum (dieta zero)',
  tubo: 'Tubo de exame',
  hemocultura: 'Frasco de hemocultura',
  glicemia: 'Glicosímetro (glicemia)',
  termometro: 'Termômetro',
  coracao: 'Coração',
  relogio: 'Relógio',
  balanca: 'Balança',
  alerta: 'Alerta',
  documento: 'Documento',
  berco: 'Berço',
  check: 'Certo (✓)',
  seringa: 'Seringa',
  x: 'Errado (✗)',
  lampada: 'Lâmpada (dica)',
  olho: 'Olho',
  gota: 'Gota',
  cerebro: 'Cérebro',
  ecg: 'ECG',
};

const BANCADAS: { nome: string; titulo: string; estado: EstadoBancada }[] = [
  { nome: 'ampola', titulo: 'Ampola de medicação', estado: { frasco: { modelo: 'ampola', rotulo: 'Ampola', sublinha: '1 mg/mL', nivel: 0.8, cor: 'adrenalina' } } },
  { nome: 'frasco-com-po', titulo: 'Frasco-ampola com pó (antes de reconstituir)', estado: { frasco: { modelo: 'frasco-po', rotulo: 'Frasco', sublinha: 'pó', nivel: 0, cor: 'medicacao', po: true } } },
  { nome: 'frasco-reconstituido', titulo: 'Frasco-ampola com o pó já dissolvido', estado: { frasco: { modelo: 'frasco-po', rotulo: 'Frasco', sublinha: 'reconstituído', nivel: 0.7, cor: 'medicacao' } } },
  {
    nome: 'seringa-com-duas-camadas',
    titulo: 'Seringa com medicação + soro (camadas)',
    estado: { seringa: { capacidadeMl: 10, camadas: [{ volumeMl: 2, cor: 'medicacao', rotulo: 'medicação' }, { volumeMl: 6, cor: 'sf', rotulo: 'SF 0,9%' }], rotulo: 'Seringa de 10 mL' } },
  },
  { nome: 'bolsa-de-soro', titulo: 'Bolsa de soro gotejando', estado: { bolsa: { rotulo: 'SF 0,9%', cor: 'sf', gotejando: true } } },
  { nome: 'bomba-de-infusao-bic', titulo: 'Bomba de infusão (BIC) ligada', estado: { bic: { vazaoMlH: 2, ligada: true, rotulo: 'BIC' } } },
];

function passoAPasso(): ImagemDoCatalogo[] {
  const r: ImagemDoCatalogo[] = [];
  for (const [nome, titulo] of Object.entries(ICONES) as [Icone, string][]) {
    r.push({
      id: `03-passo-a-passo/icones/icone-${nome}`,
      titulo: `Ícone: ${titulo}`,
      onde: 'Aba Passo a passo → cartões das etapas (ícones pequenos)',
      nota: 'Ícone pequeno (≈ 44 px): prefira imagem quadrada, simples, com fundo transparente (.png).',
      desenhar: () => <IconeSvg nome={nome} tamanho={96} />,
    });
  }
  r.push(
    {
      id: '03-passo-a-passo/cenas/recem-nascido-na-balanca',
      titulo: 'Recém-nascido na balança',
      onde: 'Aba Passo a passo → 1ª etapa dos roteiros de RN (peso)',
      animada: true,
      nota: 'No app o bebê "desce" na balança e o visor conta o peso: o número é escrito pelo app — a imagem deve deixar o visor livre.',
      desenhar: () => <CenaPaciente cena={{ tipo: 'paciente', perfil: 'rn', pesoKg: 3.2, rotulos: [] }} />,
    },
    {
      id: '03-passo-a-passo/cenas/crianca-na-balanca',
      titulo: 'Criança na balança',
      onde: 'Aba Passo a passo → 1ª etapa dos roteiros de criança (peso)',
      animada: true,
      nota: 'Idem: o visor do peso é escrito pelo app.',
      desenhar: () => <CenaPaciente cena={{ tipo: 'paciente', perfil: 'crianca', pesoKg: 15, rotulos: [] }} />,
    },
  );
  for (const b of BANCADAS) {
    r.push({
      id: `03-passo-a-passo/bancada/${b.nome}`,
      titulo: b.titulo,
      onde: 'Aba Passo a passo → etapas de preparo (diluição, rediluição, BIC)',
      animada: true,
      nota: 'O líquido sobe/desce e as marcas/números são desenhados pelo app: a imagem é só o objeto vazio (frasco, seringa, bolsa, bomba).',
      desenhar: () => <CenaBancada cena={{ tipo: 'bancada', estado: b.estado }} idEtapa={b.nome} animarDoInicio={false} />,
    });
  }
  for (const z of [0, 1, 2, 3, 4, 5] as const) {
    r.push({
      id: `03-passo-a-passo/ictericia/rn-ictericia-zona-${z}${z === 3 ? '-com-bilirrubinometro' : ''}${z === 5 ? '-em-fototerapia' : ''}`,
      titulo: `RN deitado (roteiro da icterícia) — ${z === 0 ? 'sem amarelo' : `amarelo até a zona ${z}`}${z === 3 ? ', com o bilirrubinômetro na glabela' : ''}${z === 5 ? ', em fototerapia' : ''}`,
      onde: 'Aba Passo a passo → roteiro "Icterícia"',
      animada: true,
      desenhar: () => <CenaIctericia cena={{ tipo: 'ictericia', zona: z, ...(z === 3 && { bilirrubinometro: { local: 'glabela', valor: 12.4 } }), ...(z === 5 && { fototerapia: true }) }} />,
    });
  }
  return r;
}

// ---- 04 Beira do leito (Prescrever) --------------------------------------------------------------

function beiraDoLeito(): ImagemDoCatalogo[] {
  const fr: Record<PadraoRespiratorio, number> = { normal: 30, taquipneia: 60, desconforto: 60, kussmaul: 30, bradipneia: 10, gasping: 6, apneia: 0, assistida: 30 };
  return (Object.keys(NOME_PADRAO_RESPIRATORIO) as PadraoRespiratorio[]).map((p, i) => ({
    id: `04-prescrever-beira-do-leito/respiracao-${dois(i + 1)}-${nomeDeArquivo(p)}`,
    titulo: `Respiração animada: ${NOME_PADRAO_RESPIRATORIO[p]}`,
    onde: 'Aba Prescrever → beira do leito (padrão respiratório) e aba Atenção básica (respiração)',
    animada: true,
    nota: 'O tórax sobe e desce na frequência do paciente: uma foto parada perde o movimento — para trocar, use 2 quadros (inspiração/expiração) ou um vídeo curto em loop.',
    desenhar: () => <RespiracaoAnimada padrao={p} fr={fr[p]} />,
  }));
}

/** Todas as imagens, na ordem das pastas. */
export function catalogoDeImagens(): ImagemDoCatalogo[] {
  return [...recemNascido(), ...atencaoBasica(), ...passoAPasso(), ...beiraDoLeito(), ...IMAGENS_DA_PARADA];
}

/** Nome das pastas (para a lista). */
export const NOME_DAS_PASTAS: Record<string, string> = {
  '01-recem-nascido': 'Aba 👶 Recém-nascido',
  '02-atencao-basica': 'Aba 🩺 Atenção básica',
  '03-passo-a-passo': 'Aba Passo a passo',
  '04-prescrever-beira-do-leito': 'Aba Prescrever (beira do leito)',
  '05-parada-animacao-rcp': 'Aba 🚨 Parada (animação da RCP)',
};
