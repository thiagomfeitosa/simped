/**
 * Leitor mínimo de planilhas .xlsx, sem biblioteca externa e sem internet.
 * Um .xlsx é um arquivo .zip com textos XML dentro; aqui se lê o .zip, descompacta (DecompressionStream,
 * presente nos navegadores e no Node) e lê as células de cada aba como texto.
 * Suficiente para a planilha de apresentações (texto e números); não lê fórmulas nem formatação.
 */

/** Uma aba: linhas → células (texto). Células vazias viram ''. */
export interface Aba {
  nome: string;
  linhas: string[][];
}

const ASSINATURA_FIM_DIRETORIO = 0x06054b50;
const ASSINATURA_DIRETORIO = 0x02014b50;
const ASSINATURA_ARQUIVO = 0x04034b50;

async function descompactar(dados: Uint8Array, metodo: number): Promise<Uint8Array> {
  if (metodo === 0) return dados;
  if (metodo !== 8) throw new Error(`Compressão do .zip não suportada (método ${metodo}).`);
  // cópia para um ArrayBuffer comum (o Blob não aceita SharedArrayBuffer)
  const fluxo = new Blob([dados.slice()]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(fluxo).arrayBuffer());
}

/** Lê os arquivos de dentro do .zip (nome → conteúdo em texto). */
export async function lerZip(bytes: Uint8Array): Promise<Map<string, string>> {
  const visao = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let fim = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (visao.getUint32(i, true) === ASSINATURA_FIM_DIRETORIO) {
      fim = i;
      break;
    }
  }
  if (fim < 0) throw new Error('O arquivo não é um .xlsx válido (zip sem diretório).');
  const total = visao.getUint16(fim + 10, true);
  let p = visao.getUint32(fim + 16, true);
  const decodificador = new TextDecoder('utf-8');
  const arquivos = new Map<string, string>();
  for (let k = 0; k < total; k++) {
    if (visao.getUint32(p, true) !== ASSINATURA_DIRETORIO) throw new Error('Diretório do .zip corrompido.');
    const metodo = visao.getUint16(p + 10, true);
    const tamanhoComprimido = visao.getUint32(p + 20, true);
    const tamanhoNome = visao.getUint16(p + 28, true);
    const tamanhoExtra = visao.getUint16(p + 30, true);
    const tamanhoComentario = visao.getUint16(p + 32, true);
    const inicioLocal = visao.getUint32(p + 42, true);
    const nome = decodificador.decode(bytes.subarray(p + 46, p + 46 + tamanhoNome));
    p += 46 + tamanhoNome + tamanhoExtra + tamanhoComentario;
    if (visao.getUint32(inicioLocal, true) !== ASSINATURA_ARQUIVO) throw new Error(`Arquivo "${nome}" corrompido no .zip.`);
    const nomeLocal = visao.getUint16(inicioLocal + 26, true);
    const extraLocal = visao.getUint16(inicioLocal + 28, true);
    const inicio = inicioLocal + 30 + nomeLocal + extraLocal;
    if (!nome.endsWith('.xml') && !nome.endsWith('.rels')) continue;
    const conteudo = await descompactar(bytes.subarray(inicio, inicio + tamanhoComprimido), metodo);
    arquivos.set(nome, decodificador.decode(conteudo));
  }
  return arquivos;
}

/** Desfaz &amp; &lt; &#233; etc. */
export function decodificarXml(texto: string): string {
  return texto
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Junta todos os pedaços <t>…</t> de um trecho (texto rico vem em vários <r><t>). */
function textosT(xml: string): string {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)].map((m) => decodificarXml(m[1] ?? '')).join('');
}

/** "C12" → índice da coluna (0 = A). */
export function indiceColuna(referencia: string): number {
  const letras = /^[A-Z]+/.exec(referencia)?.[0] ?? 'A';
  let n = 0;
  for (const l of letras) n = n * 26 + (l.charCodeAt(0) - 64);
  return n - 1;
}

/** Lê um .xlsx (bytes) e devolve as abas com as células em texto. */
export async function lerXlsx(bytes: Uint8Array): Promise<Aba[]> {
  const arquivos = await lerZip(bytes);
  const pastaDeTrabalho = arquivos.get('xl/workbook.xml');
  const relacoes = arquivos.get('xl/_rels/workbook.xml.rels');
  if (!pastaDeTrabalho || !relacoes) throw new Error('O arquivo não parece uma planilha do Excel (.xlsx).');

  const compartilhados = [...(arquivos.get('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textosT(m[1] ?? ''));
  const alvos = new Map<string, string>();
  for (const m of relacoes.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const atributos = m[1] ?? '';
    const id = /\bId="([^"]+)"/.exec(atributos)?.[1];
    const alvo = /\bTarget="([^"]+)"/.exec(atributos)?.[1];
    if (id && alvo) alvos.set(id, alvo.startsWith('/') ? alvo.slice(1) : `xl/${alvo}`);
  }

  const abas: Aba[] = [];
  for (const m of pastaDeTrabalho.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const atributos = m[1] ?? '';
    const nome = decodificarXml(/\bname="([^"]*)"/.exec(atributos)?.[1] ?? '');
    const rid = /\br:id="([^"]+)"/.exec(atributos)?.[1] ?? '';
    const xml = arquivos.get(alvos.get(rid) ?? '');
    if (!xml) continue;
    const linhas: string[][] = [];
    for (const linha of xml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>/g)) {
      const numero = Number(/\br="(\d+)"/.exec(linha[1] ?? '')?.[1] ?? linhas.length + 1);
      const celulas: string[] = [];
      for (const c of (linha[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const atributosCelula = c[1] ?? '';
        const conteudo = c[2] ?? '';
        const ref = /\br="([A-Z]+\d+)"/.exec(atributosCelula)?.[1] ?? '';
        const tipo = /\bt="([^"]+)"/.exec(atributosCelula)?.[1];
        const v = /<v>([\s\S]*?)<\/v>/.exec(conteudo)?.[1];
        let texto = '';
        if (tipo === 's' && v !== undefined) texto = compartilhados[Number(v)] ?? '';
        else if (tipo === 'inlineStr') texto = textosT(conteudo);
        else if (v !== undefined) texto = decodificarXml(v);
        const col = ref ? indiceColuna(ref) : celulas.length;
        while (celulas.length < col) celulas.push('');
        celulas[col] = texto.trim();
      }
      linhas[numero - 1] = celulas;
    }
    abas.push({ nome, linhas: Array.from(linhas, (l) => l ?? []) });
  }
  return abas;
}
