import { useState } from 'react';
import { conferirItem, contaDoItem } from '../../atencao-basica/receitas';
import { ACHADOS_ATENCAO_BASICA } from '../../dados/atencao-basica/exame-fisico-a-validar';
import { type ItemReceita, PROBLEMAS_COMUNS } from '../../dados/atencao-basica/receitas-a-validar';
import { formatarNumero, lerNumero } from '../../prescricao/comum';
import { DesenhoAchadoAB } from './DesenhoAchadoAB';

const PUBLICO: Record<string, string> = { lactente: 'Lactente', 'pre-escolar': 'Pré-escolar', escolar: 'Escolar', adolescente: 'Adolescente' };

function ItemComConta({ item, pesoKg, indice }: { item: ItemReceita; pesoKg: number; indice: number }) {
  const [dose, setDose] = useState('');
  const [medida, setMedida] = useState('');
  const [conferido, setConferido] = useState(false);
  const conta = contaDoItem(item, pesoKg);
  const resultado = conferido ? conferirItem(item, pesoKg, { dose: lerNumero(dose), medida: lerNumero(medida) }) : null;
  return (
    <li className="item-receita-ab">
      <p>
        <strong>
          {indice}. {item.medicamento}
        </strong>{' '}
        — {item.apresentacao.texto} · uso {item.via}
      </p>
      {conta ? (
        <form
          className="linha-botoes"
          onSubmit={(e) => {
            e.preventDefault();
            setConferido(true);
          }}
        >
          <label>
            Dose por tomada{' '}
            <input aria-label={`Dose por tomada de ${item.medicamento} (${item.apresentacao.unidade})`} inputMode="decimal" size={6} value={dose} onChange={(e) => {
                setDose(e.target.value);
                setConferido(false);
              }} /> {item.apresentacao.unidade}
          </label>
          {conta.medida && (
            <label>
              Medir{' '}
              <input aria-label={`Quanto medir de ${item.medicamento} (${conta.medida.unidade})`} inputMode="decimal" size={5} value={medida} onChange={(e) => {
                  setMedida(e.target.value);
                  setConferido(false);
                }} /> {conta.medida.unidade}
            </label>
          )}
          <button type="submit">Conferir conta</button>
        </form>
      ) : (
        <p className="nota">{item.instrucao}</p>
      )}
      {resultado && (
        <div className={resultado.doseCerta && resultado.medidaCerta ? 'retorno-ok' : 'retorno-erro'} role="status">
          <p>{resultado.doseCerta && resultado.medidaCerta ? '✔ Conta certa.' : '✘ Confira a conta:'}</p>
          <ol className="passos-conta">
            {resultado.conta.passos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </div>
      )}
      <p className="nota">
        Dose de referência: {item.dose ? (item.dose.tipo === 'fixa' ? `${formatarNumero(item.dose.valor)} ${item.apresentacao.unidade}/tomada` : `${formatarNumero(item.dose.valor)} ${item.apresentacao.unidade}/kg/${item.dose.tipo === 'porKgDia' ? 'dia' : 'dose'}`) : '—'} · {item.fonte} · A VALIDAR
      </p>
    </li>
  );
}

/** Problemas comuns: o caso, o exame, a receita para fazer a conta e a receita pronta. */
export function Receitas() {
  const [id, setId] = useState(PROBLEMAS_COMUNS[0]!.id);
  const [verDiagnostico, setVerDiagnostico] = useState(false);
  const [verReceita, setVerReceita] = useState(false);
  const problema = PROBLEMAS_COMUNS.find((p) => p.id === id)!;
  const achadosLigados = ACHADOS_ATENCAO_BASICA.filter((a) => a.receitaId === problema.id && a.desenho).slice(0, 2);

  return (
    <div className="receitas-ab">
      <div className="painel barra-opcoes">
        <label>
          Problema{' '}
          <select
            aria-label="Problema comum"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setVerDiagnostico(false);
              setVerReceita(false);
            }}
          >
            {(['lactente', 'pre-escolar', 'escolar', 'adolescente'] as const).map((g) => (
              <optgroup key={g} label={PUBLICO[g]}>
                {PROBLEMAS_COMUNS.filter((p) => p.publico === g).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>
      <div className="grade-receitas">
        <section className="painel" aria-label="Caso">
          <h2>{problema.nome}</h2>
          <p>
            <span className="selo">{problema.idade}</span> <span className="selo">{formatarNumero(problema.pesoKg)} kg</span>
          </p>
          <p>{problema.caso}</p>
          <p>
            <strong>Exame:</strong> {problema.exame}
          </p>
          {achadosLigados.length > 0 && (
            <div className="desenhos-caso">
              {achadosLigados.map((a) => (
                <figure key={a.id}>
                  <DesenhoAchadoAB achado={a} />
                  <figcaption>{a.nome}</figcaption>
                </figure>
              ))}
            </div>
          )}
          <button type="button" onClick={() => setVerDiagnostico((v) => !v)} aria-expanded={verDiagnostico}>
            {verDiagnostico ? 'Esconder' : 'Ver'} diagnóstico
          </button>
          {verDiagnostico && <p className="retorno-ok">{problema.diagnostico}</p>}
        </section>

        <section className="painel" aria-label="Receita para calcular">
          <h2>💊 Receita — faça a conta para {formatarNumero(problema.pesoKg)} kg</h2>
          <ol className="lista-receita">
            {problema.receita.map((item, i) => (
              <ItemComConta key={`${problema.id}-${i}`} item={item} pesoKg={problema.pesoKg} indice={i + 1} />
            ))}
          </ol>
          {problema.atencao && <p className="destaque-treino">💡 {problema.atencao}</p>}
          <button type="button" className="botao-principal" onClick={() => setVerReceita((v) => !v)} aria-expanded={verReceita}>
            {verReceita ? 'Esconder' : 'Ver'} a receita pronta
          </button>
        </section>

        {verReceita && (
          <section className="painel receita-pronta" aria-label="Receita pronta">
            <h2>📝 Receituário</h2>
            <p className="nota">
              Paciente: {problema.idade}, {formatarNumero(problema.pesoKg)} kg
            </p>
            {(['oral', 'nasal', 'inalatória', 'tópica', 'intramuscular'] as const).map((via) => {
              const itens = problema.receita.filter((i) => i.via === via);
              if (itens.length === 0) return null;
              return (
                <div key={via}>
                  <h3>Uso {via}</h3>
                  <ol>
                    {itens.map((item) => {
                      const c = contaDoItem(item, problema.pesoKg);
                      return (
                        <li key={item.medicamento}>
                          <strong>
                            {item.medicamento} {item.apresentacao.texto}
                          </strong>
                          <br />
                          {c ? c.posologia : item.instrucao}
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
            <h3>Orientações</h3>
            <ul>
              {problema.orientacoes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <h3>Volte ou procure atendimento se</h3>
            <ul>
              {problema.sinaisDeAlarme.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
            <p className="nota">Doses e condutas A VALIDAR — treinamento, não usar como receita real.</p>
          </section>
        )}
      </div>
    </div>
  );
}
