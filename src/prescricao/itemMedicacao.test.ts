import { describe, expect, it } from 'vitest';
import { adrenalina, ceftriaxona, dipirona, MEDICACOES_EXEMPLO } from '../dados/medicacoes/exemplos-a-validar';
import type { Medicacao, RegraDeDose } from '../dados/medicacoes/tipos';
import {
  atualizarCampos,
  type CamposMedicacao,
  camposVazios,
  conferirItemMedicacao,
  formatarNumero,
  lerNumero,
  textoDaFolha,
  type Verificacao,
} from './itemMedicacao';

const crianca16kg = { faixa: 'crianca', pesoKg: 16 } as const;

function campos(parciais: Partial<CamposMedicacao>): CamposMedicacao {
  return { ...camposVazios(), ...parciais };
}

function conferir(c: Partial<CamposMedicacao>, opcoes: { secao?: number; medicacoes?: readonly Medicacao[]; pesoKg?: number } = {}) {
  return conferirItemMedicacao({
    campos: campos(c),
    medicacoes: opcoes.medicacoes ?? MEDICACOES_EXEMPLO,
    paciente: { ...crianca16kg, pesoKg: opcoes.pesoKg ?? 16 },
    secaoNumero: opcoes.secao ?? 6,
  });
}

const doAssunto = (vs: Verificacao[], assunto: Verificacao['assunto']) => vs.filter((v) => v.assunto === assunto);

describe('números digitados em português', () => {
  it('aceita vírgula e ponto como casa decimal', () => {
    expect(lerNumero('0,48')).toBe(0.48);
    expect(lerNumero('0.48')).toBe(0.48);
    expect(lerNumero(' 240 ')).toBe(240);
    expect(lerNumero('1.000,5')).toBe(1000.5);
  });

  it('texto vazio ou que não é número vira null', () => {
    expect(lerNumero('')).toBeNull();
    expect(lerNumero('abc')).toBeNull();
    expect(lerNumero('1,2,3')).toBeNull();
  });

  it('mostra números no formato brasileiro', () => {
    expect(formatarNumero(0.48)).toBe('0,48');
    expect(formatarNumero(4000)).toBe('4.000');
    expect(formatarNumero(0.0125)).toBe('0,0125');
  });
});

describe('preenchimento do item', () => {
  it('trocar a medicação limpa o item; apresentação e indicação únicas já vêm escolhidas', () => {
    const anterior = campos({ medicacaoId: 'dipirona', dose: '240', via: 'EV' });
    const novo = atualizarCampos(anterior, { medicacaoId: 'adrenalina' }, MEDICACOES_EXEMPLO, 'crianca');
    expect(novo.dose).toBe('');
    expect(novo.via).toBe('');
    expect(novo.apresentacaoId).toBe('ampola-1mg-ml'); // única apresentação
    expect(novo.unidadeDose).toBe('mg'); // unidade da apresentação
    expect(novo.indicacao).toBe(''); // adrenalina tem 3 indicações para criança

    const dip = atualizarCampos(camposVazios(), { medicacaoId: 'dipirona' }, MEDICACOES_EXEMPLO, 'crianca');
    expect(dip.indicacao).toBe('Febre/dor'); // única indicação
    expect(dip.apresentacaoId).toBe(''); // duas apresentações: o aluno escolhe
  });

  it('item vazio: falta a medicação', () => {
    const r = conferir({});
    expect(r.completo).toBe(false);
    expect(r.faltando).toEqual(['medicação']);
  });

  it('lista o que falta, na ordem da tela', () => {
    const r = conferir({ medicacaoId: 'dipirona' });
    expect(r.faltando).toEqual(['apresentação', 'indicação', 'dose', 'unidade da dose', 'via', 'intervalo']);
  });

  it('número inválido não deixa o item completo', () => {
    const r = conferir({
      medicacaoId: 'dipirona', apresentacaoId: 'ampola-500mg-ml', indicacao: 'Febre/dor',
      dose: 'abc', unidadeDose: 'mg', volumeMl: '0,48', via: 'EV', intervalo: 6,
    });
    expect(r.completo).toBe(false);
    expect(doAssunto(r.verificacoes, 'preenchimento')[0]?.texto).toContain('"abc"');
  });

  it('item completo vira a linha da folha', () => {
    const c = campos({
      medicacaoId: 'dipirona', apresentacaoId: 'ampola-500mg-ml', indicacao: 'Febre/dor',
      dose: '240', unidadeDose: 'mg', volumeMl: '0,48', via: 'EV', intervalo: 6,
    });
    expect(conferir(c).completo).toBe(true);
    expect(textoDaFolha(c, MEDICACOES_EXEMPLO)).toBe('Dipirona — Ampola 500 mg/mL, 2 mL — 240 mg (0,48 mL) EV 6/6h');
  });
});

