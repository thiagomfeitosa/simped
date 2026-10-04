/**
 * Imagens da animação da RCP (aba 🚨 Parada) para o catálogo/galeria.
 * As cenas aqui são montadas à mão (objetos CenaRcp de exemplo), sem passar pela lógica do código.
 */

import type { AcaoAvatar, AparenciaAvatar, AvatarNaCena, CenaRcp, FaixaPaciente, LugarNaCena } from '../parada/cena';
import { CABELOS_EXEMPLO, DesenhoCenaRcp, MiniAvatar, PecaBolsa, PecaCarrinho, PecaFundoSala, PecaLaringoscopio, PecaLeito, PecaPas, PecaSeringa, RecorteCena, recorteDoLugar, recortePaciente } from '../telas/parada/CenaRcp';
import type { ImagemDoCatalogo } from './catalogo';

const PASTA = '05-parada-animacao-rcp';

const NOME_FAIXA: Record<FaixaPaciente, string> = { rn: 'recém-nascido', lactente: 'lactente', crianca: 'criança', adolescente: 'adolescente' };
const TECNICA: Record<FaixaPaciente, CenaRcp['tecnica']> = { rn: 'dois-polegares', lactente: 'dois-polegares', crianca: 'uma-mao', adolescente: 'duas-maos' };
const PELE: Record<FaixaPaciente, CenaRcp['pelePaciente']> = { rn: 'moreno', lactente: 'claro', crianca: 'negro', adolescente: 'moreno' };

/** Equipe de exemplo (nomes e aparências fixos para o catálogo). */
const EQUIPE: { papel: string; nome: string; lugar: LugarNaCena; aparencia: AparenciaAvatar }[] = [
  { papel: 'lider', nome: 'Ana', lugar: 'pes', aparencia: { pele: 'moreno', cabelo: 'preso', roupa: '#6b3fa0' } },
  { papel: 'compressor-1', nome: 'Bruno', lugar: 'torax', aparencia: { pele: 'claro', cabelo: 'curto', roupa: '#2f6fb3' } },
  { papel: 'compressor-2', nome: 'Carla', lugar: 'espera', aparencia: { pele: 'negro', cabelo: 'cacheado', roupa: '#1f8a70' } },
  { papel: 'via-aerea', nome: 'Diego', lugar: 'cabeca', aparencia: { pele: 'moreno', cabelo: 'raspado', roupa: '#2f6fb3' } },
  { papel: 'medicacao', nome: 'Elisa', lugar: 'acesso', aparencia: { pele: 'claro', cabelo: 'longo', roupa: '#be185d' } },
  { papel: 'monitor', nome: 'Fábio', lugar: 'desfibrilador', aparencia: { pele: 'negro', cabelo: 'raspado', roupa: '#475569' } },
  { papel: 'tempo', nome: 'Gabi', lugar: 'tempo', aparencia: { pele: 'claro', cabelo: 'preso', roupa: '#c2410c' } },
  { papel: 'registro', nome: 'Heitor', lugar: 'registro', aparencia: { pele: 'moreno', cabelo: 'curto', roupa: '#f1f5f9' } },
];

const ACAO_PADRAO: Record<string, AcaoAvatar> = {
  lider: 'parado',
  'compressor-1': 'comprimindo',
  'compressor-2': 'parado',
  'via-aerea': 'segurando-mascara',
  medicacao: 'parado',
  monitor: 'olhando-monitor',
  tempo: 'cronometrando',
  registro: 'anotando',
};

/** Cena de exemplo: equipe inteira, alguém comprimindo. `mudar` troca a ação/fase/balão de cada papel. */
function cenaExemplo(faixa: FaixaPaciente, opcoes: Partial<CenaRcp> & { mudar?: Record<string, Partial<AvatarNaCena>> } = {}): CenaRcp {
  const { mudar = {}, ...resto } = opcoes;
  const avatares = EQUIPE.map((m): AvatarNaCena => {
    const base: AvatarNaCena = { papel: m.papel, nome: m.nome, lugar: m.lugar, acao: ACAO_PADRAO[m.papel]!, fase: m.papel === 'compressor-1' ? 0.85 : 0.4, aparencia: m.aparencia };
    return { ...base, ...(m.papel === 'compressor-1' && { ritmo: 'boa' as const }), ...mudar[m.papel] };
  });
  return {
    faixa,
    tecnica: TECNICA[faixa],
    pelePaciente: PELE[faixa],
    compressao: 0.85,
    expansao: 0,
    viaAerea: 'mascara',
    rce: false,
    choque: 0,
    carregado: false,
    checandoRitmo: false,
    ativo: true,
    avatares,
    legenda: 'Bruno comprime (110/min) · Diego segura a máscara',
    ...resto,
  };
}

