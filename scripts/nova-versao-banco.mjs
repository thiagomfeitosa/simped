// Registra uma nova versão do banco de medicações (B7).
// Compara o banco atual com o da última versão (src/dados/medicacoes/versoes/banco-publicado.json),
// grava a lista do que mudou em versoes/historico-banco.json e atualiza o banco publicado.
// Uso: npm run nova-versao-banco -- "o que mudou (ex.: conferências de out/2026 enviadas pelo usuário)"

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runnerImport } from 'vite';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pasta = join(raiz, 'src/dados/medicacoes/versoes');
const arquivoHistorico = join(pasta, 'historico-banco.json');
const arquivoPublicado = join(pasta, 'banco-publicado.json');

const descricao = process.argv.slice(2).join(' ').trim();
if (!descricao) {
  console.error('Diga o que mudou. Exemplo: npm run nova-versao-banco -- "B8: 49 medicações A1–A50"');
  process.exit(1);
}

const carregar = async (caminho) =>
  (await runnerImport(join(raiz, caminho), { root: raiz, logLevel: 'silent', configFile: false })).module;
const { BANCO_MEDICACOES, VALIDACOES_DO_PROJETO } = await carregar('src/dados/medicacoes/index.ts');
const { novaVersao, dataBrasileira, NOME_TIPO_MUDANCA } = await carregar('src/dados/medicacoes/versao.ts');

const historico = JSON.parse(readFileSync(arquivoHistorico, 'utf8'));
const publicado = existsSync(arquivoPublicado) ? JSON.parse(readFileSync(arquivoPublicado, 'utf8')) : null;
const versao = novaVersao({
  historico: historico.versoes,
  publicado,
  atual: BANCO_MEDICACOES,
  descricao,
  agora: new Date(),
  conferencias: VALIDACOES_DO_PROJETO,
});

if (!versao) {
  console.log('O banco não mudou desde a última versão: nada a registrar.');
  process.exit(0);
}

historico.versoes.push(versao);
writeFileSync(arquivoHistorico, `${JSON.stringify(historico, null, 2)}\n`);
writeFileSync(arquivoPublicado, `${JSON.stringify(BANCO_MEDICACOES, null, 1)}\n`);

const contagem = {};
for (const m of versao.mudancas) contagem[m.tipo] = (contagem[m.tipo] ?? 0) + 1;
console.log(`Banco versão ${versao.versao} de ${dataBrasileira(versao.data)} (código ${versao.codigo}): ${descricao}`);
for (const [tipo, n] of Object.entries(contagem)) console.log(`  ${NOME_TIPO_MUDANCA[tipo] ?? tipo}: ${n}`);
