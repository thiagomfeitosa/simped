import type { ReactNode } from 'react';
import { type CasoClinico, ESTADO_CLINICO_PADRAO, type EstadoClinico, NOME_PADRAO_RESPIRATORIO, type SinaisVitais } from '../casos/tipos';
import type { PacienteAtual } from '../paciente/atual';
import { formatarDataHora, lerDataHora, textoSemanasEDias } from '../paciente/variaveis';
import { Monitor } from './Monitor';
import { RespiracaoAnimada } from './RespiracaoAnimada';

function formatar(valor: number, casas = 0): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

interface Props {
  caso: CasoClinico;
  paciente: PacienteAtual;
  sinais: SinaisVitais;
  /** Ritmo e padrão respiratório (B10). */
  clinico?: EstadoClinico;
  /** Peso estimado pelo balanço hídrico (B10). */
  pesoEstimadoKg?: number;
  /** Fonte usada para o nome da faixa etária (mostrada ao lado). */
  fonteDaFaixa?: string;
  /** Fase 2: potássio do paciente agora (muda a onda T do monitor). */
  k?: number;
  children?: ReactNode;
}

export function PainelPaciente({ caso, paciente, sinais, clinico = ESTADO_CLINICO_PADRAO, pesoEstimadoKg, fonteDaFaixa = 'SBP', k, children }: Props) {
  const v = paciente.variaveis;
  const menorDeUmAno = v.idade.anos < 1;

  return (
    <aside className="painel painel-paciente" aria-label="Paciente">
      <h2>{caso.titulo}</h2>
      <dl className="ficha">
        <dt>Nome</dt>
        <dd>
          {paciente.nome} ({paciente.sexo})
        </dd>
        <dt>Nascimento</dt>
        <dd>{formatarDataHora(lerDataHora(paciente.nascimento))}</dd>
        <dt>Idade</dt>
        <dd>
          {v.idadeTexto}{' '}
          <span className="faixa" title={`Nome da faixa segundo ${fonteDaFaixa} (A VALIDAR)`}>
            {v.nomeFaixa} · {fonteDaFaixa}
          </span>
        </dd>
        <dt>IG ao nascer</dt>
        <dd>
          {textoSemanasEDias(paciente.igNascer)} <span className="faixa">{v.classificacaoIG}</span>
        </dd>
        <dt>Peso ao nascer</dt>
        <dd>
          {formatar(paciente.pesoNascerG)} g <span className="faixa">{v.classificacaoPesoNascer}</span>
        </dd>
        {menorDeUmAno && (
          <>
            <dt>Idade pós-menstrual</dt>
            <dd>{textoSemanasEDias(v.idadePosMenstrual)}</dd>
          </>
        )}
        {v.idadeCorrigida && (
          <>
            <dt>Idade corrigida</dt>
            <dd>{v.idadeCorrigida.texto}</dd>
          </>
        )}
        <dt>Peso atual</dt>
        <dd>
          {formatar(paciente.pesoKg, paciente.pesoKg < 10 ? 3 : 1)} kg
          {pesoEstimadoKg !== undefined && Math.abs(pesoEstimadoKg - paciente.pesoKg) >= 0.001 && (
            <span className="faixa" title="Peso da admissão + balanço hídrico (1 mL ≈ 1 g; sem perdas insensíveis). As doses usam o peso da admissão. A VALIDAR.">
              {' '}
              pelo balanço: {formatar(pesoEstimadoKg, pesoEstimadoKg < 10 ? 3 : 1)} kg ({pesoEstimadoKg >= paciente.pesoKg ? '+' : '−'}
              {formatar(Math.abs(pesoEstimadoKg - paciente.pesoKg) * 1000)} g)
            </span>
          )}
        </dd>
        {paciente.estaturaCm !== undefined && (
          <>
            <dt>Estatura</dt>
            <dd>{formatar(paciente.estaturaCm, 1)} cm</dd>
          </>
        )}
        <dt>Sup. corporal</dt>
        <dd title={`Fórmula: ${v.superficieCorporal.formula}`}>
          {formatar(v.superficieCorporal.m2, 2)} m² <span className="faixa">{v.superficieCorporal.formula}</span>
        </dd>
        <dt>Alergias</dt>
        <dd className={paciente.alergias && paciente.alergias.length > 0 ? 'alergia' : undefined}>
          {paciente.alergias && paciente.alergias.length > 0 ? paciente.alergias.join(', ') : 'nenhuma conhecida'}
        </dd>
        <dt>Leito</dt>
        <dd>{paciente.leito}</dd>
      </dl>

      <details className="idade-detalhe">
        <summary>Idade em todas as unidades</summary>
        <p>
          {formatar(v.idade.horas)} h · {formatar(v.idade.dias)} d · {formatar(v.idade.semanas)} sem ·{' '}
          {formatar(v.idade.meses)} m · {formatar(v.idade.anos)} a
        </p>
        <p className="nota">Faixa usada nas regras de dose: {paciente.faixa} (provisório, A VALIDAR).</p>
      </details>

      <h3>Monitor</h3>
      <Monitor
        sinais={sinais}
        idadeDias={v.idade.dias}
        ritmo={clinico.ritmo}
        padraoRespiratorio={clinico.padraoRespiratorio}
        {...(k !== undefined && { k })}
        identificacao={{ nome: paciente.nome, idade: v.idadeTexto, leito: paciente.leito, quando: formatarDataHora(paciente.agora) }}
      />

      <h3>Beira do leito</h3>
      <dl className="ficha beira-leito" aria-label="Exame à beira do leito">
        <dt>TEC</dt>
        <dd className={sinais.tecS > 2 ? 'alterado' : undefined}>{formatar(sinais.tecS, 1)} s</dd>
        <dt>Glasgow</dt>
        <dd className={sinais.glasgow < 15 ? 'alterado' : undefined}>
          {formatar(sinais.glasgow)}
          {menorDeUmAno && <span className="faixa"> (adaptado ao lactente)</span>}
        </dd>
        <dt>Respiração</dt>
        <dd className={clinico.padraoRespiratorio !== 'normal' ? 'alterado' : undefined}>{NOME_PADRAO_RESPIRATORIO[clinico.padraoRespiratorio]}</dd>
      </dl>
      <RespiracaoAnimada padrao={clinico.padraoRespiratorio} fr={sinais.fr} />
      <p className="nota">TEC, Glasgow e padrão respiratório dos casos: provisórios (A VALIDAR).</p>

      {children}

      <h3>Queixa</h3>
      <p>{caso.queixa}</p>
      <h3>História</h3>
      <p>{caso.historia}</p>
      {paciente.dadosMaternos && (
        <>
          <h3>Dados maternos</h3>
          <p>{paciente.dadosMaternos}</p>
        </>
      )}
      <h3>Exame físico</h3>
      <p>{caso.exameFisico}</p>
    </aside>
  );
}
