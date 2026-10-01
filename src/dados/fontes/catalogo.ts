/**
 * Catálogo de fontes (B6): cada documento de referência que o banco pode citar.
 * É a versão "de dados" de referencias/catalogo.md: o app mostra de onde veio cada número.
 *
 * ⚠️ PROVISÓRIO: títulos, edições e anos abaixo foram preenchidos pelo assistente de memória,
 * para o app funcionar. Tudo A VALIDAR: o usuário confere cada documento (aba Banco → Catálogo de fontes)
 * e corrige edição/ano/link. Novos documentos podem ser cadastrados no próprio app.
 */

import type { CodigoFonte, StatusValidacao } from '../medicacoes/tipos';

export interface DocumentoFonte {
  /** Código único do documento (ex.: 'SBP-TRATADO'). É o que a dose guarda em `fonte.documentoId`. */
  id: string;
  /** Sociedade/órgão (o mesmo código usado na escolha de fonte das Configurações). */
  sociedade: CodigoFonte;
  titulo: string;
  edicao?: string;
  ano?: number;
  autor?: string;
  /** Onde o arquivo está: referencias/publicas, referencias/privado (só no Mac) ou só online. */
  onde?: 'publicas' | 'privado' | 'online';
  link?: string;
  /** Documento usado quando a dose cita só a sociedade (ex.: "SBP"), sem dizer qual documento. */
  padraoDaSociedade?: boolean;
  status: StatusValidacao;
}

const AV: StatusValidacao = 'A_VALIDAR';

export const CATALOGO_FONTES: readonly DocumentoFonte[] = [
  {
    id: 'SBP-TRATADO',
    sociedade: 'SBP',
    titulo: 'Tratado de Pediatria (Sociedade Brasileira de Pediatria)',
    edicao: '5ª ed.',
    ano: 2022,
    autor: 'SBP',
    onde: 'privado',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'SBP-DOCUMENTOS',
    sociedade: 'SBP',
    titulo: 'Documentos científicos dos Departamentos da SBP (neonatologia, emergência, adolescência)',
    autor: 'SBP',
    onde: 'online',
    link: 'https://www.sbp.com.br/departamentos-cientificos/',
    status: AV,
  },
  {
    id: 'MS-PCDT-IST',
    sociedade: 'MS',
    titulo: 'PCDT para Atenção Integral às Pessoas com IST (sífilis congênita)',
    ano: 2022,
    autor: 'Ministério da Saúde',
    onde: 'publicas',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'MS-PCDT-TV',
    sociedade: 'MS',
    titulo: 'PCDT para Prevenção da Transmissão Vertical de HIV, Sífilis e Hepatites Virais',
    ano: 2022,
    autor: 'Ministério da Saúde',
    onde: 'publicas',
    status: AV,
  },
  {
    id: 'MS-ATENCAO-RN',
    sociedade: 'MS',
    titulo: 'Atenção à Saúde do Recém-Nascido: guia para os profissionais de saúde',
    edicao: '2ª ed.',
    ano: 2014,
    autor: 'Ministério da Saúde',
    onde: 'publicas',
    status: AV,
  },
  {
    id: 'AAP-REDBOOK',
    sociedade: 'AAP',
    titulo: 'Red Book: Report of the Committee on Infectious Diseases',
    edicao: '33ª ed. (2024–2027)',
    ano: 2024,
    autor: 'American Academy of Pediatrics',
    onde: 'privado',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'AHA-PALS',
    sociedade: 'PALS',
    titulo: 'Pediatric Advanced Life Support — diretrizes da American Heart Association',
    ano: 2020,
    autor: 'American Heart Association',
    onde: 'online',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'NRP-MANUAL',
    sociedade: 'NRP',
    titulo: 'Textbook of Neonatal Resuscitation (NRP)',
    edicao: '8ª ed.',
    ano: 2021,
    autor: 'AAP / AHA',
    onde: 'privado',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'GINA',
    sociedade: 'GINA',
    titulo: 'Global Strategy for Asthma Management and Prevention (GINA)',
    ano: 2024,
    autor: 'Global Initiative for Asthma',
    onde: 'online',
    link: 'https://ginasthma.org',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'ISPAD',
    sociedade: 'ISPAD',
    titulo: 'ISPAD Clinical Practice Consensus Guidelines (cetoacidose diabética)',
    ano: 2022,
    autor: 'International Society for Pediatric and Adolescent Diabetes',
    onde: 'online',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'ASBAI-ANAFILAXIA',
    sociedade: 'ASBAI',
    titulo: 'Guia/diretriz de anafilaxia da Associação Brasileira de Alergia e Imunologia',
    autor: 'ASBAI',
    onde: 'online',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'BULA',
    sociedade: 'BULA',
    titulo: 'Bula do medicamento (Bulário Eletrônico da ANVISA)',
    autor: 'ANVISA / fabricante',
    onde: 'online',
    link: 'https://consultas.anvisa.gov.br/#/bulario/',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'HOSPITAL-SANTA-CASA',
    sociedade: 'HOSPITAL',
    titulo: 'Rotinas e padronização de medicamentos da Santa Casa',
    autor: 'Santa Casa',
    onde: 'privado',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'NEOFAX',
    sociedade: 'NEOFAX',
    titulo: 'Neofax — manual de medicamentos em neonatologia (Micromedex)',
    onde: 'privado',
    padraoDaSociedade: true,
    status: AV,
  },
  {
    id: 'SSC-PEDIATRIA',
    sociedade: 'SSC',
    titulo: 'Surviving Sepsis Campaign — diretrizes para choque séptico e sepse em crianças',
    ano: 2020,
    autor: 'SCCM / ESICM',
    onde: 'online',
    padraoDaSociedade: true,
    status: AV,
  },
];
