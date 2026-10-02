import { useCallback, useEffect, useRef, useState } from 'react';
import type { EventoParada } from '../../parada/parada';
import type { MarcaRcp, TipoMarca } from '../../parada/rcp';
import {
  acrescentar,
  CHAVES,
  continuarRelogio,
  entrarNaSala,
  type MensagemParada,
  mesclarSalas,
  mudarCampo,
  mudarVelocidade,
  novaSala,
  novoId,
  pausarRelogio,
  recomecarSala,
  relogioDaSala,
  type SalaParada,
  salaValida,
  tempoDoRelogio,
} from '../../parada/sala';
import { abrirCanal, type Canal } from '../../sessao/canal';

type SemAutoria<T> = T extends unknown ? Omit<T, 'id' | 'por'> : never;
/** Evento novo (o id e o papel de quem fez entram aqui). */
export type NovoEvento = SemAutoria<EventoParada>;

const CANAL = { nome: 'simped-parada', chave: 'simped.canal-parada' };
/** "Ainda estou aqui" a cada 4 s; tela sem notícia há 12 s é dada como fechada. */
const BATIMENTO_MS = 4000;
const SUMIU_MS = 12_000;

/** Delta (só o que mudou) para mandar às outras telas. */
function delta(sala: SalaParada, parte: Partial<Pick<SalaParada, 'campos' | 'eventos' | 'marcas'>>): SalaParada {
  return { geracao: sala.geracao, criadaEm: sala.criadaEm, campos: parte.campos ?? {}, eventos: parte.eventos ?? [], marcas: parte.marcas ?? [], telas: {} };
}

/**
 * A sala do código nesta tela, em dia com as outras telas abertas no mesmo computador
 * (cada membro da equipe pode ter a sua janela). Ver src/parada/sala.ts.
 */
