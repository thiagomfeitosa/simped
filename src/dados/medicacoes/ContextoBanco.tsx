import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { aplicarApresentacoes } from '../../importacao/apresentacoes';
import { BANCO_MEDICACOES } from './index';
import type { Apresentacao, Medicacao } from './tipos';

const CHAVE = 'simped.apresentacoes-hospital';

interface ValorContexto {
  /** Banco em uso: o do projeto, com as apresentações importadas da planilha por cima. */
  banco: readonly Medicacao[];
  /** Apresentações importadas (medicação → lista). */
  importadas: Record<string, Apresentacao[]>;
  usarImportadas: (porMedicacao: Record<string, Apresentacao[]>) => void;
  descartarImportadas: () => void;
}

const Contexto = createContext<ValorContexto>({
  banco: BANCO_MEDICACOES,
  importadas: {},
  usarImportadas: () => {},
  descartarImportadas: () => {},
});

function lerGuardadas(): Record<string, Apresentacao[]> {
  try {
    const texto = window.localStorage.getItem(CHAVE);
    const obj = texto ? (JSON.parse(texto) as unknown) : {};
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? (obj as Record<string, Apresentacao[]>) : {};
  } catch {
    return {};
  }
}

/** Banco de medicações do app (com as apresentações do hospital importadas, se houver). */
export function ProvedorBanco({ children }: { children: ReactNode }) {
  const [importadas, setImportadas] = useState<Record<string, Apresentacao[]>>(lerGuardadas);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(importadas));
    } catch {
      // sem armazenamento: vale até fechar
    }
  }, [importadas]);

  const banco = useMemo(() => aplicarApresentacoes(BANCO_MEDICACOES, new Map(Object.entries(importadas))), [importadas]);

  return (
    <Contexto.Provider
      value={{ banco, importadas, usarImportadas: setImportadas, descartarImportadas: () => setImportadas({}) }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useBanco(): ValorContexto {
  return useContext(Contexto);
}
