import { cx } from '../cx.js';

export interface LevelRingProps {
  level: number;
  /** De 0 a 1: quanto falta para o próximo nível. */
  progress: number;
  size?: number;
  className?: string;
}

/**
 * Anel de nível com o progresso até o próximo.
 *
 * O SVG é decorativo; quem lê a tela recebe a frase inteira pelo `aria-label`
 * do contêiner ("Nível 12, 92% para o próximo nível"). Um anel sem isso é
 * informação que só existe para quem enxerga.
 */
export function LevelRing({ level, progress, size = 64, className }: LevelRingProps): React.ReactElement {
  const espessura = Math.max(6, Math.round(size / 9));
  const raio = (size - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const fracao = Math.max(0, Math.min(1, progress || 0));

  return (
    <div
      role="img"
      aria-label={`Nível ${level}, ${Math.round(fracao * 100)}% para o próximo nível`}
      className={cx('gm-level', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
        className="gm-level__svg"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={raio}
          fill="none"
          className="gm-level__track"
          strokeWidth={espessura}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={raio}
          fill="none"
          className="gm-level__bar"
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={`${circunferencia * fracao} ${circunferencia}`}
        />
      </svg>
      <span className="gm-level__text" aria-hidden="true">
        <span className="gm-level__cap">NÍVEL</span>
        <span className="gm-level__num" style={{ fontSize: Math.round(size * 0.34) }}>
          {level}
        </span>
      </span>
    </div>
  );
}
