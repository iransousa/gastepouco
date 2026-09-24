import { createContext, useContext, type AnchorHTMLAttributes, type ReactNode } from 'react';

/**
 * De onde os componentes tiram o "link".
 *
 * O design system não conhece o React Router: se conhecesse, não daria para
 * usá-lo num e-mail, num Storybook ou no verificador de promoções. O app
 * injeta o Link do router aqui uma vez e todo `href` do sistema passa a
 * navegar sem recarregar a página.
 */
export type ComponenteDeLink = (
  props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children?: ReactNode },
) => React.ReactElement;

const AncoraSimples: ComponenteDeLink = (props) => <a {...props} />;

const ContextoDeLink = createContext<ComponenteDeLink>(AncoraSimples);

export function ProvedorDeLink({
  link,
  children,
}: {
  link: ComponenteDeLink;
  children: ReactNode;
}): React.ReactElement {
  return <ContextoDeLink.Provider value={link}>{children}</ContextoDeLink.Provider>;
}

export function useLink(): ComponenteDeLink {
  return useContext(ContextoDeLink);
}
