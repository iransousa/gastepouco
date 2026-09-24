import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { ExigeSessao } from './sessao.js';
import { Inicio } from '../rotas/inicio/Inicio.js';
import { DevUI } from '../rotas/dev-ui/DevUI.js';
import { BoasVindas } from '../rotas/boas-vindas/BoasVindas.js';
import { Entrar } from '../rotas/acesso/Entrar.js';
import { CriarConta } from '../rotas/acesso/CriarConta.js';
import { ConfirmarEmail } from '../rotas/acesso/ConfirmarEmail.js';
import { RecuperarSenha } from '../rotas/acesso/RecuperarSenha.js';
import { EntrarComGoogle } from '../rotas/acesso/EntrarComGoogle.js';
import { PerfilDeConsumo } from '../rotas/perfil-de-consumo/PerfilDeConsumo.js';
import { PerfilPronto } from '../rotas/perfil-de-consumo/PerfilPronto.js';
import { Escanear } from '../rotas/ler-nota/Escanear.js';
import { NotaLida } from '../rotas/notas/NotaLida.js';

/**
 * Mapa de rotas (docs/05-TELAS-E-ROTAS.md). Os caminhos estão em português
 * porque aparecem na barra de endereço para a pessoa.
 *
 * Quem chega em `/` sem sessão começa pelas boas-vindas; `ExigeSessao` cuida do
 * resto e leva ao login guardando de onde veio.
 */
export const rotas: RouteObject[] = [
  { path: '/', element: <Navigate to="/boas-vindas/1" replace /> },

  // Primeiro uso e acesso — sem sessão.
  { path: '/boas-vindas/:passo', element: <BoasVindas /> },
  { path: '/criar-conta', element: <CriarConta /> },
  { path: '/confirmar-email', element: <ConfirmarEmail /> },
  { path: '/entrar', element: <Entrar /> },
  { path: '/entrar/google', element: <EntrarComGoogle /> },
  { path: '/recuperar-senha', element: <RecuperarSenha /> },
  { path: '/recuperar-senha/nova', element: <RecuperarSenha /> },

  // Com sessão.
  {
    path: '/perfil-de-consumo',
    element: (
      <ExigeSessao>
        <PerfilDeConsumo />
      </ExigeSessao>
    ),
  },
  {
    path: '/perfil-de-consumo/pronto',
    element: (
      <ExigeSessao>
        <PerfilPronto />
      </ExigeSessao>
    ),
  },
  {
    path: '/ler-nota',
    element: (
      <ExigeSessao>
        <Escanear />
      </ExigeSessao>
    ),
  },
  {
    path: '/notas/:id/resultado',
    element: (
      <ExigeSessao>
        <NotaLida />
      </ExigeSessao>
    ),
  },
  {
    path: '/inicio',
    element: (
      <ExigeSessao>
        <Inicio />
      </ExigeSessao>
    ),
  },

  // Conferência do design system. `import.meta.env.DEV` some no build de
  // produção, então a rota não vai para o ar junto com o app.
  ...(import.meta.env.DEV ? [{ path: '/dev/ui', element: <DevUI /> }] : []),
];
