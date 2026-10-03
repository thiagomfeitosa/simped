import type { AparenciaAvatar, CenaRcp } from '../../parada/cena';

export interface PropsDesenhoCena {
  cena: CenaRcp;
  /** 'normal' = faixa no painel do código; 'grande' = tela de quem só assiste (professor, telão). */
  tamanho?: 'normal' | 'grande';
}

/** Desenha a cena da RCP (sem relógio próprio: quem chama monta a cena a cada quadro). ESBOÇO. */
export function DesenhoCenaRcp(_props: PropsDesenhoCena) {
  return null;
}

/** Rosto e ombros do avatar (para escolher a aparência no "Preparar"). ESBOÇO. */
export function MiniAvatar(_props: { aparencia: AparenciaAvatar; tamanho?: number; rotulo?: string }) {
  return null;
}
