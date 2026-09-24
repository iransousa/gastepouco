import type * as React from 'react';

export type IconName =
  | 'home' | 'chart' | 'scan' | 'tag' | 'trophy' | 'list' | 'bell' | 'pin' | 'check' | 'close' | 'back' | 'next'
  | 'share' | 'star' | 'flame' | 'plus' | 'cart' | 'help' | 'volume' | 'lock' | 'user' | 'shield' | 'trendDown'
  | 'trendLine' | 'search' | 'flash' | 'image' | 'keyboard' | 'pause' | 'trash' | 'logout' | 'download' | 'receipt';

/** Ícone de traço 24×24 que herda a cor do texto. Sem `label` é decorativo (aria-hidden). */
export interface IconProps { name: IconName; size?: number; strokeWidth?: number; label?: string; className?: string }
export declare function Icon(props: IconProps): React.ReactElement;

/** Botão com texto. `href` renderiza um link com a mesma aparência. */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'lime' | 'danger';
  size?: 'm' | 'l' | 'easy';
  icon?: IconName; iconEnd?: IconName; fullWidth?: boolean; href?: string;
}
export declare function Button(props: ButtonProps): React.ReactElement;

/** Botão só com ícone, 44×44. `label` é obrigatório: vira o aria-label. */
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName; label: string; variant?: 'outline' | 'solid' | 'ghost'; badge?: boolean; href?: string;
}
export declare function IconButton(props: IconButtonProps): React.ReactElement;

/** Filtro de toque, liga/desliga. */
export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { selected?: boolean; icon?: IconName }
export declare function Chip(props: ChipProps): React.ReactElement;

/** Escolha exclusiva entre 2 a 4 opções curtas (Mês / 3 meses / Ano). */
export interface SegmentedControlProps { label: string; options: { value: string; label: string }[]; value: string; onChange?: (value: string) => void; className?: string }
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement;

/** Linha de preferência com interruptor (role="switch"). */
export interface SwitchProps { label: string; description?: string; checked: boolean; onChange?: (next: boolean) => void; disabled?: boolean; className?: string }
export declare function Switch(props: SwitchProps): React.ReactElement;

/** Campo de texto com rótulo sempre visível, dica e erro ligados por aria-describedby. */
export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> { label: string; hint?: string; error?: string; optional?: boolean; trailing?: React.ReactNode }
export declare function TextField(props: TextFieldProps): React.ReactElement;

/** Superfície agrupadora. `brand` só no cartão de gastos do mês. */
export interface CardProps extends React.HTMLAttributes<HTMLElement> { tone?: 'default' | 'brand' | 'soft' | 'points' | 'offer' | 'sunken'; as?: keyof JSX.IntrinsicElements }
export declare function Card(props: CardProps): React.ReactElement;

/** Linha de lista: nota fiscal, item de configuração, loja. */
export interface ListRowProps { title: React.ReactNode; subtitle?: React.ReactNode; icon?: IconName; iconTone?: 'neutral' | 'brand' | 'points' | 'offer'; trailing?: React.ReactNode; href?: string; onClick?: () => void; chevron?: boolean; className?: string }
export declare function ListRow(props: ListRowProps): React.ReactElement;

/** Número pequeno com rótulo (Média hoje / Você pagou). */
export interface StatTileProps { label: string; value: React.ReactNode; tone?: 'default' | 'soft' | 'points' | 'offer'; className?: string }
export declare function StatTile(props: StatTileProps): React.ReactElement;

/** Comparação com a média da região. Sempre seta + palavra, nunca só cor. */
export interface PriceDeltaProps { percent: number; compact?: boolean; className?: string }
export declare function PriceDelta(props: PriceDeltaProps): React.ReactElement;

/** Barra de progresso (orçamento, pontos até o próximo nível). */
export interface ProgressBarProps { value: number; label: string; tone?: 'points' | 'brand' | 'lime'; onDark?: boolean; className?: string }
export declare function ProgressBar(props: ProgressBarProps): React.ReactElement;

/** "+60 pontos". O app diz "pontos", nunca "XP". */
export interface PointsBadgeProps { points: number; size?: 'm' | 'l'; className?: string }
export declare function PointsBadge(props: PointsBadgeProps): React.ReactElement;

/** Anel de nível com progresso até o próximo. */
export interface LevelRingProps { level: number; progress: number; size?: number; className?: string }
export declare function LevelRing(props: LevelRingProps): React.ReactElement;

/** Oferta paga por parceiro. O selo "Patrocinado" não pode ser removido. */
export interface SponsoredBannerProps { title: string; description?: string; ctaLabel?: string; href?: string; className?: string }
export declare function SponsoredBanner(props: SponsoredBannerProps): React.ReactElement;

/** Confirmação curta após salvar (role="status"). */
export interface ToastProps { children: React.ReactNode; className?: string }
export declare function Toast(props: ToastProps): React.ReactElement;

/** Barra inferior: 4 destinos + botão central Ler nota com rótulo visível. */
export interface BottomNavItem { key: string; label: string; icon: IconName; href: string }
export interface BottomNavProps { active?: string; items?: BottomNavItem[]; scanHref?: string; scanLabel?: string; className?: string }
export declare function BottomNav(props: BottomNavProps): React.ReactElement;

declare global {
  interface Window {
    GasteMenos: {
      Icon: typeof Icon; Button: typeof Button; IconButton: typeof IconButton; Chip: typeof Chip;
      SegmentedControl: typeof SegmentedControl; Switch: typeof Switch; TextField: typeof TextField; Card: typeof Card;
      ListRow: typeof ListRow; StatTile: typeof StatTile; PriceDelta: typeof PriceDelta; ProgressBar: typeof ProgressBar;
      PointsBadge: typeof PointsBadge; LevelRing: typeof LevelRing; SponsoredBanner: typeof SponsoredBanner;
      Toast: typeof Toast; BottomNav: typeof BottomNav;
    };
  }
}
