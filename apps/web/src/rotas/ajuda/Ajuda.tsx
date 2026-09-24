import { useId, useMemo, useState } from 'react';
import { Card, Chip, Icon, IconButton, ListRow, TextField, type IconName } from '@gastemenos/ui';

/** `referencia/telas/Ajuda.dc.html` */

/**
 * Contato do suporte.
 *
 * Fica aqui, e não em variável de ambiente, porque é conteúdo da tela e muda
 * junto com o texto — não com o ambiente.
 */
const EMAIL_DE_SUPORTE = 'ajuda@gastemenos.com.br';
const HORARIO_DE_ATENDIMENTO = 'Segunda a sexta, das 9h às 18h';
const VERSAO = '1.0.0';

interface Duvida {
  pergunta: string;
  resposta: string;
}

interface Topico {
  id: string;
  rotulo: string;
  icone: IconName;
  titulo: string;
  duvidas: Duvida[];
}

const TOPICOS: Topico[] = [
  {
    id: 'notas',
    rotulo: 'Ler notas',
    icone: 'scan',
    titulo: 'ler notas',
    duvidas: [
      {
        pergunta: 'A nota não lê. O que faço?',
        resposta:
          'Limpe a câmera, acenda a lanterna e aproxime até o QR code ficar nítido. Se a nota estiver apagada, toque em “Digitar chave” e informe os 44 números que ficam perto do QR code.',
      },
      {
        pergunta: 'Quais notas funcionam?',
        resposta:
          'Notas fiscais de consumidor (NFC-e) com QR code. Cupons sem QR code ainda não são lidos.',
      },
      {
        pergunta: 'Posso ler a mesma nota duas vezes?',
        resposta:
          'Não. Cada nota vale uma vez, para manter o ranking justo. Se outra pessoa já leu a mesma nota, ela vale para quem leu primeiro.',
      },
      {
        pergunta: 'E se a nota for antiga?',
        resposta:
          'Ela entra no seu histórico e no cálculo de preços do dia da compra, mas só rende pontos se tiver no máximo 30 dias.',
      },
    ],
  },
  {
    id: 'jogo',
    rotulo: 'Pontos e ranking',
    icone: 'star',
    titulo: 'pontos e ranking',
    duvidas: [
      {
        pergunta: 'Como ganho pontos?',
        resposta:
          'Cada nota lida vale 60 pontos. Você ganha bônus por mercado novo, por manter a sequência da semana, por confirmar ofertas e por convidar amigos.',
      },
      {
        pergunta: 'Como funciona o ranking?',
        resposta:
          'O ranking zera todo mês. Você pode disputar com amigos ou com a sua região em três categorias: quem mais economizou, quem mais comprou e quem ganhou mais pontos.',
      },
      {
        pergunta: 'Como a economia é calculada?',
        resposta:
          'Comparamos o preço que você pagou em cada item com a mediana da sua região na mesma semana.',
      },
      {
        pergunta: 'Perdi a sequência. Dá para recuperar?',
        resposta:
          'A sequência conta semanas com pelo menos uma nota lida, de segunda a domingo. Se uma semana passar em branco ela recomeça — mas os pontos já ganhos ficam.',
      },
    ],
  },
  {
    id: 'precos',
    rotulo: 'Preços e ofertas',
    icone: 'tag',
    titulo: 'preços e ofertas',
    duvidas: [
      {
        pergunta: 'De onde vêm os preços?',
        resposta:
          'Das notas lidas pela comunidade. Mostramos quantas notas e quantas pessoas sustentam cada preço, e só exibimos o preço quando há gente suficiente para ninguém ser identificado.',
      },
      {
        pergunta: 'O que é uma oferta patrocinada?',
        resposta:
          'É uma promoção paga por um mercado parceiro. Ela sempre aparece com o selo “Patrocinado” e você pode desligar esse tipo de aviso em Perfil › Notificações.',
      },
      {
        pergunta: 'O preço estava diferente no mercado',
        resposta:
          'Preços mudam rápido. Abra a nota e toque em “Algum item veio errado?” para nos avisar.',
      },
    ],
  },
  {
    id: 'conta',
    rotulo: 'Conta e privacidade',
    icone: 'shield',
    titulo: 'conta e privacidade',
    duvidas: [
      {
        pergunta: 'Meus dados de compra são públicos?',
        resposta:
          'Não. Na base de preços entram só produto, preço, mercado e data, sem seu nome, e-mail ou endereço.',
      },
      {
        pergunta: 'Qual a diferença entre pausar e encerrar?',
        resposta:
          'Pausar guarda tudo e esconde você do ranking por um tempo. Encerrar apaga a conta em 30 dias; até lá, você pode voltar atrás.',
      },
      {
        pergunta: 'Como baixo meus dados?',
        resposta:
          'Em Perfil › Privacidade e dados › Baixar meus dados. Enviamos um arquivo com suas notas, itens, listas, pontos e selos.',
      },
    ],
  },
];