describe('conta do volume (sempre conferida: é só matemática)', () => {
  const dipironaEV = {
    medicacaoId: 'dipirona', apresentacaoId: 'ampola-500mg-ml', indicacao: 'Febre/dor',
    dose: '240', unidadeDose: 'mg', via: 'EV', intervalo: 6,
  } as const;

  it('240 mg ÷ 500 mg/mL = 0,48 mL', () => {
    const [v] = doAssunto(conferir({ ...dipironaEV, volumeMl: '0,48' }).verificacoes, 'volume');
    expect(v?.situacao).toBe('certo');
    expect(v?.texto).toContain('240 mg ÷ 500 mg/mL = 0,48 mL');
  });

  it('volume errado mostra a conta certa', () => {
    const [v] = doAssunto(conferir({ ...dipironaEV, volumeMl: '0,5' }).verificacoes, 'volume');
    expect(v?.situacao).toBe('errado');
    expect(v?.texto).toContain('você escreveu 0,5 mL');
  });

  it('converte mcg para mg: 160 mcg de adrenalina 1 mg/mL = 0,16 mL', () => {
    const r = conferir({
      medicacaoId: 'adrenalina', apresentacaoId: 'ampola-1mg-ml', indicacao: 'PCR',
      dose: '160', unidadeDose: 'mcg', volumeMl: '0,16', via: 'EV', intervalo: 'dose-unica',
    });
    expect(doAssunto(r.verificacoes, 'volume')[0]?.situacao).toBe('certo');
  });

  it('unidade que não converte (UI com mg/mL) é erro', () => {
    const r = conferir({ ...dipironaEV, unidadeDose: 'UI', volumeMl: '0,48' });
    expect(doAssunto(r.verificacoes, 'unidades')[0]?.situacao).toBe('errado');
  });

  it('pó: precisa do volume de reconstituição (1 g em 10 mL = 100 mg/mL → 800 mg = 8 mL)', () => {
    const base = {
      medicacaoId: 'ceftriaxona', apresentacaoId: 'fa-1g', indicacao: 'Infecção bacteriana',
      dose: '800', unidadeDose: 'mg', volumeMl: '8', via: 'EV', intervalo: 12,
    } as const;
    expect(conferir(base, { secao: 5 }).faltando).toEqual(['volume de reconstituição']);

    const r = conferir({ ...base, reconstituicaoMl: '10' }, { secao: 5 });
    expect(r.completo).toBe(true);
    expect(doAssunto(r.verificacoes, 'volume')[0]?.situacao).toBe('certo');
  });

  it('avisa quando a dose usa mais de uma ampola', () => {
    const r = conferir({ ...dipironaEV, dose: '1500', volumeMl: '3' });
    expect(doAssunto(r.verificacoes, 'volume').map((v) => v.texto)).toContainEqual(expect.stringContaining('2 ampolas'));
  });
});

describe('referência "A VALIDAR" não corrige o aluno', () => {
  it('dose da dipirona aparece só como referência, com a faixa calculada para o peso', () => {
    const r = conferir({
      medicacaoId: 'dipirona', apresentacaoId: 'ampola-500mg-ml', indicacao: 'Febre/dor',
      dose: '240', unidadeDose: 'mg', volumeMl: '0,48', via: 'EV', intervalo: 6,
    });
    const dose = doAssunto(r.verificacoes, 'dose');
    expect(dose.map((v) => v.situacao)).toEqual(['a-validar']);
    expect(dose[0]?.texto).toContain('= 15 mg/kg/dose');
    expect(dose[0]?.texto).toContain('para 16 kg: 160–400 mg/dose');
    expect(r.verificacoes.some((v) => v.texto.includes('A VALIDAR'))).toBe(true);
  });

  it('via fora da referência A VALIDAR: avisa, sem marcar errado', () => {
    const r = conferir({
      medicacaoId: 'adrenalina', apresentacaoId: 'ampola-1mg-ml', indicacao: 'Anafilaxia',
      dose: '0,16', unidadeDose: 'mg', volumeMl: '0,16', via: 'EV', intervalo: 'dose-unica',
    });
    const vias = doAssunto(r.verificacoes, 'via');
    expect(vias.map((v) => v.situacao)).toEqual(['a-validar']);
    expect(vias[0]?.texto).toContain('IM');
  });

  it('nenhuma verificação de dose, via ou intervalo sai "certo/errado" com o banco atual', () => {
    for (const med of [adrenalina, dipirona, ceftriaxona]) {
      const r = conferir({
        medicacaoId: med.id, apresentacaoId: med.apresentacoes[0]?.id ?? '', indicacao: med.regras[0]?.indicacao ?? '',
        dose: '1', unidadeDose: 'mg', reconstituicaoMl: '10', volumeMl: '1', via: 'SC', intervalo: 8,
      }, { secao: med.secao });
      const julgadas = r.verificacoes.filter((v) => ['dose', 'via', 'intervalo'].includes(v.assunto));
      expect(julgadas.every((v) => v.situacao === 'a-validar' || v.situacao === 'atencao')).toBe(true);
    }
  });
});

