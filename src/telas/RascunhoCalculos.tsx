export function RascunhoCalculos({ texto, aoMudar }: { texto: string; aoMudar: (texto: string) => void }) {
  return (
    <section className="painel rascunho" aria-label="Rascunho de cálculos">
      <h2>Rascunho de cálculos</h2>
      <textarea
        value={texto}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={'Use este espaço para as contas.\nEx.: 16 kg × ... = ...'}
        spellCheck={false}
      />
    </section>
  );
}
