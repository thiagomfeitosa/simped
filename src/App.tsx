import { type ComponentType, lazy, type LazyExoticComponent, Suspense, useEffect, useState } from 'react';
import { ProtecaoDeErro, RelatarProblema } from './diagnostico/ProtecaoDeErro';
import { AvisoNovaVersao, BotaoInstalar } from './pwa/ComponentesPwa';
import { papelDaJanela } from './sessao/papel';

/**
 * B20 — abas sob demanda: cada tela é um pedaço separado do app, baixado só quando
 * a aba é aberta pela primeira vez (o celular abre mais rápido). Depois de aberta,
 * a aba continua montada (escondida), como antes: trocar de aba não perde nada.
 * Com o app já aberto, as outras abas são baixadas em segundo plano (ver `adiantarAbas`).
 */
function telaSobDemanda(carregar: () => Promise<ComponentType>) {
  return { carregar, Tela: lazy(async () => ({ default: await carregar() })) };
}

/** Configurações, banco, casos e sessão (usados por todas as abas menos o Passo a passo). */
const carregarProvedores = () => import('./Provedores');
const Provedores = lazy(carregarProvedores);

const TELAS = {
  passoAPasso: telaSobDemanda(() => import('./componentes/passo-a-passo/TelaPassoAPasso').then((m) => m.TelaPassoAPasso)),
  prescrever: telaSobDemanda(() => import('./telas/Prescrever').then((m) => m.Prescrever)),
  treino: telaSobDemanda(() => import('./telas/TreinoContas').then((m) => m.TreinoContas)),
  calculadoras: telaSobDemanda(() => import('./telas/Calculadoras').then((m) => m.Calculadoras)),
  parada: telaSobDemanda(() => import('./telas/CodigoParada').then((m) => m.CodigoParada)),
  casos: telaSobDemanda(() => import('./telas/EditorCasos').then((m) => m.EditorCasos)),
  banco: telaSobDemanda(() => import('./telas/Banco').then((m) => m.Banco)),
  professor: telaSobDemanda(() => import('./telas/Professor').then((m) => m.Professor)),
  configuracoes: telaSobDemanda(() => import('./telas/Configuracoes').then((m) => m.Configuracoes)),
};

interface DefinicaoModo {
  id: string;
  rotulo: string;
  descricao: string;
  /** Abas principais mostram a descrição embaixo do nome; as outras, só ao passar o mouse. */
  principal?: boolean;
  /** Estilos do modo "Prescrever" (cores, botões, painéis) valem também para as telas simples. */
  classe?: string;
  /** Não usa banco, casos nem sessão: abre sem esperar esse pedaço do app (B20). */
  semProvedores?: boolean;
  tela: { carregar: () => Promise<unknown>; Tela: LazyExoticComponent<ComponentType> };
}

const MODOS: readonly DefinicaoModo[] = [
  {
    id: 'passo-a-passo',
    rotulo: 'Passo a passo',
    descricao: 'Aprender vendo as contas animadas',
    principal: true,
    semProvedores: true,
    tela: TELAS.passoAPasso,
  },
  {
    id: 'prescrever',
    rotulo: 'Prescrever',
    descricao: 'Praticar na folha, com o paciente reagindo',
    principal: true,
    classe: 'modo-prescrever',
    tela: TELAS.prescrever,
  },
  {
    id: 'parada',
    rotulo: '🚨 Parada',
    descricao: 'Código de parada: cronômetro, desfibrilador e carrinho com gavetas',
    classe: 'modo-prescrever',
    tela: TELAS.parada,
  },
  {
    id: 'treino',
    rotulo: '🧮 Treino',
    descricao: 'Contas, caça-erros e caderno de erros',
    classe: 'modo-prescrever',
    tela: TELAS.treino,
  },
  {
    id: 'calculadoras',
    rotulo: '📐 Calculadoras',
    descricao: 'SC, Holliday, VIG, infusão, diluição, gotejamento, sódio',
    classe: 'modo-prescrever',
    tela: TELAS.calculadoras,
  },
  {
    id: 'casos',
    rotulo: '✎ Casos',
    descricao: 'Criar ou copiar casos clínicos (editor)',
    classe: 'modo-prescrever',
    tela: TELAS.casos,
  },
  {
    id: 'banco',
    rotulo: '💊 Banco',
    descricao: 'Medicações, o que falta validar e importar a planilha',
    classe: 'modo-prescrever',
    tela: TELAS.banco,
  },
  {
    id: 'professor',
    rotulo: '👩‍🏫 Professor',
    descricao: 'Mudar sinais, disparar complicações e ver a folha do aluno ao vivo',
    classe: 'modo-prescrever',
    tela: TELAS.professor,
  },
  {
    id: 'configuracoes',
    rotulo: '⚙ Configurações',
    descricao: 'Fonte, hospital, modo prova, margem',
    classe: 'modo-prescrever',
    tela: TELAS.configuracoes,
  },
];

