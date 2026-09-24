import { formatarCentavos } from '@gastemenos/shared';
import { BottomNav, Button, Card, type BottomNavItem } from '@gastemenos/ui';
import { falar } from '../../lib/voz.js';
import type { ResumoDeGastos } from './Inicio.js';

/**
 * `referencia/telas/MainFacil.dc.html`
 *
 * O modo fácil não é "o mesmo app com letra maior". É uma tela com menos
 * coisas: quanto gastou, quanto ainda pode gastar, "Ouvir", três botões
 * grandes e a ajuda. Ranking, selos e ofertas patrocinadas ficam **fora**
 * (docs/08-ACESSIBILIDADE.md) — não porque a pessoa não mereça, mas porque
 * uma tela com uma decisão por vez é o que faz ela conseguir usar o app.
 *
 * Barra inferior com 3 itens, botões de 76px.
 */

const NAVEGACAO_FACIL: BottomNavItem[] = [
  { key: 'inicio', label: 'Início', icon: 'home', href: '/inicio' },
  { key: 'gastos', label: 'Meus gastos', icon: 'chart', href: '/gastos' },
];

export function InicioFacil({ resumo }: { resumo: ResumoDeGastos | null }): React.ReactElement {
  const gastou = formatarCentavos(resumo?.totalCents ?? 0);
  const sobra =
    resumo?.remainingCents !== null && resumo?.remainingCents !== undefined
      ? formatarCentavos(Math.max(resumo.remainingCents, 0))
      : null;

  const emVozAlta = sobra
    ? `Você gastou ${gastou} este mês. Ainda pode gastar ${sobra}.`
    : `Você gastou ${gastou} este mês.`;

  return (
    <div className="mx-auto w-full max-w-[480px] pb-nav">
      <main className="flex flex-col gap-5 px-5 pt-8">
        <h1 tabIndex={-1} className="text-easy-title text-ink outline-none">
          Seus gastos
        </h1>

        <Card tone="brand" className="gap-2">
          <span className="text-easy-body opacity-90">Você gastou este mês</span>
          <span className="text-money-xl">{gastou}</span>
        </Card>

        {sobra ? (
          <Card tone="soft" className="gap-2">
            <span className="text-easy-body">Ainda pode gastar</span>
            <span className="text-title-l text-ink">{sobra}</span>
          </Card>
        ) : null}

        <Button
          size="easy"
          variant="secondary"
          icon="volume"
          fullWidth
          onClick={() => falar(emVozAlta)}
        >
          Ouvir
        </Button>

        <Button size="easy" icon="scan" fullWidth href="/ler-nota">
          Ler nota fiscal
        </Button>
        <Button size="easy" variant="secondary" icon="cart" fullWidth href="/lista">
          Minha lista de compras
        </Button>
        <Button size="easy" variant="secondary" icon="tag" fullWidth href="/ofertas">
          Onde está mais barato
        </Button>

        <a
          href="/ajuda"
          className="mt-2 flex min-h-touch items-center justify-center text-easy-body text-brand underline"
        >
          Precisa de ajuda? Toque aqui
        </a>
      </main>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-[480px]">
        <BottomNav active="inicio" items={NAVEGACAO_FACIL} scanLabel="Ler nota" />
      </div>
    </div>
  );
}
