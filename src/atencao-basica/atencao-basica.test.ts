import { describe, expect, it } from 'vitest';
import { FAIXAS_DNPM } from '../dados/atencao-basica/desenvolvimento-a-validar';
import { ACHADOS_ATENCAO_BASICA } from '../dados/atencao-basica/exame-fisico-a-validar';
import { PROBLEMAS_COMUNS } from '../dados/atencao-basica/receitas-a-validar';
import { CALENDARIO_PNI } from '../dados/atencao-basica/vacinas-a-validar';
import { criarSorteio } from '../estudo/treino';
import { classificarDesenvolvimento, faixaDaIdade } from './desenvolvimento';
import { classificarPaAdolescente, gerarPergunta } from './quiz';
import { conferirItem, contaDoItem } from './receitas';
import { conferirDosesDeHoje, dosesDeHoje, situacaoDasDoses, sortearCarteira } from './vacinas';

const problema = (id: string) => PROBLEMAS_COMUNS.find((p) => p.id === id)!;

describe('dados da atenção básica (A VALIDAR)', () => {
  it('todo item tem fonte e está A VALIDAR; ids únicos', () => {
    expect(new Set(PROBLEMAS_COMUNS.map((p) => p.id)).size).toBe(PROBLEMAS_COMUNS.length);
    for (const p of PROBLEMAS_COMUNS) {
      expect(p.status).toBe('A_VALIDAR');
      for (const item of p.receita) {
        expect(item.status, `${p.id}/${item.medicamento}`).toBe('A_VALIDAR');
        expect(item.fonte.length).toBeGreaterThan(3);
        // item sem conta precisa de instrução escrita
        if (!item.dose) expect(item.instrucao, `${p.id}/${item.medicamento}`).toBeTruthy();
      }
    }
  });

  it('achados de exame que apontam para receita apontam para uma que existe', () => {
    const ids = new Set(PROBLEMAS_COMUNS.map((p) => p.id));
    for (const a of ACHADOS_ATENCAO_BASICA) if (a.receitaId) expect(ids.has(a.receitaId), a.id).toBe(true);
  });

  it('calendário: ids únicos e séries em ordem de idade', () => {
    expect(new Set(CALENDARIO_PNI.map((d) => d.id)).size).toBe(CALENDARIO_PNI.length);
    const ultima = new Map<string, number>();
    for (const d of CALENDARIO_PNI) {
      expect(d.idadeMeses, d.id).toBeGreaterThanOrEqual(ultima.get(d.serie) ?? 0);
      ultima.set(d.serie, d.idadeMeses);
    }
  });

  it('DNPM: faixas contínuas, 4 marcos (um de cada domínio), ids únicos', () => {
    FAIXAS_DNPM.forEach((f, i) => {
      if (i > 0) expect(f.deMeses).toBe(FAIXAS_DNPM[i - 1]!.ateMeses);
      expect(new Set(f.marcos.map((m) => m.dominio)).size).toBe(4);
    });
    const ids = FAIXAS_DNPM.flatMap((f) => f.marcos.map((m) => m.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('receitas: a conta de cada item', () => {
  it('amoxicilina 50 mg/kg/dia de 8/8 h para 14 kg = 233,3 mg = 4,67 mL', () => {
    const c = contaDoItem(problema('oma').receita[0]!, 14)!;
    expect(c.tomadasPorDia).toBe(3);
    expect(c.dosePorTomada).toBeCloseTo(233.33, 1);
    expect(c.medida).toEqual({ valor: 4.67, unidade: 'mL' });
    expect(c.posologia).toMatch(/^Dar 4,67 mL \(233,3 mg\) por via oral, de 8\/8 h, por 7 a 10 dias/);
  });

  it('paracetamol gotas 10 mg/kg para 12 kg = 120 mg = 0,6 mL = 12 gotas', () => {
    const c = contaDoItem(problema('resfriado').receita[0]!, 12)!;
    expect(c.dosePorTomada).toBe(120);
    expect(c.medida).toEqual({ valor: 12, unidade: 'gotas' });
  });

  it('dose máxima limita (paracetamol 10 mg/kg para 90 kg → 750 mg)', () => {
    const c = contaDoItem(problema('resfriado').receita[0]!, 90)!;
    expect(c.limitada).toBe(true);
    expect(c.dosePorTomada).toBe(750);
  });

  it('dose fixa: vitamina D 400 UI = 2 gotas; salbutamol 400 mcg = 4 jatos; ibuprofeno 400 mg = 1 comprimido', () => {
    expect(contaDoItem(problema('vitamina-d').receita[0]!, 3.4)!.medida).toEqual({ valor: 2, unidade: 'gotas' });
    expect(contaDoItem(problema('asma-leve').receita[0]!, 26)!.medida).toEqual({ valor: 4, unidade: 'jatos' });
    expect(contaDoItem(problema('dismenorreia').receita[0]!, 55)!.medida).toEqual({ valor: 1, unidade: 'comprimido(s)' });
  });

  it('itens sem dose (tópico, soro nasal) não têm conta', () => {
    expect(contaDoItem(problema('escabiose').receita[0]!, 24)).toBeNull();
  });

  it('confere a resposta do aluno (gotas aceitam arredondar)', () => {
    const item = problema('resfriado').receita[0]!;
    expect(conferirItem(item, 12, { dose: 120, medida: 12 })).toMatchObject({ doseCerta: true, medidaCerta: true });
    expect(conferirItem(item, 12, { dose: 120, medida: 12.4 })?.medidaCerta).toBe(true);
    expect(conferirItem(item, 12, { dose: 180, medida: 18 })).toMatchObject({ doseCerta: false, medidaCerta: false });
  });

  it('todo item com dose faz conta sem erro para o peso do caso', () => {
    for (const p of PROBLEMAS_COMUNS) {
      for (const item of p.receita) {
        const c = contaDoItem(item, p.pesoKg);
        if (item.dose) {
          expect(c, `${p.id}/${item.medicamento}`).not.toBeNull();
          expect(Number.isFinite(c!.dosePorTomada)).toBe(true);
        }
      }
    }
  });
});

describe('carteira de vacinação', () => {
  const situacao = (idade: number, tomadas: string[], id: string) => situacaoDasDoses(idade, new Set(tomadas)).find((l) => l.dose.id === id)!.situacao;

  it('2 meses com as vacinas do nascimento: aplicar penta, VIP, pneumo e rotavírus', () => {
    expect(dosesDeHoje(2, new Set(['bcg', 'hepb-0']))).toEqual(['penta-1', 'vip-1', 'pneumo-1', 'rota-1']);
  });

  it('5 meses sem nenhuma vacina: rotavírus perdeu a idade; penta 1 atrasada; penta 2 aguarda', () => {
    expect(situacao(5, [], 'rota-1')).toBe('perdeu-a-idade');
    expect(situacao(5, [], 'rota-2')).toBe('perdeu-a-idade');
    expect(situacao(5, [], 'penta-1')).toBe('atrasada');
    expect(situacao(5, [], 'penta-2')).toBe('aguardar-intervalo');
    expect(situacao(5, [], 'hepb-0')).toBe('perdeu-a-idade');
    expect(situacao(5, [], 'bcg')).toBe('atrasada');
  });

  it('confere as doses marcadas pelo aluno (sem contar influenza/COVID)', () => {
    const tomadas = new Set(['bcg', 'hepb-0', 'penta-1', 'vip-1', 'pneumo-1', 'rota-1', 'menc-1']);
    const r = conferirDosesDeHoje(4, tomadas, new Set(['penta-2', 'vip-2', 'pneumo-2', 'menc-2']));
    expect(r.certas).toEqual(['penta-2', 'vip-2', 'pneumo-2']);
    expect(r.faltaram).toEqual(['rota-2']);
    expect(r.aMais).toEqual(['menc-2']);
  });

  it('sorteio dá crianças com idade e doses coerentes', () => {
    const s = criarSorteio(9);
    for (let i = 0; i < 50; i++) {
      const c = sortearCarteira(s);
      for (const id of c.tomadas) expect(CALENDARIO_PNI.find((d) => d.id === id)!.idadeMeses).toBeLessThanOrEqual(c.idadeMeses);
    }
  });
});

describe('desenvolvimento', () => {
  const todosAte = (meses: number) => new Set(FAIXAS_DNPM.filter((f) => f.deMeses <= meses).flatMap((f) => f.marcos.map((m) => m.id)));

  it('faixa pela idade', () => {
    expect(faixaDaIdade(0).id).toBe('0-1');
    expect(faixaDaIdade(7).id).toBe('6-9');
    expect(faixaDaIdade(9).id).toBe('9-12');
    expect(faixaDaIdade(80).id).toBe('48-60');
  });

  it('adequado, adequado com risco, alerta e provável atraso', () => {
    expect(classificarDesenvolvimento({ idadeMeses: 7, presentes: todosAte(7), fatoresDeRisco: 0 }).classificacao).toBe('adequado');
    expect(classificarDesenvolvimento({ idadeMeses: 7, presentes: todosAte(7), fatoresDeRisco: 1 }).classificacao).toBe('adequado-com-risco');
    const semSentar = new Set([...todosAte(7)].filter((id) => id !== 'senta'));
    const alerta = classificarDesenvolvimento({ idadeMeses: 7, presentes: semSentar, fatoresDeRisco: 0 });
    expect(alerta.classificacao).toBe('alerta');
    expect(alerta.faltamDaFaixa).toEqual(['Senta sem apoio']);
    // falta marco da faixa atual (senta) E da anterior (rola) → provável atraso
    const semRolar = new Set([...todosAte(7)].filter((id) => id !== 'rola' && id !== 'senta'));
    expect(classificarDesenvolvimento({ idadeMeses: 7, presentes: semRolar, fatoresDeRisco: 0 }).classificacao).toBe('provavel-atraso');
    expect(classificarDesenvolvimento({ idadeMeses: 7, presentes: todosAte(7), fatoresDeRisco: 0, perimetroCefalicoAlterado: true }).classificacao).toBe('provavel-atraso');
    // todos os marcos da faixa atual presentes: a faixa anterior nem é olhada
    const soAtual = new Set(faixaDaIdade(7).marcos.map((m) => m.id));
    expect(classificarDesenvolvimento({ idadeMeses: 7, presentes: soAtual, fatoresDeRisco: 0 }).classificacao).toBe('adequado');
  });
});

describe('quiz e PA do adolescente', () => {
  it('a pergunta tem 4 alternativas diferentes, uma certa', () => {
    const s = criarSorteio(3);
    for (let i = 0; i < 40; i++) {
      const q = gerarPergunta(s);
      expect(q.alternativas).toHaveLength(4);
      expect(new Set(q.alternativas).size).toBe(4);
      expect(q.alternativas).toContain(q.achado.nome);
    }
  });

  it('PA ≥ 13 anos (AAP 2017)', () => {
    expect(classificarPaAdolescente(115, 70)).toBe('Normal');
    expect(classificarPaAdolescente(124, 76)).toBe('PA elevada');
    expect(classificarPaAdolescente(118, 84)).toBe('Hipertensão estágio 1');
    expect(classificarPaAdolescente(142, 70)).toBe('Hipertensão estágio 2');
  });
});