/** Sem acento e em minúsculas: quem busca "precos" tem de achar "preços". */
function achatar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function Ajuda(): React.ReactElement {
  const [topicoId, setTopicoId] = useState(TOPICOS[0]!.id);
  const [busca, setBusca] = useState('');
  const [aberta, setAberta] = useState<string | null>(null);
  const prefixo = useId();

  const termo = achatar(busca.trim());

  // Buscar atravessa os tópicos: a dúvida de quem digita "pontos" pode estar em
  // qualquer um deles, e obrigar a adivinhar a aba é o mesmo que esconder.
  const duvidas = useMemo(() => {
    if (termo.length < 2) {
      const topico = TOPICOS.find((item) => item.id === topicoId) ?? TOPICOS[0]!;
      return topico.duvidas.map((duvida) => ({ ...duvida, topico: null as string | null }));
    }

    return TOPICOS.flatMap((topico) =>
      topico.duvidas
        .filter(
          (duvida) =>
            achatar(duvida.pergunta).includes(termo) || achatar(duvida.resposta).includes(termo),
        )
        .map((duvida) => ({ ...duvida, topico: topico.rotulo as string | null })),
    );
  }, [termo, topicoId]);

  const titulo =
    termo.length >= 2
      ? `${duvidas.length} ${duvidas.length === 1 ? 'resposta encontrada' : 'respostas encontradas'}`
      : `Dúvidas sobre ${TOPICOS.find((item) => item.id === topicoId)?.titulo}`;

  return (
    <div className="mx-auto w-full max-w-[480px] pb-10">
      <header className="flex items-center gap-3 px-5 pt-6">
        <IconButton icon="back" label="Voltar" href="/perfil" />
        <h1 tabIndex={-1} className="text-title-m text-ink outline-none">
          Ajuda
        </h1>
      </header>

      <main className="flex flex-col gap-5 px-5 pt-6">
        <p className="text-body-m text-ink-muted">Como podemos ajudar?</p>

        <TextField
          label="Buscar na ajuda"
          type="search"
          value={busca}
          onChange={(evento) => {
            setBusca(evento.target.value);
            setAberta(null);
          }}
          trailing={<Icon name="search" size={20} />}
        />

        {termo.length < 2 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Assunto">
            {TOPICOS.map((topico) => (
              <Chip
                key={topico.id}
                icon={topico.icone}
                selected={topico.id === topicoId}
                onClick={() => {
                  setTopicoId(topico.id);
                  setAberta(null);
                }}
              >
                {topico.rotulo}
              </Chip>
            ))}
          </div>
        ) : null}

        <section aria-labelledby={`${prefixo}-duvidas`}>
          {/* O título é `aria-live`: a busca troca a lista sem mudar de tela, e
              sem isso o leitor de tela não saberia que o resultado mudou. */}
          <h2
            id={`${prefixo}-duvidas`}
            aria-live="polite"
            className="mb-3 text-label text-ink-muted"
          >
            {titulo}
          </h2>

          {duvidas.length === 0 ? (
            <Card tone="sunken" className="gap-2">
              <p className="text-body-m text-ink">Não achamos nada com esse termo.</p>
              <p className="text-body-s text-ink-muted">
                Tente outra palavra ou fale com a gente aqui embaixo.
              </p>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {duvidas.map((duvida) => {
                const id = `${prefixo}-${achatar(duvida.pergunta).replace(/\W+/g, '-')}`;
                const abertaAgora = aberta === id;

                return (
                  <li key={id} className="rounded-l bg-surface-raised">
                    <h3>
                      <button
                        type="button"
                        aria-expanded={abertaAgora}
                        aria-controls={`${id}-resposta`}
                        onClick={() => setAberta(abertaAgora ? null : id)}
                        className="flex min-h-touch w-full items-center justify-between gap-3 px-4 py-3 text-left text-body-m text-ink"
                      >
                        <span className="flex flex-col gap-1">
                          {duvida.pergunta}
                          {duvida.topico ? (
                            <span className="text-caption text-ink-muted">{duvida.topico}</span>
                          ) : null}
                        </span>
                        <span aria-hidden="true" className="shrink-0 text-ink-muted">
                          <Icon name={abertaAgora ? 'close' : 'next'} size={18} />
                        </span>
                      </button>
                    </h3>
                    {abertaAgora ? (
                      <div id={`${id}-resposta`} className="px-4 pb-4 text-body-s text-ink-muted">
                        {duvida.resposta}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-labelledby={`${prefixo}-contato`}>
          <h2 id={`${prefixo}-contato`} className="mb-3 text-label text-ink-muted">
            Fale com a gente
          </h2>
          <div className="overflow-hidden rounded-l">
            {/*
              E-mail, e não chat: botão de chat sem ninguém do outro lado é pior
              do que não existir. O chat entra quando houver equipe de plantão.
            */}
            <ListRow
              icon="help"
              iconTone="brand"
              title="Enviar e-mail"
              subtitle={`${EMAIL_DE_SUPORTE} · ${HORARIO_DE_ATENDIMENTO}`}
              href={`mailto:${EMAIL_DE_SUPORTE}`}
              chevron
            />
            <ListRow
              icon="flash"
              title="Reportar um problema"
              subtitle="Conte o que aconteceu e anexe um print da tela"
              href={`mailto:${EMAIL_DE_SUPORTE}?subject=${encodeURIComponent(
                `Problema no GasteMenos ${VERSAO}`,
              )}`}
              chevron
            />
          </div>
        </section>

        <div className="flex flex-col gap-2 pt-2">
          <a href="/termos" className="min-h-touch text-body-m text-brand underline">
            Termos de uso
          </a>
          <a href="/privacidade" className="min-h-touch text-body-m text-brand underline">
            Política de privacidade
          </a>
          <p className="text-caption text-ink-muted">{`GasteMenos · versão ${VERSAO}`}</p>
        </div>
      </main>
    </div>
  );
}