const FAIXAS: FaixaPaciente[] = ['rn', 'lactente', 'crianca', 'adolescente'];

const NOTA_CENA =
  'A cena é montada a cada quadro (60 por segundo) juntando peças separadas: fundo, maca, paciente e cada pessoa. Para pôr um desenho ou foto seu, o melhor é trocar uma PEÇA (ex.: só o paciente, só o fundo) e não a cena inteira: com fundo transparente (PNG) e o mesmo enquadramento da peça original.';
const NOTA_PACIENTE =
  'No app o tórax afunda e volta em cada compressão (a linha do peito desce de verdade). Para trocar por um desenho seu, faça 2 quadros no MESMO enquadramento — tórax normal e tórax afundado —, com fundo transparente (PNG); o app alterna entre eles no ritmo das compressões.';
const NOTA_AVATAR =
  'Cada pessoa é desenhada pelo app com a pele, o cabelo e a cor do pijama escolhidos pelo aluno, e os braços se mexem até o ponto certo (tórax, bolsa, seringa). Uma foto não acompanha isso; se quiser trocar, faça a pessoa em quadros (ex.: braços em cima / embaixo), fundo transparente e mesma altura dos pés à cabeça.';

/** Outros momentos do código (cena completa). */
const MOMENTOS: { arquivo: string; titulo: string; faixa: FaixaPaciente; cena: Partial<CenaRcp> & { mudar?: Record<string, Partial<AvatarNaCena>> } }[] = [
  {
    arquivo: 'cena-lactente-tubo-intraossea',
    titulo: 'Lactente intubado (tubo saindo da boca), ventilação pelo tubo e adrenalina pela intraóssea',
    faixa: 'lactente',
    cena: {
      viaAerea: 'tubo',
      acesso: 'intraosseo',
      compressao: 0.6,
      expansao: 0.7,
      legenda: 'Bruno comprime · Diego ventila pelo tubo · Elisa: adrenalina 0,8 mL (IO)',
      mudar: { 'via-aerea': { acao: 'ventilando', fase: 0.8 }, medicacao: { acao: 'injetando', fase: 0.5, balao: 'Adrenalina 0,8 mL feita!' }, lider: { balao: 'Elisa: adrenalina 0,8 mL' } },
    },
  },
  {
    arquivo: 'cena-crianca-afastem-se',
    titulo: 'Criança — desfibrilador carregado: todos de mãos ao alto ("afastem-se!")',
    faixa: 'crianca',
    cena: {
      carregado: true,
      compressao: 0,
      legenda: 'Fábio carregou 40 J · Afastem-se!',
      mudar: {
        'compressor-1': { acao: 'maos-ao-alto', fase: 0 },
        'via-aerea': { acao: 'maos-ao-alto', fase: 0 },
        medicacao: { acao: 'maos-ao-alto', fase: 0 },
        monitor: { acao: 'carregando', fase: 1, balao: 'Carregado! Afastem-se!' },
        lider: { balao: 'Todos afastados? Chocar!' },
      },
    },
  },
  {
    arquivo: 'cena-adolescente-checagem-de-ritmo',
    titulo: 'Adolescente — pausa para checar o ritmo (todos olham o monitor)',
    faixa: 'adolescente',
    cena: {
      checandoRitmo: true,
      compressao: 0,
      legenda: 'Checagem de ritmo',
      mudar: {
        'compressor-1': { acao: 'olhando-monitor', fase: 0 },
        'compressor-2': { acao: 'olhando-monitor', fase: 0 },
        'via-aerea': { acao: 'segurando-mascara', fase: 0 },
        medicacao: { acao: 'olhando-monitor', fase: 0 },
        monitor: { acao: 'olhando-monitor', fase: 0, balao: 'AESP: ritmo organizado, sem pulso' },
        lider: { balao: 'Que ritmo? Alguém sente pulso?' },
        tempo: { balao: '2 minutos: checar o ritmo e trocar!' },
      },
    },
  },
];

function cenas(): ImagemDoCatalogo[] {
  const momentos = MOMENTOS.map(
    (m): ImagemDoCatalogo => ({
      id: `${PASTA}/cena-completa/${m.arquivo}`,
      titulo: `Cena completa da RCP — ${m.titulo}`,
      onde: 'Aba 🚨 Parada → Código (painel da cena) e tela de quem só assiste (professor/telão)',
      animada: true,
      variaPelaPele: true,
      nota: NOTA_CENA,
      desenhar: () => <DesenhoCenaRcp cena={cenaExemplo(m.faixa, m.cena)} />,
    }),
  );
  return [...completas(), ...momentos];
}