describe('seção da folha', () => {
  it('antibiótico na seção 6 é erro de ordem da folha', () => {
    const r = conferir({ medicacaoId: 'ceftriaxona' }, { secao: 6 });
    expect(doAssunto(r.verificacoes, 'secao')[0]?.texto).toContain('seção 5');
  });

  it('na seção certa, não reclama', () => {
    expect(doAssunto(conferir({ medicacaoId: 'ceftriaxona' }, { secao: 5 }).verificacoes, 'secao')).toEqual([]);
  });
});

describe('sem regra para a faixa etária', () => {
  it('não exige indicação e avisa que a dose não será conferida', () => {
    const r = conferirItemMedicacao({
      campos: campos({
        medicacaoId: 'dipirona', apresentacaoId: 'ampola-500mg-ml',
        dose: '30', unidadeDose: 'mg', volumeMl: '0,06', via: 'EV', intervalo: 6,
      }),
      medicacoes: MEDICACOES_EXEMPLO,
      paciente: { faixa: 'RN', pesoKg: 3 },
      secaoNumero: 6,
    });
    expect(r.completo).toBe(true);
    expect(doAssunto(r.verificacoes, 'fonte')[0]?.texto).toContain('não tem regra de dose');
  });
});

// Droga e números FICTÍCIOS, só para testar o caminho "conferido" (certo/errado).
const fonteFicticia = { codigo: 'SBP', documento: 'Documento fictício, 2026', pagina: '1' } as const;
const regraPorDose: RegraDeDose = {
  id: 'por-dose',
  indicacao: 'Teste por dose',
  faixas: ['crianca'],
  vias: ['EV'],
  dose: { tipo: 'porKg', min: 10, max: 20, unidade: 'mg', por: 'dose' },
  doseMaxima: { valor: 300, unidade: 'mg', por: 'dose' },
  intervalosHoras: [6, 8],
  fonte: fonteFicticia,
  status: 'CONFERIDO',
};
const regraPorDia: RegraDeDose = {
  id: 'por-dia',
  indicacao: 'Teste por dia',
  faixas: ['crianca'],
  vias: ['EV'],
  dose: { tipo: 'porKg', min: 50, max: 100, unidade: 'mg', por: 'dia' },
  doseMaxima: { valor: 2000, unidade: 'mg', por: 'dia' },
  intervalosHoras: [12, 24],
  fonte: fonteFicticia,
  status: 'CONFERIDO',
};
const drogaTeste: Medicacao = {
  id: 'droga-teste',
  nome: 'Droga Teste',
  secao: 6,
  apresentacoes: [
    {
      id: 'amp',
      descricao: 'Ampola 100 mg/mL, 5 mL',
      forma: 'ampola',
      vias: ['EV'],
      quantidade: { valor: 500, unidade: 'mg' },
      volumeMl: 5,
      concentracaoPorMl: { valor: 100, unidade: 'mg' },
      status: 'CONFERIDO',
      fonte: fonteFicticia,
    },
  ],
  regras: [regraPorDose, regraPorDia],
};

function conferirTeste(c: Partial<CamposMedicacao>, pesoKg = 16) {
  return conferir(
    { medicacaoId: 'droga-teste', apresentacaoId: 'amp', unidadeDose: 'mg', via: 'EV', ...c },
    { medicacoes: [drogaTeste], pesoKg },
  );
}

