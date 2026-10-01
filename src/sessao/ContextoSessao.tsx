import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useCasos } from '../casos/ContextoCasos';
import { CASOS } from '../casos/index';
import type { CasoClinico } from '../casos/tipos';
import { definirContexto } from '../diagnostico/relato';
import { abrirCanal, type Canal, type MensagemCanal } from './canal';
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

/** B15: esta janela é a do aluno (dona da sessão) ou a do professor (espelho que manda ações)? */
export type Papel = 'aluno' | 'professor';

export function papelDaJanela(): Papel {
  try {
    return new URLSearchParams(window.location.search).get('papel') === 'professor' ? 'professor' : 'aluno';
  } catch {
    return 'aluno';
  }
}

/** Abre a janela do professor (mesmo app, com ?papel=professor). */
export function abrirJanelaProfessor(): void {
  const url = new URL(window.location.href);
  url.searchParams.set('papel', 'professor');
  url.hash = 'professor';
  window.open(url.toString(), 'simped-professor', 'width=1200,height=850');
}

export interface ValorSessao {
  papel: Papel;
  /** Janela do professor: já recebeu a sessão da janela do aluno? Quando? */
  conexao: { conectado: boolean; ultima?: Date };
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
  const [papel] = useState<Papel>(papelDaJanela);
  const espelho = papel === 'professor';
  const { personalizados } = useCasos();
  const casos = useMemo(() => [...CASOS, ...personalizados], [personalizados]);
  const [casoId, setCasoId] = useState<string>(() => ler(CHAVE_CASO) ?? CASOS[0]!.id);
  const caso = casos.find((c) => c.id === casoId) ?? CASOS[0]!;
  const [sessao, setSessao] = useState<Sessao>(() => iniciarSessao());
  const [geracao, setGeracao] = useState(0);
  const [conexao, setConexao] = useState<{ conectado: boolean; ultima?: Date }>({ conectado: false });
  const canal = useRef<Canal | null>(null);

  const novaSessao = useCallback((id: string, registros: readonly RegistroSessao[] = []) => {
    setCasoId(id);
    gravar(CHAVE_CASO, id);
    setSessao(iniciarSessao(registros));
    setGeracao((g) => g + 1);
  }, []);

  const fazer = useCallback(
    (acao: AcaoSessao, autor: Autor = 'aluno') => {
      // na janela do professor, a ação vai para a janela do aluno (que aplica e devolve o estado)
      if (espelho) canal.current?.enviar({ tipo: 'acao', acao });
      else setSessao((s) => fazerNaSessao(s, acao, new Date(), autor));
    },
    [espelho],
  );

  // B15: canal entre janelas
  const receber = useRef<(msg: MensagemCanal) => void>(() => {});
  receber.current = (msg) => {
    if (espelho) {
      if (msg.tipo === 'estado') {
        if (msg.casoId !== casoId) setCasoId(msg.casoId);
        setSessao(iniciarSessao(msg.registros));
        setGeracao(msg.geracao);
        setConexao({ conectado: true, ultima: new Date() });
      }
      return;
    }
    if (msg.tipo === 'ola') canal.current?.enviar({ tipo: 'estado', casoId: caso.id, geracao, registros: sessao.registros });
    else if (msg.tipo === 'acao') fazer(msg.acao, 'professor');
    else if (msg.tipo === 'trocarCaso' && casos.some((c) => c.id === msg.casoId)) {
      apagarSessaoGuardada();
      novaSessao(msg.casoId);
    }
  };
  useEffect(() => {
    const c = abrirCanal((msg) => receber.current(msg));
    canal.current = c;
    if (espelho) c.enviar({ tipo: 'ola' });
    return () => {
      c.fechar();
      canal.current = null;
    };
  }, [espelho]);

  // janela do aluno: manda a sessão para a janela do professor a cada mudança (agrupando digitação rápida)
  useEffect(() => {
    if (espelho) return;
    const id = window.setTimeout(
      () => canal.current?.enviar({ tipo: 'estado', casoId: caso.id, geracao, registros: sessao.registros }),
      120,
    );
    return () => window.clearTimeout(id);
  }, [espelho, sessao.registros, caso.id, geracao]);

  // salva a sessão a cada ação (só quando já houve trabalho de verdade; a janela do professor não salva)
  useEffect(() => {
    if (!espelho && temTrabalho(sessao.registros)) {
      gravar(CHAVE_SESSAO, JSON.stringify(guardarSessao(caso.id, caso.titulo, sessao.registros, new Date())));
    }
  }, [espelho, sessao.registros, caso.id, caso.titulo]);

  // o "Relatar problema" diz qual caso estava aberto
  useEffect(() => definirContexto('Caso do Prescrever', `${caso.titulo} (${caso.id})`), [caso.titulo, caso.id]);

  // o editor de casos pede para abrir um caso ("Jogar este caso")
  useEffect(() => {
    const abrir = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (typeof id === 'string' && !espelho) {
        apagarSessaoGuardada();
        novaSessao(id);
      }
    };
    window.addEventListener('simped:abrir-caso', abrir);
    return () => window.removeEventListener('simped:abrir-caso', abrir);
  }, [novaSessao, espelho]);

  const valor: ValorSessao = {
    papel,
    conexao,
    casos,
    caso,
    sessao,
    geracao,
    fazer,
    trocarCaso: (id) => {
      if (espelho) return canal.current?.enviar({ tipo: 'trocarCaso', casoId: id });
      apagarSessaoGuardada();
      novaSessao(id);
    },
    recomecar: () => {
      if (espelho) return canal.current?.enviar({ tipo: 'trocarCaso', casoId: caso.id });
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