function completas(): ImagemDoCatalogo[] {
  return FAIXAS.map((f) => ({
    id: `${PASTA}/cena-completa/cena-${f}`,
    titulo: `Cena completa da RCP — ${NOME_FAIXA[f]} (alguém comprimindo)`,
    onde: 'Aba 🚨 Parada → Código (painel da cena) e tela de quem só assiste (professor/telão)',
    animada: true,
    variaPelaPele: true,
    nota: NOTA_CENA,
    desenhar: () => <DesenhoCenaRcp cena={cenaExemplo(f, f === 'adolescente' ? { mudar: { lider: { balao: 'Elisa: adrenalina 4,5 mL' }, medicacao: { balao: 'Entendido!' } } } : {})} />,
  }));
}

function pacientes(): ImagemDoCatalogo[] {
  const r: ImagemDoCatalogo[] = [];
  for (const f of FAIXAS) {
    const so: string[] = [];
    r.push({
      id: `${PASTA}/paciente/${f}-1-torax-normal`,
      titulo: `Paciente ${NOME_FAIXA[f]} — quadro 1: tórax em cima (sem circulação)`,
      onde: 'Aba 🚨 Parada → cena da RCP',
      animada: true,
      variaPelaPele: true,
      nota: NOTA_PACIENTE,
      desenhar: () => <RecorteCena cena={cenaExemplo(f, { compressao: 0 })} recorte={recortePaciente(f)} so={so} fundo={false} rotulo={`Paciente ${NOME_FAIXA[f]}, tórax em cima`} />,
    });
    r.push({
      id: `${PASTA}/paciente/${f}-2-torax-afundado`,
      titulo: `Paciente ${NOME_FAIXA[f]} — quadro 2: tórax afundado (compressão)`,
      onde: 'Aba 🚨 Parada → cena da RCP',
      animada: true,
      variaPelaPele: true,
      nota: NOTA_PACIENTE,
      desenhar: () => <RecorteCena cena={cenaExemplo(f, { compressao: 1 })} recorte={recortePaciente(f)} so={so} fundo={false} rotulo={`Paciente ${NOME_FAIXA[f]}, tórax afundado`} />,
    });
    r.push({
      id: `${PASTA}/paciente/${f}-3-tubo-acesso-pas`,
      titulo: `Paciente ${NOME_FAIXA[f]} — com tubo traqueal, acesso ${f === 'rn' || f === 'lactente' ? 'intraósseo (tíbia)' : 'periférico (antebraço)'} e pás do desfibrilador`,
      onde: 'Aba 🚨 Parada → cena da RCP (depois da intubação, do acesso e com o desfibrilador carregado)',
      variaPelaPele: true,
      nota: 'Tubo, cateter/agulha e pás são peças por cima do paciente: se trocar o paciente por um desenho seu, mantenha a boca, o braço e a perna nos mesmos lugares.',
      desenhar: () => (
        <RecorteCena
          cena={cenaExemplo(f, { compressao: 0, viaAerea: 'tubo', acesso: f === 'rn' || f === 'lactente' ? 'intraosseo' : 'periferico', carregado: true })}
          recorte={recortePaciente(f)}
          so={so}
          fundo={false}
          rotulo={`Paciente ${NOME_FAIXA[f]} com tubo, acesso e pás`}
        />
      ),
    });
  }
  r.push({
    id: `${PASTA}/paciente/crianca-4-com-retorno-da-circulacao`,
    titulo: 'Paciente criança — com retorno da circulação (pele corada, lábios rosados)',
    onde: 'Aba 🚨 Parada → cena da RCP (depois do RCE)',
    variaPelaPele: true,
    nota: 'Sem circulação a pele fica pálida/arroxeada; com o retorno, corada. Se trocar por desenho seu, faça as duas versões.',
    desenhar: () => <RecorteCena cena={cenaExemplo('crianca', { compressao: 0, rce: true, viaAerea: 'tubo', acesso: 'periferico' })} recorte={recortePaciente('crianca')} so={[]} fundo={false} rotulo="Paciente criança com retorno da circulação" />,
  });
  return r;
}

interface ExemploAvatar {
  arquivo: string;
  titulo: string;
  papel: string;
  faixa: FaixaPaciente;
  cena?: Partial<CenaRcp>;
  mudar: Partial<AvatarNaCena>;
}

