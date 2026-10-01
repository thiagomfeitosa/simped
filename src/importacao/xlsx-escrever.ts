/**
 * Escritor mínimo de planilhas .xlsx, sem biblioteca externa e sem internet (par do leitor em xlsx.ts).
 * Gera texto com alguns estilos fixos (cabeçalho, células amarelas para preencher, cinzas já prontas),
 * largura de colunas, painel congelado, filtro e listas de escolha. Não escreve fórmulas.
 *
 * O .zip sai sem compressão e com data fixa: a mesma planilha gera sempre os mesmos bytes
 * (o arquivo do projeto só muda quando o conteúdo muda).
 */

/** Estilos disponíveis (a ordem é o índice em styles.xml). */
const ESTILOS = ['padrao', 'titulo', 'texto', 'subtitulo', 'negrito', 'cabecalho', 'exemplo', 'pronta', 'preencher', 'legendaAmarela', 'legendaCinza'] as const;
export type EstiloCelula = (typeof ESTILOS)[number];

export interface CelulaEscrita {
  texto: string;
  estilo?: EstiloCelula;
}

/** Lista de escolha (validação de dados) numa coluna. */
export interface ListaDeEscolha {
  /** Coluna (0 = A). */
  coluna: number;
  /** Linhas (1 = primeira linha, como o Excel mostra). */
  deLinha: number;
  ateLinha: number;
  /** Opções fixas ("Sim", "Não") ou intervalo de outra aba ("Listas!$A$1:$A$18"). */
  opcoes: readonly string[] | { intervalo: string };
  /** Recusa o que não estiver na lista (padrão: aceita texto livre). */
  soDaLista?: boolean;
}

export interface AbaEscrita {
  /** Até 31 letras, sem []:*?/\ */
  nome: string;
  /** Linhas → células. `null` = célula vazia sem estilo. */
  linhas: readonly (readonly (CelulaEscrita | string | null)[])[];
  /** Largura de cada coluna (em caracteres). */
  larguras?: readonly number[];
  /** Altura da primeira linha (cabeçalho), em pontos. */
  alturaPrimeiraLinha?: number;
  /** Congela as primeiras colunas/linhas (ficam paradas ao rolar). */
  congelar?: { colunas: number; linhas: number };
  /** Filtro no cabeçalho (primeira linha). */
  filtro?: boolean;
  listas?: readonly ListaDeEscolha[];
}

// ---------- XML ----------

