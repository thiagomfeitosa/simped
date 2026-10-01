/**
 * Planilha de apresentações gerada pelo app a partir do banco (B8): sempre em dia com a lista de medicações.
 * Mesmo formato do formulário original (docs/fase-0/apresentacoes-formulario.xlsx), que a importação
 * da aba Banco lê de volta (apresentacoes.ts). O "Nº" de cada linha é o `codigo` da medicação.
 *
 * O arquivo do projeto é gerado por `npm run gerar-planilha`; um teste avisa quando ele ficou velho.
 */

import { descreverBancoEmUso } from '../dados/medicacoes/versao';
import type { Apresentacao, Medicacao } from '../dados/medicacoes/tipos';
import { SECOES_DA_FOLHA } from '../dados/secoes';
import { type AbaEscrita, type CelulaEscrita, escreverXlsx } from './xlsx-escrever';

/** Cabeçalho da aba "Apresentações" (a importação procura as colunas pelo começo do texto). */
export const CABECALHO_PLANILHA = [
  'Nº',
  'Medicação',
  'Seção da prescrição',
  'O que o banco do SimPed tem hoje (só referência)',
  'Tem no hospital?',
  'Nome comercial / fabricante (opcional)',
  'Forma',
  'Via(s)',
  'Conteúdo total da unidade',
  'Volume da unidade (mL)',
  'Concentração como está no rótulo',
  'Precisa reconstituir?',
  'Reconstituição: diluente e volume',
  'Concentração após reconstituir (se informada)',
  'Rotina de diluição no hospital',
  'Diluente usado',
  'Usa a seringa da BIC de 12 mL?',
  'Onde conferi (fonte)',
  'Data da conferência',
  'Observações',
] as const;

const LARGURAS = [6, 26, 22, 46, 11, 20, 20, 14, 18, 12, 20, 13, 22, 20, 28, 14, 14, 18, 12, 30];

/** Colunas já preenchidas pelo app (cinzas); as outras são do usuário (amarelas). */
const COLUNAS_PRONTAS = 4;

const FORMAS = [
  'Ampola',
  'Frasco-ampola (pó)',
  'Frasco-ampola (solução)',
  'Bolsa/frasco de soro',
  'Flaconete',
  'Comprimido',
  'Comprimido dispersível',
  'Comprimido mastigável',
  'Cápsula',
  'Solução oral / xarope / elixir',
  'Suspensão oral',
  'Gotas',
  'Spray (aerossol)',
  'Pó inalatório',
  'Solução para nebulização',
  'Sachê / granulado',
  'Manipulado',
  'Outro',
];
const ONDE_CONFERI = ['Rótulo / caixa', 'Bula', 'Protocolo do hospital', 'Farmácia do hospital', 'Prescrição eletrônica do hospital', 'Outro'];

const EXEMPLO = [
  'EX',
  'EXEMPLO FICTÍCIO (não é uma droga real)',
  '—',
  '—',
  'Sim',
  '—',
  'Frasco-ampola (pó)',
  'EV',
  '500 mg',
  '',
  '500 mg',
  'Sim',
  '5 mL de água destilada',
  '100 mg/mL',
  'aspira 1 mL e completa até 10 mL com SF',
  'SF 0,9%',
  'Sim',
  'Bula',
  '01/10/2026',
  'Linha de exemplo: pode ignorar.',
];

/** Ordem da planilha: seção; dentro dela, a lista do MVP (1, 2, ... 8b) e depois a ampliação (A1, A2...). */
export function ordemDaPlanilha(a: Medicacao, b: Medicacao): number {
  const chave = (m: Medicacao) => {
    const c = (m.codigo ?? '').toUpperCase();
    const ampliacao = c.startsWith('A') ? 1 : 0;
    const numero = Number(/\d+/.exec(c)?.[0] ?? 9999);
    return [m.secao, ampliacao, numero, c] as const;
  };
  const x = chave(a);
  const y = chave(b);
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2] || x[3].localeCompare(y[3]);
}

const STATUS: Record<Apresentacao['status'], string> = { A_VALIDAR: 'A VALIDAR', CONFERIDO: 'CONFERIDA' };

/** "Ampola 5 mg/mL, 3 mL (15 mg) [A VALIDAR]; Comprimido 5 mg [A VALIDAR]". */
export function referenciaDaMedicacao(m: Medicacao): string {
  if (m.apresentacoes.length === 0) return '(nenhuma apresentação no banco)';
  return m.apresentacoes.map((a) => `${a.descricao} — ${a.vias.join('/') || 'via?'} [${STATUS[a.status]}]`).join('; ');
}

function tituloDaSecao(numero: number): string {
  const s = SECOES_DA_FOLHA.find((x) => x.numero === numero);
  return s ? `${s.numero}. ${s.titulo}` : String(numero);
}

