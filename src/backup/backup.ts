/**
 * Backup e restauração (B4). Sem tela.
 *
 * Tudo o que o SimPed guarda no computador fica no armazenamento do navegador, em "gavetas" com nome
 * começando por "simped." (configurações, casos criados, histórico, apresentações importadas,
 * conferências, catálogo de fontes, caso em andamento...). O backup copia todas, do jeito que estão,
 * para um arquivo .json; a restauração põe o arquivo de volta (em outro computador, por exemplo).
 *
 * Gaveta nova que aparecer no futuro entra sozinha no backup (basta começar por "simped.").
 */

export const PREFIXO = 'simped.';

/** Gavetas que não entram no backup: passageiras, só valem enquanto o app está aberto. */
export const FORA_DO_BACKUP: readonly string[] = ['simped.canal'];

/** Nome de cada gaveta conhecida, para mostrar ao usuário. */
export const NOMES_DAS_GAVETAS: Readonly<Record<string, string>> = {
  'simped.configuracoes': 'Configurações',
  'simped.casos-personalizados': 'Casos criados no editor',
  'simped.historico': 'Histórico de relatórios',
  'simped.apresentacoes-hospital': 'Apresentações importadas da planilha',
  'simped.validacoes': 'Conferências do modo validação',
  'simped.fontes': 'Documentos cadastrados no catálogo de fontes',
  'simped.validador': 'Nome de quem confere',
  'simped.treino-placar': 'Placar do treino de contas',
  'simped.ritmo': 'Ritmo do passo a passo',
  'simped.caso-atual': 'Último caso aberto',
  'simped.sessao-em-andamento': 'Caso em andamento (continuar depois)',
};

export interface ArquivoBackup {
  formato: 'simped-backup';
  versao: 1;
  /** Data e hora do backup (ISO). */
  geradoEm: string;
  /** Banco de medicações em uso quando o backup foi feito (só para informação). */
  banco?: string;
  /** Gaveta → conteúdo, exatamente como estava guardado. */
  dados: Record<string, string>;
}

