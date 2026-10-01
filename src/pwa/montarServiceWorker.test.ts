import { describe, expect, it } from 'vitest';
import modelo from './sw-modelo.js?raw';
import { type ArquivoGerado, impressaoDigital, montarServiceWorker } from './montarServiceWorker';

const texto = (caminho: string, conteudo: string): ArquivoGerado => ({ caminho, conteudo: new TextEncoder().encode(conteudo) });

const GERADOS = [
  texto('index.html', '<html></html>'),
  texto('assets/index-abc.js', 'console.log(1)'),
  texto('icones/icone-192.png', 'png'),
  texto('manifest.webmanifest', '{}'),
  texto('sw.js', 'antigo'),
];

describe('B18 — service worker gerado no build', () => {
  it('lista os arquivos do app (menos o próprio sw.js) e põe a versão', () => {
    const sw = montarServiceWorker(modelo, GERADOS);
    expect(sw).toContain('"./assets/index-abc.js"');
    expect(sw).toContain('"./index.html"');
    expect(sw).toContain('"./manifest.webmanifest"');
    expect(sw).not.toContain('"./sw.js"');
    expect(sw).not.toContain('__VERSAO__');
    expect(sw).not.toContain('__ARQUIVOS__');
    expect(sw).toMatch(/const VERSAO = "[0-9a-f]{16}";/);
    // é JavaScript válido
    expect(() => new Function(sw)).not.toThrow();
  });

  it('qualquer mudança no app muda a versão (e o celular baixa de novo)', () => {
    const v1 = impressaoDigital(GERADOS);
    expect(impressaoDigital([...GERADOS].reverse())).toBe(v1);
    expect(impressaoDigital([...GERADOS.slice(0, 1), texto('assets/index-abc.js', 'console.log(2)'), ...GERADOS.slice(2)])).not.toBe(v1);
    expect(impressaoDigital([...GERADOS, texto('icones/novo.png', 'x')])).not.toBe(v1);
  });

  it('o sw.js antigo não muda a versão', () => {
    expect(impressaoDigital(GERADOS.filter((a) => a.caminho !== 'sw.js'))).toBe(
      impressaoDigital(GERADOS.filter((a) => a.caminho !== 'sw.js')),
    );
    const a = montarServiceWorker(modelo, GERADOS);
    const b = montarServiceWorker(modelo, [...GERADOS.slice(0, 4), texto('sw.js', 'outro')]);
    expect(a).toBe(b);
  });

  it('recusa modelo sem as marcas', () => {
    expect(() => montarServiceWorker('const x = 1;', GERADOS)).toThrow(/marcas/);
  });
});
