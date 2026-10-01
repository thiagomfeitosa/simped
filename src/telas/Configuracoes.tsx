import { useState } from 'react';
import { FONTES_DE_DOSE, hospitalAtual } from '../configuracoes/configuracoes';
import { useConfiguracoes } from '../configuracoes/ContextoConfiguracoes';
import { FAIXAS_POR_FONTE, FONTES_DE_FAIXA, type FonteDeFaixa } from '../dados/faixas-etarias';
import { hospitalPorId, LISTA_HOSPITAIS } from '../dados/hospitais';
import type { CodigoFonte } from '../dados/medicacoes/tipos';
import { PainelBackup } from './PainelBackup';

/** Tela de configurações: tudo fica guardado no próprio computador. */
export function Configuracoes() {
  const { config, mudar, restaurar } = useConfiguracoes();
  const hospital = hospitalAtual(config);
  const original = hospitalPorId(config.hospitalId);
  // botão "Testar a tela de erro": mostra como fica quando algo dá errado (B3)
  const [testarErro, setTestarErro] = useState(false);
  if (testarErro) throw new Error('Erro de teste (botão “Testar a tela de erro” em Configurações).');

  return (
    <div className="pagina-simples">
      <header className="cabecalho">
        <h1>Configurações</h1>
        <span className="subtitulo">Valem para todo o app e ficam guardadas neste computador.</span>
      </header>

      <div className="cartoes">
        <section className="painel">
          <h2>Fontes de referência</h2>
          <label className="campo">
            Fonte das doses
            <select value={config.fonteDose} onChange={(e) => mudar({ fonteDose: e.target.value as CodigoFonte })}>
              {FONTES_DE_DOSE.map((f) => (
                <option key={f} value={f}>
                  {f}
                  {f === 'SBP' ? ' (padrão)' : ''}
                </option>
              ))}
            </select>
          </label>
          <p className="nota">Se a fonte escolhida não tiver o valor, o app usa a SBP e avisa na conferência.</p>

          <label className="campo">
            Nome da faixa etária
            <select
              value={config.fonteFaixa}
              onChange={(e) => mudar({ fonteFaixa: e.target.value as FonteDeFaixa })}
            >
              {FONTES_DE_FAIXA.map((f) => (
                <option key={f} value={f}>
                  {f}
                  {f === 'SBP' ? ' (padrão)' : ''}
                </option>
              ))}
            </select>
          </label>
          <p className="nota">
            Só muda o NOME mostrado (ex.: “Lactente” × “Criança”). As doses usam sempre os números da idade.{' '}
            {FAIXAS_POR_FONTE[config.fonteFaixa].observacao} Tabela A VALIDAR.
          </p>
        </section>

        <section className="painel">
          <h2>Hospital</h2>
          <label className="campo">
            Hospital
            <select
              value={config.hospitalId}
              onChange={(e) => mudar({ hospitalId: e.target.value, ajustesHospital: {} })}
            >
              {LISTA_HOSPITAIS.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Volume final da seringa da BIC (mL)
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={hospital.volumeFinalBicMl}
              onChange={(e) => {
                const valor = Number(e.target.value);
                if (valor > 0 && valor <= 100) {
                  mudar({ ajustesHospital: { ...config.ajustesHospital, volumeFinalBicMl: valor } });
                }
              }}
            />
          </label>
          <p className="nota">
            Medicação + SF completando até este volume. Valor do hospital: {original.volumeFinalBicMl} mL ({original.fonte}).
          </p>
          <label className="campo">
            Hora da primeira dose (aprazamento)
            <input
              type="time"
              value={hospital.horaInicial}
              onChange={(e) => {
                if (/^\d\d:\d\d$/.test(e.target.value)) {
                  mudar({ ajustesHospital: { ...config.ajustesHospital, horaInicial: e.target.value } });
                }
              }}
            />
          </label>
          <p className="nota">Horários padrão do hospital: A VALIDAR (fictícios até chegar a rotina da enfermagem).</p>
        </section>

        <section className="painel">
          <h2>Conferência</h2>
          <fieldset className="opcoes">
            <legend>Modo</legend>
            <label>
              <input type="radio" checked={config.modo === 'treino'} onChange={() => mudar({ modo: 'treino' })} />
              <b>Treino</b> — a conferência mostra a conta certa.
            </label>
            <label>
              <input type="radio" checked={config.modo === 'prova'} onChange={() => mudar({ modo: 'prova' })} />
              <b>Prova</b> — mostra só certo/errado (gabarito escondido).
            </label>
          </fieldset>
          <label className="campo">
            Margem de arredondamento aceita (%)
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={config.margemPct}
              onChange={(e) => {
                const valor = Number(e.target.value);
                if (valor >= 0 && valor <= 20) mudar({ margemPct: valor });
              }}
            />
          </label>
          <p className="nota">Provisório: 1% (pendente com o usuário, formulas.md item 8).</p>
        </section>

        <PainelBackup />
      </div>

      <p className="rodape-config">
        <button type="button" onClick={restaurar}>
          Voltar ao padrão
        </button>{' '}
        <button type="button" onClick={() => setTestarErro(true)} title="Mostra a mensagem que aparece quando algo dá errado">
          Testar a tela de erro
        </button>
      </p>
    </div>
  );
}
