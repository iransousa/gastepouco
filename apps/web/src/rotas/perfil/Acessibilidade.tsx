import { useMutation } from '@tanstack/react-query';
import {
  Card,
  IconButton,
  SegmentedControl,
  Switch,
  useAparencia,
  type TamanhoDeTexto,
  type Tema,
} from '@gastemenos/ui';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';

/**
 * `referencia/telas/Acessibilidade.dc.html`
 *
 * Toda mudança aplica **na hora**, antes de a API responder, e só depois é
 * salva. Quem escolhe "Muito grande" precisa ver a letra crescer no instante
 * do toque — esperar a rede para descobrir se funcionou é exatamente o atrito
 * que essa tela existe para remover.
 *
 * O salvamento no servidor é o que faz a escolha valer em outro aparelho
 * (docs/09-SEGURANCA-LGPD.md e a tabela Preferences).
 */

const TAMANHOS = [
  { value: 'normal', label: 'Normal' },
  { value: 'grande', label: 'Grande' },
  { value: 'muito-grande', label: 'Muito grande' },
];

const PARA_A_API: Record<TamanhoDeTexto, 'NORMAL' | 'GRANDE' | 'MUITO_GRANDE'> = {
  normal: 'NORMAL',
  grande: 'GRANDE',
  'muito-grande': 'MUITO_GRANDE',
};

export function Acessibilidade(): React.ReactElement {
  const navegar = useNavigate();
  const aparencia = useAparencia();

  const salvar = useMutation({
    mutationFn: (mudanca: Record<string, unknown>) => api.patch('/me/preferences', mudanca),
  });

  function mudarTamanho(valor: string): void {
    const tamanho = valor as TamanhoDeTexto;
    aparencia.definir({ tamanhoDeTexto: tamanho });
    salvar.mutate({ textSize: PARA_A_API[tamanho] });
  }

  function mudarContraste(ligado: boolean): void {
    const tema: Tema = ligado ? 'contraste' : 'sistema';
    aparencia.definir({ tema });
    salvar.mutate({ highContrast: ligado, theme: ligado ? 'CONTRAST' : 'SYSTEM' });
  }

  return (
    <div className="mx-auto w-full max-w-[480px] pb-10">
      <header className="flex items-center gap-3 px-5 pt-6">
        <IconButton icon="back" label="Voltar" href="/perfil" />
        <h1 tabIndex={-1} className="text-title-m text-ink outline-none">
          Acessibilidade
        </h1>
      </header>

      <main className="flex flex-col gap-6 px-5 pt-6">
        <section aria-labelledby="tamanho">
          <h2 id="tamanho" className="mb-3 text-title-s text-ink">
            Tamanho do texto
          </h2>
          <SegmentedControl
            label="Tamanho do texto"
            value={aparencia.tamanhoDeTexto}
            options={TAMANHOS}
            onChange={mudarTamanho}
          />

          {/* Prévia real: o texto abaixo já está no tamanho escolhido. */}
          <Card tone="sunken" className="mt-4 gap-1">
            <span className="text-caption text-ink-muted">Prévia</span>
            <span className="text-title-s text-ink">Total em setembro</span>
            <span className="text-money-xl text-ink">R$ 1.284,60</span>
            <span className="text-body-m text-ink-muted">
              Assim vai ficar a letra no aplicativo inteiro.
            </span>
          </Card>
        </section>

        <section aria-labelledby="ver">
          <h2 id="ver" className="mb-3 text-title-s text-ink">
            Ver melhor
          </h2>
          <div className="overflow-hidden rounded-l">
            <Switch
              label="Alto contraste"
              description="Fundo branco ou preto, bordas grossas, sem cor clara atrás de texto."
              checked={aparencia.tema === 'contraste'}
              onChange={mudarContraste}
            />
            <Switch
              label="Modo fácil"
              description="Tela inicial só com o essencial e botões grandes."
              checked={aparencia.modoFacil}
              onChange={(ligado) => {
                aparencia.definir({ modoFacil: ligado });
                salvar.mutate({ easyMode: ligado });
              }}
            />
          </div>
        </section>

        <section aria-labelledby="ouvir">
          <h2 id="ouvir" className="mb-3 text-title-s text-ink">
            Ouvir e sentir
          </h2>
          <div className="overflow-hidden rounded-l">
            <Switch
              label="Ler em voz alta"
              description="O app fala o resultado da nota e o resumo do mês."
              checked={false}
              onChange={(ligado) => salvar.mutate({ readAloud: ligado })}
            />
            <Switch
              label="Vibrar ao concluir"
              description="O celular vibra quando a nota é lida."
              checked
              onChange={(ligado) => salvar.mutate({ vibrate: ligado })}
            />
          </div>
        </section>

        <section aria-labelledby="movimento">
          <h2 id="movimento" className="mb-3 text-title-s text-ink">
            Movimento
          </h2>
          <div className="overflow-hidden rounded-l">
            <Switch
              label="Reduzir movimento"
              description="Sem confete e sem animação. Bom para quem sente desconforto com movimento na tela."
              checked={aparencia.reduzirMovimento}
              onChange={(ligado) => {
                aparencia.definir({ reduzirMovimento: ligado });
                salvar.mutate({ reduceMotion: ligado });
              }}
            />
          </div>
        </section>

        <p className="text-body-s text-ink-muted">
          Suas escolhas ficam salvas na sua conta, então valem em qualquer aparelho onde você
          entrar.
        </p>

        <button
          type="button"
          onClick={() => navegar('/inicio')}
          className="min-h-touch text-center text-body-m text-brand underline"
        >
          Ver como ficou no Início
        </button>
      </main>
    </div>
  );
}
