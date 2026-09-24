import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Icon, PointsBadge } from '@gastemenos/ui';
import { TelaDeAcesso } from '../../componentes/TelaDeAcesso.js';
import { Erro } from '../../componentes/Erro.js';
import { api } from '../../lib/api.js';
import { PERGUNTAS, type Pergunta } from './perguntas.js';

/**
 * `referencia/telas/PerfilConsumo.dc.html` — 5 perguntas numa rota, com o
 * passo em `?p=1..5`.
 *
 * O passo vive na URL para o botão "voltar" do navegador funcionar como a
 * pessoa espera: voltar uma pergunta, não sair do questionário inteiro.
 *
 * "Continuar" só libera com resposta, e diz o que falta quando está bloqueado.
 */

type Respostas = Record<string, string[]>;

function Opcoes({
  pergunta,
  escolhidas,
  aoEscolher,
}: {
  pergunta: Pergunta;
  escolhidas: string[];
  aoEscolher: (id: string) => void;
}): React.ReactElement {
  // `input` de verdade, não `button` com `role="radio"`.
  //
  // Um radiogroup ARIA só está correto se as setas do teclado navegarem entre
  // as opções — e isso é trabalho que o navegador já faz de graça com radio
  // nativo. Escolher o elemento real dá navegação por setas, leitura correta
  // em TalkBack e VoiceOver e nenhum ARIA para errar
  // (docs/08-ACESSIBILIDADE.md, "Elementos reais").
  const tipo = pergunta.multipla ? 'checkbox' : 'radio';

  return (
    <fieldset className="mt-6 border-0 p-0">
      <legend className="gm-sr">{pergunta.titulo}</legend>
      <div className="flex flex-col gap-3">
        {pergunta.opcoes.map((opcao) => {
          const marcada = escolhidas.includes(opcao.id);
          return (
            <label
              key={opcao.id}
              className={`flex min-h-touch cursor-pointer items-center gap-3 rounded-l border-2 px-4 py-3 ${
                marcada
                  ? 'border-brand bg-brand-soft text-ink'
                  : 'border-line bg-surface-raised text-ink'
              }`}
            >
              <input
                type={tipo}
                name={pergunta.campo}
                value={opcao.id}
                checked={marcada}
                onChange={() => aoEscolher(opcao.id)}
                className="h-5 w-5 shrink-0 accent-brand"
              />
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-m bg-surface-sunken">
                <Icon name={opcao.icone} size={20} />
              </span>
              <span className="flex flex-1 flex-col">
                <span className="text-body-m font-semibold">{opcao.label}</span>
                {opcao.sub ? (
                  <span className="text-caption text-ink-muted">{opcao.sub}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function PerfilDeConsumo(): React.ReactElement {
  const navegar = useNavigate();
  const [parametros, setParametros] = useSearchParams();

  const passo = Math.min(Math.max(Number(parametros.get('p')) || 1, 1), PERGUNTAS.length);
  const pergunta = PERGUNTAS[passo - 1]!;

  const [respostas, setRespostas] = useState<Respostas>({});
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const escolhidas = respostas[pergunta.campo] ?? [];
  const ehUltima = passo === PERGUNTAS.length;
  const cheia = Boolean(pergunta.maximo && escolhidas.length >= pergunta.maximo);

  function escolher(id: string): void {
    setErro(null);
    setRespostas((atual) => {
      const antes = atual[pergunta.campo] ?? [];

      if (!pergunta.multipla) return { ...atual, [pergunta.campo]: [id] };

      if (antes.includes(id)) {
        return { ...atual, [pergunta.campo]: antes.filter((x) => x !== id) };
      }
      // No limite, ignora em vez de trocar em silêncio: trocar sozinho
      // confunde quem não viu a regra.
      if (pergunta.maximo && antes.length >= pergunta.maximo) return atual;

      return { ...atual, [pergunta.campo]: [...antes, id] };
    });
  }

  async function continuar(): Promise<void> {
    if (!ehUltima) {
      setParametros({ p: String(passo + 1) });
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      await api.put('/me/profile', {
        householdSize: respostas.householdSize?.[0],
        storeTypes: respostas.storeTypes ?? [],
        frequency: respostas.frequency?.[0],
        monthlySpendBand: respostas.monthlySpendBand?.[0],
        priorities: respostas.priorities ?? [],
      });
      navegar('/perfil-de-consumo/pronto', { replace: true });
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível salvar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <TelaDeAcesso
      acimaDoTitulo={
        <div className="mb-6 flex items-center justify-between">
          <span className="text-overline text-ink-muted">{`PERGUNTA ${passo} DE ${PERGUNTAS.length}`}</span>
          <Button variant="ghost" size="m" onClick={() => navegar('/inicio')}>
            Pular
          </Button>
        </div>
      }
      titulo={pergunta.titulo}
      descricao={pergunta.ajuda}
      rodape={
        <>
          <Erro mensagem={erro} />
          <Button fullWidth onClick={continuar} disabled={escolhidas.length === 0 || enviando}>
            {ehUltima ? (enviando ? 'Salvando…' : 'Ver meu perfil') : 'Continuar'}
          </Button>
          {escolhidas.length === 0 ? (
            <p className="text-center text-caption text-ink-muted">
              {pergunta.multipla ? 'Escolha pelo menos uma opção' : 'Escolha uma opção'}
            </p>
          ) : cheia ? (
            <p className="text-center text-caption text-ink-muted">
              {`Você já escolheu ${pergunta.maximo}. Desmarque uma para trocar.`}
            </p>
          ) : null}
        </>
      }
    >
      <div className="mt-2">
        <PointsBadge points={100} />
        <span className="ml-2 text-caption text-ink-muted">ao completar</span>
      </div>

      <Opcoes pergunta={pergunta} escolhidas={escolhidas} aoEscolher={escolher} />
    </TelaDeAcesso>
  );
}
