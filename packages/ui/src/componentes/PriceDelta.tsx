import { cx } from '../cx.js';

export interface PriceDeltaProps {
  /** Negativo = abaixo da média da região. */
  percent: number;
  compact?: boolean;
  className?: string;
}

/**
 * Comparação com a média da região.
 *
 * Sempre seta **e** palavra, nunca só a cor — quem não distingue verde de
 * laranja precisa saber se pagou mais ou menos (docs/08-ACESSIBILIDADE.md).
 *
 * No modo compacto a tela mostra só "↓ 11%", mas o `aria-label` continua
 * dizendo a frase inteira: seta sozinha é lida de forma imprevisível pelos
 * leitores de tela, quando é lida.
 */
export function PriceDelta({ percent, compact, className }: PriceDeltaProps): React.ReactElement {
  const valor = Math.round(percent || 0);
  const direcao = valor < 0 ? 'down' : valor > 0 ? 'up' : 'same';
  const absoluto = Math.abs(valor);

  const completo =
    direcao === 'down'
      ? `${absoluto}% abaixo da média`
      : direcao === 'up'
        ? `${absoluto}% acima da média`
        : 'na média';

  const visivel =
    direcao === 'down'
      ? compact
        ? `↓ ${absoluto}%`
        : `↓ ${absoluto}% abaixo da média`
      : direcao === 'up'
        ? compact
          ? `↑ ${absoluto}%`
          : `↑ ${absoluto}% acima da média`
        : '= na média';

  // `aria-label` num <span> sem role nao e anunciado de forma confiavel, e
  // role="text" so existe no Safari. Texto visivel escondido do leitor + texto
  // so para o leitor funciona em todos e passa no axe.
  return (
    <span className={cx('gm-delta', `gm-delta--${direcao}`, className)}>
      <span aria-hidden="true">{visivel}</span>
      <span className="gm-sr">{completo}</span>
    </span>
  );
}
