import type { AchadoExame } from '../../dados/atencao-basica/exame-fisico-a-validar';
import { type AchadoGarganta, type AchadoOtoscopia, CriancaRosto, Garganta, Otoscopia, SinalDaPrega, SinalMeningeo } from '../../ilustracoes/AtencaoBasica';
import { type LesaoPele, PeleDetalhe } from '../../ilustracoes/detalhes/Pele';
import type { TomDePele } from '../../neonatal/exame';
import { RespiracaoAnimada } from '../RespiracaoAnimada';

/** O desenho certo de um achado do exame físico da atenção básica. */
export function DesenhoAchadoAB({ achado, tom = 'claro' }: { achado: AchadoExame; tom?: TomDePele }) {
  const d = achado.desenho;
  if (!d) return null;
  switch (d.tipo) {
    case 'otoscopia':
      return <Otoscopia achado={d.achado as AchadoOtoscopia} />;
    case 'garganta':
      return <Garganta achado={d.achado as AchadoGarganta} tom={tom} />;
    case 'pele':
      return <PeleDetalhe achado={d.achado as LesaoPele} tom={tom} titulo={achado.nome} />;
    case 'crianca':
      return <CriancaRosto estado={d.achado === 'desidratada' ? 'desidratada' : 'hidratada'} tom={tom} />;
    case 'prega':
      return <SinalDaPrega lenta={d.achado === 'lenta'} tom={tom} />;
    case 'respiracao':
      return <RespiracaoAnimada padrao={d.achado === 'tiragem' ? 'desconforto' : 'taquipneia'} fr={d.achado === 'tiragem' ? 58 : 56} />;
    case 'meningeo':
      return <SinalMeningeo achado={d.achado as 'nuca' | 'kernig' | 'brudzinski'} tom={tom} />;
  }
}
