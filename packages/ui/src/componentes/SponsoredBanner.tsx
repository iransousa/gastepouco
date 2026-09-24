import { cx } from '../cx.js';
import { useLink } from '../ligacao.js';

export interface SponsoredBannerProps {
  title: string;
  description?: string;
  ctaLabel?: string;
  href?: string;
  className?: string;
}

/**
 * Oferta paga por parceiro.
 *
 * O selo "Patrocinado" é obrigatório e não tem prop para desligar: conteúdo
 * pago precisa se identificar como tal (CLAUDE.md, "Texto da interface", e
 * docs/09-SEGURANCA-LGPD.md, "Transparência"). Se um dia alguém quiser
 * esconder, vai ter que editar este arquivo e explicar no diff.
 */
export function SponsoredBanner({
  title,
  description,
  ctaLabel,
  href,
  className,
}: SponsoredBannerProps): React.ReactElement {
  const Link = useLink();
  return (
    <section className={cx('gm-sponsor', className)} aria-label="Oferta patrocinada">
      <span className="gm-sponsor__tag">Patrocinado</span>
      <h3 className="gm-sponsor__title">{title}</h3>
      {description ? <p className="gm-sponsor__desc">{description}</p> : null}
      {ctaLabel ? (
        <Link href={href ?? '#'} className="gm-sponsor__cta">
          {ctaLabel}
        </Link>
      ) : null}
      <span className="gm-sponsor__shape gm-sponsor__shape--a" aria-hidden="true" />
      <span className="gm-sponsor__shape gm-sponsor__shape--b" aria-hidden="true" />
    </section>
  );
}
