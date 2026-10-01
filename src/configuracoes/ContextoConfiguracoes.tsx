import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { type Configuracoes, CONFIGURACOES_PADRAO, escreverConfiguracoes, lerConfiguracoes } from './configuracoes';

const CHAVE = 'simped.configuracoes';

interface ValorContexto {
  config: Configuracoes;
  mudar: (mudanca: Partial<Configuracoes>) => void;
  restaurar: () => void;
}

const Contexto = createContext<ValorContexto>({ config: CONFIGURACOES_PADRAO, mudar: () => {}, restaurar: () => {} });

function lerGuardado(): Configuracoes {
  try {
    return lerConfiguracoes(window.localStorage.getItem(CHAVE));
  } catch {
    return CONFIGURACOES_PADRAO;
  }
}

/** Guarda as configurações no próprio computador (funciona sem internet). */
export function ProvedorConfiguracoes({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Configuracoes>(lerGuardado);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAVE, escreverConfiguracoes(config));
    } catch {
      // navegador sem armazenamento: as configurações valem só até fechar
    }
  }, [config]);

  return (
    <Contexto.Provider
      value={{
        config,
        mudar: (mudanca) => setConfig((atual) => ({ ...atual, ...mudanca })),
        restaurar: () => setConfig(CONFIGURACOES_PADRAO),
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useConfiguracoes(): ValorContexto {
  return useContext(Contexto);
}
