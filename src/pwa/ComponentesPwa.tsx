import { useState } from 'react';
import { aparelho, atualizarAgora, COMO_INSTALAR, instalar, usaServiceWorker, usePwa } from './pwa';

/** B18: botão "📲 Instalar" na barra do topo (só quando o navegador deixa instalar pelo app). */
export function BotaoInstalar() {
  const { podeInstalar, instalado } = usePwa();
  if (!podeInstalar || instalado) return null;
  return (
    <button type="button" className="botao-instalar" onClick={() => void instalar()} title="Instalar o SimPed como app neste aparelho (abre sem internet)">
      📲 Instalar
    </button>
  );
}

/** B18: aviso de versão nova do site (aparece embaixo; troca só quando o usuário clicar). */
export function AvisoNovaVersao() {
  const { novaVersao } = usePwa();
  const [depois, setDepois] = useState(false);
  if (!novaVersao || depois) return null;
  return (
    <div className="aviso-versao" role="status" aria-label="Nova versão do SimPed">
      <span>🔄 Há uma versão nova do SimPed. O que está guardado neste aparelho continua.</span>
      <button type="button" className="botao-principal" onClick={atualizarAgora}>
        Atualizar agora
      </button>
      <button type="button" onClick={() => setDepois(true)}>
        Depois
      </button>
    </div>
  );
}

const TEXTO_SEM_INTERNET = {
  'nao-se-aplica': '',
  preparando: '⏳ Guardando o app neste aparelho…',
  pronto: '✔ Guardado neste aparelho: abre mesmo sem internet.',
  falhou: '⚠ Não deu para guardar o app neste aparelho (o navegador recusou). Ele funciona, mas precisa de internet para abrir.',
} as const;

/** B18: painel "Instalar como app" (aba Configurações). */
export function PainelInstalar() {
  const { podeInstalar, instalado, semInternet } = usePwa();
  const site = usaServiceWorker();
  const local = window.location.protocol === 'file:';
  return (
    <section className="painel painel-instalar" aria-label="Instalar como app">
      <h2>📲 Instalar como app</h2>
      {instalado ? (
        <p>✔ O SimPed está aberto como app instalado.</p>
      ) : local ? (
        <p className="nota">
          Esta é a versão de arquivo único (ou o programa de computador): já funciona sem internet. Para instalar no celular ou tablet, abra o
          SimPed pelo endereço do site (README, “Instalar pelo navegador”).
        </p>
      ) : !site ? (
        <p className="nota">
          Versão de desenvolvimento (npm run dev): a instalação só funciona na versão de site (npm run site, ou o endereço do GitHub Pages).
        </p>
      ) : podeInstalar ? (
        <>
          <p>Instale o SimPed neste aparelho: ele ganha ícone próprio, abre em tela cheia e funciona sem internet.</p>
          <button type="button" className="botao-principal" onClick={() => void instalar()}>
            📲 Instalar o SimPed
          </button>
        </>
      ) : (
        <p>{COMO_INSTALAR[aparelho()]}</p>
      )}
      {semInternet !== 'nao-se-aplica' && <p className="situacao-offline">{TEXTO_SEM_INTERNET[semInternet]}</p>}
      <p className="nota">
        Cada jeito de abrir (site, app instalado, arquivo único, programa) guarda os dados separados. Para levar configurações, casos e
        histórico de um para outro, use o Backup acima.
      </p>
    </section>
  );
}