describe('referência CONFERIDA corrige o aluno (dados fictícios)', () => {
  it('por dose: 16 kg × 10–20 mg/kg, limitado a 300 mg → aceita 160–300 mg', () => {
    const dose = (valor: string) =>
      doAssunto(conferirTeste({ indicacao: 'Teste por dose', dose: valor, intervalo: 6 }).verificacoes, 'dose')[0];
    expect(dose('240')?.situacao).toBe('certo');
    expect(dose('300')?.situacao).toBe('certo');
    expect(dose('320')).toMatchObject({ situacao: 'errado', texto: expect.stringContaining('acima') });
    expect(dose('100')).toMatchObject({ situacao: 'errado', texto: expect.stringContaining('abaixo') });
  });

  it('por dia: 1000 mg 12/12h = 2000 mg/dia em 30 kg (faixa 1500–2000) está certo', () => {
    const r = conferirTeste({ indicacao: 'Teste por dia', dose: '1000', intervalo: 12 }, 30);
    expect(doAssunto(r.verificacoes, 'dose')[0]?.situacao).toBe('certo');
    expect(doAssunto(r.verificacoes, 'intervalo')[0]?.situacao).toBe('certo');
  });

  it('por dia: 1000 mg 8/8h = 3000 mg/dia passa da faixa e o intervalo está errado', () => {
    const r = conferirTeste({ indicacao: 'Teste por dia', dose: '1000', intervalo: 8 }, 30);
    expect(doAssunto(r.verificacoes, 'dose')[0]?.situacao).toBe('errado');
    expect(doAssunto(r.verificacoes, 'intervalo')[0]?.situacao).toBe('errado');
  });

  it('dose máxima manda: em 50 kg (50 mg/kg/dia daria 2500) o certo é 2000 mg/dia', () => {
    const r = conferirTeste({ indicacao: 'Teste por dia', dose: '1000', intervalo: 12 }, 50);
    expect(doAssunto(r.verificacoes, 'dose')[0]?.situacao).toBe('certo');
  });

  it('por dia sem intervalo: ainda não confere a dose', () => {
    const r = conferirTeste({ indicacao: 'Teste por dia', dose: '1000' }, 30);
    expect(doAssunto(r.verificacoes, 'dose')).toEqual([]);
    expect(r.faltando).toContain('intervalo');
  });

  it('via fora da referência conferida é erro; a certa é marcada como certa', () => {
    const errada = conferirTeste({ indicacao: 'Teste por dose', dose: '240', via: 'IM', intervalo: 6 });
    expect(doAssunto(errada.verificacoes, 'via').map((v) => v.situacao)).toEqual(['errado', 'errado']);
    const certa = conferirTeste({ indicacao: 'Teste por dose', dose: '240', intervalo: 6 });
    expect(doAssunto(certa.verificacoes, 'via').map((v) => v.situacao)).toEqual(['certo']);
  });

  it('dose máxima de outro período: regra por dose com máximo por dia', () => {
    const comMaximaDiaria: Medicacao = {
      ...drogaTeste,
      regras: [{ ...regraPorDose, doseMaxima: { valor: 900, unidade: 'mg', por: 'dia' } }],
    };
    const r = conferir(
      { medicacaoId: 'droga-teste', apresentacaoId: 'amp', unidadeDose: 'mg', via: 'EV', indicacao: 'Teste por dose', dose: '300', intervalo: 6 },
      { medicacoes: [comMaximaDiaria], pesoKg: 20 },
    );
    const maxima = doAssunto(r.verificacoes, 'dose')[1];
    expect(maxima).toMatchObject({ situacao: 'errado', texto: expect.stringContaining('1.200 mg/dia') });
  });
});

describe('regra que muda com a idade em dias (relógio do caso)', () => {
  const rn = (idadeDias: number) => ({
    faixa: 'RN' as const,
    pesoKg: 3,
    variaveis: {
      idadeHoras: idadeDias * 24,
      idadeDias,
      idadeMeses: 0,
      idadeAnos: 0,
      igNascerSemanas: 39,
      idadePosMenstrualSemanas: 39,
      pesoKg: 3,
    },
  });
  const item = campos({
    medicacaoId: 'penicilina-cristalina',
    apresentacaoId: 'fa-1milhao',
    indicacao: 'Sífilis congênita / neurossífilis',
    dose: '150000',
    unidadeDose: 'UI',
    reconstituicaoMl: '10',
    volumeMl: '1,5',
    via: 'EV',
    intervalo: 12,
  });
  const conferirRn = (idadeDias: number) =>
    conferirItemMedicacao({ campos: item, medicacoes: MEDICACOES_EXEMPLO, paciente: rn(idadeDias), secaoNumero: 5 });

  it('com 6 dias, 12/12h bate com a referência', () => {
    const r = conferirRn(6);
    expect(r.regra?.id).toBe('sifilis-rn-ate-7d');
    expect(doAssunto(r.verificacoes, 'intervalo')).toEqual([]);
    expect(doAssunto(r.verificacoes, 'fonte').map((v) => v.texto).join(' ')).toMatch(/idade < 7 dias de vida/);
    expect(doAssunto(r.verificacoes, 'volume')[0]?.situacao).toBe('certo');
  });

  it('com 7 dias, a regra passa a ser 8/8h e o 12/12h é apontado (A VALIDAR)', () => {
    const r = conferirRn(7);
    expect(r.regra?.id).toBe('sifilis-rn-apos-7d');
    const intervalo = doAssunto(r.verificacoes, 'intervalo');
    expect(intervalo[0]?.situacao).toBe('a-validar');
    expect(intervalo[0]?.texto).toMatch(/8\/8h/);
  });
});
