/**
 * Código de parada: briefing (antes) e debriefing (depois) — DADOS.
 * ⚠️ A VALIDAR: roteiro escrito pelo assistente com base em AHA/PALS 2020 (dinâmica de equipe),
 * princípios de CRM (gestão de recursos em crise) e modelos de debriefing (GAS, PEARLS, plus/delta).
 */

import type { StatusValidacao } from './medicacoes/tipos';

const AV: StatusValidacao = 'A_VALIDAR';

export interface PapelEquipe {
  id: string;
  nome: string;
  tarefas: string;
}

export const PAPEIS_EQUIPE: readonly PapelEquipe[] = [
  { id: 'lider', nome: 'Líder', tarefas: 'Fica fora das mãos (não faz procedimento), olha o todo, decide, fala alto e confirma cada ordem.' },
  { id: 'compressor-1', nome: 'Compressões 1', tarefas: 'RCP de alta qualidade: 100–120/min, profundidade de 1/3 do tórax, retorno total, mínimo de pausas.' },
  { id: 'compressor-2', nome: 'Compressões 2', tarefas: 'Troca com o colega a cada 2 min (na checagem de ritmo) e confere a qualidade.' },
  { id: 'via-aerea', nome: 'Via aérea', tarefas: 'Bolsa-válvula-máscara com O₂ 100%, 15:2 (2 socorristas) ou 1 ventilação a cada 2–3 s com via aérea avançada.' },
  { id: 'medicacao', nome: 'Acesso e medicações', tarefas: 'EV/IO, prepara e aplica as drogas, fala a dose em voz alta e faz o flush.' },
  { id: 'monitor', nome: 'Monitor e desfibrilador', tarefas: 'Eletrodos/pás, lê o ritmo para o líder, carrega e choca com segurança ("afastem-se").' },
  { id: 'registro', nome: 'Registro e tempo', tarefas: 'Anota horários, avisa 2 min de RCP e o tempo desde a última adrenalina.' },
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
