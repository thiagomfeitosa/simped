import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
// A ordem importa: primeiro a base (cores, fonte, botões), depois cada tela e por fim a barra dos modos.
import './componentes/passo-a-passo/estilos.css';
import './telas/estilos-prescrever.css';
import './estilos.css';

createRoot(document.getElementById('raiz')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
