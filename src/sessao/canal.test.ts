import { describe, expect, it } from 'vitest';
import { abrirCanal, type MensagemCanal } from './canal';

const esperar = () => new Promise((r) => setTimeout(r, 30));

describe('canal entre janelas (B15)', () => {
  it('entrega a mensagem para a outra janela, não para quem mandou', async () => {
    const recebidosA: MensagemCanal[] = [];
    const recebidosB: MensagemCanal[] = [];
    const a = abrirCanal((m) => recebidosA.push(m), 'A');
    const b = abrirCanal((m) => recebidosB.push(m), 'B');
    a.enviar({ tipo: 'ola' });
    b.enviar({ tipo: 'acao', acao: { tipo: 'mensagem', texto: 'oi' }, de: 'professor' });
    await esperar();
    expect(recebidosB).toEqual([{ tipo: 'ola' }]);
    expect(recebidosA).toEqual([{ tipo: 'acao', acao: { tipo: 'mensagem', texto: 'oi' }, de: 'professor' }]);
    a.fechar();
    b.fechar();
  });
});