export function useSalaParada() {
  const [tela] = useState(novoId);
  const [sala, setSala] = useState<SalaParada>(() => novaSala(tela, Date.now()));
  const salaRef = useRef(sala);
  const [vistas, setVistas] = useState<Readonly<Record<string, number>>>({});
  const canal = useRef<Canal<MensagemParada> | null>(null);
  const contador = useRef(0);

  const trocar = useCallback((nova: SalaParada) => {
    salaRef.current = nova;
    setSala(nova);
  }, []);

  /** Mudança feita aqui: vale nesta tela e vai para as outras (inteira ou só o que mudou). */
  const aplicar = useCallback(
    (nova: SalaParada, parcial?: SalaParada) => {
      trocar(nova);
      canal.current?.enviar({ tipo: 'sala', tela, sala: parcial ?? nova, ...(parcial && { parcial: true }) });
    },
    [tela, trocar],
  );

  useEffect(() => {
    const viu = (outra: string) => setVistas((v) => ({ ...v, [outra]: Date.now() }));
    const c = abrirCanal<MensagemParada>(
      (msg) => {
        if (!msg || typeof msg !== 'object' || typeof msg.tela !== 'string' || msg.tela === tela) return;
        if (msg.tipo === 'tchau') {
          setVistas((v) => Object.fromEntries(Object.entries(v).filter(([t]) => t !== msg.tela)));
          return;
        }
        viu(msg.tela);
        if (msg.tipo === 'ola') c.enviar({ tipo: 'sala', tela, sala: salaRef.current });
        if (msg.tipo !== 'sala' || !salaValida(msg.sala)) return;
        const atual = salaRef.current;
        if (msg.parcial && msg.sala.geracao !== atual.geracao) {
          // pedaço de outra rodada: pede a sala inteira
          c.enviar({ tipo: 'ola', tela });
          return;
        }
        const juntas = entrarNaSala(mesclarSalas(atual, msg.sala), tela, Date.now());
        trocar(juntas);
        // a outra tela não sabe de mim ou ficou com a rodada que perdeu: manda a sala inteira
        if (!msg.parcial && (!(tela in msg.sala.telas) || juntas.geracao !== msg.sala.geracao)) c.enviar({ tipo: 'sala', tela, sala: juntas });
      },
      tela,
      CANAL,
    );
    canal.current = c;
    c.enviar({ tipo: 'ola', tela });
    const batimento = window.setInterval(() => {
      c.enviar({ tipo: 'presente', tela });
      setVistas((v) => {
        const limite = Date.now() - SUMIU_MS;
        return Object.values(v).some((ms) => ms < limite) ? Object.fromEntries(Object.entries(v).filter(([, ms]) => ms >= limite)) : v;
      });
    }, BATIMENTO_MS);
    const sair = () => c.enviar({ tipo: 'tchau', tela });
    window.addEventListener('pagehide', sair);
    return () => {
      window.clearInterval(batimento);
      window.removeEventListener('pagehide', sair);
      sair();
      c.fechar();
      canal.current = null;
    };
  }, [tela, trocar]);

  const agoraS = useCallback(() => tempoDoRelogio(relogioDaSala(salaRef.current), Date.now()), []);

  const mudar = useCallback(
    (chave: string, valor: unknown) => {
      const nova = mudarCampo(salaRef.current, chave, valor, tela, Date.now());
      aplicar(nova, delta(nova, { campos: { [chave]: nova.campos[chave]! } }));
    },
    [aplicar, tela],
  );

  /** Registra uma ação da equipe (com o horário do código agora) e devolve o id. */
  const registrar = useCallback(
    (e: NovoEvento, por?: string): string => {
      const id = `${tela}-e${(contador.current += 1)}`;
      const evento = { ...e, id, ...(por && { por }) } as EventoParada;
      const nova = acrescentar(salaRef.current, { eventos: [evento] }, Date.now());
      aplicar(nova, delta(nova, { eventos: [evento] }));
      return id;
    },
    [aplicar, tela],
  );

  /** Uma compressão ou ventilação agora. Com o relógio parado não conta (devolve false). */
  const marcar = useCallback(
    (tipo: TipoMarca, por: string): boolean => {
      const relogio = relogioDaSala(salaRef.current);
      if (relogio.desdeMs === null) return false;
      const marca: MarcaRcp = { id: `${tela}-m${(contador.current += 1)}`, tipo, tS: tempoDoRelogio(relogio, Date.now()), por };
      const nova = acrescentar(salaRef.current, { marcas: [marca] }, Date.now());
      aplicar(nova, delta(nova, { marcas: [marca] }));
      return true;
    },
    [aplicar, tela],
  );

  const relogio = useCallback(
    (mudanca: 'pausar' | 'continuar' | number) => {
      const agora = Date.now();
      const r = relogioDaSala(salaRef.current);
      mudar(CHAVES.relogio, mudanca === 'pausar' ? pausarRelogio(r, agora) : mudanca === 'continuar' ? continuarRelogio(r, agora) : mudarVelocidade(r, mudanca, agora));
    },
    [mudar],
  );

  const iniciar = useCallback(
    (por?: string) => {
      if (salaRef.current.eventos.some((e) => e.tipo === 'iniciar')) return;
      registrar({ tipo: 'iniciar', tS: agoraS() }, por);
      relogio('continuar');
    },
    [agoraS, registrar, relogio],
  );

  const encerrar = useCallback(
    (por?: string) => {
      registrar({ tipo: 'encerrar', tS: agoraS() }, por);
      relogio('pausar');
    },
    [agoraS, registrar, relogio],
  );

  const recomecar = useCallback(() => aplicar(recomecarSala(salaRef.current, tela, Date.now())), [aplicar, tela]);

  const agoraMs = Date.now();
  const vivas = new Set([tela, ...Object.entries(vistas).filter(([, ms]) => agoraMs - ms < SUMIU_MS).map(([t]) => t)]);

  return { tela, sala, vivas, agoraS, mudar, registrar, marcar, relogio, iniciar, encerrar, recomecar };
}

export type SalaNaTela = ReturnType<typeof useSalaParada>;
