import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import type { CasoClinico } from './tipos';

const CHAVE = 'simped.casos-personalizados';

interface ValorContexto {
  /** Casos criados no editor (guardados neste computador). */
  personalizados: CasoClinico[];
  salvar: (caso: CasoClinico) => void;
  remover: (id: string) => void;
}

const Contexto = createContext<ValorContexto>({ personalizados: [], salvar: () => {}, remover: () => {} });

function lerGuardados(): CasoClinico[] {
  try {
    const texto = window.localStorage.getItem(CHAVE);
    const lista = texto ? (JSON.parse(texto) as unknown) : [];
    return Array.isArray(lista) ? (lista.filter((c) => typeof c === 'object' && c && typeof c.id === 'string') as CasoClinico[]) : [];
  } catch {
    return [];
  }
}

/** Casos personalizados, compartilhados entre o editor e a aba Prescrever. */
export function ProvedorCasos({ children }: { children: ReactNode }) {
  const [personalizados, setPersonalizados] = useState<CasoClinico[]>(lerGuardados);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(personalizados));
    } catch {
      // sem armazenamento: os casos valem até fechar o app
    }
  }, [personalizados]);

  return (
    <Contexto.Provider
      value={{
        personalizados,
        salvar: (caso) => setPersonalizados((l) => [...l.filter((c) => c.id !== caso.id), caso]),
        remover: (id) => setPersonalizados((l) => l.filter((c) => c.id !== id)),
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useCasos(): ValorContexto {
  return useContext(Contexto);
}
