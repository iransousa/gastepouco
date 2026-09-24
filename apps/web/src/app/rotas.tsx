import type { RouteObject } from 'react-router-dom';
import { Inicio } from '../rotas/inicio/Inicio.js';
import { DevUI } from '../rotas/dev-ui/DevUI.js';

/**
 * Mapa de rotas. Os caminhos são os de docs/05-TELAS-E-ROTAS.md e estão em
 * português porque aparecem na barra de endereço para a pessoa.
 *
 * As 34 telas entram nas fases 2 a 7.
 */
export const rotas: RouteObject[] = [
  { path: '/', element: <Inicio /> },
  { path: '/inicio', element: <Inicio /> },

  // Conferência do design system. `import.meta.env.DEV` some no build de
  // produção, então a rota não vai para o ar junto com o app.
  ...(import.meta.env.DEV ? [{ path: '/dev/ui', element: <DevUI /> }] : []),
];