/** O mínimo do armazenamento do navegador (window.localStorage, ou um falso nos testes). */
export interface Armazenamento {
  readonly length: number;
  key(indice: number): string | null;
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

function entraNoBackup(chave: string): boolean {
  return chave.startsWith(PREFIXO) && !FORA_DO_BACKUP.includes(chave);
}

/** Gavetas do SimPed que existem agora neste armazenamento. */
export function gavetasGuardadas(a: Armazenamento): string[] {
  const chaves: string[] = [];
  for (let i = 0; i < a.length; i++) {
    const chave = a.key(i);
    if (chave && entraNoBackup(chave)) chaves.push(chave);
  }
  return chaves.sort();
}

export function criarBackup(a: Armazenamento, agora: Date, banco?: string): ArquivoBackup {
  const dados: Record<string, string> = {};
  for (const chave of gavetasGuardadas(a)) {
    const valor = a.getItem(chave);
    if (valor !== null) dados[chave] = valor;
  }
  return { formato: 'simped-backup', versao: 1, geradoEm: agora.toISOString(), ...(banco && { banco }), dados };
}

export function textoDoBackup(b: ArquivoBackup): string {
  return `${JSON.stringify(b, null, 2)}\n`;
}

/** "simped-backup-2026-10-01.json" (data do computador). */
export function nomeDoArquivo(agora: Date): string {
  const d = (n: number) => String(n).padStart(2, '0');
  return `simped-backup-${agora.getFullYear()}-${d(agora.getMonth() + 1)}-${d(agora.getDate())}.json`;
}

/** Lê um arquivo de backup. Recusa o que não for backup do SimPed e ignora gavetas estranhas. */
export function lerBackup(texto: string): { backup: ArquivoBackup; ignoradas: string[] } | { erro: string } {
  let dado: unknown;
  try {
    dado = JSON.parse(texto);
  } catch {
    return { erro: 'O arquivo não é um backup do SimPed (não é um .json válido).' };
  }
  const b = dado as Partial<ArquivoBackup> | null;
  if (!b || typeof b !== 'object' || b.formato !== 'simped-backup') return { erro: 'O arquivo não é um backup do SimPed.' };
  if (b.versao !== 1) return { erro: `Backup de uma versão do SimPed que este app não conhece (formato ${String(b.versao)}).` };
  if (!b.dados || typeof b.dados !== 'object' || Array.isArray(b.dados)) return { erro: 'O backup está sem os dados.' };
  const dados: Record<string, string> = {};
  const ignoradas: string[] = [];
  for (const [chave, valor] of Object.entries(b.dados)) {
    if (entraNoBackup(chave) && typeof valor === 'string') dados[chave] = valor;
    else ignoradas.push(chave);
  }
  return {
    backup: {
      formato: 'simped-backup',
      versao: 1,
      geradoEm: typeof b.geradoEm === 'string' ? b.geradoEm : '',
      ...(typeof b.banco === 'string' && { banco: b.banco }),
      dados,
    },
    ignoradas,
  };
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Quanto tem numa gaveta, em palavras ("3 casos", "12 relatórios"). */
export function detalheDaGaveta(chave: string, valor: string): string {
  let dado: unknown;
  try {
    dado = JSON.parse(valor);
  } catch {
    return valor.length > 40 ? `${valor.slice(0, 40)}…` : valor;
  }
  if (Array.isArray(dado)) {
    const n = dado.length;
    if (chave === 'simped.casos-personalizados') return plural(n, 'caso', 'casos');
    if (chave === 'simped.historico') return plural(n, 'relatório', 'relatórios');
    if (chave === 'simped.validacoes') return plural(n, 'conferência', 'conferências');
    if (chave === 'simped.fontes') return plural(n, 'documento', 'documentos');
    return plural(n, 'item', 'itens');
  }
  if (dado && typeof dado === 'object') {
    if (chave === 'simped.apresentacoes-hospital') {
      const listas = Object.values(dado as Record<string, unknown>).filter(Array.isArray);
      const total = listas.reduce((s, l) => s + l.length, 0);
      return `${plural(total, 'apresentação', 'apresentações')} de ${plural(listas.length, 'medicação', 'medicações')}`;
    }
    const titulo = (dado as { casoTitulo?: unknown }).casoTitulo;
    if (chave === 'simped.sessao-em-andamento' && typeof titulo === 'string') return titulo;
    const { tentativas, acertos } = dado as { tentativas?: unknown; acertos?: unknown };
    if (chave === 'simped.treino-placar' && typeof tentativas === 'number' && typeof acertos === 'number') {
      return `${acertos} de ${plural(tentativas, 'conta', 'contas')} certas`;
    }
    return 'guardado';
  }
  return String(dado);
}

export interface ItemDoResumo {
  chave: string;
  nome: string;
  detalhe: string;
}

/** Gaveta sem nada dentro ("[]", "{}", vazia): não vale a pena mostrar. */
export function gavetaVazia(valor: string): boolean {
  const t = valor.trim();
  return t === '' || t === '[]' || t === '{}' || t === 'null';
}

/** O que tem no backup (ou no computador), em linhas para mostrar (sem as gavetas vazias). */
export function resumirBackup(b: ArquivoBackup): ItemDoResumo[] {
  return Object.entries(b.dados)
    .filter(([, valor]) => !gavetaVazia(valor))
    .map(([chave, valor]) => ({ chave, nome: NOMES_DAS_GAVETAS[chave] ?? chave, detalhe: detalheDaGaveta(chave, valor) }))
    .sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
}

/**
 * Põe o backup no armazenamento: o que está no arquivo SUBSTITUI o que havia
 * (gavetas do SimPed que não estão no arquivo são apagadas). O app precisa recarregar depois.
 */
export function restaurarBackup(a: Armazenamento, b: ArquivoBackup): { gravadas: number; apagadas: number } {
  const apagar = gavetasGuardadas(a).filter((chave) => !(chave in b.dados));
  // grava primeiro: se faltar espaço no meio, nada do que havia foi apagado ainda
  let gravadas = 0;
  for (const [chave, valor] of Object.entries(b.dados)) {
    if (!entraNoBackup(chave)) continue;
    try {
      a.setItem(chave, valor);
    } catch {
      throw new Error('Não coube no armazenamento deste navegador. Libere espaço (ou use outro navegador) e tente de novo.');
    }
    gravadas++;
  }
  for (const chave of apagar) a.removeItem(chave);
  return { gravadas, apagadas: apagar.length };
}