function abaComoPreencher(banco: readonly Medicacao[], hospital: string): AbaEscrita {
  const t = (texto: string, estilo: CelulaEscrita['estilo'] = 'texto'): CelulaEscrita[] => [{ texto, estilo }];
  const versao = descreverBancoEmUso(banco);
  return {
    nome: 'Como preencher',
    larguras: [110],
    linhas: [
      t(`SimPed — levantamento das apresentações (${hospital})`, 'titulo'),
      t(`Gerada pelo app a partir do banco de medicações (${banco.length} medicações, banco ${versao.texto}).`),
      [],
      t('Para que serve', 'subtitulo'),
      t('Registrar as apresentações que o hospital realmente tem: forma, quanto de droga, volume, concentração e como a equipe prepara.'),
      t('Esses dados vão para o banco de medicações do SimPed, sempre com a fonte anotada.'),
      [],
      t('Como preencher', 'subtitulo'),
      t('1. Vá para a aba "Apresentações". Cada linha é uma medicação do banco do SimPed.'),
      t('2. Preencha só as células AMARELAS. As cinzas já vêm prontas.'),
      t('3. Uma linha por apresentação. Se o hospital tem mais de uma (ex.: dexametasona ampola e elixir),'),
      t('copie a linha inteira, cole logo abaixo e preencha cada uma (mantenha o mesmo Nº).'),
      t('4. Copie a concentração EXATAMENTE como está no rótulo (ex.: 19,1%; 40 mg/mL; 100 mcg/jato).'),
      t('5. Anote sempre onde conferiu (rótulo, bula, protocolo...). Sem fonte, o dado fica "A VALIDAR".'),
      t('6. Na dúvida, deixe em branco e escreva a dúvida em Observações. Não precisa preencher tudo de uma vez.'),
      [],
      t('Coluna "O que o banco do SimPed tem hoje"', 'subtitulo'),
      t('São as apresentações que o app usa agora. A VALIDAR = rascunho do assistente, de memória, NÃO conferido: use só como lembrete do que procurar.'),
      [],
      t('Linha de exemplo', 'subtitulo'),
      t('A 1ª linha da aba "Apresentações" (Nº = EX, em itálico) é um exemplo FICTÍCIO só para mostrar o formato. Pode ignorar.'),
      [],
      t('Quando terminar', 'subtitulo'),
      t('Na aba Banco do SimPed: "Importar planilha de apresentações" → escolher este arquivo. Ou envie numa conversa nova (ex.: "Cadastrar apresentações").'),
      [],
      t('⚠️ Ferramenta de treinamento. Não substitui protocolos institucionais.', 'negrito'),
      [],
      t('Legenda:', 'negrito'),
      t('Célula amarela = você preenche', 'legendaAmarela'),
      t('Célula cinza = já preenchida (não precisa mexer)', 'legendaCinza'),
    ],
  };
}

/** Linhas da aba "Apresentações" (cabeçalho, exemplo e uma linha por medicação). */
export function linhasDaPlanilha(banco: readonly Medicacao[]): string[][] {
  return [
    [...CABECALHO_PLANILHA],
    EXEMPLO,
    ...[...banco].sort(ordemDaPlanilha).map((m) => [
      m.codigo ?? '',
      m.nome,
      tituloDaSecao(m.secao),
      referenciaDaMedicacao(m),
      ...Array<string>(CABECALHO_PLANILHA.length - COLUNAS_PRONTAS).fill(''),
    ]),
  ];
}

/** Gera a planilha (.xlsx, bytes) com todas as medicações do banco. */
export function gerarPlanilhaApresentacoes(banco: readonly Medicacao[], hospital = 'Santa Casa'): Uint8Array<ArrayBuffer> {
  const linhas = linhasDaPlanilha(banco);
  // espaço para o usuário copiar linhas (mais de uma apresentação por medicação)
  const ate = linhas.length + 300;
  const col = (titulo: (typeof CABECALHO_PLANILHA)[number]) => CABECALHO_PLANILHA.indexOf(titulo);
  const apresentacoes: AbaEscrita = {
    nome: 'Apresentações',
    larguras: LARGURAS,
    alturaPrimeiraLinha: 60,
    congelar: { colunas: 2, linhas: 1 },
    filtro: true,
    linhas: linhas.map((l, i) =>
      l.map((texto, j): CelulaEscrita => ({
        texto,
        estilo: i === 0 ? 'cabecalho' : i === 1 ? 'exemplo' : j < COLUNAS_PRONTAS ? 'pronta' : 'preencher',
      })),
    ),
    listas: [
      { coluna: col('Tem no hospital?'), deLinha: 3, ateLinha: ate, opcoes: ['Sim', 'Não'], soDaLista: true },
      { coluna: col('Forma'), deLinha: 3, ateLinha: ate, opcoes: { intervalo: `Listas!$A$1:$A$${FORMAS.length}` } },
      { coluna: col('Precisa reconstituir?'), deLinha: 3, ateLinha: ate, opcoes: ['Sim', 'Não'], soDaLista: true },
      { coluna: col('Usa a seringa da BIC de 12 mL?'), deLinha: 3, ateLinha: ate, opcoes: ['Sim', 'Não', 'Não se aplica'], soDaLista: true },
      { coluna: col('Onde conferi (fonte)'), deLinha: 3, ateLinha: ate, opcoes: { intervalo: `Listas!$B$1:$B$${ONDE_CONFERI.length}` } },
    ],
  };
  const listas: AbaEscrita = {
    nome: 'Listas',
    larguras: [32, 34],
    linhas: FORMAS.map((f, i) => [f, ONDE_CONFERI[i] ?? null]),
  };
  return escreverXlsx([abaComoPreencher(banco, hospital), apresentacoes, listas]);
}
