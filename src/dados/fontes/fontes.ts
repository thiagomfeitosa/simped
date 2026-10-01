/**
 * Funções do catálogo de fontes (B6): achar o documento de uma dose, descrever "de onde veio o número"
 * e conferir se o banco aponta para documentos que existem.
 */

import type { CodigoFonte, Fonte, Medicacao } from '../medicacoes/tipos';
import { CATALOGO_FONTES, type DocumentoFonte } from './catalogo';

export { CATALOGO_FONTES, type DocumentoFonte } from './catalogo';

/**
 * Documento que a fonte cita: o do `documentoId` ou, se ela citar só a sociedade,
 * o documento padrão dessa sociedade (marcado como "provável").
 */
export function documentoDaFonte(
  fonte: Fonte,
  catalogo: readonly DocumentoFonte[] = CATALOGO_FONTES,
): { documento: DocumentoFonte; provavel: boolean } | undefined {
  if (fonte.documentoId) {
    const doc = catalogo.find((d) => d.id === fonte.documentoId);
    return doc ? { documento: doc, provavel: false } : undefined;
  }
  const padrao = catalogo.find((d) => d.sociedade === fonte.codigo && d.padraoDaSociedade);
  return padrao ? { documento: padrao, provavel: true } : undefined;
}

/** "Tratado de Pediatria, 5ª ed., 2022". */
export function referenciaCurta(doc: DocumentoFonte): string {
  return [doc.titulo, doc.edicao, doc.ano?.toString()].filter(Boolean).join(', ');
}

/**
 * Texto de "de onde veio este número", para a tela.
 * Ex.: "SBP — Tratado de Pediatria, 5ª ed., 2022, p. 345" ou "SBP (documento provável: Tratado...)".
 */
export function descreverFonte(fonte: Fonte, catalogo: readonly DocumentoFonte[] = CATALOGO_FONTES): string {
  const pagina = fonte.pagina ? `, ${/^\s*(p\.|pág|tab|seç|cap)/i.test(fonte.pagina) ? '' : 'p. '}${fonte.pagina}` : '';
  if (fonte.documento && !fonte.documentoId) return `${fonte.codigo} — ${fonte.documento}${pagina}`;
  const achado = documentoDaFonte(fonte, catalogo);
  if (!achado) return `${fonte.codigo}${fonte.documentoId ? ` — documento "${fonte.documentoId}" fora do catálogo` : ' (documento não informado)'}${pagina}`;
  if (achado.provavel) return `${fonte.codigo} (documento provável: ${referenciaCurta(achado.documento)})${pagina}`;
  return `${fonte.codigo} — ${referenciaCurta(achado.documento)}${pagina}`;
}

/** Problemas no catálogo (roda nos testes e na aba Banco). */
export function verificarCatalogo(catalogo: readonly DocumentoFonte[]): string[] {
  const problemas: string[] = [];
  const ids = new Set<string>();
  const padroes = new Map<CodigoFonte, string>();
  for (const d of catalogo) {
    if (!d.id.trim()) problemas.push('Documento sem código.');
    if (ids.has(d.id)) problemas.push(`Documento repetido: ${d.id}.`);
    ids.add(d.id);
    if (!d.titulo.trim()) problemas.push(`${d.id}: sem título.`);
    if (d.ano !== undefined && (!Number.isInteger(d.ano) || d.ano < 1900 || d.ano > 2100)) problemas.push(`${d.id}: ano estranho (${d.ano}).`);
    if (d.padraoDaSociedade) {
      const outro = padroes.get(d.sociedade);
      if (outro) problemas.push(`${d.sociedade}: dois documentos padrão (${outro} e ${d.id}).`);
      padroes.set(d.sociedade, d.id);
    }
  }
  return problemas;
}

/** Cada fonte do banco aponta para um documento que existe e é da mesma sociedade? */
export function verificarFontesDoBanco(banco: readonly Medicacao[], catalogo: readonly DocumentoFonte[] = CATALOGO_FONTES): string[] {
  const problemas: string[] = [];
  const conferir = (onde: string, fonte: Fonte | undefined) => {
    if (!fonte?.documentoId) return;
    const doc = catalogo.find((d) => d.id === fonte.documentoId);
    if (!doc) problemas.push(`${onde}: documento "${fonte.documentoId}" não está no catálogo de fontes.`);
    else if (doc.sociedade !== fonte.codigo) problemas.push(`${onde}: documento ${doc.id} é da ${doc.sociedade}, mas a fonte diz ${fonte.codigo}.`);
  };
  for (const m of banco) {
    for (const a of m.apresentacoes) conferir(`${m.id}/${a.id}`, a.fonte);
    for (const r of m.regras) conferir(`${m.id}/${r.id}`, r.fonte);
    if (m.concentracaoMaximaEV) conferir(`${m.id}/concentração máxima`, m.concentracaoMaximaEV.fonte);
  }
  return problemas;
}

/** Junta o catálogo do projeto com os documentos cadastrados no app (o do app vale por cima, pelo código). */
export function juntarCatalogos(projeto: readonly DocumentoFonte[], doApp: readonly DocumentoFonte[]): DocumentoFonte[] {
  const porId = new Map(projeto.map((d) => [d.id, d]));
  for (const d of doApp) porId.set(d.id, d);
  return [...porId.values()];
}

/** Lê documentos guardados (JSON), descartando o que não tiver o formato mínimo. */
export function lerCatalogo(texto: string | null): DocumentoFonte[] {
  if (!texto) return [];
  try {
    const lista = JSON.parse(texto) as unknown;
    if (!Array.isArray(lista)) return [];
    return lista.filter(
      (d): d is DocumentoFonte =>
        !!d && typeof d === 'object' && typeof (d as DocumentoFonte).id === 'string' && typeof (d as DocumentoFonte).titulo === 'string' && typeof (d as DocumentoFonte).sociedade === 'string',
    );
  } catch {
    return [];
  }
}
