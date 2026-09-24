import type { RouteObject } from 'react-router-dom';
import { Inicio } from '../rotas/inicio/Inicio.js';

/**
 * Mapa de rotas. Os caminhos são os de docs/05-TELAS-E-ROTAS.md e estão em
 * português porque aparecem na barra de endereço para a pessoa.
 *
 * As 34 telas entram nas fases 2 a 7; por ora só a casca do Início existe.
 */
export const rotas: RouteObject[] = [
  { path: '/', element: <Inicio /> },
  { path: '/inicio', element: <Inicio /> },
];
