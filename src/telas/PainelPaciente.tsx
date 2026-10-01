import type { ReactNode } from 'react';
import type { CasoClinico, SinaisVitais } from '../casos/tipos';
import type { PacienteAtual } from '../paciente/atual';
import { formatarDataHora, lerDataHora, textoSemanasEDias } from '../paciente/variaveis';

function formatar(valor: number, casas = 0): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

interface Props {
  caso: CasoClinico;
  paciente: PacienteAtual;
  sinais: SinaisVitais;
  /** Fonte usada para o nome da faixa etária (mostrada ao lado). */
  fonteDaFaixa?: string;
  children?: ReactNode;
}

export function PainelPaciente({ caso, paciente, sinais, fonteDaFaixa = 'SBP', children }: Props) {
  const v = paciente.variaveis;
  const vitais: [string, string, string][] = [
    ['FC', formatar(sinais.fc), 'bpm'],
    ['FR', formatar(sinais.fr), 'irpm'],
    ['SpO₂', formatar(sinais.spo2), '%'],
    ['PA', `${formatar(sinais.paSistolica)} × ${formatar(sinais.paDiastolica)}`, 'mmHg'],
    ['Temp. axilar', formatar(sinais.temperaturaC, 1), '°C'],
    ['Glicemia capilar', formatar(sinais.glicemiaMgDl), 'mg/dL'],
  ];
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
        <dd>{formatar(paciente.pesoKg, paciente.pesoKg < 10 ? 3 : 1)} kg</dd>
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

      <h3>Sinais vitais</h3>
      <div className="vitais">
        {vitais.map(([rotulo, valor, unidade]) => (
          <div className="vital" key={rotulo}>
            <span className="vital-rotulo">{rotulo}</span>
            <span className="vital-valor">{valor}</span>
            <span className="vital-unidade">{unidade}</span>
          </div>
        ))}
      </div>

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
