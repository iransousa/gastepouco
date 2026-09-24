/**
 * Componentes do design system GasteMenos.
 *
 * Portados de design-system/bundle-referencia/, mantendo as props de
 * index.d.ts, as classes de estado e o comportamento de acessibilidade.
 *
 * Regra: componente reutilizável mora aqui; componente de uma tela só mora em
 * apps/web/src/rotas/<rota>/ (CLAUDE.md, "Regras de código").
 *
 * Quem usa precisa importar `@gastemenos/ui/estilos.css` e
 * `@gastemenos/tokens/tokens.css` uma vez, no app.
 */
export { cx } from './cx.js';
export { ProvedorDeLink, useLink, type ComponenteDeLink } from './ligacao.js';
export {
  AppearanceProvider,
  APARENCIA_PADRAO,
  aplicarAparencia,
  lerAparenciaSalva,
  useAparencia,
  type Aparencia,
  type TamanhoDeTexto,
  type Tema,
} from './aparencia.js';

export { Icon, NOMES_DE_ICONE, type IconName, type IconProps } from './componentes/Icon.js';
export { Button, type ButtonProps } from './componentes/Button.js';
export { IconButton, type IconButtonProps } from './componentes/IconButton.js';
export { Chip, type ChipProps } from './componentes/Chip.js';
export {
  SegmentedControl,
  type SegmentedControlProps,
} from './componentes/SegmentedControl.js';
export { Switch, type SwitchProps } from './componentes/Switch.js';
export { TextField, type TextFieldProps } from './componentes/TextField.js';
export { Card, type CardProps } from './componentes/Card.js';
export { ListRow, type ListRowProps } from './componentes/ListRow.js';
export { StatTile, type StatTileProps } from './componentes/StatTile.js';
export { PriceDelta, type PriceDeltaProps } from './componentes/PriceDelta.js';
export { ProgressBar, type ProgressBarProps } from './componentes/ProgressBar.js';
export { PointsBadge, type PointsBadgeProps } from './componentes/PointsBadge.js';
export { LevelRing, type LevelRingProps } from './componentes/LevelRing.js';
export {
  SponsoredBanner,
  type SponsoredBannerProps,
} from './componentes/SponsoredBanner.js';
export { Toast, type ToastProps } from './componentes/Toast.js';
export {
  ConfettiBurst,
  type ConfettiBurstProps,
} from './componentes/ConfettiBurst.js';
export {
  DonutChart,
  type DonutChartProps,
  type FatiaDoDonut,
} from './componentes/DonutChart.js';
export {
  WeeklyBars,
  type WeeklyBarsProps,
  type BarraSemanal,
} from './componentes/WeeklyBars.js';
export {
  PriceHistoryChart,
  type PriceHistoryChartProps,
  type PontoDePreco,
} from './componentes/PriceHistoryChart.js';
export {
  BottomNav,
  ITENS_PADRAO,
  type BottomNavItem,
  type BottomNavProps,
} from './componentes/BottomNav.js';
