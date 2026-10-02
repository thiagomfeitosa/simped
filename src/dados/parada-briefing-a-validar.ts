/**
 * Código de parada: briefing (antes) e debriefing (depois) — DADOS.
 * ⚠️ A VALIDAR: roteiro escrito pelo assistente com base em AHA/PALS 2020 (dinâmica de equipe),
 * princípios de CRM (gestão de recursos em crise) e modelos de debriefing (GAS, PEARLS, plus/delta).
 */

import type { StatusValidacao } from './medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';

/** Painel que cada papel vê durante o código (os dois compressores dividem o mesmo). */
export type PainelPapel = 'lider' | 'compressoes' | 'ventilacao' | 'medicacao' | 'monitor' | 'tempo' | 'anotacao';

export interface PapelEquipe {
  id: string;
  nome: string;
  icone: string;
  painel: PainelPapel;
  tarefas: string;
}

export const PAPEIS_EQUIPE: readonly PapelEquipe[] = [
  { id: 'lider', nome: 'Líder', icone: '🗣️', painel: 'lider', tarefas: 'Fica fora das mãos (não faz procedimento), olha o todo, decide, dá as ordens em voz alta e confirma cada uma.' },
  { id: 'compressor-1', nome: 'Compressões 1', icone: '🫀', painel: 'compressoes', tarefas: 'RCP de alta qualidade: 100–120/min, profundidade de 1/3 do tórax, retorno total, mínimo de pausas.' },
  { id: 'compressor-2', nome: 'Compressões 2', icone: '🫀', painel: 'compressoes', tarefas: 'Reveza com o colega a cada 2 min (na checagem de ritmo) e confere a qualidade.' },
  { id: 'via-aerea', nome: 'Ventilação e via aérea', icone: '🫁', painel: 'ventilacao', tarefas: 'Bolsa-válvula-máscara com O₂ 100%: 2 ventilações a cada 15 compressões (30 no adolescente); com via aérea avançada, 1 a cada 2–3 s.' },
  { id: 'medicacao', nome: 'Acesso e medicações', icone: '💉', painel: 'medicacao', tarefas: 'EV/IO, prepara e aplica as drogas, fala a dose em voz alta, faz o flush e eleva o membro.' },
  { id: 'monitor', nome: 'Monitor e desfibrilador', icone: '⚡', painel: 'monitor', tarefas: 'Eletrodos/pás, lê o ritmo para o líder, carrega e choca com segurança ("afastem-se").' },
  { id: 'tempo', nome: 'Tempo', icone: '⏱️', painel: 'tempo', tarefas: 'Cronometra: avisa os 2 min de RCP (checar ritmo e trocar o compressor) e a hora da adrenalina (3–5 min).' },
  { id: 'registro', nome: 'Anotação', icone: '✍️', painel: 'anotacao', tarefas: 'Anota cada ação com o horário na folha do código e escreve as observações.' },
];

/** Ordens prontas do líder (comunicação em alça fechada: quem recebe responde "entendido"). */
export interface OrdemLider {
  id: string;
  texto: string;
  /** Papel que recebe a ordem. */
  para: string;
  /** Dica no campo do detalhe (o líder escreve a dose ou a energia). */
  detalhe?: string;
}

export const ORDENS_LIDER: readonly OrdemLider[] = [
  { id: 'checar', texto: 'Checar o ritmo', para: 'monitor' },
  { id: 'carregar', texto: 'Carregar o desfibrilador', para: 'monitor', detalhe: 'quantos J?' },
  { id: 'chocar', texto: 'Chocar', para: 'monitor' },
  { id: 'acesso', texto: 'Acesso EV ou intraósseo', para: 'medicacao' },
  { id: 'adrenalina', texto: 'Adrenalina', para: 'medicacao', detalhe: 'quantos mL?' },
  { id: 'amiodarona', texto: 'Amiodarona', para: 'medicacao', detalhe: 'quantos mL?' },
  { id: 'bolus', texto: 'SF 0,9% em bolus', para: 'medicacao', detalhe: 'quantos mL?' },
  { id: 'intubar', texto: 'Intubar', para: 'via-aerea' },
  { id: 'trocar', texto: 'Trocar o compressor', para: 'compressor-1' },
  { id: 'tempo', texto: 'Quanto tempo desde a última adrenalina?', para: 'tempo' },
];

export interface ItemBriefing {
  id: string;
  texto: string;
}

export const CHECKLIST_BRIEFING: readonly ItemBriefing[] = [
  { id: 'peso', texto: 'Peso (real ou estimado) falado para todos e doses calculadas (folha de emergência).' },
  { id: 'papeis', texto: 'Papéis distribuídos e confirmados em voz alta (cada um diz o seu).' },
  { id: 'via-aerea', texto: 'Via aérea pronta: O₂, aspirador, bolsa e máscara do tamanho certo, laringoscópio, tubos (± 0,5).' },
  { id: 'desfibrilador', texto: 'Desfibrilador ligado, pás/eletrodos do tamanho certo, energia do 1º choque combinada.' },
  { id: 'acesso', texto: 'Material de acesso EV e intraósseo separado.' },
  { id: 'drogas', texto: 'Adrenalina 1:10.000 preparada e identificada; dose em mL combinada.' },
  { id: 'comunicacao', texto: 'Combinado: comunicação em alça fechada ("adrenalina 0,8 mL" — "0,8 mL feito").' },
  { id: 'plano', texto: 'Plano dito em voz alta: o que fazer se o ritmo for chocável e se não for.' },
  { id: 'apoio', texto: 'Quem chama ajuda e quem conversa com a família.' },
];

/** Debriefing em 4 fases (GAS + PEARLS). */
export const FASES_DEBRIEFING: readonly { id: string; nome: string; pergunta: string }[] = [
  { id: 'reacao', nome: '1. Reação', pergunta: 'Como cada um está se sentindo depois do código?' },
  { id: 'descricao', nome: '2. Descrição', pergunta: 'O que aconteceu? (use a linha do tempo e os números abaixo)' },
  { id: 'analise', nome: '3. Análise (plus/delta)', pergunta: 'O que funcionou bem (+)? O que faríamos diferente (Δ)? Por quê?' },
  { id: 'resumo', nome: '4. Resumo', pergunta: 'Quais 2 ou 3 lições a equipe leva para o próximo código?' },
];

/** Comportamentos de equipe (CRM) para a equipe se autoavaliar. */
export const ITENS_CRM: readonly string[] = [
  'Liderança clara (um líder, fora das mãos)',
  'Papéis definidos e respeitados',
  'Comunicação em alça fechada',
  'Mensagens claras e tom de voz calmo',
  'Pediu ajuda cedo',
  'Reavaliou e resumiu a situação em voz alta',
  'Distribuiu a carga de trabalho',
  'Respeito mútuo e espaço para alertas ("parem, há um problema")',
];

/**
 * Pausas nas compressões usadas para ESTIMAR a fração de compressão torácica (o app não sabe quando
 * a RCP para de verdade). Meta: fração > 80%. A VALIDAR.
 */
export const PAUSAS_ESTIMADAS = { checagemS: 10, choqueS: 5, intubacaoS: 10, metaFracao: 0.8, status: AV } as const;
