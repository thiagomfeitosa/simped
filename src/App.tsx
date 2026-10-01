import { type ReactNode, useEffect, useState } from 'react';
import { TelaPassoAPasso } from './componentes/passo-a-passo/TelaPassoAPasso';
import { ProvedorCasos } from './casos/ContextoCasos';
import { ProvedorConfiguracoes } from './configuracoes/ContextoConfiguracoes';
import { ProvedorBanco } from './dados/medicacoes/ContextoBanco';
import { ProtecaoDeErro, RelatarProblema } from './diagnostico/ProtecaoDeErro';
import { AvisoNovaVersao, BotaoInstalar } from './pwa/ComponentesPwa';
import { papelDaJanela, ProvedorSessao } from './sessao/ContextoSessao';
import { PerguntaContinuar } from './sessao/PerguntaContinuar';
import { Banco } from './telas/Banco';
import { Calculadoras } from './telas/Calculadoras';
import { Configuracoes } from './telas/Configuracoes';
import { EditorCasos } from './telas/EditorCasos';
import { Prescrever } from './telas/Prescrever';
import { Professor } from './telas/Professor';
import { TreinoContas } from './telas/TreinoContas';

interface DefinicaoModo {
  id: string;
  rotulo: string;
  descricao: string;
  /** Abas principais mostram a descrição embaixo do nome; as outras, só ao passar o mouse. */
  principal?: boolean;
  /** Estilos do modo "Prescrever" (cores, botões, painéis) valem também para as telas simples. */
  classe?: string;
  tela: () => ReactNode;
}

const MODOS: readonly DefinicaoModo[] = [
  {
    id: 'passo-a-passo',
    rotulo: 'Passo a passo',
    descricao: 'Aprender vendo as contas animadas',
    principal: true,
    tela: () => <TelaPassoAPasso />,
  },
  {
    id: 'prescrever',
    rotulo: 'Prescrever',
    descricao: 'Praticar na folha, com o paciente reagindo',
    principal: true,
    classe: 'modo-prescrever',
    tela: () => <Prescrever />,
  },
  {
    id: 'treino',
    rotulo: '🧮 Treino',
    descricao: 'Contas sem fim com números inventados',
    classe: 'modo-prescrever',
    tela: () => <TreinoContas />,
  },
  {
    id: 'calculadoras',
    rotulo: '📐 Calculadoras',
    descricao: 'SC, Holliday, VIG, infusão, diluição, gotejamento, sódio',
    classe: 'modo-prescrever',
    tela: () => <Calculadoras />,
  },
  {
    id: 'casos',
    rotulo: '✎ Casos',
    descricao: 'Criar ou copiar casos clínicos (editor)',
    classe: 'modo-prescrever',
    tela: () => <EditorCasos />,
  },
  {
    id: 'banco',
    rotulo: '💊 Banco',
    descricao: 'Medicações, o que falta validar e importar a planilha',
    classe: 'modo-prescrever',
    tela: () => <Banco />,
  },
  {
    id: 'professor',
    rotulo: '👩‍🏫 Professor',
    descricao: 'Mudar sinais, disparar complicações e ver a folha do aluno ao vivo',
    classe: 'modo-prescrever',
    tela: () => <Professor />,
  },
  {
    id: 'configuracoes',
    rotulo: '⚙ Configurações',
    descricao: 'Fonte, hospital, modo prova, margem',
    classe: 'modo-prescrever',
    tela: () => <Configuracoes />,
  },
];

/** Janela do professor (B15): aberta pelo painel do professor, com ?papel=professor. */
const JANELA_DO_PROFESSOR = papelDaJanela() === 'professor';

/** O modo fica no endereço (#prescrever), então recarregar a página mantém a aba escolhida. */
function modoDoEndereco(): string {
  const id = window.location.hash.slice(1);
  return MODOS.some((m) => m.id === id) ? id : JANELA_DO_PROFESSOR ? 'professor' : 'passo-a-passo';
}

export function App() {
  const [modo, setModo] = useState<string>(modoDoEndereco);

  useEffect(() => {
    const aoMudar = () => setModo(modoDoEndereco());
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  // B17: no celular a barra do topo rola de lado; a aba escolhida fica sempre à vista
  useEffect(() => {
    document.querySelector('.modo-aba[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [modo]);

  return (
    <ProvedorConfiguracoes>
      <ProvedorBanco>
        <ProvedorCasos>
          <ProvedorSessao>
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

            {/* Todas as telas ficam abertas: trocar de aba não apaga a prescrição nem a etapa do passo a passo. */}
            {MODOS.map((m) => (
              <div key={m.id} hidden={modo !== m.id} className={m.classe}>
                {/* erro numa aba mostra uma mensagem amigável só nela; as outras continuam funcionando */}
                <ProtecaoDeErro onde={m.rotulo}>{m.tela()}</ProtecaoDeErro>
              </div>
            ))}
            {/* B13: continuar de onde parou (só na janela do aluno) */}
            {!JANELA_DO_PROFESSOR && <PerguntaContinuar />}
            {/* B18: versão nova do site */}
            <AvisoNovaVersao />
          </ProvedorSessao>
        </ProvedorCasos>
      </ProvedorBanco>
    </ProvedorConfiguracoes>
  );
}
