import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../estilos-base.css';
import '../componentes/passo-a-passo/estilos.css';
import '../telas/estilos-prescrever.css';
import '../telas/estilos-paginas.css';
import '../telas/estilos-saude.css';
import '../telas/parada/estilos-parada.css';
import '../estilos.css';
import { catalogoDeImagens, NOME_DAS_PASTAS } from './catalogo';

/**
 * Galeria (http://localhost:5173/galeria.html no "npm run dev"): todas as ilustrações do app,
 * cada uma com o nome do arquivo que a substitui. O "npm run exportar-imagens" fotografa cada quadro.
 */
function Galeria() {
  const imagens = catalogoDeImagens();
  const pastas = [...new Set(imagens.map((i) => i.id.split('/')[0]!))];
  return (
    <main className="galeria-imagens">
      <h1>Galeria de imagens do SimPed ({imagens.length})</h1>
      <p>
        Para trocar uma imagem: salve a sua com o <strong>mesmo nome</strong> em <code>imagens/minhas/</code> (mesma pasta). Lista completa:{' '}
        <code>imagens/LISTA.md</code>.
      </p>
      {pastas.map((p) => (
        <section key={p}>
          <h2>
            {p} — {NOME_DAS_PASTAS[p] ?? ''}
          </h2>
          <div className="galeria-grade">
            {imagens
              .filter((i) => i.id.startsWith(`${p}/`))
              .map((i) => (
                <figure key={i.id} className="galeria-item" data-imagem={i.id}>
                  <div className="galeria-desenho">{i.desenhar()}</div>
                  <figcaption>
                    <code>{i.id.split('/').slice(1).join('/')}</code>
                    <strong>{i.titulo}</strong>
                    <small>{i.onde}</small>
                    {i.nota && <small>ℹ️ {i.nota}</small>}
                  </figcaption>
                </figure>
              ))}
          </div>
        </section>
      ))}
    </main>
  );
}

// o exportador (scripts/exportar-imagens.mjs) lê daqui o título, onde aparece e as notas de cada imagem
(window as unknown as { __CATALOGO__: unknown }).__CATALOGO__ = catalogoDeImagens().map(({ desenhar: _, ...resto }) => resto);

const estilo = document.createElement('style');
estilo.textContent = `
.galeria-imagens { padding: 16px; }
.galeria-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 12px; }
.galeria-item { margin: 0; border: 1px solid var(--borda); border-radius: 10px; background: var(--superficie); overflow: hidden; }
.galeria-desenho { width: 340px; max-width: 100%; padding: 8px; background: #fff; }
.galeria-desenho svg { max-width: 100%; height: auto; }
.galeria-item figcaption { display: flex; flex-direction: column; gap: 2px; padding: 8px; font-size: 13px; }
.galeria-item code { word-break: break-all; }
`;
document.head.appendChild(estilo);

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <Galeria />
  </StrictMode>,
);
