import { type ReactNode, useEffect, useState } from 'react';
import { TelaPassoAPasso } from './componentes/passo-a-passo/TelaPassoAPasso';
import { ProvedorCasos } from './casos/ContextoCasos';
import { ProvedorConfiguracoes } from './configuracoes/ContextoConfiguracoes';
import { Calculadoras } from './telas/Calculadoras';
import { Configuracoes } from './telas/Configuracoes';
import { EditorCasos } from './telas/EditorCasos';
import { Prescrever } from './telas/Prescrever';
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
    id: 'configuracoes',
    rotulo: '⚙ Configurações',
    descricao: 'Fonte, hospital, modo prova, margem',
    classe: 'modo-prescrever',
    tela: () => <Configuracoes />,
  },
];

/** O modo fica no endereço (#prescrever), então recarregar a página mantém a aba escolhida. */
function modoDoEndereco(): string {
  const id = window.location.hash.slice(1);
  return MODOS.some((m) => m.id === id) ? id : 'passo-a-passo';
}

export function App() {
  const [modo, setModo] = useState<string>(modoDoEndereco);

  useEffect(() => {
    const aoMudar = () => setModo(modoDoEndereco());
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  return (
    <ProvedorConfiguracoes>
      <ProvedorCasos>
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
        </nav>

        {/* Todas as telas ficam abertas: trocar de aba não apaga a prescrição nem a etapa do passo a passo. */}
        {MODOS.map((m) => (
          <div key={m.id} hidden={modo !== m.id} className={m.classe}>
            {m.tela()}
          </div>
        ))}
      </ProvedorCasos>
    </ProvedorConfiguracoes>
  );
}
