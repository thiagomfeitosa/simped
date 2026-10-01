// Gera a planilha de apresentações a partir do banco de medicações (B8):
// docs/fase-0/apresentacoes-formulario.xlsx, sempre em dia com a lista.
// Uso: npm run gerar-planilha   (o mesmo arquivo também sai pelo botão da aba Banco)

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const carregar = async (caminho) =>
  (await runnerImport(join(raiz, caminho), { root: raiz, logLevel: 'silent', configFile: false })).module;
const { BANCO_MEDICACOES } = await carregar('src/dados/medicacoes/index.ts');
const { gerarPlanilhaApresentacoes } = await carregar('src/importacao/planilha.ts');

const destino = join(raiz, 'docs/fase-0/apresentacoes-formulario.xlsx');
writeFileSync(destino, gerarPlanilhaApresentacoes(BANCO_MEDICACOES));
console.log(`Planilha gerada com ${BANCO_MEDICACOES.length} medicações: docs/fase-0/apresentacoes-formulario.xlsx`);
