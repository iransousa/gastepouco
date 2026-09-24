/* @ds-bundle: {"format":4,"namespace":"GasteMenos","components":[{"name":"Icon"},{"name":"Button"},{"name":"IconButton"},{"name":"Chip"},{"name":"SegmentedControl"},{"name":"Switch"},{"name":"TextField"},{"name":"Card"},{"name":"ListRow"},{"name":"StatTile"},{"name":"PriceDelta"},{"name":"ProgressBar"},{"name":"PointsBadge"},{"name":"LevelRing"},{"name":"SponsoredBanner"},{"name":"Toast"},{"name":"BottomNav"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    return Array.prototype.filter.call(arguments, Boolean).join(' ');
  }
  function omit(obj, keys) {
    var out = {};
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) out[k] = obj[k];
    }
    return out;
  }

  var ICONS = {
    home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
    chart: 'M21 12a9 9 0 1 1-9-9v9zM15 3.5A9 9 0 0 1 20.5 9H15z',
    scan: 'M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10',
    tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3',
    trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
    list: 'M9 6h11M9 12h11M9 18h11M3.5 6l1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2',
    bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0',
    pin: 'M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 6.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 1 0 0-5',
    check: 'M20 6 9 17l-5-5',
    close: 'M18 6 6 18M6 6l12 12',
    back: 'm15 18-6-6 6-6',
    next: 'm9 18 6-6-6-6',
    share: 'M18 2a3 3 0 1 0 0 6 3 3 0 1 0 0-6M6 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6M18 16a3 3 0 1 0 0 6 3 3 0 1 0 0-6M8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
    star: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z',
    flame: 'M12 22c4 0 7-3 7-7 0-4-3-6-4-9-1 2-2 3-4 3 0-2 0-4-2-6-1 4-4 6-4 11 0 5 3 8 7 8z',
    plus: 'M12 5v14M5 12h14',
    cart: 'M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 8H6M9 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3M18 18.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 1 0 0-3',
    help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01',
    volume: 'M11 5 6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
    lock: 'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2zM8 11V7a4 4 0 0 1 8 0v4',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8',
    shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
    trendDown: 'm3 7 6 6 4-4 8 8M21 11v6h-6',
    trendLine: 'M3 3v18h18M7 14l4-4 3 3 5-6',
    search: 'M11 4a7 7 0 1 0 0 14 7 7 0 1 0 0-14M20 20l-3.5-3.5',
    flash: 'M13 2 4 14h7l-1 8 9-12h-7z',
    image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 7a2 2 0 1 0 0 4 2 2 0 1 0 0-4M21 15l-5-5L5 21',
    keyboard: 'M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM7 10h.01M11 10h.01M15 10h.01M7 14h10',
    pause: 'M9 5v14M15 5v14',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    logout: 'M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l-5-5 5-5M5 12h11',
    download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
    receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6'
  };

  function Icon(p) {
    var size = p.size || 24;
    var labelled = !!p.label;
    return h('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: p.strokeWidth || 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      className: cx('gm-icon', p.className),
      role: labelled ? 'img' : undefined,
      'aria-label': labelled ? p.label : undefined,
      'aria-hidden': labelled ? undefined : 'true',
      focusable: 'false'
    }, h('path', { d: ICONS[p.name] || '' }));
  }
  Icon.names = Object.keys(ICONS);

  function Button(p) {
    var variant = p.variant || 'primary';
    var size = p.size || 'l';
    var rest = omit(p, ['variant', 'size', 'icon', 'iconEnd', 'fullWidth', 'className', 'children']);
    var tag = p.href ? 'a' : 'button';
    if (!p.href && rest.type === undefined) rest.type = 'button';
    rest.className = cx('gm-btn', 'gm-btn--' + variant, 'gm-btn--' + size, p.fullWidth && 'gm-btn--full', p.className);
    var iconSize = size === 'easy' ? 30 : size === 'm' ? 18 : 20;
    return h(tag, rest,
      p.icon ? h('span', { className: size === 'easy' ? 'gm-btn__easyicon' : 'gm-btn__icon' }, h(Icon, { name: p.icon, size: iconSize })) : null,
      h('span', { className: 'gm-btn__label' }, p.children),
      p.iconEnd ? h(Icon, { name: p.iconEnd, size: iconSize }) : null);
  }

  function IconButton(p) {
    var rest = omit(p, ['icon', 'label', 'variant', 'className', 'badge']);
    var tag = p.href ? 'a' : 'button';
    if (!p.href && rest.type === undefined) rest.type = 'button';
    rest['aria-label'] = p.label;
    rest.className = cx('gm-iconbtn', 'gm-iconbtn--' + (p.variant || 'outline'), p.className);
    return h(tag, rest, h(Icon, { name: p.icon, size: 22 }), p.badge ? h('span', { className: 'gm-iconbtn__dot', 'aria-hidden': 'true' }) : null);
  }

  function Chip(p) {
    var rest = omit(p, ['selected', 'icon', 'className', 'children']);
    rest.type = 'button';
    rest['aria-pressed'] = p.selected ? 'true' : 'false';
    rest.className = cx('gm-chip', p.selected && 'gm-chip--on', p.className);
    return h('button', rest, p.icon ? h(Icon, { name: p.icon, size: 16 }) : null, p.children);
  }

  function SegmentedControl(p) {
    return h('div', { role: 'group', 'aria-label': p.label, className: cx('gm-seg', p.className) },
      (p.options || []).map(function (o) {
        var on = o.value === p.value;
        return h('button', {
          key: o.value, type: 'button', 'aria-pressed': on ? 'true' : 'false',
          className: cx('gm-seg__item', on && 'gm-seg__item--on'),
          onClick: function () { if (p.onChange) p.onChange(o.value); }
        }, o.label);
      }));
  }

  function Switch(p) {
    var on = !!p.checked;
    return h('div', { className: cx('gm-switchrow', p.className) },
      h('span', { className: 'gm-switchrow__text' },
        h('span', { className: 'gm-switchrow__label' }, p.label),
        p.description ? h('span', { className: 'gm-switchrow__desc' }, p.description) : null),
      h('button', {
        type: 'button', role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': p.label,
        disabled: p.disabled, className: cx('gm-switch', on && 'gm-switch--on'),
        onClick: function () { if (p.onChange) p.onChange(!on); }
      }, h('span', { className: 'gm-switch__track' }, h('span', { className: 'gm-switch__knob' }, on ? h(Icon, { name: 'check', size: 14, strokeWidth: 3.4 }) : null))));
  }

  var fieldSeq = 0;
  function TextField(p) {
    var idRef = React.useRef(null);
    if (idRef.current === null) { fieldSeq += 1; idRef.current = p.id || 'gm-field-' + fieldSeq; }
    var id = idRef.current;
    var hintId = id + '-hint';
    var errId = id + '-err';
    var rest = omit(p, ['label', 'hint', 'error', 'optional', 'className', 'trailing']);
    rest.id = id;
    rest.className = cx('gm-field__input', p.error && 'gm-field__input--error');
    rest['aria-invalid'] = p.error ? 'true' : undefined;
    var described = [p.hint ? hintId : null, p.error ? errId : null].filter(Boolean).join(' ');
    if (described) rest['aria-describedby'] = described;
    return h('div', { className: cx('gm-field', p.className) },
      h('label', { htmlFor: id, className: 'gm-field__label' }, p.label, p.optional ? h('span', { className: 'gm-field__opt' }, ' (opcional)') : null),
      h('div', { className: 'gm-field__wrap' }, h('input', rest), p.trailing || null),
      p.error ? h('span', { id: errId, role: 'alert', className: 'gm-field__error' }, p.error) : null,
      p.hint ? h('span', { id: hintId, className: 'gm-field__hint' }, p.hint) : null);
  }

  function Card(p) {
    var rest = omit(p, ['tone', 'className', 'children', 'as']);
    rest.className = cx('gm-card', 'gm-card--' + (p.tone || 'default'), p.className);
    return h(p.as || 'section', rest, p.children);
  }

  function ListRow(p) {
    var tag = p.href ? 'a' : p.onClick ? 'button' : 'div';
    var props = { className: cx('gm-row', (p.href || p.onClick) && 'gm-row--action', p.className) };
    if (p.href) props.href = p.href;
    if (p.onClick) { props.onClick = p.onClick; props.type = 'button'; }
    return h(tag, props,
      p.icon ? h('span', { className: cx('gm-row__icon', 'gm-row__icon--' + (p.iconTone || 'neutral')) }, h(Icon, { name: p.icon, size: 20 })) : null,
      h('span', { className: 'gm-row__text' },
        h('span', { className: 'gm-row__title' }, p.title),
        p.subtitle ? h('span', { className: 'gm-row__sub' }, p.subtitle) : null),
      p.trailing ? h('span', { className: 'gm-row__trail' }, p.trailing) : null,
      p.chevron ? h(Icon, { name: 'next', size: 18, className: 'gm-row__chev' }) : null);
  }

  function StatTile(p) {
    return h('div', { className: cx('gm-stat', 'gm-stat--' + (p.tone || 'default'), p.className) },
      h('span', { className: 'gm-stat__label' }, p.label),
      h('span', { className: 'gm-stat__value' }, p.value));
  }

  function PriceDelta(p) {
    var v = Math.round(p.percent || 0);
    var dir = v < 0 ? 'down' : v > 0 ? 'up' : 'same';
    var abs = Math.abs(v);
    var text = dir === 'down' ? (p.compact ? '↓ ' + abs + '%' : '↓ ' + abs + '% abaixo da média')
      : dir === 'up' ? (p.compact ? '↑ ' + abs + '%' : '↑ ' + abs + '% acima da média')
      : '= na média';
    return h('span', { className: cx('gm-delta', 'gm-delta--' + dir, p.className) }, text);
  }

  function ProgressBar(p) {
    var v = Math.max(0, Math.min(1, p.value || 0));
    return h('div', {
      role: 'progressbar', 'aria-label': p.label, 'aria-valuemin': 0, 'aria-valuemax': 100,
      'aria-valuenow': Math.round(v * 100), className: cx('gm-progress', 'gm-progress--' + (p.tone || 'points'), p.onDark && 'gm-progress--ondark', p.className)
    }, h('span', { className: 'gm-progress__fill', style: { width: v * 100 + '%' } }));
  }

  function PointsBadge(p) {
    var n = p.points || 0;
    return h('span', { className: cx('gm-points', p.size === 'l' && 'gm-points--l', p.className) },
      h(Icon, { name: 'star', size: p.size === 'l' ? 16 : 13, strokeWidth: 2.4 }), (n > 0 ? '+' : '') + n + ' pontos');
  }

  function LevelRing(p) {
    var size = p.size || 64;
    var stroke = Math.max(6, Math.round(size / 9));
    var r = (size - stroke) / 2;
    var circ = 2 * Math.PI * r;
    var prog = Math.max(0, Math.min(1, p.progress || 0));
    return h('div', {
      role: 'img', 'aria-label': 'Nível ' + p.level + ', ' + Math.round(prog * 100) + '% para o próximo nível',
      className: cx('gm-level', p.className), style: { width: size, height: size }
    },
      h('svg', { width: size, height: size, viewBox: '0 0 ' + size + ' ' + size, 'aria-hidden': 'true', className: 'gm-level__svg' },
        h('circle', { cx: size / 2, cy: size / 2, r: r, fill: 'none', className: 'gm-level__track', strokeWidth: stroke }),
        h('circle', { cx: size / 2, cy: size / 2, r: r, fill: 'none', className: 'gm-level__bar', strokeWidth: stroke, strokeLinecap: 'round', strokeDasharray: (circ * prog) + ' ' + circ })),
      h('span', { className: 'gm-level__text', 'aria-hidden': 'true' },
        h('span', { className: 'gm-level__cap' }, 'NÍVEL'),
        h('span', { className: 'gm-level__num', style: { fontSize: Math.round(size * 0.34) } }, p.level)));
  }

  function SponsoredBanner(p) {
    return h('section', { className: cx('gm-sponsor', p.className), 'aria-label': 'Oferta patrocinada' },
      h('span', { className: 'gm-sponsor__tag' }, 'Patrocinado'),
      h('h3', { className: 'gm-sponsor__title' }, p.title),
      p.description ? h('p', { className: 'gm-sponsor__desc' }, p.description) : null,
      p.ctaLabel ? h('a', { href: p.href || '#', className: 'gm-sponsor__cta' }, p.ctaLabel) : null,
      h('span', { className: 'gm-sponsor__shape gm-sponsor__shape--a', 'aria-hidden': 'true' }),
      h('span', { className: 'gm-sponsor__shape gm-sponsor__shape--b', 'aria-hidden': 'true' }));
  }

  function Toast(p) {
    return h('div', { role: 'status', className: cx('gm-toast', p.className) },
      h(Icon, { name: 'check', size: 18, strokeWidth: 3 }), h('span', null, p.children));
  }

  var NAV_ITEMS = [
    { key: 'inicio', label: 'Início', icon: 'home', href: '/inicio' },
    { key: 'gastos', label: 'Gastos', icon: 'chart', href: '/gastos' },
    { key: 'ofertas', label: 'Ofertas', icon: 'tag', href: '/ofertas' },
    { key: 'ranking', label: 'Ranking', icon: 'trophy', href: '/ranking' }
  ];
  function BottomNav(p) {
    var items = p.items || NAV_ITEMS;
    var half = Math.ceil(items.length / 2);
    function item(it) {
      var on = it.key === p.active;
      return h('a', { key: it.key, href: it.href, 'aria-current': on ? 'page' : undefined, className: cx('gm-nav__item', on && 'gm-nav__item--on') },
        h(Icon, { name: it.icon, size: 24, strokeWidth: on ? 2.4 : 2 }), h('span', null, it.label));
    }
    return h('nav', { 'aria-label': 'Navegação principal', className: cx('gm-nav', p.className) },
      items.slice(0, half).map(item),
      h('a', { href: p.scanHref || '/ler-nota', className: 'gm-nav__scan' },
        h('span', { className: 'gm-nav__fab' }, h(Icon, { name: 'scan', size: 30, strokeWidth: 2.2 })),
        h('span', null, p.scanLabel || 'Ler nota')),
      items.slice(half).map(item));
  }

  var api = {
    Icon: Icon, Button: Button, IconButton: IconButton, Chip: Chip, SegmentedControl: SegmentedControl,
    Switch: Switch, TextField: TextField, Card: Card, ListRow: ListRow, StatTile: StatTile,
    PriceDelta: PriceDelta, ProgressBar: ProgressBar, PointsBadge: PointsBadge, LevelRing: LevelRing,
    SponsoredBanner: SponsoredBanner, Toast: Toast, BottomNav: BottomNav
  };
  window.GasteMenos = Object.assign(window.GasteMenos || {}, api);
})();
