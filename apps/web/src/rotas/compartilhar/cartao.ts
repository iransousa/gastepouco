import { formatarCentavos } from '@gastemenos/shared';

/**
 * Cartão de compartilhar, desenhado em canvas a 1080×1920.
 *
 * 1080×1920 é o formato de Stories; qualquer coisa menor sai borrada quando o
 * Instagram amplia. Desenhamos em canvas, e não convertendo HTML em imagem,
 * porque `html2canvas` e afins erram fonte e sombra e pesam ~200 KB — aqui são
 * ~60 linhas e o resultado é exato.
 *
 * As cores vêm dos tokens lidos do `<html>`: o cartão sai no tema que a pessoa
 * está usando, sem uma segunda tabela de cores para manter em sincronia.
 */

export interface DadosDoCartao {
  level: number;
  levelName: string;
  savingsCents: number;
  rank: number | null;
  badges: Array<{ id: string; name: string }>;
  inviteCode: string;
}

const LARGURA = 1080;
const ALTURA = 1920;

function token(nome: string, reserva: string): string {
  if (typeof document === 'undefined') return reserva;
  const valor = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return valor || reserva;
}

/** Quebra o texto em linhas que cabem na largura. */
function quebrar(
  pincel: CanvasRenderingContext2D,
  texto: string,
  largura: number,
): string[] {
  const palavras = texto.split(' ');
  const linhas: string[] = [];
  let atual = '';

  for (const palavra of palavras) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (pincel.measureText(tentativa).width > largura && atual) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

export async function desenharCartao(dados: DadosDoCartao): Promise<Blob> {
  const tela = document.createElement('canvas');
  tela.width = LARGURA;
  tela.height = ALTURA;

  const pincel = tela.getContext('2d');
  if (!pincel) throw new Error('Este navegador não consegue desenhar o cartão.');

  const marca = token('--brand', '#0E4D3A');
  const sobreMarca = token('--on-brand', '#F5F3EC');
  const lima = token('--lime', '#D4F36B');

  pincel.fillStyle = marca;
  pincel.fillRect(0, 0, LARGURA, ALTURA);

  // Círculo decorativo, como no cartão da tela.
  pincel.fillStyle = 'rgba(255,255,255,0.06)';
  pincel.beginPath();
  pincel.arc(LARGURA - 120, 360, 420, 0, Math.PI * 2);
  pincel.fill();

  pincel.textAlign = 'center';

  pincel.fillStyle = sobreMarca;
  pincel.font = '600 44px Figtree, system-ui, sans-serif';
  pincel.globalAlpha = 0.8;
  pincel.fillText('GASTEMENOS', LARGURA / 2, 220);
  pincel.globalAlpha = 1;

  pincel.font = '500 52px Figtree, system-ui, sans-serif';
  pincel.fillText('Este mês eu economizei', LARGURA / 2, 520);

  pincel.fillStyle = lima;
  pincel.font = '800 150px "Bricolage Grotesque", Figtree, system-ui, sans-serif';
  pincel.fillText(formatarCentavos(dados.savingsCents), LARGURA / 2, 680);

  pincel.fillStyle = sobreMarca;
  pincel.font = '800 64px "Bricolage Grotesque", Figtree, system-ui, sans-serif';
  pincel.fillText(`Nível ${dados.level}`, LARGURA / 2, 860);

  pincel.font = '500 48px Figtree, system-ui, sans-serif';
  pincel.globalAlpha = 0.85;
  for (const [indice, linha] of quebrar(pincel, dados.levelName, 880).entries()) {
    pincel.fillText(linha, LARGURA / 2, 930 + indice * 60);
  }

  if (dados.rank) {
    pincel.fillText(`${dados.rank}º entre os amigos`, LARGURA / 2, 1050);
  }
  pincel.globalAlpha = 1;

  // Selos: três, em pastilhas.
  let y = 1220;
  pincel.font = '600 40px Figtree, system-ui, sans-serif';
  for (const selo of dados.badges.slice(0, 3)) {
    const largura = pincel.measureText(selo.name).width + 80;
    const x = (LARGURA - largura) / 2;

    pincel.fillStyle = 'rgba(255,255,255,0.14)';
    pincel.beginPath();
    pincel.roundRect(x, y - 52, largura, 78, 39);
    pincel.fill();

    pincel.fillStyle = sobreMarca;
    pincel.fillText(selo.name, LARGURA / 2, y);
    y += 110;
  }

  // Convite: o motivo de o cartão existir.
  pincel.fillStyle = lima;
  pincel.font = '500 44px Figtree, system-ui, sans-serif';
  pincel.fillText('Entre com o meu código', LARGURA / 2, ALTURA - 340);

  pincel.fillStyle = sobreMarca;
  pincel.font = '800 96px "Bricolage Grotesque", Figtree, system-ui, sans-serif';
  pincel.fillText(dados.inviteCode, LARGURA / 2, ALTURA - 230);

  pincel.font = '400 38px Figtree, system-ui, sans-serif';
  pincel.globalAlpha = 0.7;
  pincel.fillText('gastemenos.com.br', LARGURA / 2, ALTURA - 130);

  return new Promise<Blob>((resolver, rejeitar) => {
    tela.toBlob(
      (imagem) =>
        imagem ? resolver(imagem) : rejeitar(new Error('Não foi possível gerar a imagem.')),
      'image/png',
    );
  });
}

/**
 * Compartilha o cartão.
 *
 * Web Share com arquivo quando o aparelho suporta; senão baixa o PNG. Baixar
 * não é "falhar": num computador, salvar a imagem é o comportamento esperado.
 */
export async function compartilharCartao(
  imagem: Blob,
  texto: string,
): Promise<'compartilhado' | 'baixado'> {
  const arquivo = new File([imagem], 'gastemenos.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], text: texto });
      return 'compartilhado';
    } catch (falha) {
      // Cancelar não é erro: a pessoa mudou de ideia, e cair no download
      // seria surpreendê-la com um arquivo que ela não pediu.
      if ((falha as { name?: string }).name === 'AbortError') return 'compartilhado';
    }
  }

  const endereco = URL.createObjectURL(imagem);
  const link = document.createElement('a');
  link.href = endereco;
  link.download = 'gastemenos.png';
  link.click();
  URL.revokeObjectURL(endereco);

  return 'baixado';
}
