import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useCasos } from '../casos/ContextoCasos';
import { CASOS } from '../casos/index';
import type { CasoClinico } from '../casos/tipos';
import { definirContexto } from '../diagnostico/relato';
import {
  type AcaoSessao,
  type Autor,
  fazerNaSessao,
  guardarSessao,
  iniciarSessao,
  lerSessaoGuardada,
  type RegistroSessao,
  type Sessao,
  type SessaoGuardada,
  temTrabalho,
} from './sessao';

const CHAVE_CASO = 'simped.caso-atual';
/** Sessão em andamento (B13): salva a cada ação, para continuar depois. */
export const CHAVE_SESSAO = 'simped.sessao-em-andamento';

function ler(chave: string): string | null {
  try {
    return window.localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave: string, valor: string | null): void {
  try {
    if (valor === null) window.localStorage.removeItem(chave);
    else window.localStorage.setItem(chave, valor);
  } catch {
    // sem armazenamento: só não lembra
  }
}

/** Sessão guardada no computador (ou null). */
export function sessaoGuardada(): SessaoGuardada | null {
  return lerSessaoGuardada(ler(CHAVE_SESSAO));
}

export function apagarSessaoGuardada(): void {
  gravar(CHAVE_SESSAO, null);
}

export interface ValorSessao {
  casos: readonly CasoClinico[];
  caso: CasoClinico;
  sessao: Sessao;
  /** Muda a cada sessão nova (troca de caso, recomeçar, continuar): as telas usam como `key`. */
  geracao: number;
  /** Faz uma ação na sessão (aluno, ou professor no painel do professor). */
  fazer: (acao: AcaoSessao, autor?: Autor) => void;
  /** Abre outro caso (sessão nova, do zero). */
  trocarCaso: (id: string) => void;
  /** Mesmo caso, do zero. */
  recomecar: () => void;
  /** Continua uma sessão guardada (B13). */
  continuar: (guardada: { casoId: string; registros: readonly RegistroSessao[] }) => void;
}

const Contexto = createContext<ValorSessao | null>(null);

/**
 * Sessão do caso em uso, compartilhada pelo Prescrever, pelo painel do professor e (B15) pela outra janela.
 * Guarda tudo no computador a cada ação (B13).
 */
export function ProvedorSessao({ children }: { children: ReactNode }) {
  const { personalizados } = useCasos();
  const casos = useMemo(() => [...CASOS, ...personalizados], [personalizados]);
  const [casoId, setCasoId] = useState<string>(() => ler(CHAVE_CASO) ?? CASOS[0]!.id);
  const caso = casos.find((c) => c.id === casoId) ?? CASOS[0]!;
  const [sessao, setSessao] = useState<Sessao>(() => iniciarSessao());
  const [geracao, setGeracao] = useState(0);

  const fazer = useCallback((acao: AcaoSessao, autor: Autor = 'aluno') => {
    setSessao((s) => fazerNaSessao(s, acao, new Date(), autor));
  }, []);

  const novaSessao = useCallback((id: string, registros: readonly RegistroSessao[] = []) => {
    setCasoId(id);
    gravar(CHAVE_CASO, id);
    setSessao(iniciarSessao(registros));
    setGeracao((g) => g + 1);
  }, []);

  // salva a sessão a cada ação (só quando já houve trabalho de verdade)
  useEffect(() => {
    if (temTrabalho(sessao.registros)) {
      gravar(CHAVE_SESSAO, JSON.stringify(guardarSessao(caso.id, caso.titulo, sessao.registros, new Date())));
    }
  }, [sessao.registros, caso.id, caso.titulo]);

  // o "Relatar problema" diz qual caso estava aberto
  useEffect(() => definirContexto('Caso do Prescrever', `${caso.titulo} (${caso.id})`), [caso.titulo, caso.id]);

  // o editor de casos pede para abrir um caso ("Jogar este caso")
  useEffect(() => {
    const abrir = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id === 'string') {
        apagarSessaoGuardada();
        novaSessao(id);
      }
    };
    window.addEventListener('simped:abrir-caso', abrir);
    return () => window.removeEventListener('simped:abrir-caso', abrir);
  }, [novaSessao]);

  const valor: ValorSessao = {
    casos,
    caso,
    sessao,
    geracao,
    fazer,
    trocarCaso: (id) => {
      apagarSessaoGuardada();
      novaSessao(id);
    },
    recomecar: () => {
      apagarSessaoGuardada();
      novaSessao(caso.id);
    },
    continuar: (g) => novaSessao(g.casoId, g.registros),
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): ValorSessao {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useSessao precisa estar dentro de <ProvedorSessao>.');
  return valor;
}
