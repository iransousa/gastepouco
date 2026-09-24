import { formatarCentavos } from '@gastemenos/shared';

/**
 * Casca do Início, só para a Fase 0 ter algo para servir e testar.
 * A tela de verdade nasce na Fase 4, a partir de referencia/telas/Main.dc.html.
 */
export function Inicio(): React.ReactElement {
  return (
    <main className="mx-5 py-8">
      <h1 className="text-title-l text-ink" tabIndex={-1}>
        GasteMenos
      </h1>
      <p className="mt-3 text-body-l text-ink-muted">
        Monorepo no ar. As telas entram a partir da Fase 2.
      </p>
      <p className="mt-6 text-money-xl text-brand">{formatarCentavos(128460)}</p>
      <p className="mt-1 text-caption text-ink-muted">
        Total de setembro no seed — confere com a tela Gastos.
      </p>
    </main>
  );
}