const EXEMPLOS: ExemploAvatar[] = [
  { arquivo: '01-comprimindo-duas-maos-em-cima', titulo: 'Comprimindo com as duas mãos — em cima (tórax solto)', papel: 'compressor-1', faixa: 'adolescente', cena: { compressao: 0 }, mudar: { acao: 'comprimindo', fase: 0 } },
  { arquivo: '02-comprimindo-duas-maos-embaixo', titulo: 'Comprimindo com as duas mãos — embaixo (tórax afundado)', papel: 'compressor-1', faixa: 'adolescente', cena: { compressao: 1 }, mudar: { acao: 'comprimindo', fase: 1 } },
  { arquivo: '03-comprimindo-uma-mao', titulo: 'Comprimindo com uma mão (criança)', papel: 'compressor-1', faixa: 'crianca', cena: { compressao: 1 }, mudar: { acao: 'comprimindo', fase: 1 } },
  { arquivo: '04-comprimindo-dois-polegares', titulo: 'Comprimindo com os dois polegares, mãos envolvendo o tórax (lactente)', papel: 'compressor-1', faixa: 'lactente', cena: { compressao: 1 }, mudar: { acao: 'comprimindo', fase: 1 } },
  { arquivo: '05-ventilando-bolsa-solta', titulo: 'Ventilação: segurando a máscara (bolsa solta)', papel: 'via-aerea', faixa: 'crianca', cena: { compressao: 0 }, mudar: { acao: 'segurando-mascara', fase: 0 } },
  { arquivo: '06-ventilando-bolsa-apertada', titulo: 'Ventilação: apertando a bolsa (tórax sobe)', papel: 'via-aerea', faixa: 'crianca', cena: { compressao: 0, expansao: 1 }, mudar: { acao: 'ventilando', fase: 1 } },
  { arquivo: '07-ventilando-pelo-tubo', titulo: 'Ventilação pelo tubo traqueal', papel: 'via-aerea', faixa: 'adolescente', cena: { compressao: 0, viaAerea: 'tubo', expansao: 0.6 }, mudar: { acao: 'ventilando', fase: 0.6 } },
  { arquivo: '08-intubando', titulo: 'Intubando (laringoscópio e tubo)', papel: 'via-aerea', faixa: 'crianca', cena: { compressao: 0 }, mudar: { acao: 'intubando', fase: 0.5 } },
  { arquivo: '09-puncionando-intraosseo', titulo: 'Pegando acesso intraósseo (furadeira na tíbia)', papel: 'medicacao', faixa: 'lactente', mudar: { acao: 'puncionando', fase: 0.5 } },
  { arquivo: '10-puncionando-periferico', titulo: 'Pegando acesso periférico (antebraço)', papel: 'medicacao', faixa: 'crianca', mudar: { acao: 'puncionando', fase: 0.5 } },
  { arquivo: '11-injetando', titulo: 'Injetando a medicação no acesso (êmbolo andando)', papel: 'medicacao', faixa: 'crianca', cena: { acesso: 'periferico' }, mudar: { acao: 'injetando', fase: 0.5, balao: 'Adrenalina 2 mL!' } },
  { arquivo: '12-carregando', titulo: 'Carregando o desfibrilador', papel: 'monitor', faixa: 'crianca', cena: { carregado: true, compressao: 0 }, mudar: { acao: 'carregando', fase: 0.5, balao: 'Carregando 40 J' } },
  { arquivo: '13-chocando', titulo: 'Chocando (botão do choque)', papel: 'monitor', faixa: 'crianca', cena: { compressao: 0 }, mudar: { acao: 'chocando', fase: 1 } },
  { arquivo: '14-maos-ao-alto', titulo: 'Mãos ao alto ("afastem-se!")', papel: 'compressor-1', faixa: 'crianca', cena: { carregado: true, compressao: 0 }, mudar: { acao: 'maos-ao-alto', fase: 0 } },
  { arquivo: '15-olhando-o-monitor', titulo: 'Olhando o monitor (checagem de ritmo)', papel: 'compressor-1', faixa: 'crianca', cena: { checandoRitmo: true, compressao: 0 }, mudar: { acao: 'olhando-monitor', fase: 0 } },
  { arquivo: '16-cronometrando', titulo: 'Cronometrando (tempo)', papel: 'tempo', faixa: 'crianca', mudar: { acao: 'cronometrando', balao: '2 minutos: checar o ritmo!' } },
  { arquivo: '17-anotando', titulo: 'Anotando na prancheta', papel: 'registro', faixa: 'crianca', mudar: { acao: 'anotando', fase: 0.3 } },
  { arquivo: '18-lider-dando-ordem', titulo: 'Líder dando uma ordem (aponta e fala)', papel: 'lider', faixa: 'crianca', mudar: { acao: 'parado', balao: 'Fábio: carregar 40 J' } },
  { arquivo: '19-injetando-veia-do-pe-do-bebe', titulo: 'Injetando no acesso periférico do bebê (veia do pé)', papel: 'medicacao', faixa: 'lactente', cena: { acesso: 'periferico' }, mudar: { acao: 'injetando', fase: 0.5 } },
];

