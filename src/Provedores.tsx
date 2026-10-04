import type { ReactNode } from 'react';
import { ProvedorCasos } from './casos/ContextoCasos';
import { ProvedorConfiguracoes } from './configuracoes/ContextoConfiguracoes';
import { ProvedorBanco } from './dados/medicacoes/ContextoBanco';
import { ProvedorSessao } from './sessao/ContextoSessao';
import { PerguntaContinuar } from './sessao/PerguntaContinuar';

/**
 * B20 — tudo o que as abas de prática usam em comum (configurações, banco de medicações,
 * casos e a sessão do aluno) fica neste pedaço do app, baixado à parte.
 * O Passo a passo não depende dele: abre sem esperar o banco e os casos.
 */
export default function Provedores({ children, janelaEspelho }: { children: ReactNode; janelaEspelho: boolean }) {
  return (
    <ProvedorConfiguracoes>
      <ProvedorBanco>
        <ProvedorCasos>
          <ProvedorSessao>
            {children}
            {/* B13: continuar de onde parou (só na janela do aluno; a do professor e as extras da Parada só espelham) */}
            {!janelaEspelho && <PerguntaContinuar />}
          </ProvedorSessao>
        </ProvedorCasos>
      </ProvedorBanco>
    </ProvedorConfiguracoes>
  );
}
