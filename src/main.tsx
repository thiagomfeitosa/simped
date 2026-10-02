import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { instalarCapturaDeErros } from './diagnostico/coletar';
import { ProtecaoDeErro } from './diagnostico/ProtecaoDeErro';
import { iniciarPwa } from './pwa/pwa';
// A ordem importa: primeiro as peças padronizadas (B19: cores, fonte, botões, campos), depois cada tela,
// a barra dos modos e, por fim, tablet/celular.
import './estilos-base.css';
import './componentes/passo-a-passo/estilos.css';
import './telas/estilos-prescrever.css';
import './telas/estilos-paginas.css';
import './estilos.css';
// B17: tablet e celular (por cima de tudo)
import './estilos-telas-pequenas.css';

instalarCapturaDeErros();
// B18: app instalável e sem internet (só na versão de site)
iniciarPwa();

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    {/* última proteção: se até a barra do topo falhar, aparece a mensagem em vez de tela branca */}
    <ProtecaoDeErro onde="SimPed">
      <App />
    </ProtecaoDeErro>
  </StrictMode>,
);
