import { describe, expect, it } from 'vitest';
import {
  ASSUNTO_DA_CATEGORIA,
  CADERNO_VAZIO,
  type Caderno,
  diaDe,
  evolucaoDoAssunto,
  lerCadernoDeTexto,
  registrarNoCaderno,
  situacaoDoCaderno,
  tiposParaTreinoDirigido,
} from './caderno';
import { CATEGORIAS_ERRO } from './cacaErros';
import { TIPOS_DE_EXERCICIO } from './treino';

const dia = (d: string) => new Date(`${d}T10:00:00`);

describe('caderno de erros', () => {
  it('todo tipo de erro do caça-erros cai num assunto do caderno', () => {
    for (const c of Object.keys(CATEGORIAS_ERRO) as (keyof typeof CATEGORIAS_ERRO)[]) {
      const a = ASSUNTO_DA_CATEGORIA[c];
      expect(a === 'seguranca' || a in TIPOS_DE_EXERCICIO, c).toBe(true);
    }
  });

  it('errou → caixa 1 e revisar hoje; acertando sobe a caixa e afasta a revisão', () => {
    let c: Caderno = registrarNoCaderno(CADERNO_VAZIO, 'rediluicao', false, 'treino', dia('2026-10-01'));
    expect(c.assuntos.rediluicao).toMatchObject({ caixa: 1, proxima: '2026-10-01', tentativas: 1, acertos: 0 });
    c = registrarNoCaderno(c, 'rediluicao', true, 'treino', dia('2026-10-01'));
    expect(c.assuntos.rediluicao).toMatchObject({ caixa: 2, proxima: '2026-10-02' });
    c = registrarNoCaderno(c, 'rediluicao', true, 'caca', dia('2026-10-02'));
    expect(c.assuntos.rediluicao).toMatchObject({ caixa: 3, proxima: '2026-10-05', origens: { treino: 2, caca: 1 } });
    c = registrarNoCaderno(c, 'rediluicao', false, 'treino', dia('2026-10-05'));
    expect(c.assuntos.rediluicao).toMatchObject({ caixa: 1, proxima: '2026-10-05' });
  });

  it('treino dirigido: primeiro o que venceu; senão, os de menor acerto; vazio = tudo', () => {
    expect(tiposParaTreinoDirigido(CADERNO_VAZIO, dia('2026-10-01'))).toBeNull();
    let c = registrarNoCaderno(CADERNO_VAZIO, 'vig', false, 'treino', dia('2026-10-01'));
    c = registrarNoCaderno(c, 'bic', true, 'treino', dia('2026-10-01'));
    c = registrarNoCaderno(c, 'seguranca', false, 'caca', dia('2026-10-01'));
    expect(tiposParaTreinoDirigido(c, dia('2026-10-01'))).toEqual(['vig']);
    // no dia seguinte a BIC também venceu (caixa 2 = 1 dia); a segurança nunca vira conta
    expect(tiposParaTreinoDirigido(c, dia('2026-10-02'))).toEqual(['vig', 'bic']);
  });

  it('situação ordenada do mais fraco para o mais forte, com evolução por dia', () => {
    let c = CADERNO_VAZIO;
    for (const ok of [true, true, false]) c = registrarNoCaderno(c, 'vazao', ok, 'treino', dia('2026-10-01'));
    for (const ok of [true, true]) c = registrarNoCaderno(c, 'vazao', ok, 'treino', dia('2026-10-03'));
    c = registrarNoCaderno(c, 'volume', true, 'treino', dia('2026-10-03'));
    const s = situacaoDoCaderno(c, dia('2026-10-03'));
    expect(s[0]!.assunto).toBe('vazao');
    expect(s[0]!.taxaRecente).toBeCloseTo(0.8, 5);
    expect(evolucaoDoAssunto(c, 'vazao')).toEqual([
      { dia: '2026-10-01', taxa: 2 / 3, tentativas: 3 },
      { dia: '2026-10-03', taxa: 1, tentativas: 2 },
    ]);
  });

  it('guarda só os 10 últimos resultados e lê com segurança o que estiver guardado', () => {
    let c = CADERNO_VAZIO;
    for (let i = 0; i < 15; i++) c = registrarNoCaderno(c, 'volume', i % 2 === 0, 'treino', dia('2026-10-01'));
    expect(c.assuntos.volume!.ultimos).toHaveLength(10);
    expect(lerCadernoDeTexto(JSON.stringify(c))).toEqual(c);
    expect(lerCadernoDeTexto('lixo')).toEqual(CADERNO_VAZIO);
    expect(lerCadernoDeTexto(null)).toEqual(CADERNO_VAZIO);
    expect(diaDe(dia('2026-01-05'))).toBe('2026-01-05');
  });
});
