import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { instalarCapturaDeErros } from './diagnostico/coletar';
import { ProtecaoDeErro } from './diagnostico/ProtecaoDeErro';
// A ordem importa: primeiro a base (cores, fonte, botões), depois cada tela e por fim a barra dos modos.
import './componentes/passo-a-passo/estilos.css';
import './telas/estilos-prescrever.css';
import './telas/estilos-paginas.css';
import './estilos.css';

instalarCapturaDeErros();

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    {/* última proteção: se até a barra do topo falhar, aparece a mensagem em vez de tela branca */}
    <ProtecaoDeErro onde="SimPed">
      <App />
    </ProtecaoDeErro>
  </StrictMode>,
);
