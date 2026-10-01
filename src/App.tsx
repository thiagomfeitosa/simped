import { useEffect, useState } from 'react';
import { TelaPassoAPasso } from './componentes/passo-a-passo/TelaPassoAPasso';
import { Prescrever } from './telas/Prescrever';

type Modo = 'passo-a-passo' | 'prescrever';

const MODOS: readonly { id: Modo; rotulo: string; descricao: string }[] = [
  { id: 'passo-a-passo', rotulo: 'Passo a passo', descricao: 'Aprender vendo as contas animadas' },
  { id: 'prescrever', rotulo: 'Prescrever', descricao: 'Praticar na folha, com o paciente reagindo' },
];

/** O modo fica no endereço (#prescrever), então recarregar a página mantém a aba escolhida. */
function modoDoEndereco(): Modo {
  return window.location.hash === '#prescrever' ? 'prescrever' : 'passo-a-passo';
}

export function App() {
  const [modo, setModo] = useState<Modo>(modoDoEndereco);

  useEffect(() => {
    const aoMudar = () => setModo(modoDoEndereco());
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  return (
    <>
      <nav className="modos" aria-label="Modo do SimPed">
        <span className="modos-marca" aria-hidden="true">
          Sim<b>Ped</b>
        </span>
        {MODOS.map((m) => (
          <a key={m.id} href={`#${m.id}`} className="modo-aba" aria-current={m.id === modo ? 'page' : undefined}>
            {m.rotulo}
            <small>{m.descricao}</small>
          </a>
        ))}
      </nav>

      {/* As duas telas ficam abertas: trocar de aba não apaga a prescrição nem a etapa do passo a passo. */}
      <div hidden={modo !== 'passo-a-passo'}>
        <TelaPassoAPasso />
      </div>
      <div hidden={modo !== 'prescrever'} className="modo-prescrever">
        <Prescrever />
      </div>
    </>
  );
}
