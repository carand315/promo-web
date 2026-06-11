import type * as LType from 'leaflet';
import { Promocion } from '../../admin/promociones/models/promocion.model';

export interface MarkerIconOptions {
  selected?: boolean;
  color?: string;
  w?: number;
  h?: number;
  popupAnchor?: [number, number];
}

function ensureLogoMarkerStyles(): void {
  const ID = 'dh-logo-marker-styles';
  if (document.getElementById(ID)) return;
  const style = document.createElement('style');
  style.id = ID;
  style.textContent = `
    @keyframes dh-radar {
      0%   { transform: scale(1);   opacity: 0.75; }
      100% { transform: scale(2.8); opacity: 0;    }
    }
    .dh-logo-marker {
      position: relative;
      display: inline-block;
    }
    .dh-logo-marker::before,
    .dh-logo-marker::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.55);
      animation: dh-radar 2s ease-out infinite;
      pointer-events: none;
    }
    .dh-logo-marker::after {
      animation-delay: 0.9s;
    }
    .dh-logo-circle {
      border-radius: 50%;
      overflow: hidden;
      box-shadow:
        0 0 0 3px rgba(255,255,255,0.95),
        0 6px 20px rgba(0,0,0,0.55);
      position: relative;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Construye un L.divIcon para un marcador de Leaflet.
 * Si la promo tiene logoUrl → muestra el logo circular dentro del pin.
 * Si no → muestra el pin SVG estándar con descuento% o ★.
 */
export function buildMarkerIcon(
  L: typeof LType,
  promo: Promocion,
  opts: MarkerIconOptions = {}
): LType.DivIcon {
  const color  = opts.color ?? '#E8372C';
  const shadow = opts.selected
    ? 'drop-shadow(0 6px 16px rgba(0,0,0,.45))'
    : 'drop-shadow(0 4px 10px rgba(0,0,0,.32))';

  if (promo.logoUrl) {
    ensureLogoMarkerStyles();

    // Círculo puro: tamaño cuadrado, ancla en el centro
    const d = opts.selected ? 52 : 40;
    const svgHtml = buildLogoSvg(promo, d);

    const iconOptions: LType.DivIconOptions = {
      className:   '',
      iconSize:    [d, d],
      iconAnchor:  [d / 2, d / 2],
      popupAnchor: opts.popupAnchor ?? [0, -(d / 2)],
    };

    const logoInner = `<div class="dh-logo-circle">${svgHtml}</div>`;

    if (opts.selected) {
      iconOptions.html = `
        <div style="position:relative;width:${d}px;height:${d}px;">
          <div class="dh-pin-pulse" style="background:${color};border-radius:50%;"></div>
          <div class="dh-pin-bounce">
            <div class="dh-logo-marker">${logoInner}</div>
          </div>
        </div>`;
    } else {
      iconOptions.html = `<div class="dh-logo-marker">${logoInner}</div>`;
    }

    return L.divIcon(iconOptions);
  }

  // Pin SVG estándar
  const w = opts.w ?? 48;
  const h = opts.h ?? 62;
  const svgHtml = buildDefaultSvg(promo, w, h, color);

  const iconOptions: LType.DivIconOptions = {
    className:   '',
    iconSize:    [w, h],
    iconAnchor:  [w / 2, h],
    popupAnchor: opts.popupAnchor ?? [0, -h],
  };

  if (opts.selected) {
    iconOptions.html = `
      <div style="position:relative;width:${w}px;height:${h}px;">
        <div class="dh-pin-pulse" style="background:${color};"></div>
        <div class="dh-pin-bounce" style="filter:${shadow};">${svgHtml}</div>
      </div>`;
  } else {
    iconOptions.html = `<div style="filter:${shadow}">${svgHtml}</div>`;
  }

  return L.divIcon(iconOptions);
}

function buildLogoSvg(promo: Promocion, d: number): string {
  const uid = `lc-${promo.id}`;
  return `
    <svg width="${d}" height="${d}" viewBox="0 0 28 28" overflow="visible"
         xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <clipPath id="${uid}">
          <circle cx="14" cy="14" r="14"/>
        </clipPath>
      </defs>
      <image href="${promo.logoUrl}" x="0" y="0" width="28" height="28"
             clip-path="url(#${uid})" preserveAspectRatio="xMidYMid slice"/>
    </svg>`;
}

function buildDefaultSvg(promo: Promocion, w: number, h: number, color: string): string {
  const sw  = (3 * 28 / w).toFixed(2);
  const fs  = w > 48 ? 7.5 : 8;
  const fss = w > 48 ? 11 : 10;

  const innerContent = promo.descuento > 0
    ? `<text x="14" y="14" text-anchor="middle" dominant-baseline="central"
              fill="white" font-weight="800" font-size="${fs}"
              font-family="'Bricolage Grotesque','Inter',system-ui,sans-serif"
          >${promo.descuento}%</text>`
    : `<text x="14" y="15" text-anchor="middle" dominant-baseline="central"
              fill="white" font-size="${fss}"
          >★</text>`;

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 28 36" overflow="visible"
         xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
            fill="${color}" stroke="white" stroke-width="${sw}"/>
      ${innerContent}
    </svg>`;
}