function avatares(): ImagemDoCatalogo[] {
  const r: ImagemDoCatalogo[] = EXEMPLOS.map((x) => {
    const cena = cenaExemplo(x.faixa, { ...x.cena, mudar: { [x.papel]: x.mudar } });
    return {
      id: `${PASTA}/avatar-por-acao/${x.arquivo}`,
      titulo: `Avatar: ${x.titulo}`,
      onde: 'Aba 🚨 Parada → cena da RCP (cada aluno vira um avatar)',
      animada: true,
      variaPelaPele: true,
      nota: NOTA_AVATAR,
      desenhar: () => <RecorteCena cena={cena} recorte={recorteDoLugar(cena, x.papel)} so={[x.papel]} rotulo={`Avatar ${x.titulo}`} />,
    };
  });
  for (const a of CABELOS_EXEMPLO) {
    r.push({
      id: `${PASTA}/aparencia/rosto-${a.arquivo}`,
      titulo: `Escolha da aparência: ${a.titulo}`,
      onde: 'Aba 🚨 Parada → Preparar (cada aluno escolhe pele, cabelo e cor do pijama)',
      variaPelaPele: true,
      nota: 'Rosto e ombros para escolher o avatar. O app combina pele, cabelo e cor do pijama; uma imagem sua aqui valeria só para essa combinação.',
      desenhar: () => <MiniAvatar aparencia={a.aparencia} tamanho={120} rotulo={a.titulo} />,
    });
  }
  return r;
}

function pecas(): ImagemDoCatalogo[] {
  const p = (arquivo: string, titulo: string, nota: string, desenhar: () => React.ReactNode): ImagemDoCatalogo => ({
    id: `${PASTA}/pecas/${arquivo}`,
    titulo,
    onde: 'Aba 🚨 Parada → cena da RCP',
    nota,
    desenhar,
  });
  return [
    p('fundo-da-sala', 'Fundo da sala (parede, chão, relógio, régua de oxigênio)', 'Fundo parado: pode ser uma foto/desenho seu da sala de emergência, no formato 800 × 380 (horizontal), sem pessoas e sem maca.', () => <PecaFundoSala />),
    p('maca', 'Maca (com prancha de RCP)', 'Fundo transparente (PNG), maca vista de lado, mesmo tamanho.', () => <PecaLeito faixa="crianca" />),
    p('berco-aquecido', 'Berço de calor radiante (RN)', 'Fundo transparente (PNG), berço visto de lado, mesmo tamanho.', () => <PecaLeito faixa="rn" />),
    p('carrinho-de-parada-desfibrilador', 'Carrinho de parada com monitor/desfibrilador', 'Os botões de carga e choque acendem no app: se trocar, deixe os botões no mesmo lugar (ou faça 2 quadros: normal e carregado).', () => <PecaCarrinho />),
    p('carrinho-de-parada-carregado', 'Carrinho de parada — desfibrilador carregado', 'Quadro "carregado" do carrinho (botão de choque aceso).', () => <PecaCarrinho carregado />),
    p('bolsa-valvula-mascara-solta', 'Bolsa-válvula-máscara (bolsa solta)', 'A bolsa amassa quando o aluno ventila: 2 quadros (solta e apertada), fundo transparente.', () => <PecaBolsa aperto={0} />),
    p('bolsa-valvula-mascara-apertada', 'Bolsa-válvula-máscara (bolsa apertada)', 'Quadro 2 da bolsa (apertada).', () => <PecaBolsa aperto={1} />),
    p('seringa', 'Seringa (o êmbolo anda quando injeta)', 'O êmbolo é uma peça separada que desliza: se trocar, faça o corpo e o êmbolo em imagens separadas.', () => <PecaSeringa />),
    p('pas-adesivas', 'Pás adesivas do desfibrilador', 'Aparecem no tórax quando o desfibrilador é carregado.', () => <PecaPas />),
    p('laringoscopio', 'Laringoscópio', 'Na mão de quem intuba.', () => <PecaLaringoscopio />),
  ];
}

/** Imagens da animação da RCP (aba 🚨 Parada). */
export const IMAGENS_DA_PARADA: ImagemDoCatalogo[] = [...cenas(), ...pacientes(), ...avatares(), ...pecas()];