export function escaparXml(texto: string): string {
  return texto
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 0 → "A", 26 → "AA". */
export function letraDaColuna(indice: number): string {
  let n = indice + 1;
  let letras = '';
  while (n > 0) {
    const resto = (n - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    n = Math.floor((n - 1) / 26);
  }
  return letras;
}

const CABECALHO_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

const ESTILOS_XML = `${CABECALHO_XML}<styleSheet xmlns="${NS}">
<fonts count="8">
<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="14"/><name val="Arial"/></font>
<font><sz val="11"/><name val="Arial"/></font>
<font><b/><sz val="12"/><name val="Arial"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Arial"/></font>
<font><i/><sz val="10"/><color rgb="FF808080"/><name val="Arial"/></font>
<font><sz val="10"/><color rgb="FF000000"/><name val="Arial"/></font>
<font><b/><sz val="11"/><name val="Arial"/></font>
</fonts>
<fills count="5">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFFFF2CC"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEDEDED"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1F4E79"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFBFBFBF"/></left><right style="thin"><color rgb="FFBFBFBF"/></right><top style="thin"><color rgb="FFBFBFBF"/></top><bottom style="thin"><color rgb="FFBFBFBF"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="${ESTILOS.length}">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="7" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="5" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="6" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function xmlDaAba(aba: AbaEscrita): string {
  const largura = Math.max(1, ...aba.linhas.map((l) => l.length));
  const partes: string[] = [`${CABECALHO_XML}<worksheet xmlns="${NS}" xmlns:r="${NS_R}">`];
  partes.push(`<dimension ref="A1:${letraDaColuna(largura - 1)}${Math.max(1, aba.linhas.length)}"/>`);
  if (aba.congelar && (aba.congelar.colunas > 0 || aba.congelar.linhas > 0)) {
    const { colunas, linhas } = aba.congelar;
    const canto = `${letraDaColuna(colunas)}${linhas + 1}`;
    const painel = colunas > 0 && linhas > 0 ? 'bottomRight' : linhas > 0 ? 'bottomLeft' : 'topRight';
    partes.push(
      `<sheetViews><sheetView workbookViewId="0"><pane${colunas > 0 ? ` xSplit="${colunas}"` : ''}${linhas > 0 ? ` ySplit="${linhas}"` : ''} topLeftCell="${canto}" activePane="${painel}" state="frozen"/><selection pane="${painel}" activeCell="${canto}" sqref="${canto}"/></sheetView></sheetViews>`,
    );
  } else {
    partes.push('<sheetViews><sheetView workbookViewId="0"/></sheetViews>');
  }
  partes.push('<sheetFormatPr defaultRowHeight="15"/>');
  if (aba.larguras?.length) {
    partes.push(`<cols>${aba.larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`);
  }
  partes.push('<sheetData>');
  aba.linhas.forEach((linha, i) => {
    const r = i + 1;
    const altura = i === 0 && aba.alturaPrimeiraLinha ? ` ht="${aba.alturaPrimeiraLinha}" customHeight="1"` : '';
    const celulas = linha
      .map((c, j) => {
        if (c === null) return '';
        const { texto, estilo } = typeof c === 'string' ? { texto: c, estilo: undefined } : c;
        const s = estilo ? ESTILOS.indexOf(estilo) : 0;
        const ref = `${letraDaColuna(j)}${r}`;
        const atributoEstilo = s > 0 ? ` s="${s}"` : '';
        if (!texto) return s > 0 ? `<c r="${ref}"${atributoEstilo}/>` : '';
        return `<c r="${ref}"${atributoEstilo} t="inlineStr"><is><t xml:space="preserve">${escaparXml(texto)}</t></is></c>`;
      })
      .join('');
    partes.push(`<row r="${r}"${altura}>${celulas}</row>`);
  });
  partes.push('</sheetData>');
  if (aba.filtro && aba.linhas.length > 0) {
    partes.push(`<autoFilter ref="A1:${letraDaColuna(largura - 1)}${aba.linhas.length}"/>`);
  }
  if (aba.listas?.length) {
    partes.push(`<dataValidations count="${aba.listas.length}">`);
    for (const l of aba.listas) {
      const col = letraDaColuna(l.coluna);
      const formula = 'intervalo' in l.opcoes ? l.opcoes.intervalo : `"${l.opcoes.join(',')}"`;
      partes.push(
        `<dataValidation type="list" allowBlank="1" showErrorMessage="${l.soDaLista ? 1 : 0}" error="Escolha uma opção da lista." sqref="${col}${l.deLinha}:${col}${l.ateLinha}"><formula1>${escaparXml(formula)}</formula1></dataValidation>`,
      );
    }
    partes.push('</dataValidations>');
  }
  partes.push('<pageMargins left="0.7" right="0.7" top="0.75" bottom="0.75" header="0.3" footer="0.3"/>');
  partes.push('</worksheet>');
  return partes.join('');
}

// ---------- .zip (sem compressão) ----------

const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(dados: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < dados.length; i++) c = TABELA_CRC[(c ^ dados[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Data fixa (01/01/2026 00:00) no formato do .zip: o mesmo conteúdo gera os mesmos bytes. */
const DATA_DOS = ((2026 - 1980) << 9) | (1 << 5) | 1;

/** Junta arquivos num .zip sem compressão (método 0). */
export function escreverZip(arquivos: readonly { nome: string; conteudo: Uint8Array }[]): Uint8Array<ArrayBuffer> {
  const codificador = new TextEncoder();
  const locais: Uint8Array[] = [];
  const centrais: Uint8Array[] = [];
  let posicao = 0;
  for (const { nome, conteudo } of arquivos) {
    const nomeBytes = codificador.encode(nome);
    const crc = crc32(conteudo);
    const local = new Uint8Array(30 + nomeBytes.length);
    const v = new DataView(local.buffer);
    v.setUint32(0, 0x04034b50, true);
    v.setUint16(4, 20, true); // versão mínima
    v.setUint16(6, 0x0800, true); // nomes em UTF-8
    v.setUint16(8, 0, true); // sem compressão
    v.setUint16(10, 0, true); // hora
    v.setUint16(12, DATA_DOS, true);
    v.setUint32(14, crc, true);
    v.setUint32(18, conteudo.length, true);
    v.setUint32(22, conteudo.length, true);
    v.setUint16(26, nomeBytes.length, true);
    v.setUint16(28, 0, true);
    local.set(nomeBytes, 30);

    const central = new Uint8Array(46 + nomeBytes.length);
    const c = new DataView(central.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, 0, true);
    c.setUint16(14, DATA_DOS, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, conteudo.length, true);
    c.setUint32(24, conteudo.length, true);
    c.setUint16(28, nomeBytes.length, true);
    c.setUint32(42, posicao, true);
    central.set(nomeBytes, 46);

    locais.push(local, conteudo);
    centrais.push(central);
    posicao += local.length + conteudo.length;
  }
  const tamanhoCentral = centrais.reduce((s, x) => s + x.length, 0);
  const fim = new Uint8Array(22);
  const f = new DataView(fim.buffer);
  f.setUint32(0, 0x06054b50, true);
  f.setUint16(8, arquivos.length, true);
  f.setUint16(10, arquivos.length, true);
  f.setUint32(12, tamanhoCentral, true);
  f.setUint32(16, posicao, true);

  const total = new Uint8Array(posicao + tamanhoCentral + fim.length);
  let p = 0;
  for (const parte of [...locais, ...centrais, fim]) {
    total.set(parte, p);
    p += parte.length;
  }
  return total;
}

/** Monta o .xlsx (bytes) com as abas dadas. */
export function escreverXlsx(abas: readonly AbaEscrita[]): Uint8Array<ArrayBuffer> {
  if (abas.length === 0) throw new Error('A planilha precisa de pelo menos uma aba.');
  for (const a of abas) {
    if (!a.nome || a.nome.length > 31 || /[[\]:*?/\\]/.test(a.nome)) throw new Error(`Nome de aba inválido: "${a.nome}".`);
  }
  const cod = new TextEncoder();
  const tipos = `${CABECALHO_XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${abas
    .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join('')}<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`;
  const relsRaiz = `${CABECALHO_XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const pasta = `${CABECALHO_XML}<workbook xmlns="${NS}" xmlns:r="${NS_R}"><bookViews><workbookView/></bookViews><sheets>${abas
    .map((a, i) => `<sheet name="${escaparXml(a.nome)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('')}</sheets></workbook>`;
  const relsPasta = `${CABECALHO_XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${abas
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    )
    .join('')}<Relationship Id="rId${abas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

  return escreverZip([
    { nome: '[Content_Types].xml', conteudo: cod.encode(tipos) },
    { nome: '_rels/.rels', conteudo: cod.encode(relsRaiz) },
    { nome: 'xl/workbook.xml', conteudo: cod.encode(pasta) },
    { nome: 'xl/_rels/workbook.xml.rels', conteudo: cod.encode(relsPasta) },
    { nome: 'xl/styles.xml', conteudo: cod.encode(ESTILOS_XML) },
    ...abas.map((a, i) => ({ nome: `xl/worksheets/sheet${i + 1}.xml`, conteudo: cod.encode(xmlDaAba(a)) })),
  ]);
}
