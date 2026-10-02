/**
 * Peças pequenas usadas pelas abas Recém-nascido e Atenção básica:
 * sub-abas, escolha do tom de pele, selo de categoria e aviso "A VALIDAR".
 */

import type { ReactNode } from 'react';
import { NOME_TOM } from '../../ilustracoes/pele';
import { type TomDePele, TONS_DE_PELE } from '../../neonatal/exame';

export function Subabas<T extends string>({ partes, atual, aoEscolher, rotulo }: { partes: readonly { id: T; rotulo: string }[]; atual: T; aoEscolher: (id: T) => void; rotulo: string }) {
  return (
    <div className="subabas" role="group" aria-label={rotulo}>
      {partes.map((p) => (
        <button key={p.id} type="button" aria-pressed={atual === p.id} onClick={() => aoEscolher(p.id)}>
          {p.rotulo}
        </button>
      ))}
    </div>
  );
}

export function SeletorTom({ tom, aoMudar }: { tom: TomDePele; aoMudar: (t: TomDePele) => void }) {
  return (
    <span className="seletor-tom" role="group" aria-label="Tom de pele das ilustrações">
      {TONS_DE_PELE.map((t) => (
        <button key={t} type="button" aria-pressed={tom === t} onClick={() => aoMudar(t)} title={NOME_TOM[t]} className={`amostra-tom tom-${t}`}>
          <span className="sr-only">{NOME_TOM[t]}</span>
        </button>
      ))}
    </span>
  );
}

export function SeloCategoria({ categoria, urgente }: { categoria: 'normal' | 'variacao' | 'alterado'; urgente?: boolean }) {
  return (
    <>
      <span className={`selo selo-${categoria}`}>{categoria === 'normal' ? 'Normal' : categoria === 'variacao' ? 'Variação do normal' : 'Alterado'}</span>
      {urgente && <span className="selo selo-perigo">Urgente</span>}
    </>
  );
}

export function AvisoValidar({ children }: { children?: ReactNode }) {
  return (
    <p className="aviso-treino" role="note">
      ⚠️ Treinamento. {children ?? 'Textos, tabelas e números: A VALIDAR (conferir na fonte).'} Não substitui protocolos institucionais.
    </p>
  );
}
