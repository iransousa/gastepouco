# Design system GasteMenos

A versão navegável (tokens nos 3 temas, 17 componentes com prévia ao vivo e o guia de marca) está no artifact **GasteMenos Design System** no Claude. Esta pasta é a cópia que o código usa.

| Arquivo | Uso |
| --- | --- |
| `tokens.json` | Fonte única dos tokens (cores em 3 temas, tipografia, espaço, raios, sombras, tamanhos). Formato de lista `{ tokens: [{ name, value, usage }] }`. |
| `tokens.css` | Variáveis CSS geradas: `:root`/`[data-theme="light"]`, `[data-theme="dark"]`, `[data-theme="contraste"]`, `prefers-color-scheme`, tamanhos de texto (`html[data-text-size]`), foco e movimento reduzido, classes `.text-<estilo>`. |
| `tailwind-preset.ts` | Preset do Tailwind que aponta cada cor, espaço, raio, sombra e estilo de texto para as variáveis. Com ele, `bg-brand`, `text-ink-muted`, `rounded-l`, `text-money-xl`, `min-h-touch`. |
| `bundle-referencia/` | Implementação de referência dos componentes (JS clássico + CSS + tipos). Porte para TSX em `packages/ui`, mantendo nomes de props, classes de estado e comportamento de acessibilidade. |
| `logos/` | Símbolo colorido e monocromático (SVG). Gere os ícones do PWA a partir de `gastemenos-mark.svg`. |

## Regras

- Nenhuma cor, tamanho de fonte ou raio fora dos tokens. Se faltar um token, adicione em `tokens.json` e gere de novo.
- Texto sempre em `rem` (as classes do preset já são), para o ajuste Normal / Grande / Muito grande funcionar.
- As fontes vêm do Google Fonts: Bricolage Grotesque (600, 800) e Figtree (400, 500, 600, 700, 800), com `display=swap`. Em produção, hospede os arquivos no próprio app (`@fontsource-variable/bricolage-grotesque` e `@fontsource-variable/figtree`).
- Três temas: `light` (padrão), `dark`, `contraste`. Sem atributo, o app segue o sistema.

## Componentes (packages/ui)

`Icon`, `Button`, `IconButton`, `Chip`, `SegmentedControl`, `Switch`, `TextField`, `Card`, `ListRow`, `StatTile`, `PriceDelta`, `ProgressBar`, `PointsBadge`, `LevelRing`, `SponsoredBanner`, `Toast`, `BottomNav`. As props e as regras de uso estão em `bundle-referencia/index.d.ts` e nos guias do artifact.

Componentes de tela que ainda não estão no sistema e devem nascer em `packages/ui` durante as fases: `DonutChart`, `WeeklyBars`, `PriceHistoryChart`, `Podium`, `BadgeTile`, `LevelTrail`, `QrScanner` (visor + linha animada), `OtpInput`, `ReceiptCard` (borda serrilhada), `ConfettiBurst` (respeita movimento reduzido), `EmptyState`, `Skeleton`. Tire o visual das telas em `referencia/telas/`.