/** Janela do professor (B15): aberta pelo painel do professor, com ?papel=professor. */
const JANELA_DO_PROFESSOR = papelDaJanela() === 'professor';

/** O modo fica no endereço (#prescrever), então recarregar a página mantém a aba escolhida. */
function modoDoEndereco(): string {
  const id = window.location.hash.slice(1);
  return MODOS.some((m) => m.id === id) ? id : JANELA_DO_PROFESSOR ? 'professor' : 'passo-a-passo';
}

/**
 * Depois que a primeira aba abriu, baixa as outras quando o navegador estiver folgado:
 * a troca de aba fica instantânea e o app instalado (B18) funciona sem internet.
 */
function adiantarAbas() {
  const baixar = () => {
    void carregarProvedores().catch(() => undefined);
    MODOS.forEach((m) => void m.tela.carregar().catch(() => undefined));
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(baixar, { timeout: 4000 });
  else globalThis.setTimeout(baixar, 1500);
}

/** Enquanto o pedaço da aba chega (quase sempre imperceptível). */
function CarregandoAba() {
  return (
    <p className="carregando-aba" role="status">
      Abrindo…
    </p>
  );
}

export function App() {
  const [modo, setModo] = useState<string>(modoDoEndereco);
  // abas já abertas uma vez: continuam montadas (escondidas) para não perder nada
  const [abertas, setAbertas] = useState<ReadonlySet<string>>(() => new Set([modoDoEndereco()]));

  useEffect(() => {
    const aoMudar = () => {
      const novo = modoDoEndereco();
      setModo(novo);
      setAbertas((a) => (a.has(novo) ? a : new Set([...a, novo])));
    };
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  useEffect(adiantarAbas, []);

  // B17: no celular a barra do topo rola de lado; a aba escolhida fica sempre à vista
  useEffect(() => {
    document.querySelector('.modo-aba[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [modo]);

  /** Uma aba: só existe depois de aberta uma vez; depois fica montada (escondida). */
  const aba = (m: DefinicaoModo) => (
    <div key={m.id} hidden={modo !== m.id} className={m.classe}>
      {/* erro numa aba (inclusive falha ao baixá-la) mostra uma mensagem amigável só nela */}
      {abertas.has(m.id) && (
        <ProtecaoDeErro onde={m.rotulo}>
          <Suspense fallback={<CarregandoAba />}>
            <m.tela.Tela />
          </Suspense>
        </ProtecaoDeErro>
      )}
    </div>
  );
  const precisaDosProvedores = MODOS.some((m) => !m.semProvedores && modo === m.id);

  return (
    <>
      <nav className="modos" aria-label="Modo do SimPed">
        <span className="modos-marca" aria-hidden="true">
          Sim<b>Ped</b>
        </span>
        {MODOS.map((m) => (
          <a
            key={m.id}
            href={`#${m.id}`}
            className={m.principal ? 'modo-aba' : 'modo-aba secundaria'}
            title={m.descricao}
            aria-current={m.id === modo ? 'page' : undefined}
          >
            {m.rotulo}
            {m.principal && <small>{m.descricao}</small>}
          </a>
        ))}
        <BotaoInstalar />
        <RelatarProblema />
      </nav>
      {JANELA_DO_PROFESSOR && (
        <p className="banner-professor">
          👩‍🏫 Janela do professor — o que você faz aqui aparece na janela do aluno. A aba Prescrever desta janela mostra a mesma sessão do aluno.
        </p>
      )}

      {/* Toda aba aberta continua aberta: trocar de aba não apaga a prescrição nem a etapa do passo a passo. */}
      {MODOS.filter((m) => m.semProvedores).map(aba)}
      <ProtecaoDeErro onde="SimPed">
        <Suspense fallback={precisaDosProvedores ? <CarregandoAba /> : null}>
          <Provedores janelaDoProfessor={JANELA_DO_PROFESSOR}>{MODOS.filter((m) => !m.semProvedores).map(aba)}</Provedores>
        </Suspense>
      </ProtecaoDeErro>
      {/* B18: versão nova do site */}
      <AvisoNovaVersao />
    </>
  );
}
