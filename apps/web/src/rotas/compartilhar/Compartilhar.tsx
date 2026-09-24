import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatarCentavos } from '@gastemenos/shared';
import { Button, Card, IconButton, Toast } from '@gastemenos/ui';
import { api } from '../../lib/api.js';
import { compartilharCartao, desenharCartao, type DadosDoCartao } from './cartao.js';

/** `referencia/telas/Compartilhar.dc.html` */

export function Compartilhar(): React.ReactElement {
  const navegar = useNavigate();
  const [previa, setPrevia] = useState<string | null>(null);
  const [imagem, setImagem] = useState<Blob | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const cartao = useQuery({
    queryKey: ['cartao'],
    queryFn: () => api.get<DadosDoCartao>('/game/share-card'),
  });

  useEffect(() => {
    if (!cartao.data) return;

    let vivo = true;
    let endereco: string | null = null;

    void desenharCartao(cartao.data)
      .then((png) => {
        if (!vivo) return;
        setImagem(png);
        endereco = URL.createObjectURL(png);
        setPrevia(endereco);
      })
      .catch(() => {
        if (vivo) setAviso('Não conseguimos montar o cartão neste aparelho.');
      });

    return () => {
      vivo = false;
      // Sem revogar, cada visita à tela deixa um blob de ~300 KB na memória.
      if (endereco) URL.revokeObjectURL(endereco);
    };
  }, [cartao.data]);

  async function compartilhar(): Promise<void> {
    if (!imagem || !cartao.data) return;

    const texto = `Economizei ${formatarCentavos(cartao.data.savingsCents)} este mês com o GasteMenos. Entre com o meu código ${cartao.data.inviteCode}.`;

    const resultado = await compartilharCartao(imagem, texto);
    setAviso(
      resultado === 'baixado'
        ? 'Imagem salva no seu aparelho. É só anexar onde quiser.'
        : 'Pronto!',
    );
  }

  async function copiarCodigo(): Promise<void> {
    if (!cartao.data) return;
    try {
      await navigator.clipboard.writeText(cartao.data.inviteCode);
      setAviso('Código copiado.');
    } catch {
      setAviso(`Seu código é ${cartao.data.inviteCode}.`);
    }
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[480px] flex-col px-5 pb-8 pt-6">
      <header className="mb-6 flex items-center gap-3">
        <IconButton icon="back" label="Voltar" onClick={() => navegar(-1)} />
        <h1 tabIndex={-1} className="text-title-m text-ink outline-none">
          Compartilhar
        </h1>
      </header>

      <main className="flex flex-1 flex-col items-center gap-6">
        {previa ? (
          /*
            A prévia é a imagem de verdade, não uma reconstrução em HTML: o que
            a pessoa vê aqui é exatamente o que vai sair no Stories.
            `alt` descreve o conteúdo, para quem não vê a imagem saber o que
            está prestes a compartilhar.
          */
          <img
            src={previa}
            alt={
              cartao.data
                ? `Cartão: economizei ${formatarCentavos(cartao.data.savingsCents)} este mês, nível ${cartao.data.level}, ${cartao.data.levelName}. Código de convite ${cartao.data.inviteCode}.`
                : 'Cartão de conquistas'
            }
            className="w-full max-w-[280px] rounded-xl shadow-pop"
          />
        ) : (
          <div
            role="status"
            className="flex aspect-[9/16] w-full max-w-[280px] items-center justify-center rounded-xl bg-surface-sunken text-body-m text-ink-muted"
          >
            Montando seu cartão…
          </div>
        )}

        {cartao.data ? (
          <Card tone="sunken" className="w-full gap-1">
            <span className="text-caption text-ink-muted">Seu código de convite</span>
            <span className="text-title-m tracking-widest text-ink">
              {cartao.data.inviteCode}
            </span>
            <span className="text-body-s text-ink-muted">
              Quando alguém entrar com ele e ler a primeira nota, você ganha 100 pontos.
            </span>
          </Card>
        ) : null}

        {aviso ? <Toast>{aviso}</Toast> : null}
      </main>

      <div className="mt-6 flex flex-col gap-3">
        <Button fullWidth icon="share" disabled={!imagem} onClick={() => void compartilhar()}>
          Compartilhar
        </Button>
        <Button variant="secondary" fullWidth onClick={() => void copiarCodigo()}>
          Copiar o código
        </Button>
      </div>
    </div>
  );
}
