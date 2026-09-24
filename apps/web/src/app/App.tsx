import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { rotas } from './rotas.js';

/**
 * Raiz do app: providers e roteador.
 *
 * As telas entram nas fases 2 a 7 (docs/11-ROADMAP-E-PROMPTS.md). O que existe
 * aqui é a casca: cache de dados, roteamento e, na fase 1, o AppearanceProvider
 * que aplica tema, tamanho de texto e movimento reduzido no <html>.
 */
const cliente = new QueryClient({
  defaultOptions: {
    queries: {
      // O app abre offline mostrando o que já estava salvo; recarregar a cada
      // foco brigaria com isso e gastaria dados de quem está no 4G.
      refetchOnWindowFocus: false,
      staleTime: 60_000,
      retry: (tentativa, erro) => {
        // Não insistir em erro de regra (400/401/403/404): só em falha de rede.
        const status = (erro as { status?: number } | null)?.status ?? 0;
        if (status >= 400 && status < 500) return false;
        return tentativa < 2;
      },
    },
  },
});

const roteador = createBrowserRouter(rotas);

export function App(): React.ReactElement {
  return (
    <QueryClientProvider client={cliente}>
      <RouterProvider router={roteador} />
    </QueryClientProvider>
  );
}
