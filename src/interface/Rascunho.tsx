import { useState } from 'react';

export function Rascunho() {
  const [texto, setTexto] = useState('');
  return (
    <section className="painel">
      <h2>Rascunho de cálculos</h2>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Faça suas contas aqui (texto livre)"
        rows={8}
      />
    </section>
  );
}
