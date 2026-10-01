import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { aplicarApresentacoes } from '../../importacao/apresentacoes';
import { CATALOGO_FONTES, type DocumentoFonte, juntarCatalogos, lerCatalogo } from '../fontes/fontes';
import { BANCO_MEDICACOES } from './index';
import type { Apresentacao, Medicacao } from './tipos';
import { aplicarValidacoes, juntarHistoricos, lerValidacoes, registrarValidacao, type Validacao } from './validacoes';

const CHAVE = 'simped.apresentacoes-hospital';
const CHAVE_VALIDACOES = 'simped.validacoes';
const CHAVE_FONTES = 'simped.fontes';

interface ValorContexto {
  /** Banco em uso: o do projeto, com as apresentações importadas e as conferências feitas no app por cima. */
  banco: readonly Medicacao[];
  /** Banco antes das conferências feitas neste computador (para mostrar o "valor anterior"). */
  bancoSemValidacoesLocais: readonly Medicacao[];
  /** Apresentações importadas (medicação → lista). */
  importadas: Record<string, Apresentacao[]>;
  usarImportadas: (porMedicacao: Record<string, Apresentacao[]>) => void;
  descartarImportadas: () => void;
  /** Conferências feitas neste computador (modo validação, aba Banco), em ordem. */
  validacoes: readonly Validacao[];
  registrarValidacao: (v: Validacao) => void;
  carregarValidacoes: (lista: readonly Validacao[]) => void;
  apagarValidacoes: () => void;
  /** Catálogo de fontes: o do projeto + os documentos cadastrados no app. */
  catalogo: readonly DocumentoFonte[];
  documentosDoApp: readonly DocumentoFonte[];
  salvarDocumento: (doc: DocumentoFonte) => void;
  removerDocumento: (id: string) => void;
}

const nada = () => {};
const Contexto = createContext<ValorContexto>({
  banco: BANCO_MEDICACOES,
  bancoSemValidacoesLocais: BANCO_MEDICACOES,
  importadas: {},
  usarImportadas: nada,
  descartarImportadas: nada,
  validacoes: [],
  registrarValidacao: nada,
  carregarValidacoes: nada,
  apagarValidacoes: nada,
  catalogo: CATALOGO_FONTES,
  documentosDoApp: [],
  salvarDocumento: nada,
  removerDocumento: nada,
});

function ler(chave: string): string | null {
  try {
    return window.localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function lerGuardadas(): Record<string, Apresentacao[]> {
  try {
    const texto = ler(CHAVE);
    const obj = texto ? (JSON.parse(texto) as unknown) : {};
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? (obj as Record<string, Apresentacao[]>) : {};
  } catch {
    return {};
  }
}

function useGuardar(chave: string, valor: unknown) {
  useEffect(() => {
    try {
      window.localStorage.setItem(chave, JSON.stringify(valor));
    } catch {
      // sem armazenamento: vale até fechar
    }
  }, [chave, valor]);
}

/** Banco de medicações do app (com as apresentações do hospital importadas e as conferências feitas no app). */
export function ProvedorBanco({ children }: { children: ReactNode }) {
  const [importadas, setImportadas] = useState<Record<string, Apresentacao[]>>(lerGuardadas);
  const [validacoes, setValidacoes] = useState<Validacao[]>(() => lerValidacoes(ler(CHAVE_VALIDACOES)));
  const [documentosDoApp, setDocumentosDoApp] = useState<DocumentoFonte[]>(() => lerCatalogo(ler(CHAVE_FONTES)));
  useGuardar(CHAVE, importadas);
  useGuardar(CHAVE_VALIDACOES, validacoes);
  useGuardar(CHAVE_FONTES, documentosDoApp);

  const bancoSemValidacoesLocais = useMemo(
    () => aplicarApresentacoes(BANCO_MEDICACOES, new Map(Object.entries(importadas))),
    [importadas],
  );
  const banco = useMemo(() => aplicarValidacoes(bancoSemValidacoesLocais, validacoes), [bancoSemValidacoesLocais, validacoes]);
  const catalogo = useMemo(() => juntarCatalogos(CATALOGO_FONTES, documentosDoApp), [documentosDoApp]);

  return (
    <Contexto.Provider
      value={{
        banco,
        bancoSemValidacoesLocais,
        importadas,
        usarImportadas: setImportadas,
        descartarImportadas: () => setImportadas({}),
        validacoes,
        registrarValidacao: (v) => setValidacoes((h) => registrarValidacao(h, v)),
        carregarValidacoes: (lista) => setValidacoes((h) => juntarHistoricos(h, lista)),
        apagarValidacoes: () => setValidacoes([]),
        catalogo,
        documentosDoApp,
        salvarDocumento: (doc) => setDocumentosDoApp((l) => [...l.filter((d) => d.id !== doc.id), doc]),
        removerDocumento: (id) => setDocumentosDoApp((l) => l.filter((d) => d.id !== id)),
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useBanco(): ValorContexto {
  return useContext(Contexto);
}
