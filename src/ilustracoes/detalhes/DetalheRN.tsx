/**
 * Escolhe o desenho de perto certo para um achado do RN (tipo + nome do achado, vindos dos dados).
 */

import type { DetalheIlustrado } from '../../dados/neonatal/exame-rn-a-validar';
import type { TomDePele } from '../../neonatal/exame';
import { BocaDetalhe, type AchadoBoca } from './Boca';
import { CabecaDetalhe, type AchadoCabeca } from './Cabeca';
import { CostasDetalhe, type AchadoCostas } from './Costas';
import { type AchadoMao, type AchadoPe, type AchadoQuadril, MaoDetalhe, PeDetalhe, QuadrilDetalhe } from './Membros';
import { type AchadoOlho, OlhoDetalhe } from './Olho';
import { type LesaoPele, PeleDetalhe } from './Pele';
import { type AchadoRosto, RostoDetalhe } from './Rosto';
import { type AchadoUmbigo, UmbigoDetalhe } from './Umbigo';

export function DetalheRN({ detalhe, tom }: { detalhe: DetalheIlustrado; tom: TomDePele }) {
  switch (detalhe.tipo) {
    case 'pele':
      return <PeleDetalhe achado={detalhe.achado as LesaoPele} tom={tom} />;
    case 'rosto':
      return <RostoDetalhe achado={detalhe.achado as AchadoRosto} tom={tom} />;
    case 'olho':
      return <OlhoDetalhe achado={detalhe.achado as AchadoOlho} tom={tom} />;
    case 'boca':
      return <BocaDetalhe achado={detalhe.achado as AchadoBoca} tom={tom} />;
    case 'cabeca':
      return <CabecaDetalhe achado={detalhe.achado as AchadoCabeca} tom={tom} />;
    case 'costas':
      return <CostasDetalhe achado={detalhe.achado as AchadoCostas} tom={tom} />;
    case 'umbigo':
      return <UmbigoDetalhe achado={detalhe.achado as AchadoUmbigo} tom={tom} />;
    case 'pe':
      return <PeDetalhe achado={detalhe.achado as AchadoPe} tom={tom} />;
    case 'mao':
      return <MaoDetalhe achado={detalhe.achado as AchadoMao} tom={tom} />;
    case 'quadril':
      return <QuadrilDetalhe achado={detalhe.achado as AchadoQuadril} />;
  }
}
